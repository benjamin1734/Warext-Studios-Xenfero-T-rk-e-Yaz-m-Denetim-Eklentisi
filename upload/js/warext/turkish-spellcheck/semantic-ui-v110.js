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
    style.textContent = '.wtsc-semantic-panel{display:none!important}.wtsc-semantic-deep-panel{margin:6px 0 3px;padding:8px 10px;border:1px solid rgba(190,140,40,.42);border-radius:8px;background:rgba(190,140,40,.07);font-size:12px;line-height:1.4}.wtsc-semantic-deep-panel[hidden]{display:none}.wtsc-semantic-deep-item+.wtsc-semantic-deep-item{margin-top:6px;padding-top:6px;border-top:1px solid rgba(127,127,127,.14)}.wtsc-semantic-deep-title{font-weight:650;margin-right:5px}.wtsc-semantic-deep-meta{opacity:.58;margin-left:6px;font-size:11px}.wtsc-semantic-deep-action{appearance:none;border:0;background:transparent;color:inherit;opacity:.7;padding:2px 5px;margin-left:6px;font:inherit;font-size:11px;cursor:pointer}.wtsc-semantic-deep-action:hover,.wtsc-semantic-deep-action:focus{opacity:1;text-decoration:underline;outline:none}';
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

  function warningKey(warning) {
    return `${warning.rule || ''}:${warning.start || 0}:${warning.end || 0}:${warning.message || ''}`;
  }

  function render(el,report) {
    const state=states.get(el);
    const panel = state?.panel;
    if (!panel) return;
    panel.textContent = '';
    const warnings = (report?.warnings || []).filter(item => Number(item.confidence || 0) >= sensitivity && !state.dismissed.has(warningKey(item))).slice(0,5);
    if (!warnings.length) {
      panel.hidden = true;
      return;
    }
    const fullText=editorText(el);
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
      const action=document.createElement('button');
      action.type='button';
      action.className='wtsc-semantic-deep-action';
      action.textContent='Bu doğru';
      action.addEventListener('click',() => {
        const start=Math.max(0,Number(warning.start || 0));
        const end=Math.max(start,Number(warning.end || start));
        const rawWord=String(warning.word || '').trim();
        const candidate=/^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû'’-]{2,64}$/u.test(rawWord) ? rawWord : '';
        engine.learning?.falsePositive?.({rule:warning.rule || 'semantic',text:fullText.slice(Math.max(0,start - 50),Math.min(fullText.length,Math.max(end,start + 1) + 50)),word:candidate,confidence:Number(warning.confidence || 0)});
        state.dismissed.add(warningKey(warning));
        state.schedule(20);
      });
      row.append(title,text,meta,action);
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
    states.set(el,{panel,schedule,dismissed:new Set()});
    el.addEventListener('input',() => { states.get(el)?.dismissed.clear(); schedule(700); },{passive:true});
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
