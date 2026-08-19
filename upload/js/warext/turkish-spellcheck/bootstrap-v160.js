(() => {
  'use strict';

  if (window.__warextTurkishSpellBootstrapV160) return;
  window.__warextTurkishSpellBootstrapV160 = true;

  const VERSION = '1';
  const BUILD = '1.6.0';
  const script = document.currentScript;
  const scriptUrl = script?.src || '';
  const baseDir = scriptUrl ? scriptUrl.slice(0,scriptUrl.lastIndexOf('/') + 1) : '';
  window.WarextSpellBaseDirV160 = baseDir;
  document.documentElement.dataset.wtscBootstrap = VERSION;
  document.documentElement.dataset.wtscBuild = BUILD;
  let started = false;
  let observer = null;

  function editorExists(root = document) {
    if (root instanceof Element && root.matches?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]')) return true;
    return !!root.querySelector?.('.js-editor,.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]');
  }

  function loadEditor() {
    if (started) return;
    started = true;
    const existing = Array.from(document.scripts).find(item => item.dataset.wtscAsset === 'editor-v160.js' || item.src === baseDir + 'editor-v160.js');
    if (existing) return;
    const el = document.createElement('script');
    el.src = baseDir + 'editor-v160.js';
    el.async = false;
    el.dataset.wtscAsset = 'editor-v160.js';
    el.addEventListener('load',() => {
      document.documentElement.dataset.wtscStatus = 'assets-ready';
      observer?.disconnect();
    },{once:true});
    el.addEventListener('error',() => {
      document.documentElement.dataset.wtscStatus = 'asset-load-error';
    },{once:true});
    document.head.appendChild(el);
  }

  function detect(root = document) {
    if (editorExists(root)) loadEditor();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => detect(document),{once:true});
  else detect(document);

  if (!started && document.documentElement) {
    observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && editorExists(node)) {
            loadEditor();
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
