(() => {
  'use strict';

  if (window.__warextParagraphV230) return;
  const core = window.WarextTextCoreV110;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!core || !engine?.analyzeParagraph) return;
  window.__warextParagraphV230 = true;

  const VERSION = '2.3.0';
  const states = new WeakMap();
  const stateList = new Set();
  const observedRoots = new WeakSet();

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
    if (!isRichEditor(el) || end <= start) return null;
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

  function installStyle() {
    if (document.getElementById('wtsc-paragraph-style-v230')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-paragraph-style-v230';
    style.textContent = `
      ::highlight(wtsc-paragraph-v230){text-decoration:underline wavy #c98212;text-decoration-thickness:1px;text-underline-offset:3px}
      .wtsc-paragraph-panel{display:none;margin:7px 0 3px;border:1px solid rgba(127,127,127,.25);border-radius:8px;overflow:hidden;font-size:12px;line-height:1.4}
      .wtsc-paragraph-panel.is-active{display:block}
      .wtsc-paragraph-title{padding:7px 10px;font-weight:600;background:rgba(127,127,127,.08)}
      .wtsc-paragraph-item{padding:7px 10px;border-top:1px solid rgba(127,127,127,.14)}
      .wtsc-paragraph-suggestion{display:block;margin-top:3px;opacity:.78}
    `;
    document.head.appendChild(style);
  }

  function panelOwner(el) {
    return isRichEditor(el) ? el.closest('.fr-box') || el : el;
  }

  function ensurePanel(el) {
    const owner = panelOwner(el);
    if (owner.__wtscParagraphPanel?.isConnected) return owner.__wtscParagraphPanel;
    const panel = document.createElement('div');
    panel.className = 'wtsc-paragraph-panel';
    panel.dataset.wtscParagraphVersion = VERSION;
    if (isRichEditor(el)) {
      const box = el.closest('.fr-box') || el;
      box.insertAdjacentElement('afterend',panel);
    } else {
      const holder = el.closest('.inputGroup') || el;
      holder.insertAdjacentElement('afterend',panel);
    }
    owner.__wtscParagraphPanel = panel;
    return panel;
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
    title.className = 'wtsc-paragraph-title';
    title.textContent = `Paragraf denetimi: ${items.length} bağlam/anlatım uyarısı`;
    panel.appendChild(title);
    for (const item of items.slice(0,8)) {
      const row = document.createElement('div');
      row.className = 'wtsc-paragraph-item';
      row.textContent = item.message || 'Paragraf bağlamını kontrol edin.';
      if (item.suggestions?.[0]) {
        const suggestion = document.createElement('span');
        suggestion.className = 'wtsc-paragraph-suggestion';
        suggestion.textContent = `Öneri: ${item.suggestions[0]}`;
        row.appendChild(suggestion);
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
        const range = rangeAt(st.el,item.start,item.end);
        if (range) ranges.push(range);
      }
    }
    if (ranges.length) CSS.highlights.set('wtsc-paragraph-v230',new Highlight(...ranges));
    else CSS.highlights.delete('wtsc-paragraph-v230');
  }

  function clear(st) {
    st.items = [];
    st.el.dataset.wtscParagraphIssues = '0';
    renderPanel(st);
    refreshHighlights();
  }

  function run(st) {
    if (!st.el?.isConnected) return;
    const snap = snapshot(st.el);
    if (!snap) return;
    const text = snap.text;
    if (text.length < 220 || core.sentenceSegments(text).length < 2) {
      clear(st);
      return;
    }
    let report;
    try {
      report = engine.analyzeParagraph(text,{semantic:true,punctuation:true,properNames:true,longText:true}) || {};
    } catch (_) {
      report = {};
    }
    const combined = [...(report.warnings || []),...(report.fixes || []).filter(item => /^v230-/u.test(item.rule || ''))];
    const seen = new Set();
    st.items = combined.filter(item => {
      if (!item || item.end <= item.start || (item.confidence || 0) < 0.8) return false;
      const key = `${item.start}:${item.end}:${item.rule || ''}:${item.message || ''}:${item.suggestions?.[0] || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start).slice(0,12);
    st.el.dataset.wtscParagraphIssues = String(st.items.length);
    st.el.dataset.wtscParagraphState = 'ready';
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
    el.addEventListener('input',() => st.schedule(650),{passive:true});
    el.addEventListener('paste',() => st.schedule(180),{passive:true});
    el.addEventListener('cut',() => st.schedule(220),{passive:true});
    el.addEventListener('focus',() => st.schedule(800),{passive:true});
    st.schedule(900);
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

  installStyle();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => observe(document),{once:true});
  else observe(document);
})();
