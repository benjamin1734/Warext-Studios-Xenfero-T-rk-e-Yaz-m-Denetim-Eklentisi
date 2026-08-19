(() => {
  'use strict';

  if (window.__warextTurkishLongTextV310) return;
  window.__warextTurkishLongTextV310 = true;

  const VERSION = '3.1.0';
  const core = window.WarextLongTextCoreV310;
  if (!core) return;

  const states = new WeakMap();
  const stateList = new Set();
  const listened = new WeakSet();
  const uid = window.XF?.config?.userId ?? window.XF?.config?.user_id ?? 'guest';
  const ignoredKey = `warextSpellIgnoredV300:${location.host}:${uid}`;
  const configData = document.getElementById('wtsc-config')?.dataset || {};
  const boolValue = (value, fallback = true) => value == null || value === '' ? fallback : !['0','false','off','no'].includes(String(value).toLowerCase());
  const numberValue = (value, fallback, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : fallback));
  const cfg = {
    enabled: boolValue(configData.longText, true),
    grammar: boolValue(configData.grammar, true),
    punctuation: boolValue(configData.punctuation, true),
    underline: boolValue(configData.underline, true),
    properNames: boolValue(configData.properNames, true),
    informal: boolValue(configData.informal, true),
    threshold: numberValue(configData.longTextThreshold, 800, 250, 50000),
    maxIssues: numberValue(configData.longTextMaxIssues, 160, 20, 500)
  };

  document.documentElement.dataset.wtscLongText = VERSION;

  function engine() {
    return window.WarextTurkishSpellEngineV300 || null;
  }

  function ignoredWords() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(ignoredKey) || '[]');
      return new Set(Array.isArray(parsed) ? parsed.map(normalize).filter(Boolean) : []);
    } catch (_) {
      return new Set();
    }
  }

  function normalize(value) {
    return String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR');
  }

  function isMessageTextarea(el) {
    return el instanceof HTMLTextAreaElement && (el.name === 'message' || el.dataset.originalName === 'message' || el.matches('textarea.js-editor[data-xf-init~="editor"]'));
  }

  function isRichEditor(el) {
    return el instanceof HTMLElement && el.isContentEditable && (el.classList.contains('fr-element') || !!el.closest('.fr-box'));
  }

  function editorElements(root = document) {
    const out = [];
    if (root instanceof Element && (isMessageTextarea(root) || isRichEditor(root))) out.push(root);
    if (root.querySelectorAll) {
      for (const el of root.querySelectorAll('textarea[name="message"],textarea.js-editor[data-xf-init~="editor"],.fr-element[contenteditable="true"]')) {
        if (isMessageTextarea(el) || isRichEditor(el)) out.push(el);
      }
    }
    return [...new Set(out)];
  }

  function textNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function snapshot(el) {
    if (el instanceof HTMLTextAreaElement) {
      const text = el.value || '';
      return {text,protectedRanges:core.protectedRanges(text),nodes:null};
    }
    if (!isRichEditor(el)) return null;
    const nodes = textNodes(el);
    let text = '';
    const domProtected = [];
    for (const node of nodes) {
      const start = text.length;
      const value = node.nodeValue || '';
      if (node.parentElement?.closest?.('code,pre,.bbCodeCode,.bbCodeBlock--code,.fr-code')) domProtected.push({start,end:start + value.length});
      text += value;
    }
    return {text,protectedRanges:core.mergeRanges([...domProtected,...core.protectedRanges(text)]),nodes};
  }

  function rangeAt(el, start, end) {
    if (!isRichEditor(el) || end <= start) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let position = 0;
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      const length = node.nodeValue?.length || 0;
      if (!startNode && start >= position && start <= position + length) {
        startNode = node;
        startOffset = start - position;
      }
      if (end >= position && end <= position + length) {
        endNode = node;
        endOffset = end - position;
        break;
      }
      position += length;
    }
    if (!startNode || !endNode) return null;
    try {
      const range = document.createRange();
      range.setStart(startNode, Math.max(0, Math.min(startOffset, startNode.nodeValue?.length || 0)));
      range.setEnd(endNode, Math.max(0, Math.min(endOffset, endNode.nodeValue?.length || 0)));
      return range;
    } catch (_) {
      return null;
    }
  }

  function installStyle() {
    if (document.getElementById('wtsc-longtext-style-v310')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-longtext-style-v310';
    style.textContent = '::highlight(wtsc-longtext-v310){text-decoration:underline wavy #d33;text-decoration-thickness:1px;text-underline-offset:2px}';
    document.head.appendChild(style);
  }

  function refreshHighlights() {
    if (!cfg.underline || typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
    const ranges = [];
    for (const st of [...stateList]) {
      if (!st.el?.isConnected) {
        stateList.delete(st);
        continue;
      }
      if (!isRichEditor(st.el)) continue;
      for (const issue of st.issues || []) {
        const range = rangeAt(st.el, issue.start, issue.end);
        if (range) ranges.push(range);
      }
    }
    if (ranges.length) CSS.highlights.set('wtsc-longtext-v310', new Highlight(...ranges));
    else CSS.highlights.delete('wtsc-longtext-v310');
  }

  function localProtectedRanges(allRanges, segment) {
    return (allRanges || []).map(range => ({
      start: Math.max(0, range.start - segment.start),
      end: Math.min(segment.end - segment.start, range.end - segment.start)
    })).filter(range => range.end > range.start && range.end > 0 && range.start < segment.end - segment.start);
  }

  function lastToken(text) {
    const tokens = core.tokens(text);
    return tokens.length ? tokens[tokens.length - 1] : null;
  }

  function issueSignature(issue) {
    return `${issue.start}:${issue.end}:${issue.rule || issue.category || 'word'}:${(issue.suggestions || []).join('|')}`;
  }

  function analyzeSegment(st, snap, segments, index, ignored) {
    const localEngine = engine();
    const segment = segments[index];
    if (!localEngine || !segment) return [];
    const previousText = segments[index - 1]?.text || '';
    const nextText = segments[index + 1]?.text || '';
    const localRanges = localProtectedRanges(snap.protectedRanges, segment);
    const analysisText = core.maskText(segment.text, localRanges);
    const issues = [];
    const signatures = new Set();
    const add = issue => {
      if (!issue || issue.end <= issue.start) return;
      const signature = issueSignature(issue);
      if (signatures.has(signature)) return;
      signatures.add(signature);
      issues.push(issue);
    };
    const trailingText = snap.text.slice(segment.end);
    const naturalEnd = /[.!?…]["”’')\]}]*$/u.test(segment.text.trimEnd()) || !trailingText.trim() || /^\s*\r?\n/u.test(trailingText);

    if (cfg.grammar && typeof localEngine.analyzeSentence === 'function') {
      let languageIssues = [];
      try {
        languageIssues = localEngine.analyzeSentence(analysisText, {
          properNames: cfg.properNames,
          punctuation: cfg.punctuation && naturalEnd,
          previousSentence: previousText,
          nextSentence: nextText,
          longText: true
        }) || [];
      } catch (_) {
        languageIssues = [];
      }
      for (const issue of languageIssues) {
        const start = Math.max(0, Number(issue.start) || 0);
        const end = Math.max(start, Number(issue.end) || start);
        if (end <= start || core.isProtected(localRanges, start, end)) continue;
        add({
          start,
          end,
          word: issue.word || analysisText.slice(start,end),
          suggestions: Array.isArray(issue.suggestions) ? issue.suggestions.filter(Boolean).slice(0,3) : [],
          rule: issue.rule || 'sentence',
          category: issue.category || 'grammar',
          message: issue.message || ''
        });
        if (issues.length >= 32) break;
      }
    }

    const tokens = core.tokens(analysisText, localRanges);
    const previousLast = lastToken(previousText);
    for (let i = 0; i < tokens.length && issues.length < 32; i++) {
      const token = tokens[i];
      const normalized = normalize(token.word);
      if (ignored.has(normalized)) continue;
      const previousWord = i > 0 ? tokens[i - 1].word : previousLast?.word || '';
      let result = null;
      try {
        result = localEngine.check(token.word, {
          previousWord,
          sentenceStart: i === 0,
          before: analysisText.slice(0, token.end),
          previousSentence: previousText,
          nextSentence: nextText,
          properNames: cfg.properNames,
          informal: cfg.informal,
          longText: true
        });
      } catch (_) {
        result = null;
      }
      if (!result || result.correct !== false) continue;
      const suggestions = Array.isArray(result.suggestions) ? result.suggestions.filter(Boolean).slice(0,3) : [];
      if (!suggestions.length) continue;
      add({
        start: token.start,
        end: token.end,
        word: token.word,
        suggestions,
        rule: result.rule || 'word',
        category: result.category || 'spelling',
        message: result.message || ''
      });
    }

    return issues;
  }

  function scheduleIdle(fn) {
    if (typeof requestIdleCallback === 'function') return requestIdleCallback(fn, {timeout:900});
    return setTimeout(() => fn({didTimeout:true,timeRemaining:() => 8}), 16);
  }

  function cancelIdle(id) {
    if (!id) return;
    if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
    else clearTimeout(id);
  }

  function finishScan(st, snap, issues, stats) {
    if (!st.el?.isConnected) return;
    st.issues = issues.slice(0, cfg.maxIssues).sort((a,b) => a.start - b.start || a.end - b.end);
    st.lastText = snap.text;
    st.lastStats = stats;
    st.el.dataset.wtscLongTextState = 'ready';
    st.el.dataset.wtscLongTextIssues = String(st.issues.length);
    st.el.dataset.wtscLongTextReused = String(stats.reused);
    st.el.dataset.wtscLongTextAnalyzed = String(stats.analyzed);
    document.documentElement.dataset.wtscLongTextStatus = 'ready';
    refreshHighlights();
  }

  function clearState(st, reason = 'short') {
    cancelIdle(st.idleId);
    st.idleId = 0;
    st.issues = [];
    st.el.dataset.wtscLongTextState = reason;
    st.el.dataset.wtscLongTextIssues = '0';
    refreshHighlights();
  }

  function runScan(st) {
    if (!cfg.enabled || !st.el?.isConnected) return;
    const localEngine = engine();
    if (!localEngine?.check) return;
    const snap = snapshot(st.el);
    if (!snap) return;
    st.scanId++;
    const scanId = st.scanId;
    cancelIdle(st.idleId);
    st.idleId = 0;

    if (snap.text.length < cfg.threshold) {
      st.lastText = snap.text;
      clearState(st, 'short');
      return;
    }

    const segments = core.sentenceSegments(snap.text, snap.protectedRanges, 1800);
    if (!segments.length) {
      clearState(st, 'empty');
      return;
    }

    const change = core.changedRange(st.lastText, snap.text);
    st.el.dataset.wtscLongTextState = 'scanning';
    st.el.dataset.wtscLongTextChangedStart = String(change.start);
    document.documentElement.dataset.wtscLongTextStatus = 'scanning';
    const ignored = ignoredWords();
    const collected = [];
    const stats = {segments:segments.length,reused:0,analyzed:0,characters:snap.text.length};
    let index = 0;

    const step = deadline => {
      if (scanId !== st.scanId || !st.el?.isConnected) return;
      const started = performance.now();
      let processed = 0;
      while (index < segments.length && collected.length < cfg.maxIssues) {
        const segment = segments[index];
        const flags = `${cfg.grammar ? 1 : 0}${cfg.punctuation ? 1 : 0}${cfg.properNames ? 1 : 0}${cfg.informal ? 1 : 0}`;
        const key = core.cacheKey(segments, index, flags);
        let relative = st.cache.get(key);
        if (relative) {
          stats.reused++;
        } else {
          relative = analyzeSegment(st, snap, segments, index, ignored);
          st.cache.set(key, relative);
          stats.analyzed++;
          if (st.cache.size > 900) st.cache.delete(st.cache.keys().next().value);
        }
        for (const issue of relative) {
          collected.push({...issue,start:segment.start + issue.start,end:segment.start + issue.end});
          if (collected.length >= cfg.maxIssues) break;
        }
        index++;
        processed++;
        const elapsed = performance.now() - started;
        if (processed >= 6 || elapsed >= 9 || (!deadline.didTimeout && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 2)) break;
      }

      if (scanId !== st.scanId) return;
      if (index < segments.length && collected.length < cfg.maxIssues) {
        st.idleId = scheduleIdle(step);
        return;
      }
      st.idleId = 0;
      finishScan(st, snap, collected, stats);
    };

    st.idleId = scheduleIdle(step);
  }

  function attach(el) {
    if (!cfg.enabled || !el || states.has(el) || !(isMessageTextarea(el) || isRichEditor(el))) return states.get(el) || null;
    const st = {el,issues:[],cache:new Map(),scanId:0,idleId:0,timer:0,lastText:'',lastStats:null};
    states.set(el, st);
    stateList.add(st);
    el.dataset.wtscLongTextBound = '1';
    const schedule = delay => {
      clearTimeout(st.timer);
      st.timer = setTimeout(() => runScan(st), delay);
    };
    st.schedule = schedule;
    el.addEventListener('input', () => schedule(520), {passive:true});
    el.addEventListener('paste', () => schedule(140), {passive:true});
    el.addEventListener('cut', () => schedule(180), {passive:true});
    el.addEventListener('focus', () => schedule(700), {passive:true});
    el.addEventListener('blur', () => schedule(120), {passive:true});
    schedule(850);
    return st;
  }

  function bindRoot(root = document) {
    for (const el of editorElements(root)) attach(el);
  }

  function rescan(root = document) {
    bindRoot(root);
    for (const st of [...stateList]) {
      if (!st.el?.isConnected) {
        stateList.delete(st);
        continue;
      }
      if (root === document || root === st.el || root.contains?.(st.el)) st.schedule?.(0);
    }
  }

  function getIssues(el) {
    return (states.get(el)?.issues || []).map(issue => ({...issue,suggestions:[...(issue.suggestions || [])]}));
  }

  function init() {
    installStyle();
    bindRoot(document);
    if (!listened.has(document)) {
      listened.add(document);
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof Element) bindRoot(node);
          }
        }
      });
      observer.observe(document.documentElement, {childList:true,subtree:true});
    }
    if (window.XF?.on) {
      for (const event of ['xf:reinit','editor:init','editor:ready','xf:editor-start']) {
        try { window.XF.on(document, event, () => bindRoot(document)); } catch (_) {}
      }
    }
  }

  window.WarextLongTextV310 = {VERSION,rescan,getIssues,config:{...cfg}};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
