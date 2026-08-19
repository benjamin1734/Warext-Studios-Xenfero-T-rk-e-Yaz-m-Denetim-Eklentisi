(() => {
  'use strict';

  if (window.__warextTurkishSpellCheckV142) return;
  window.__warextTurkishSpellCheckV142 = true;

  const VERSION = '1.4.2';
  const states = new WeakMap();
  const listenedTextareas = new WeakSet();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const LETTER_RE = new RegExp(`[${LETTERS}]`, 'u');
  const TOKEN_RE = new RegExp(`[${LETTERS}]{2,}`, 'gu');

  document.documentElement.dataset.wtscVersion = VERSION;

  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function engine() {
    return window.WarextTurkishSpellEngineV142 || null;
  }

  function installStyle() {
    if (document.getElementById('wtsc-style-v142')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-style-v142';
    style.textContent = `
      .wtsc-suggestions{display:none;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:7px 0 3px;width:100%;box-sizing:border-box}
      .wtsc-suggestions.is-active{display:grid}
      .wtsc-suggestion{appearance:none;min-width:0;border:1px solid rgba(127,127,127,.32);background:rgba(127,127,127,.08);color:inherit;border-radius:7px;padding:8px 10px;font:inherit;font-size:13px;font-weight:500;line-height:1.2;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
      .wtsc-suggestion:hover,.wtsc-suggestion:focus{background:rgba(127,127,127,.16);border-color:rgba(127,127,127,.55);outline:none}
      .wtsc-suggestions.is-error{display:block;padding:7px 10px;border:1px solid rgba(180,70,70,.35);border-radius:7px;font-size:12px;line-height:1.3}
      @media (max-width:650px){.wtsc-suggestion{padding:8px 6px;font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function normalize(value) {
    return String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR');
  }

  function capitalizeTurkish(value) {
    const s = String(value || '');
    if (!s) return s;
    const first = s[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR');
    return first + s.slice(1);
  }

  function isTitleInput(el) {
    return el instanceof HTMLInputElement && el.name === 'title';
  }

  function isMessageTextarea(el) {
    return el instanceof HTMLTextAreaElement && (
      el.name === 'message' ||
      el.dataset.originalName === 'message' ||
      el.matches('textarea.js-editor[data-xf-init~="editor"]')
    );
  }

  function isRichEditor(el) {
    return el instanceof HTMLElement && el.isContentEditable && (el.classList.contains('fr-element') || !!el.closest('.fr-box'));
  }

  function createBar(el) {
    const box = isRichEditor(el) ? el.closest('.fr-box') : null;
    const owner = box || el;
    const existing = owner.__wtscSuggestionBar || el.__wtscSuggestionBar;
    if (existing?.isConnected) return existing;

    const bar = document.createElement('div');
    bar.className = 'wtsc-suggestions';
    bar.setAttribute('role', 'listbox');
    bar.setAttribute('aria-label', 'Yazım ve cümle önerileri');
    bar.dataset.wtscVersion = VERSION;

    if (isRichEditor(el)) {
      const richBox = box || el.parentElement;
      richBox?.parentElement?.querySelectorAll('.wtsc-suggestions').forEach(other => other.remove());
      richBox?.insertAdjacentElement('afterend', bar);
      if (richBox) richBox.__wtscSuggestionBar = bar;
    } else {
      const holder = el.closest('.inputGroup') || el.parentElement;
      holder?.insertAdjacentElement('afterend', bar);
    }

    owner.__wtscSuggestionBar = bar;
    el.__wtscSuggestionBar = bar;
    return bar;
  }

  function textNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function richTextAndCaret(el) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed) return null;
    const caretRange = selection.getRangeAt(0);
    if (!el.contains(caretRange.startContainer)) return null;

    const nodes = textNodes(el);
    let text = '';
    let caret = null;

    for (const node of nodes) {
      if (node === caretRange.startContainer) {
        caret = text.length + Math.max(0, Math.min(node.nodeValue?.length || 0, caretRange.startOffset));
      }
      text += node.nodeValue || '';
    }

    if (caret === null) {
      try {
        const beforeRange = document.createRange();
        beforeRange.selectNodeContents(el);
        beforeRange.setEnd(caretRange.startContainer, caretRange.startOffset);
        caret = beforeRange.toString().length;
      } catch (_) {
        caret = text.length;
      }
    }

    return { text, caret: Math.max(0, Math.min(text.length, caret)) };
  }

  function getDocumentState(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const text = el.value || '';
      const caret = el.selectionStart ?? text.length;
      return { text, caret: Math.max(0, Math.min(text.length, caret)) };
    }
    if (isRichEditor(el)) return richTextAndCaret(el);
    return null;
  }

  function rangeFromOffsets(root, start, end) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let pos = 0, startNode = null, startOffset = 0, endNode = null, endOffset = 0, node;
    while ((node = walker.nextNode())) {
      const len = node.nodeValue?.length || 0;
      const next = pos + len;
      if (!startNode && start >= pos && start <= next) {
        startNode = node;
        startOffset = Math.max(0, Math.min(len, start - pos));
      }
      if (end >= pos && end <= next) {
        endNode = node;
        endOffset = Math.max(0, Math.min(len, end - pos));
        break;
      }
      pos = next;
    }
    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  function makeContext(el, state, start, end, extra = {}) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return { start, end, type: 'input', fullText: state.text, caret: state.caret, ...extra };
    }
    const range = rangeFromOffsets(el, start, end);
    if (!range) return null;
    return { range, start, end, type: 'contenteditable', fullText: state.text, caret: state.caret, ...extra };
  }

  function isLetterAt(text, index) {
    if (index < 0 || index >= text.length) return false;
    return LETTER_RE.test(text[index]);
  }

  function tokenAtCaret(text, caret) {
    if (!text) return null;
    let pos = Math.max(0, Math.min(text.length, caret));

    if (!isLetterAt(text, pos) && !isLetterAt(text, pos - 1)) {
      let probe = pos - 1;
      while (probe >= 0 && !isLetterAt(text, probe)) {
        if (text[probe] === '\n' || text[probe] === '\r') break;
        probe--;
      }
      if (isLetterAt(text, probe)) pos = probe + 1;
    }

    let start = pos;
    while (start > 0 && isLetterAt(text, start - 1)) start--;
    let end = pos;
    while (end < text.length && isLetterAt(text, end)) end++;

    if (start === end || end - start < 2) return null;
    return { word: text.slice(start, end), start, end };
  }

  function sentenceBounds(text, position) {
    let start = 0;
    for (let i = Math.max(0, position - 1); i >= 0; i--) {
      if (/[.!?\n]/u.test(text[i])) { start = i + 1; break; }
    }
    let end = text.length;
    for (let i = Math.max(0, position); i < text.length; i++) {
      if (/[.!?\n]/u.test(text[i])) { end = i + 1; break; }
    }
    while (start < end && /\s/u.test(text[start])) start++;
    return { start, end };
  }

  function tokensInRange(text, start, end) {
    const out = [];
    const part = text.slice(start, end);
    const re = new RegExp(`[${LETTERS}]{2,}`, 'gu');
    let match;
    while ((match = re.exec(part))) {
      out.push({ word: match[0], start: start + match.index, end: start + match.index + match[0].length });
    }
    return out;
  }

  function previousToken(text, token, sentenceStart) {
    const tokens = tokensInRange(text, sentenceStart, token.start);
    return tokens.length ? tokens[tokens.length - 1] : null;
  }

  function isSentenceStart(text, tokenStart, sentenceStart) {
    return text.slice(sentenceStart, tokenStart).trim() === '';
  }

  function directPunctuationIssue(el, state) {
    const text = state.text;
    const caret = state.caret;
    const before = text.slice(0, caret);
    let m;

    m = before.match(new RegExp(`([${LETTERS}]{2,})\\s+([,;:.!?])$`, 'u'));
    if (m) {
      const raw = m[0];
      return makeContext(el, state, caret - raw.length, caret, {
        word: raw,
        directSuggestions: [`${m[1]}${m[2]}`],
        compareKey: raw,
        rule: 'punctuation-space-before'
      });
    }

    m = before.match(/([!?;,.:])\1+$/u);
    if (m && !(m[1] === '.' && m[0] === '...')) {
      return makeContext(el, state, caret - m[0].length, caret, {
        word: m[0], directSuggestions: [m[1]], compareKey: m[0], rule: 'punctuation-repeat'
      });
    }

    m = before.match(new RegExp(`([,;:!?])([${LETTERS}]{2,})$`, 'u'));
    if (m) {
      return makeContext(el, state, caret - m[0].length, caret, {
        word: m[0], directSuggestions: [`${m[1]} ${m[2]}`], compareKey: m[0], rule: 'punctuation-space-after'
      });
    }

    m = before.match(new RegExp(`([${LETTERS}]{2,})\\s+\\1$`, 'iu'));
    if (m) {
      return makeContext(el, state, caret - m[0].length, caret, {
        word: m[0], directSuggestions: [m[1]], compareKey: normalize(m[0]), rule: 'duplicate-word'
      });
    }

    return null;
  }

  function harmonyVowel(word) {
    const n = normalize(word);
    let last = '';
    for (let i = n.length - 1; i >= 0; i--) {
      if ('aeıioöuü'.includes(n[i])) { last = n[i]; break; }
    }
    if ('aı'.includes(last)) return 'ı';
    if ('ei'.includes(last)) return 'i';
    if ('ou'.includes(last)) return 'u';
    if ('öü'.includes(last)) return 'ü';
    return '';
  }

  function genitiveCandidate(word) {
    const vowel = harmonyVowel(word);
    if (!vowel) return '';
    const lower = normalize(word);
    if (/(?:n?[ıiuü]n)$/u.test(lower)) return '';
    const endsVowel = /[aeıioöuü]$/u.test(lower);
    return word + (endsVowel ? `n${vowel}n` : `${vowel}n`);
  }

  function contextualGrammarIssue(el, state, token, bounds) {
    const localEngine = engine();
    if (!localEngine) return null;

    const following = state.text.slice(token.end, bounds.end);
    const enPattern = new RegExp(`^\\s+en\\s+[${LETTERS}]{2,}\\s+(?:günü|günüdür|günüydü)(?=\\s|[.!?,;:]|$)`, 'iu');
    if (enPattern.test(following)) {
      const candidate = genitiveCandidate(token.word);
      if (candidate && localEngine.isValid?.(candidate)) {
        const cased = token.word[0] !== normalize(token.word[0]) ? capitalizeTurkish(candidate) : candidate;
        return makeContext(el, state, token.start, token.end, {
          word: token.word,
          directSuggestions: [cased],
          compareKey: `${token.start}:${token.end}:${token.word}`,
          rule: 'context-genitive'
        });
      }
    }

    return null;
  }

  function checkToken(el, state, token, bounds) {
    const localEngine = engine();
    if (!localEngine || typeof localEngine.check !== 'function') return { error: true };
    const prev = previousToken(state.text, token, bounds.start);
    const sentenceStart = isSentenceStart(state.text, token.start, bounds.start);
    const result = localEngine.check(token.word, {
      previousWord: prev?.word || '',
      sentenceStart,
      before: state.text.slice(0, token.end)
    });

    if (result?.correct) {
      const grammar = contextualGrammarIssue(el, state, token, bounds);
      if (grammar) return { context: grammar, result: null };
      return { context: null, result };
    }

    const context = makeContext(el, state, token.start, token.end, {
      word: token.word,
      previousWord: prev?.word || '',
      sentenceStart,
      compareKey: `${token.start}:${token.end}:${normalize(token.word)}`,
      rule: 'word'
    });
    return { context, result };
  }

  function collectSentenceIssues(el, state, bounds, activeToken, limit = 3) {
    const localEngine = engine();
    if (!localEngine || typeof localEngine.check !== 'function') return { error: true, issues: [] };

    const issues = [];
    const signatures = new Set();
    const addIssue = issue => {
      if (!issue?.context || issues.length >= limit) return;
      const signature = `${issue.context.rule || ''}:${issue.context.start ?? ''}:${issue.context.end ?? ''}:${issue.context.word || ''}`;
      if (signatures.has(signature)) return;
      signatures.add(signature);
      issues.push(issue);
    };

    const sentenceText = state.text.slice(bounds.start, bounds.end);
    let m;

    const beforeRe = new RegExp(`([${LETTERS}]{2,})\\s+([,;:.!?])`, 'gu');
    while ((m = beforeRe.exec(sentenceText)) && issues.length < limit) {
      const start = bounds.start + m.index;
      addIssue({ context: makeContext(el, state, start, start + m[0].length, {
        word: m[0], directSuggestions: [`${m[1]}${m[2]}`], compareKey: `p:${start}`, rule: 'punctuation-space-before'
      }), result: null });
    }

    const afterRe = new RegExp(`([,;:!?])([${LETTERS}]{2,})`, 'gu');
    while ((m = afterRe.exec(sentenceText)) && issues.length < limit) {
      const start = bounds.start + m.index;
      addIssue({ context: makeContext(el, state, start, start + m[0].length, {
        word: m[0], directSuggestions: [`${m[1]} ${m[2]}`], compareKey: `p:${start}`, rule: 'punctuation-space-after'
      }), result: null });
    }

    const duplicateRe = new RegExp(`([${LETTERS}]{2,})\\s+\\1(?=\\s|[.!?,;:]|$)`, 'giu');
    while ((m = duplicateRe.exec(sentenceText)) && issues.length < limit) {
      const start = bounds.start + m.index;
      addIssue({ context: makeContext(el, state, start, start + m[0].length, {
        word: m[0], directSuggestions: [m[1]], compareKey: `d:${start}`, rule: 'duplicate-word'
      }), result: null });
    }

    const tokens = tokensInRange(state.text, bounds.start, bounds.end);
    for (const token of tokens) {
      if (issues.length >= limit) break;
      if (activeToken && token.start === activeToken.start && token.end === activeToken.end) continue;
      const checked = checkToken(el, state, token, bounds);
      if (checked.error) return { error: true, issues: [] };
      if (checked.context) addIssue(checked);
    }

    if (issues.length < limit) {
      const trimmed = sentenceText.trimEnd();
      const absoluteTrimmedEnd = bounds.start + trimmed.length;
      const tokenCount = tokens.length;
      const caretAtSentenceEnd = state.caret >= absoluteTrimmedEnd && bounds.end >= state.text.length;
      if (tokenCount >= 2 && caretAtSentenceEnd && trimmed && !/[.!?…]$/u.test(trimmed)) {
        const questionLike = /\b(?:mı|mi|mu|mü|mısın|misin|musun|müsün|mıyım|miyim|muyum|müyüm|mıyız|miyiz|muyuz|müyüz|mısınız|misiniz|musunuz|müsünüz)\b/iu.test(trimmed);
        const preferred = questionLike ? '?' : '.';
        addIssue({ context: makeContext(el, state, absoluteTrimmedEnd, absoluteTrimmedEnd, {
          word: '', directSuggestions: [preferred], compareKey: `end:${absoluteTrimmedEnd}`, rule: 'sentence-terminal-punctuation'
        }), result: null });
      }
    }

    return { error: false, issues };
  }

  function getIssue(el) {
    const state = getDocumentState(el);
    if (!state) return null;

    const localPunctuation = directPunctuationIssue(el, state);
    if (localPunctuation) return { mode: 'single', context: localPunctuation, result: null };

    const activeToken = tokenAtCaret(state.text, state.caret);
    const bounds = sentenceBounds(state.text, activeToken?.start ?? state.caret);

    if (activeToken) {
      const checked = checkToken(el, state, activeToken, bounds);
      if (checked.error) return { error: true };
      if (checked.context) return { mode: 'single', ...checked };
    }

    const collected = collectSentenceIssues(el, state, bounds, activeToken, 3);
    if (collected.error) return { error: true };
    return { mode: 'multi', issues: collected.issues };
  }

  function replaceRange(el, context, suggestion) {
    if (context.type === 'input') {
      el.value = el.value.slice(0, context.start) + suggestion + el.value.slice(context.end);
      const pos = context.start + suggestion.length;
      el.setSelectionRange?.(pos, pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.focus();
      return;
    }

    const range = context.range?.cloneRange();
    if (!range) return;
    range.deleteContents();
    const node = document.createTextNode(suggestion);
    range.insertNode(node);
    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(after);
    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: suggestion }));
    } catch (_) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    el.focus();
  }

  function hideBar(bar) {
    bar.classList.remove('is-active', 'is-error');
    bar.textContent = '';
  }

  function render(bar, el, context, result) {
    hideBar(bar);
    const suggestions = context?.directSuggestions || result?.suggestions || [];
    if (!context || !suggestions.length || (!context.directSuggestions && result?.correct)) return;

    const seen = new Set();
    for (const suggestion of suggestions) {
      const key = normalize(suggestion);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wtsc-suggestion';
      button.textContent = suggestion;
      button.setAttribute('role', 'option');
      button.addEventListener('mousedown', event => event.preventDefault());
      button.addEventListener('click', () => {
        replaceRange(el, context, suggestion);
        hideBar(bar);
      });
      bar.appendChild(button);
      if (bar.childElementCount >= 3) break;
    }
    if (bar.childElementCount) bar.classList.add('is-active');
  }

  function renderMultiple(bar, el, issues) {
    hideBar(bar);
    const seen = new Set();
    for (const issue of issues || []) {
      const context = issue?.context;
      const suggestions = context?.directSuggestions || issue?.result?.suggestions || [];
      const suggestion = suggestions[0];
      if (!context || !suggestion) continue;
      const key = normalize(suggestion);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wtsc-suggestion';
      button.textContent = suggestion;
      button.setAttribute('role', 'option');
      button.addEventListener('mousedown', event => event.preventDefault());
      button.addEventListener('click', () => {
        replaceRange(el, context, suggestion);
        hideBar(bar);
      });
      bar.appendChild(button);
      if (bar.childElementCount >= 3) break;
    }
    if (bar.childElementCount) bar.classList.add('is-active');
  }

  function renderEngineError(bar) {
    bar.classList.remove('is-active');
    bar.classList.add('is-error');
    bar.textContent = 'Yazım sözlüğü yüklenemedi. Sayfayı Ctrl+F5 ile yenileyin.';
  }

  function attach(el) {
    if (!el || states.has(el)) return states.get(el) || null;
    if (!(isTitleInput(el) || isMessageTextarea(el) || isRichEditor(el))) return null;

    const bar = createBar(el);
    let timer = 0;
    let seq = 0;

    const schedule = (delay = 220) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const current = ++seq;
        const issue = getIssue(el);
        if (current !== seq) return;

        if (issue?.error || !engine()) {
          renderEngineError(bar);
          document.documentElement.dataset.wtscStatus = 'dictionary-missing';
          return;
        }

        if (issue?.mode === 'multi') {
          if (!issue.issues?.length) hideBar(bar);
          else renderMultiple(bar, el, issue.issues);
          document.documentElement.dataset.wtscStatus = 'local-ok';
          return;
        }

        if (!issue?.context) {
          hideBar(bar);
          document.documentElement.dataset.wtscStatus = 'local-ok';
          return;
        }

        render(bar, el, issue.context, issue.result);
        document.documentElement.dataset.wtscStatus = 'local-ok';
      }, delay);
    };

    const state = { bar, schedule };
    states.set(el, state);
    el.dataset.wtscBound = '1';

    el.addEventListener('input', () => schedule(380), { passive: true });
    el.addEventListener('keyup', () => schedule(220), { passive: true });
    el.addEventListener('click', () => schedule(40), { passive: true });
    el.addEventListener('focus', () => schedule(80), { passive: true });

    return state;
  }

  function surfaceFromEditorEvent(event) {
    return event?.ed?.el || event?.editor?.ed?.el || event?.detail?.ed?.el || null;
  }

  function bindTextarea(textarea) {
    if (!(textarea instanceof HTMLTextAreaElement)) return;

    if (!listenedTextareas.has(textarea)) {
      listenedTextareas.add(textarea);
      const listener = event => {
        const surface = surfaceFromEditorEvent(event);
        if (surface instanceof HTMLElement) attach(surface)?.schedule(40);
      };
      if (window.XF && typeof XF.on === 'function') XF.on(textarea, 'editor:init', listener);
      else textarea.addEventListener('editor:init', listener);
    }

    try {
      const handler = window.XF?.Element?.getHandler?.(textarea, 'editor');
      const surface = handler?.ed?.el;
      if (surface instanceof HTMLElement) {
        attach(surface);
        return;
      }
    } catch (_) {}

    const hasRich = !!textarea.parentElement?.querySelector?.('.fr-box .fr-element[contenteditable="true"]');
    if (!hasRich && isMessageTextarea(textarea) && textarea.offsetParent !== null) attach(textarea);
  }

  function scan(root = document) {
    if (root instanceof HTMLTextAreaElement) bindTextarea(root);
    root.querySelectorAll?.('textarea.js-editor[data-xf-init~="editor"], textarea[name="message"], textarea[data-original-name="message"]').forEach(bindTextarea);

    if (root instanceof HTMLInputElement && isTitleInput(root)) attach(root);
    root.querySelectorAll?.('input[name="title"]').forEach(attach);

    if (root instanceof HTMLElement && isRichEditor(root)) attach(root);
    root.querySelectorAll?.('.fr-element[contenteditable="true"]').forEach(attach);
  }

  function boot() {
    installStyle();
    document.querySelectorAll('.wtsc-suggestions').forEach(bar => bar.remove());
    document.documentElement.dataset.wtscStatus = engine() ? 'local-ready' : 'dictionary-missing';

    if (window.XF && typeof XF.on === 'function') {
      XF.on(document, 'editor:init', event => {
        const surface = surfaceFromEditorEvent(event);
        if (surface instanceof HTMLElement) attach(surface)?.schedule(40);
      });
    }

    scan(document);

    document.addEventListener('focusin', event => {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement) bindTextarea(target);
      const candidate = target?.closest?.('.fr-element[contenteditable="true"], textarea.js-editor, textarea[name="message"], input[name="title"]');
      if (candidate instanceof HTMLElement) attach(candidate)?.schedule(50);
    }, true);

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          if (mutation.target instanceof Element) scan(mutation.target);
          continue;
        }
        for (const node of mutation.addedNodes) if (node instanceof Element) scan(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','contenteditable','data-xf-init'] });

    let passes = 0;
    const rescanner = window.setInterval(() => {
      scan(document);
      if (++passes >= 12) window.clearInterval(rescanner);
    }, 500);
  }

  ready(boot);
})();
