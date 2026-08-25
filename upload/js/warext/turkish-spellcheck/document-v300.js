(() => {
  'use strict';

  if (window.__warextDocumentV300) return;
  const core = window.WarextTextCoreV110;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!core || !engine?.analyzeParagraph || !engine?.analyzeSemanticDocument) return;
  window.__warextDocumentV300 = true;

  const VERSION = '3.1.0';
  const states = new WeakMap();
  const stateList = new Set();
  const observedRoots = new WeakSet();
  const reportCache = new Map();
  const CACHE_LIMIT = 18;
  const LABELS = new Map([
    ['spelling','Yazım'],['grammar','Dilbilgisi'],['punctuation','Noktalama'],['semantic','Anlam'],['syntax','Sözdizimi'],['discourse','Bağlam'],['style','Anlatım'],['logic','Mantık']
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

  function replaceRange(el,item,replacement) {
    if (el instanceof HTMLTextAreaElement) {
      const value = el.value || '';
      el.value = value.slice(0,item.start) + replacement + value.slice(item.end);
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
    try { el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertReplacementText',data:replacement})); }
    catch (_) { el.dispatchEvent(new Event('input',{bubbles:true})); }
    el.focus();
    return true;
  }

  function installStyle() {
    if (document.getElementById('wtsc-document-style-v300')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-document-style-v300';
    style.textContent = `
      .wtsc-paragraph-panel,.wtsc-document-panel{display:none!important}
      ::highlight(wtsc-document-v300){text-decoration:underline wavy #b87400;text-decoration-thickness:1px;text-underline-offset:3px}
      .wtsc-document-v300{margin:8px 0 4px;border:1px solid rgba(127,127,127,.28);border-radius:10px;overflow:hidden;font-size:12px;line-height:1.45}
      .wtsc-document-v300-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;background:rgba(127,127,127,.09)}
      .wtsc-document-v300-title{font-weight:700}
      .wtsc-document-v300-score{font-size:11px;font-weight:700;white-space:nowrap}
      .wtsc-document-v300-summary{display:flex;flex-wrap:wrap;gap:6px;padding:7px 11px;border-top:1px solid rgba(127,127,127,.12)}
      .wtsc-document-v300-chip{padding:2px 6px;border:1px solid rgba(127,127,127,.2);border-radius:999px;opacity:.82}
      .wtsc-document-v300-item{padding:8px 11px;border-top:1px solid rgba(127,127,127,.14)}
      .wtsc-document-v300-meta{display:block;margin-bottom:3px;font-size:10px;font-weight:700;letter-spacing:.04em;opacity:.65;text-transform:uppercase}
      .wtsc-document-v300-fix{appearance:none;margin-top:6px;border:1px solid rgba(127,127,127,.28);border-radius:6px;background:rgba(127,127,127,.08);color:inherit;padding:5px 8px;font:inherit;font-size:11px;cursor:pointer}
      .wtsc-document-v300-empty{padding:8px 11px;border-top:1px solid rgba(127,127,127,.14);opacity:.72}
    `;
    document.head.appendChild(style);
  }

  function owner(el) {
    return isRichEditor(el) ? el.closest('.fr-box') || el : el;
  }

  function ensurePanel(el) {
    const target = owner(el);
    if (target.__wtscDocumentV300?.isConnected) return target.__wtscDocumentV300;
    const panel = document.createElement('div');
    panel.className = 'wtsc-document-v300';
    panel.dataset.wtscDocumentVersion = VERSION;
    if (isRichEditor(el)) (el.closest('.fr-box') || el).insertAdjacentElement('afterend',panel);
    else (el.closest('.inputGroup') || el).insertAdjacentElement('afterend',panel);
    target.__wtscDocumentV300 = panel;
    return panel;
  }

  function categoryLabel(item) {
    return LABELS.get(String(item.category || '').toLocaleLowerCase('tr-TR')) || 'Metin';
  }

  function render(st) {
    const panel = ensurePanel(st.el);
    panel.textContent = '';
    if (!st.report) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = '';
    const coherence = st.report.coherence || st.report.semanticDocument?.coherence || {};
    const score = Number.isFinite(Number(coherence.score)) ? Number(coherence.score) : 100;
    const head = document.createElement('div');
    head.className = 'wtsc-document-v300-head';
    const title = document.createElement('span');
    title.className = 'wtsc-document-v300-title';
    title.textContent = `Genel metin ve anlam analizi · ${st.sentenceCount} cümle`;
    const scoreEl = document.createElement('span');
    scoreEl.className = 'wtsc-document-v300-score';
    scoreEl.textContent = `Bütünlük ${score}/100`;
    head.append(title,scoreEl);
    panel.appendChild(head);

    const summary = document.createElement('div');
    summary.className = 'wtsc-document-v300-summary';
    const findings = document.createElement('span');
    findings.className = 'wtsc-document-v300-chip';
    findings.textContent = `${st.items.length} bulgu`;
    summary.appendChild(findings);
    const similarity = Number(coherence.averageAdjacentSimilarity);
    if (Number.isFinite(similarity)) {
      const continuity = document.createElement('span');
      continuity.className = 'wtsc-document-v300-chip';
      continuity.textContent = `Cümle bağı ${(Math.max(0,Math.min(1,similarity)) * 100).toFixed(0)}%`;
      summary.appendChild(continuity);
    }
    for (const topic of (coherence.topics || []).slice(0,4)) {
      const chip = document.createElement('span');
      chip.className = 'wtsc-document-v300-chip';
      chip.textContent = `Konu: ${topic.name}`;
      summary.appendChild(chip);
    }
    panel.appendChild(summary);

    if (!st.items.length) {
      const empty = document.createElement('div');
      empty.className = 'wtsc-document-v300-empty';
      empty.textContent = 'Paragrafın cümleler arası anlam, mantık, zaman, özne ve konu akışında yüksek güvenli bir sorun bulunmadı.';
      panel.appendChild(empty);
      return;
    }

    for (const item of st.items.slice(0,24)) {
      const row = document.createElement('div');
      row.className = 'wtsc-document-v300-item';
      const meta = document.createElement('span');
      meta.className = 'wtsc-document-v300-meta';
      meta.textContent = `${categoryLabel(item)} · ${Math.round((item.confidence || 0.75) * 100)}%`;
      const message = document.createElement('span');
      message.textContent = item.message || 'Metnin bu bölümündeki anlam ve bağlam yapısını kontrol edin.';
      row.append(meta,message);
      const suggestion = item.suggestions?.[0];
      if (suggestion != null && String(suggestion) !== '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wtsc-document-v300-fix';
        button.textContent = `Düzelt: ${suggestion}`;
        button.addEventListener('click',() => {
          if (replaceRange(st.el,item,String(suggestion))) st.schedule?.(50);
        });
        row.appendChild(button);
      }
      panel.appendChild(row);
    }
  }

  function refreshHighlights() {
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
    const ranges = [];
    for (const st of [...stateList]) {
      if (!st.el?.isConnected) {
        cancelScheduled(st);
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
    if (ranges.length) CSS.highlights.set('wtsc-document-v300',new Highlight(...ranges));
    else CSS.highlights.delete('wtsc-document-v300');
  }

  function spellingFalsePositive(text,item) {
    if (String(item.category || '').toLocaleLowerCase('tr-TR') !== 'spelling') return false;
    const raw = text.slice(item.start,item.end).trim();
    if (!raw || /\s/u.test(raw)) return false;
    try { return !!engine.isValid?.(raw); } catch (_) { return false; }
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash,16777619);
    }
    return `${text.length}:${hash >>> 0}`;
  }

  function cacheGet(text) {
    const key = hashText(text);
    const entry = reportCache.get(key);
    if (!entry || entry.text !== text) return null;
    reportCache.delete(key);
    reportCache.set(key,entry);
    return entry;
  }

  function cachePut(text,report,items,sentenceCount) {
    const key = hashText(text);
    reportCache.delete(key);
    reportCache.set(key,{text,report,items,sentenceCount});
    while (reportCache.size > CACHE_LIMIT) reportCache.delete(reportCache.keys().next().value);
  }

  function scheduleIdle(fn,timeout = 900) {
    if (typeof requestIdleCallback === 'function') return {type:'idle',id:requestIdleCallback(fn,{timeout})};
    return {type:'timer',id:setTimeout(() => fn({didTimeout:true,timeRemaining:() => 8}),24)};
  }

  function cancelIdle(handle) {
    if (!handle) return;
    if (handle.type === 'idle' && typeof cancelIdleCallback === 'function') cancelIdleCallback(handle.id);
    else clearTimeout(handle.id);
  }

  function cancelScheduled(st) {
    clearTimeout(st.timer);
    st.timer = 0;
    cancelIdle(st.idleHandle);
    st.idleHandle = null;
  }

  function applyResult(st,text,report,items,sentenceCount,source,elapsed = 0) {
    if (!st.el?.isConnected) return;
    st.report = report;
    st.items = items;
    st.sentenceCount = sentenceCount;
    st.lastText = text;
    st.el.dataset.wtscDocumentIssues = String(items.length);
    st.el.dataset.wtscDocumentState = 'ready';
    st.el.dataset.wtscDocumentSentences = String(sentenceCount);
    st.el.dataset.wtscCoherenceScore = String(report?.coherence?.score ?? report?.semanticDocument?.coherence?.score ?? 100);
    st.el.dataset.wtscDocumentSource = source;
    st.el.dataset.wtscDocumentAnalysisMs = String(Math.max(0,Math.round(elapsed)));
    st.el.dataset.wtscDocumentCacheSize = String(reportCache.size);
    render(st);
    refreshHighlights();
  }

  function analyzeNow(st,text,sentenceCount,scanId) {
    if (scanId !== st.scanId || !st.el?.isConnected) return;
    const cached = cacheGet(text);
    if (cached) {
      st.cacheHits++;
      st.el.dataset.wtscDocumentCacheHits = String(st.cacheHits);
      applyResult(st,text,cached.report,cached.items.map(item => ({...item})),cached.sentenceCount,'cache',0);
      return;
    }
    const started = performance.now();
    let report = {warnings:[],fixes:[]};
    try { report = engine.analyzeParagraph(text,{semantic:true,punctuation:true,properNames:true,longText:true,fullParagraph:true}) || report; }
    catch (_) {}
    if (scanId !== st.scanId || !st.el?.isConnected) return;
    const combined = [...(report.fixes || []),...(report.warnings || [])];
    const seen = new Set();
    const items = combined.filter(item => {
      if (!item || item.end < item.start) return false;
      const confidence = item.confidence == null ? 0.72 : Number(item.confidence);
      if (confidence < 0.68) return false;
      if (spellingFalsePositive(text,item)) return false;
      const key = `${item.start}:${item.end}:${item.rule || item.category || ''}:${item.message || ''}:${item.suggestions?.[0] || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start).slice(0,36);
    const elapsed = performance.now() - started;
    cachePut(text,report,items.map(item => ({...item})),sentenceCount);
    st.scans++;
    st.el.dataset.wtscDocumentScans = String(st.scans);
    applyResult(st,text,report,items,sentenceCount,'analysis',elapsed);
  }

  function run(st) {
    if (!st.el?.isConnected) return;
    const snap = snapshot(st.el);
    if (!snap) return;
    const text = snap.text;
    const sentenceCount = core.sentenceSegments(text).length;
    st.scanId++;
    const scanId = st.scanId;
    cancelIdle(st.idleHandle);
    st.idleHandle = null;
    if (text.length < 90 || sentenceCount < 2) {
      st.report = null;
      st.items = [];
      st.sentenceCount = sentenceCount;
      st.lastText = text;
      st.el.dataset.wtscDocumentState = 'short';
      render(st);
      refreshHighlights();
      return;
    }
    if (text === st.lastText && st.report) {
      st.el.dataset.wtscDocumentState = 'ready';
      st.el.dataset.wtscDocumentSource = 'unchanged';
      return;
    }
    st.el.dataset.wtscDocumentState = 'waiting-idle';
    const timeout = text.length > 12000 ? 1500 : text.length > 5000 ? 1150 : 800;
    st.idleHandle = scheduleIdle(() => {
      st.idleHandle = null;
      if (scanId !== st.scanId) return;
      analyzeNow(st,text,sentenceCount,scanId);
    },timeout);
  }

  function attach(el) {
    if (!el || states.has(el) || !(isMessageTextarea(el) || isRichEditor(el))) return;
    const st = {el,items:[],report:null,sentenceCount:0,timer:0,idleHandle:null,scanId:0,lastText:'',scans:0,cacheHits:0};
    states.set(el,st);
    stateList.add(st);
    st.schedule = delay => {
      clearTimeout(st.timer);
      cancelIdle(st.idleHandle);
      st.idleHandle = null;
      st.scanId++;
      st.timer = setTimeout(() => {
        st.timer = 0;
        run(st);
      },delay);
    };
    el.dataset.wtscDocumentV300Bound = '1';
    el.dataset.wtscDocumentRuntime = VERSION;
    el.addEventListener('input',() => st.schedule(620),{passive:true});
    el.addEventListener('paste',() => st.schedule(220),{passive:true});
    el.addEventListener('cut',() => st.schedule(240),{passive:true});
    el.addEventListener('focus',() => st.schedule(720),{passive:true});
    st.schedule(900);
  }

  function observe(root = document) {
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);
    editorElements(root).forEach(attach);
    const target = root === document ? document.documentElement : root;
    if (!target) return;
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) editorElements(node).forEach(attach);
    });
    observer.observe(target,{childList:true,subtree:true});
  }

  function rescanVisible() {
    for (const st of stateList) if (st.el?.isConnected && document.visibilityState === 'visible') st.schedule?.(80);
  }

  window.WarextDocumentV300 = {
    VERSION,
    rescan(root = document) { editorElements(root).forEach(el => states.get(el)?.schedule?.(0)); },
    getReport(el) { return states.get(el)?.report || null; },
    getIssues(el) { return (states.get(el)?.items || []).map(item => ({...item,suggestions:[...(item.suggestions || [])]})); },
    getPerformance(el) {
      const st = states.get(el);
      return st ? {scans:st.scans,cacheHits:st.cacheHits,cacheEntries:reportCache.size,lastTextLength:st.lastText.length} : null;
    },
    clearCache() { reportCache.clear(); }
  };

  installStyle();
  document.addEventListener('visibilitychange',rescanVisible,{passive:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => observe(document),{once:true});
  else observe(document);
})();