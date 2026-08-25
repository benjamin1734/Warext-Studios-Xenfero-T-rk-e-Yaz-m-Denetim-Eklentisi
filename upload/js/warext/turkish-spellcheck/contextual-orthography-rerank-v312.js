(() => {
  'use strict';

  if (window.__warextContextualOrthographyRerankV312) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check || !engine?.contextualOrthographyV312) return;
  window.__warextContextualOrthographyRerankV312 = true;

  const baseCheck = engine.check.bind(engine);
  const baseSuggest = typeof engine.suggest === 'function' ? engine.suggest.bind(engine) : null;

  function check(rawWord, context = {}) {
    const result = baseCheck(rawWord,context);
    if (!result || context.__wtscOrthographyProbe) return result;
    let repair = null;
    try { repair = engine.contextualOrthographyV312(rawWord,context); } catch (_) {}
    if (!repair?.suggestion) return result;
    if (result.correct !== false && result.correct !== true) return result;
    const suggestions = [repair.suggestion,...(repair.suggestions || []),...(result.suggestions || [])]
      .filter((value,index,array) => value && array.indexOf(value) === index)
      .slice(0,3);
    return {
      ...result,
      correct:false,
      suggestions,
      provider:'local-contextual-orthography-v312',
      rule:'v312-contextual-orthography',
      category:'spelling',
      confidence:Math.max(Number(result.confidence || 0),Number(repair.confidence || 0.82)),
      contextReason:repair.genitiveFrame ? 'genitive-possessive' : 'local-language-model'
    };
  }

  function suggest(rawWord, context = {}, limit = 3) {
    const result = check(rawWord,context);
    if (result?.provider === 'local-contextual-orthography-v312' && result.suggestions?.length) return result.suggestions.slice(0,Math.max(1,Math.min(3,limit)));
    return baseSuggest ? baseSuggest(rawWord,context,limit) : [];
  }

  engine.check = check;
  engine.suggest = suggest;
  engine.stats = {
    ...(engine.stats || {}),
    contextualSuggestionReranking:true,
    contextualFalseNegativeRecovery:true,
    externalDependencies:0
  };
})();