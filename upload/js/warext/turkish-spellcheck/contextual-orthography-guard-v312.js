(() => {
  'use strict';

  if (window.__warextContextualOrthographyGuardV312) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check) return;
  window.__warextContextualOrthographyGuardV312 = true;

  const baseCheck = engine.check.bind(engine);
  const baseSuggest = typeof engine.suggest === 'function' ? engine.suggest.bind(engine) : null;

  function originalResult(rawWord, context = {}) {
    try {
      return baseCheck(rawWord,{...context,__wtscOrthographyProbe:true});
    } catch (_) {
      return null;
    }
  }

  function check(rawWord, context = {}) {
    const result = baseCheck(rawWord,context);
    if (!result || context.__wtscOrthographyProbe || result.provider !== 'local-contextual-orthography-v312') return result;
    const original = originalResult(rawWord,context);
    if (original?.correct === true) return original;
    return result;
  }

  function suggest(rawWord, context = {}, limit = 3) {
    const result = check(rawWord,context);
    if (result?.correct === false && result.suggestions?.length) return result.suggestions.slice(0,Math.max(1,Math.min(3,limit)));
    return baseSuggest ? baseSuggest(rawWord,context,limit) : [];
  }

  engine.check = check;
  engine.suggest = suggest;
  engine.stats = {
    ...(engine.stats || {}),
    contextualExactWordGuard:true,
    contextualFalsePositiveGuard:true,
    externalDependencies:0
  };
})();