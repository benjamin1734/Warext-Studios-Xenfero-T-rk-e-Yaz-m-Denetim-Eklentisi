(() => {
  'use strict';

  if (window.__warextDocumentV240) return;
  const core = window.WarextTextCoreV110;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!core || !engine?.analyzeParagraph) return;
  window.__warextDocumentV240 = true;

  const VERSION = '2.4.0';
  const states = new WeakMap();
  const stateList = new Set();
  const observedRoots = new WeakSet();
  const LABELS = new Map([
    ['spelling','Yazım'],['grammar','Dilbilgisi'],['punctuation','Noktalama'],['semantic','Anlam'],['syntax','Sözdizimi'],['discourse','Bağlam'],['style','Anlatım']
  ]);

  function isMessageTextarea(el) {
    return el instanceof HTMLTextAreaElement && (el.name === 'message' || el.dataset.originalName === 'message' || el.matches('textarea.js-editor[data-xf-init~="editor"]'));
  }

  function isRichEditor(el) {
    return el instanceof HTMLElement && el.isContentEditable && (el.classList.contains('fr-element') || !!el.closest('.fr-box'));
  }

  function editorElements(root = document) {
    const out = [];
    if (root instanceof Element && (isMessageTextarea(root) || isRichEditor(root))) out.push(root);
    root.querySelectorAll?.('textarea[name="message"],textarea.js-editor[data-xf-init~="editor"],.fr-element[contenteditable="true"]').forEach(el => {
      if (isMessageTextarea(el) || isRichEditor(el)) out.push(el);
    });
    return [...new Set(out)];
  }

  function textNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function snapshot(el) {
    if (el instanceof HTMLTextAreaElement) return {text:el.value || ''};
    if (!isRichEditor(el)) return null;
    return {text:textNodes(el).map(node => node.nodeValue || '').join('')};
  }

  function rangeAt(el,start,end) {
    if (!isRichEditor(el) || end < start) return null;
    const walker = document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let position = 0;
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;
    let node;
    while ((node = walker.nextNode())) {
      const length = node.nodeValue?.length || 0;
      const next = position + length;
      if (!startNode && start >= position && start <= next) {
        startNode = node;
        startOffset = start - position;
      }
      if (end >= position && end <= next) {
        endNode = node;
        endOffset = end - position;
        break;
      }
      position = next;
    }
    if (!startNode || !endNode) return null;
    try {
      const range = document.createRange();
      range.setStart(startNode,Math.max(0,Math.min(startOffset,startNode.nodeValue?.length || 0)));
      range.setEnd(endNode,Math.max(0,Math.min(endOffset,endNode.nodeValue?.length || 0)));
      return range;
    } catch (_) {
      return null;
    }
  }

  function replaceRange(el,item,replacement) {
    if (el instanceof HTMLTextAreaElement) {
      const current = el.value || '';
      el.value = current.slice(0,item.start) + replacement + current.slice(item.end);
      const position = item.start + replacement.length;
      el.setSelectionRange?.(position,position);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.focus();
      return true;
    }
    const range = rangeAt(el,item.start,item.end);
    if (!range) return false;
    range.deleteContents();
    const node = document.createTextNode(replacement);
    range.insertNode(node);
    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(after);
    try {
      el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:replacement}));
    } catch (_) {
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    el.focus();
    return true;
  }

  function installStyle() {
    if (document.getElementById('wtsc-document-style-v240')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-document-style-v240';
    style.textContent = `
      .wtsc-paragraph-panel{display:none!important}
      ::highlight(wtsc-document-v240){text-decoration:underline wavy #b87400;text-decoration-thickness:1px;text-underline-offset:3px}
      .wtsc-document-panel{display:none;margin:8px 0 4px;border:1px solid rgba(127,127,127,.28);border-radius:9px;overflow:hidden;font-size:12px;line-height:1.45}
      .wtsc-document-panel.is-active{display:block}
      .wtsc-document-title{display:flex;justify-content:space-between;gap:10px;padding:8px 11px;font-weight:600;background:rgba(127,127,127,.09)}
      .wtsc-document-item{padding:8px 11px;border-top:1px solid rgba(127,127,127,.14)}
      .wtsc-document-meta{display:block;margin-bottom:2px;font-size:10px;font-weight:700;letter-spacing:.03em;opacity:.62;text-transform:uppercase}
      .wtsc-document-fix{appearance:none;margin-top:5px;border:1px solid rgba(127,127,127,.28);border-radius:6px;background:rgba(127,127,127,.08);color:inherit;padding:5px 8px;font:inherit;font-size:11px;cursor:pointer}
      .wtsc-document-fix:hover,.wtsc-document-fix:focus{background:rgba(127,127,127,.16);outline:none}
    `;
    document.head.appendChild(style);
  }

  function panelOwner(el) {
    return isRichEditor(el) ? el.closest('.fr-box') || el : el;
  }

  function ensurePanel(el) {
    const owner = panelOwner(el);
    if (owner.__wtscDocumentPanel?.isConnected) return owner.__wtscDocumentPanel;
    const panel = document.createElement('div');
    panel.className = 'wtsc-document-panel';
    panel.dataset.wtscDocumentVersion = VERSION;
    if (isRichEditor(el)) {
      const box = el.closest('.fr-box') || el;
      box.insertAdjacentElement('afterend',panel);
    } else {
      const holder = el.closest('.inputGroup') || el;
      holder.insertAdjacentElement('afterend',panel);
    }
    owner.__wtscDocumentPanel = panel;
    return panel;
  }

  function categoryLabel(item) {
    return LABELS.get(String(item.category || '').toLocaleLowerCase('tr-TR')) || 'Metin';
  }

  function renderPanel(st) {
    const panel = ensurePanel(st.el);
    panel.textContent = '';
    const items = st.items || [];
    if (!items.length) {
      panel.classList.remove('is-active');
      return;
    }
    const title = document.createElement('div');
    title.className = 'wtsc-document-title';
    const left = document.createElement('span');
    left.textContent = `Metin denetimi: ${items.length} bulgu`;
    const right = document.createElement('span');
    right.textContent = 'Tüm paragraf tarandı';
    right.style.opacity = '.62';
    title.append(left,right);
    panel.appendChild(title);
    for (const item of items.slice(0,16)) {
      const row = document.createElement('div');
      row.className = 'wtsc-document-item';
      const meta = document.createElement('span');
      meta.className = 'wtsc-document-meta';
      meta.textContent = categoryLabel(item);
      const message = document.createElement('span');
      message.textContent = item.message || 'Bu bölümün yazım, dilbilgisi veya bağlam yapısını kontrol edin.';
      row.append(meta,message);
      const suggestion = item.suggestions?.[0];
      if (suggestion != null && String(suggestion) !== '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wtsc-document-fix';
        button.textContent = `Düzelt: ${suggestion}`;
        button.addEventListener('click',() => {
          if (replaceRange(st.el,item,String(suggestion))) st.schedule?.(50);
        });
        row.appendChild(button);
      }
      panel.appendChild(row);
    }
    panel.classList.add('is-active');
  }

  function refreshHighlights() {
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
    const ranges = [];
    for (const st of [...stateList]) {
      if (!st.el?.isConnected) {
        stateList.delete(st);
        continue;
      }
      if (!isRichEditor(st.el)) continue;
      for (const item of st.items || []) {
        if (item.end <= item.start) continue;
        const range = rangeAt(st.el,item.start,item.end);
        if (range) ranges.push(range);
      }
    }
    if (ranges.length) CSS.highlights.set('wtsc-document-v240',new Highlight(...ranges));
    else CSS.highlights.delete('wtsc-document-v240');
  }

  function spellingFalsePositive(text,item) {
    if (String(item.category || '').toLocaleLowerCase('tr-TR') !== 'spelling') return false;
    const raw = text.slice(item.start,item.end).trim();
    if (!raw || /\s/u.test(raw)) return false;
    try {
      return !!engine.isValid?.(raw);
    } catch (_) {
      return false;
    }
  }

  function clear(st) {
    st.items = [];
    st.el.dataset.wtscDocumentIssues = '0';
    st.el.dataset.wtscDocumentState = 'idle';
    renderPanel(st);
    refreshHighlights();
  }

  function run(st) {
    if (!st.el?.isConnected) return;
    const snap = snapshot(st.el);
    if (!snap) return;
    const text = snap.text;
    const sentenceCount = core.sentenceSegments(text).length;
    if (text.length < 120 || sentenceCount < 2) {
      clear(st);
      return;
    }
    st.el.dataset.wtscDocumentState = 'scanning';
    let report;
    try {
      report = engine.analyzeParagraph(text,{semantic:true,punctuation:true,properNames:true,longText:true,fullParagraph:true}) || {};
    } catch (_) {
      report = {};
    }
    const combined = [...(report.fixes || []),...(report.warnings || [])];
    const seen = new Set();
    st.items = combined.filter(item => {
      if (!item || item.end < item.start) return false;
      const confidence = item.confidence == null ? 0.8 : Number(item.confidence);
      if (confidence < 0.65) return false;
      if (spellingFalsePositive(text,item)) return false;
      const key = `${item.start}:${item.end}:${item.rule || item.category || ''}:${item.message || ''}:${item.suggestions?.[0] || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)).slice(0,24);
    st.el.dataset.wtscDocumentIssues = String(st.items.length);
    st.el.dataset.wtscDocumentState = 'ready';
    st.el.dataset.wtscDocumentSentences = String(sentenceCount);
    renderPanel(st);
    refreshHighlights();
  }

  function attach(el) {
    if (!el || states.has(el) || !(isMessageTextarea(el) || isRichEditor(el))) return;
    const st = {el,items:[],timer:0};
    states.set(el,st);
    stateList.add(st);
    st.schedule = delay => {
      clearTimeout(st.timer);
      st.timer = setTimeout(() => run(st),delay);
    };
    el.dataset.wtscDocumentBound = '1';
    el.addEventListener('input',() => st.schedule(420),{passive:true});
    el.addEventListener('paste',() => st.schedule(120),{passive:true});
    el.addEventListener('cut',() => st.schedule(150),{passive:true});
    el.addEventListener('focus',() => st.schedule(500),{passive:true});
    st.schedule(650);
  }

  function observe(root = document) {
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);
    editorElements(root).forEach(attach);
    const target = root === document ? document.documentElement : root;
    if (!target) return;
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          editorElements(node).forEach(attach);
        }
      }
    });
    observer.observe(target,{childList:true,subtree:true});
  }

  window.WarextDocumentV240 = {
    VERSION,
    rescan(root = document) {
      editorElements(root).forEach(el => states.get(el)?.schedule?.(0));
    },
    getIssues(el) {
      return (states.get(el)?.items || []).map(item => ({...item,suggestions:[...(item.suggestions || [])]}));
    }
  };

  installStyle();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => observe(document),{once:true});
  else observe(document);
})();
