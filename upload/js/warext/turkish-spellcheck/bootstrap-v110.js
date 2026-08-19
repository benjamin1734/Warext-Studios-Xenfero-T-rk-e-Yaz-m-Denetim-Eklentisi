(() => {
  'use strict';

  if (window.__warextTurkishSpellBootstrapV110) return;
  window.__warextTurkishSpellBootstrapV110 = true;

  const VERSION = '1.1.0';
  const script = document.currentScript;
  const scriptUrl = script?.src || '';
  const baseDir = scriptUrl ? scriptUrl.slice(0,scriptUrl.lastIndexOf('/') + 1) : '';
  let started = false;
  let observer = null;

  document.documentElement.dataset.wtscBootstrap = VERSION;

  function editorExists(root = document) {
    if (root instanceof Element && root.matches?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]')) return true;
    return !!root.querySelector?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]');
  }

  function loadScript(file,readyCheck) {
    return new Promise((resolve,reject) => {
      if (readyCheck?.()) return resolve();
      const full = baseDir ? baseDir + file : file;
      const existing = Array.from(document.scripts).find(el => el.src === full || el.dataset.wtscAsset === file);
      if (existing) {
        if (existing.dataset.wtscLoaded === '1' || readyCheck?.()) return resolve();
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const el = document.createElement('script');
      el.src = full;
      el.async = false;
      el.dataset.wtscAsset = file;
      el.addEventListener('load',() => {
        el.dataset.wtscLoaded = '1';
        resolve();
      },{once:true});
      el.addEventListener('error',reject,{once:true});
      document.head.appendChild(el);
    });
  }

  function showAssetError() {
    document.documentElement.dataset.wtscStatus = 'asset-load-error';
    const anchor = document.querySelector('.fr-box') || document.querySelector('textarea[name="message"]') || document.querySelector('.js-editor');
    if (!anchor || document.querySelector('.wtsc-bootstrap-error')) return;
    const bar = document.createElement('div');
    bar.className = 'wtsc-bootstrap-error';
    bar.textContent = 'Yazım denetimi dosyaları yüklenemedi.';
    bar.style.cssText = 'margin:7px 0 3px;padding:7px 10px;border:1px solid rgba(180,70,70,.45);border-radius:7px;font-size:12px;';
    anchor.insertAdjacentElement('afterend',bar);
  }

  async function start() {
    if (started) return;
    started = true;
    document.documentElement.dataset.wtscStatus = 'assets-loading';
    try {
      await loadScript('text-core-v110.js',() => !!window.WarextTextCoreV110);
      await loadScript('dictionary-v110.js',() => !!window.WarextTurkishSpellEngineV110);
      await loadScript('corrections-v110.js',() => !!window.WarextCorrectionMapV110);
      await loadScript('language-v110.js',() => !!window.__warextLanguageV110);
      if (!window.WarextTurkishSpellEngineV110) throw new Error('engine');
      await loadScript('editor-v110.js',() => !!window.__warextTurkishSpellCheckV110);
      await loadScript('longtext-v110.js',() => !!window.__warextLongTextV110);
      document.documentElement.dataset.wtscStatus = 'assets-ready';
      observer?.disconnect();
    } catch (_) {
      showAssetError();
    }
  }

  function detect(root = document) {
    if (editorExists(root)) start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => detect(document),{once:true});
  else detect(document);

  if (!started && document.documentElement) {
    observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && editorExists(node)) {
            start();
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
