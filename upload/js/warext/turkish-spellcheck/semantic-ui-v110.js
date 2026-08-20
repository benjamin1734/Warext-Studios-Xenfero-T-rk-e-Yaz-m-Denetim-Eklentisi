(() => {
  'use strict';

  if (typeof document === 'undefined' || window.__warextSemanticUiV130) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning) return;
  window.__warextSemanticUiV130 = true;

  const config = document.getElementById('wtsc-config')?.dataset || {};
  const enabled = !['0','false','off','no'].includes(String(config.semantic ?? '1').toLowerCase());
  const sensitivity = Math.max(0.7,Math.min(0.99,Number(config.semanticSensitivity || 88) / 100));
  if (!enabled) return;

  const states = new WeakMap();

  function editorText(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value || '';
    if (el instanceof HTMLElement && el.isContentEditable) return el.innerText || el.textContent || '';
    return '';
  }

  function ranges(text) {
    return window.WarextTextCoreV110?.protectedRanges?.(text) || [];
  }

  function anchorFor(el) {
    if (el instanceof HTMLElement && el.isContentEditable) return el.closest('.fr-box') || el;
    return el.closest?.('.inputGroup') || el;
  }

  function installStyle() {
    if (document.getElementById('wtsc-semantic-ui-v130')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-semantic-ui-v130';
    style.textContent = '.wtsc-semantic-panel{display:none!important}.wtsc-semantic-deep-panel{margin:6px 0 3px;padding:8px 10px;border:1px solid rgba(190,140,40,.42);border-radius:8px;background:rgba(190,140,40,.07);font-size:12px;line-height:1.4}.wtsc-semantic-deep-panel[hidden]{display:none}.wtsc-semantic-deep-item+.wtsc-semantic-deep-item{margin-top:6px;padding-top:6px;border-top:1px solid rgba(127,127,127,.14)}.wtsc-semantic-deep-title{font-weight:650;margin-right:5px}.wtsc-semantic-deep-meta{opacity:.58;margin-left:6px;font-size:11px}';
    document.head.appendChild(style);
  }

  function ensurePanel(el) {
    const anchor = anchorFor(el);
    if (!anchor) return null;
    let panel = anchor.parentElement?.querySelector?.(':scope > .wtsc-semantic-deep-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'wtsc-semantic-deep-panel';
    panel.hidden = true;
    anchor.insertAdjacentElement('afterend',panel);
    return panel;
  }

  function render(el,report) {
    const panel = states.get(el)?.panel;
    if (!panel) return;
    panel.textContent = '';
    const warnings = (report?.warnings || []).filter(item => Number(item.confidence || 0) >= sensitivity).slice(0,4);
    if (!warnings.length) {
      panel.hidden = true;
      return;
    }
    for (const warning of warnings) {
      const row = document.createElement('div');
      row.className = 'wtsc-semantic-deep-item';
      const title = document.createElement('span');
      title.className = 'wtsc-semantic-deep-title';
      title.textContent = 'Anlam denetimi:';
      const text = document.createElement('span');
      text.textContent = warning.message || 'Cümlede yüksek güvenli bir anlam uyumsuzluğu bulundu.';
      const meta = document.createElement('span');
      meta.className = 'wtsc-semantic-deep-meta';
      meta.textContent = `%${Math.round(Number(warning.confidence || 0) * 100)}`;
      row.append(title,text,meta);
      panel.appendChild(row);
    }
    panel.hidden = false;
  }

  function analyze(el) {
    const text = editorText(el);
    if (!text.trim() || text.length > 60000) {
      render(el,{warnings:[]});
      return;
    }
    const job = () => {
      let report = null;
      try {
        report = engine.analyzeMeaning(text,{protectedRanges:ranges(text),longText:text.length >= 700,semantic:true});
      } catch (_) {
        report = {warnings:[]};
      }
      render(el,report);
    };
    if (typeof requestIdleCallback === 'function' && text.length > 900) requestIdleCallback(job,{timeout:650});
    else job();
  }

  function attach(el) {
    if (!el || states.has(el)) return;
    if (el instanceof HTMLTextAreaElement && el.parentElement?.querySelector?.('.fr-box .fr-element[contenteditable="true"]')) return;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable))) return;
    const panel = ensurePanel(el);
    if (!panel) return;
    let timer = 0;
    const schedule = delay => {
      clearTimeout(timer);
      timer = window.setTimeout(() => analyze(el),delay);
    };
    states.set(el,{panel,schedule});
    el.addEventListener('input',() => schedule(700),{passive:true});
    el.addEventListener('focus',() => schedule(180),{passive:true});
    schedule(320);
  }

  function scan(root = document) {
    if (root instanceof Element && root.matches?.('.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]')) attach(root);
    root.querySelectorAll?.('.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]').forEach(attach);
  }

  function boot() {
    installStyle();
    scan(document);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) scan(node);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
