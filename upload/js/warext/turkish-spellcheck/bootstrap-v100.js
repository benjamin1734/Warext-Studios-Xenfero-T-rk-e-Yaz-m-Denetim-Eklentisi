(() => {
  'use strict';
  if (window.__warextTurkishSpellBootstrapV100) return;
  window.__warextTurkishSpellBootstrapV100 = true;
  const VERSION = '1.0.0';
  const script = document.currentScript;
  const src = script?.src || '';
  const base = src ? src.slice(0,src.lastIndexOf('/') + 1) : '';
  let started = false;
  let observer = null;
  document.documentElement.dataset.wtscBootstrap = VERSION;
  const hasEditor = root => {
    if (root instanceof Element && root.matches?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]')) return true;
    return !!root.querySelector?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]');
  };
  const load = (file,ready) => new Promise((resolve,reject) => {
    if (ready?.()) return resolve();
    const full = base ? base + file : file;
    const existing = [...document.scripts].find(el => el.src === full || el.dataset.wtscAsset === file);
    if (existing) {
      if (ready?.() || existing.dataset.wtscLoaded === '1') return resolve();
      existing.addEventListener('load',resolve,{once:true});
      existing.addEventListener('error',reject,{once:true});
      return;
    }
    const el = document.createElement('script');
    el.src = full;
    el.async = false;
    el.dataset.wtscAsset = file;
    el.addEventListener('load',() => { el.dataset.wtscLoaded = '1'; resolve(); },{once:true});
    el.addEventListener('error',reject,{once:true});
    document.head.appendChild(el);
  });
  const errorBar = () => {
    document.documentElement.dataset.wtscStatus = 'asset-load-error';
    const anchor = document.querySelector('.fr-box') || document.querySelector('textarea[name="message"]') || document.querySelector('.js-editor');
    if (!anchor || document.querySelector('.wtsc-bootstrap-error')) return;
    const bar = document.createElement('div');
    bar.className = 'wtsc-bootstrap-error';
    bar.textContent = 'Yazım denetimi dosyaları yüklenemedi.';
    bar.style.cssText = 'margin:7px 0 3px;padding:7px 10px;border:1px solid rgba(180,70,70,.45);border-radius:7px;font-size:12px';
    anchor.insertAdjacentElement('afterend',bar);
  };
  const start = async () => {
    if (started) return;
    started = true;
    document.documentElement.dataset.wtscStatus = 'assets-loading';
    try {
      await load('dictionary-v300.js',() => !!window.WarextTurkishSpellEngineV300);
      await load('corrections-v100.js',() => window.WarextCorrectionMapV100 instanceof Map);
      await load('language-core-v100.js',() => !!window.WarextV100Lang);
      await load('language-morph-v100.js',() => !!window.WarextV100Lang?.extendedMorphology);
      await load('language-context-time-v100.js',() => !!window.WarextV100Lang?.temporalIssues);
      await load('language-context-rules-v100.js',() => !!window.WarextV100Lang?.extraSentenceIssues);
      await load('language-v100.js',() => !!window.WarextTurkishSpellEngineV100);
      await load('editor-v300.js',() => !!window.__warextTurkishSpellCheckV300);
      await load('text-core-v100.js',() => !!window.WarextLongTextCoreV310);
      await load('longtext-v310.js',() => !!window.__warextTurkishLongTextV310);
      document.documentElement.dataset.wtscVersion = VERSION;
      document.documentElement.dataset.wtscStatus = 'local-ready';
      observer?.disconnect();
    } catch (_) {
      errorBar();
    }
  };
  const detect = root => { if (hasEditor(root || document)) start(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => detect(document),{once:true});
  else detect(document);
  if (!started && document.documentElement) {
    observer = new MutationObserver(list => {
      for (const mutation of list) for (const node of mutation.addedNodes) if (node instanceof Element && hasEditor(node)) return void start();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
