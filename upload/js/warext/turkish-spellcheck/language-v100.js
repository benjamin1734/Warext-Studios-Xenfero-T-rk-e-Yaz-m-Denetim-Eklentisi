(() => {
  'use strict';
  const s = window.WarextV100Lang;
  if (!s || s.finalized) return;
  s.finalized = true;
  const engine = s.engine;
  engine.check = (rawWord,context = {}) => {
    const raw = String(rawWord || '').trim();
    const exactTech = s.tech.get(s.normalizeTech(raw));
    if (exactTech && raw === exactTech.canonical) return {word:raw,correct:true,suggestions:[],provider:'local-v1-tech-exact'};
    const learned = s.corrections()?.get(s.normalize(raw));
    if (learned && s.normalize(learned) !== s.normalize(raw)) return {word:raw,correct:false,suggestions:[s.preserve(raw,learned)],provider:'local-v1-correction-corpus'};
    const tech = s.techSuggestion(raw);
    if (tech) return {word:raw,correct:false,suggestions:[tech],provider:'local-v1-tech-abbreviation'};
    const result = s.baseCheck(raw,context) || {word:raw,correct:true,suggestions:[],provider:'local-v1-fallback'};
    if (result.correct === false && s.extendedMorphology) {
      const morphology = s.extendedMorphology(raw);
      if (morphology?.valid) return {word:raw,correct:true,suggestions:[],provider:'local-v1-extended-morphology',morphology};
    }
    if (result.correct === false && Array.isArray(result.suggestions)) result.suggestions = s.rank(raw,result.suggestions);
    return result;
  };
  engine.isValid = rawWord => {
    const raw = String(rawWord || '').trim();
    if (!raw) return false;
    if (s.techSuggestion(raw)) return false;
    const tech = s.tech.get(s.normalizeTech(raw));
    if (tech && raw === tech.canonical) return true;
    if (s.baseValid(raw)) return true;
    return !!s.extendedMorphology?.(raw)?.valid;
  };
  engine.suggest = (rawWord,context = {},limit = 3) => {
    const learned = s.corrections()?.get(s.normalize(rawWord));
    if (learned) return [s.preserve(String(rawWord || ''),learned)];
    const tech = s.techSuggestion(rawWord);
    if (tech) return [tech];
    const list = s.baseSuggest ? s.baseSuggest(rawWord,context,Math.max(limit,3)) : s.baseCheck(rawWord,context)?.suggestions || [];
    return s.rank(rawWord,list).slice(0,limit);
  };
  engine.analyzeSentence = (rawText,context = {}) => {
    const text = String(rawText || '');
    const list = [...(s.baseAnalyze(text,context) || []),...(s.extraSentenceIssues?.(text,context) || [])];
    const seen = new Set();
    return list.filter(item => {
      const key = `${item.start}:${item.end}:${item.rule || item.category || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  };
  engine.version = s.VERSION;
  engine.extendedMorphology = s.extendedMorphology;
  engine.techSuggestion = s.techSuggestion;
  engine.stats = {...(engine.stats || {}),morphology:'v1-local-multi-stage',technicalAbbreviations:s.tech.size,correctionCorpus:s.corrections()?.size || 0,extendedPatterns:s.extendedMorphologyCount || 0,temporalVerbFamilies:s.temporalFamilies || 0,contextLayers:3,externalDependencies:0};
  window.WarextTurkishSpellEngineV100 = engine;
})();
