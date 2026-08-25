(() => {
  'use strict';

  if (window.__warextContextualOrthographyV312) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check || !engine?.analyzeMorphology) return;
  window.__warextContextualOrthographyV312 = true;

  const VERSION = '3.1.2';
  const baseCheck = engine.check.bind(engine);
  const baseSuggest = typeof engine.suggest === 'function' ? engine.suggest.bind(engine) : null;
  const analyzeMorphology = engine.analyzeMorphology.bind(engine);
  const lm = window.WarextLmV200 || null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const letters = value => Array.from(normalize(value));
  const vowels = new Set(['a','e','ı','i','o','ö','u','ü']);
  const highVowels = new Set(['ı','i','u','ü']);
  const consonantAlternatives = new Map([
    ['c',['ç']],['ç',['c']],['g',['ğ']],['ğ',['g']],['s',['ş']],['ş',['s']],['i',['ı']],['ı',['i']],['o',['ö']],['ö',['o']],['u',['ü']],['ü',['u']]
  ]);
  const contextCache = new Map();

  function rootProbe(raw, context = {}) {
    const word = normalize(raw);
    if (!word) return {strong:false,provider:'',root:word};
    let morphology = null;
    try { morphology = analyzeMorphology(word) || null; } catch (_) {}
    const root = normalize(morphology?.root || word);
    if (!root || root === word) return {strong:false,provider:'',root,morphology};
    let rootResult = null;
    try {
      rootResult = baseCheck(root,{properNames:false,informal:true,sentenceStart:false,__wtscOrthographyProbe:true});
    } catch (_) {}
    const provider = String(rootResult?.provider || '');
    const strong = rootResult?.correct === true && /(?:tdk-exact|custom-dictionary|abbreviation-exact)$/u.test(provider);
    return {strong,provider,root,morphology};
  }

  function candidateProbe(candidate, context = {}) {
    let result = null;
    try {
      result = baseCheck(candidate,{
        ...context,
        sentenceStart:false,
        previousWord:'',
        before:'',
        previousSentence:'',
        nextSentence:'',
        __wtscOrthographyProbe:true
      });
    } catch (_) {}
    if (!result || result.correct !== true) return null;
    const root = rootProbe(candidate,context);
    const provider = String(result.provider || '');
    const exact = /(?:tdk-exact|custom-dictionary|abbreviation-exact)$/u.test(provider);
    const morphologyScore = Number(root.morphology?.score || 0);
    return {
      candidate,
      result,
      root:root.root,
      rootStrong:root.strong,
      exact,
      inflected:root.strong && root.root && root.root !== candidate,
      morphologyScore:Number.isFinite(morphologyScore) ? morphologyScore : 0
    };
  }

  function variantCandidates(raw, limit = 260) {
    const source = letters(raw);
    if (source.length < 3 || source.length > 28) return [];
    const out = new Map();
    const add = (value,changes,kind) => {
      const candidate = value.join('');
      if (!candidate || candidate === source.join('') || out.has(candidate) || out.size >= limit) return;
      out.set(candidate,{candidate,changes,kind});
    };
    for (let index = 0; index < source.length && out.size < limit; index++) {
      const current = source[index];
      if (vowels.has(current)) {
        for (const replacement of vowels) {
          if (replacement === current) continue;
          const copy = source.slice();
          copy[index] = replacement;
          add(copy,1,'vowel');
        }
      }
      for (const replacement of consonantAlternatives.get(current) || []) {
        const copy = source.slice();
        copy[index] = replacement;
        add(copy,1,'diacritic');
      }
    }
    const vowelIndexes = [];
    for (let index = 0; index < source.length; index++) if (vowels.has(source[index])) vowelIndexes.push(index);
    for (let first = 0; first < vowelIndexes.length && out.size < limit; first++) {
      for (let second = first + 1; second < vowelIndexes.length && out.size < limit; second++) {
        const a = vowelIndexes[first];
        const b = vowelIndexes[second];
        for (const firstReplacement of vowels) {
          if (firstReplacement === source[a]) continue;
          for (const secondReplacement of vowels) {
            if (secondReplacement === source[b]) continue;
            const copy = source.slice();
            copy[a] = firstReplacement;
            copy[b] = secondReplacement;
            add(copy,2,'double-vowel');
            if (out.size >= limit) break;
          }
          if (out.size >= limit) break;
        }
      }
    }
    return [...out.values()];
  }

  function leftContext(context, original) {
    const before = String(context?.before || '');
    if (!before) return '';
    const lower = normalize(before);
    const word = normalize(original);
    const index = lower.lastIndexOf(word);
    if (index < 0) return before.slice(-220);
    return before.slice(Math.max(0,index - 220),index);
  }

  function genitivePossessiveFrame(context, original) {
    const left = normalize(leftContext(context,original));
    if (!left) return false;
    const tail = left.slice(-180);
    return /(?:^|[.!?;:]\s*)[a-zçğıöşüâîû'’-]+(?:nın|nin|nun|nün)(?:\s+[a-zçğıöşüâîû'’-]+){0,7}\s*$/u.test(tail);
  }

  function possessiveShape(probe) {
    if (!probe?.inflected || !probe.rootStrong || !probe.root || !probe.candidate) return false;
    const candidateChars = letters(probe.candidate);
    const rootChars = letters(probe.root);
    if (candidateChars.length <= rootChars.length) return false;
    const final = candidateChars[candidateChars.length - 1];
    if (highVowels.has(final)) return true;
    return /(?:s[ıiuü]|lar[ıi]|ler[ıi])$/u.test(probe.candidate);
  }

  function languageModelDelta(original,candidate,context) {
    if (!lm?.score) return 0;
    const left = leftContext(context,original).slice(-140);
    const previous = normalize(context?.previousWord || '');
    const originalText = `${left} ${original}`.trim();
    const candidateText = `${left} ${candidate}`.trim();
    let originalScore = 0.035;
    let candidateScore = 0.035;
    try { originalScore = Number(lm.score(originalText)?.score || 0.035); } catch (_) {}
    try { candidateScore = Number(lm.score(candidateText)?.score || 0.035); } catch (_) {}
    let delta = Math.max(-1,Math.min(1,(candidateScore - originalScore) / Math.max(0.035,originalScore)));
    if (previous) {
      try {
        const basePair = Number(lm.score(`${previous} ${original}`)?.score || 0.035);
        const candidatePair = Number(lm.score(`${previous} ${candidate}`)?.score || 0.035);
        delta += Math.max(-1,Math.min(1,(candidatePair - basePair) / Math.max(0.035,basePair))) * 0.8;
      } catch (_) {}
    }
    return delta;
  }

  function originalStrength(word) {
    const root = rootProbe(word,{});
    return {
      root:root.root,
      rootStrong:root.strong,
      inflected:root.strong && root.root && root.root !== word,
      morphologyScore:Number(root.morphology?.score || 0)
    };
  }

  function rankCandidate(entry, probe, originalResult, originalInfo, context, genitiveFrame) {
    if (!probe) return -Infinity;
    let score = 0;
    if (probe.exact) score += 3.4;
    if (probe.rootStrong) score += 3.1;
    if (probe.inflected) score += 1.5;
    score += Math.max(0,Math.min(1.4,probe.morphologyScore * 0.18));
    if (entry.changes === 1) score += 1.3;
    else score -= 0.35;
    if (entry.kind === 'diacritic') score += 0.9;
    if (genitiveFrame && possessiveShape(probe)) score += 6.2;
    if (genitiveFrame && originalInfo.inflected) score -= 4.8;
    if (originalInfo.rootStrong && originalInfo.root === probe.root) score += 2.1;
    if (originalInfo.inflected && originalInfo.root !== probe.root) score -= 2.8;
    if (String(originalResult?.provider || '').includes('tdk-exact')) score -= 2.4;
    const lmDelta = languageModelDelta(normalize(originalResult?.word || ''),probe.candidate,context);
    if (lmDelta > 0) score += Math.min(4.2,lmDelta * 3.4);
    else score += Math.max(-1.8,lmDelta * 1.4);
    return score;
  }

  function contextualRepair(original, originalResult, context = {}) {
    const word = normalize(original);
    if (!word || word.length < 3 || word.length > 28 || context.__wtscOrthographyProbe) return null;
    if (!/^[a-zçğıöşüâîû]+$/u.test(word)) return null;
    const before = String(context.before || '');
    const cacheKey = `${word}\u0000${normalize(context.previousWord || '')}\u0000${normalize(leftContext(context,original)).slice(-96)}`;
    if (contextCache.has(cacheKey)) return contextCache.get(cacheKey);
    const genitiveFrame = genitivePossessiveFrame(context,original);
    const originalInfo = originalStrength(word);
    const ranked = [];
    for (const entry of variantCandidates(word)) {
      const probe = candidateProbe(entry.candidate,context);
      if (!probe) continue;
      if (!probe.exact && !probe.rootStrong) continue;
      const score = rankCandidate(entry,probe,originalResult,originalInfo,context,genitiveFrame);
      if (!Number.isFinite(score)) continue;
      ranked.push({...entry,...probe,score});
    }
    ranked.sort((a,b) => b.score - a.score || a.changes - b.changes || a.candidate.localeCompare(b.candidate,'tr-TR'));
    const best = ranked[0] || null;
    const second = ranked[1] || null;
    let repair = null;
    if (best) {
      const margin = best.score - Number(second?.score ?? -99);
      const threshold = genitiveFrame && possessiveShape(best) && !originalInfo.inflected ? 6.4 : 8.7;
      const minimumMargin = genitiveFrame && possessiveShape(best) ? 0.35 : 1.15;
      if (best.score >= threshold && margin >= minimumMargin) {
        const suggestions = ranked.filter(item => item.score >= threshold - 0.9).slice(0,3).map(item => item.candidate);
        repair = {
          suggestion:best.candidate,
          suggestions:suggestions.length ? suggestions : [best.candidate],
          confidence:Math.max(0.82,Math.min(0.995,0.82 + (best.score - threshold) * 0.025 + Math.max(0,margin) * 0.025)),
          genitiveFrame,
          originalInfo,
          bestScore:best.score,
          margin
        };
      }
    }
    contextCache.set(cacheKey,repair);
    while (contextCache.size > 900) contextCache.delete(contextCache.keys().next().value);
    return repair;
  }

  function check(rawWord, context = {}) {
    const originalResult = baseCheck(rawWord,context);
    if (context.__wtscOrthographyProbe) return originalResult;
    if (!originalResult || originalResult.correct !== true) return originalResult;
    const repair = contextualRepair(rawWord,originalResult,context);
    if (!repair) return originalResult;
    return {
      word:String(rawWord || ''),
      correct:false,
      suggestions:repair.suggestions,
      provider:'local-contextual-orthography-v312',
      rule:'v312-contextual-orthography',
      category:'spelling',
      confidence:repair.confidence,
      contextReason:repair.genitiveFrame ? 'genitive-possessive' : 'local-language-model'
    };
  }

  function suggest(rawWord, context = {}, limit = 3) {
    const checked = check(rawWord,context);
    if (checked?.correct === false && checked.provider === 'local-contextual-orthography-v312') return checked.suggestions.slice(0,Math.max(1,Math.min(3,limit)));
    return baseSuggest ? baseSuggest(rawWord,context,limit) : [];
  }

  engine.check = check;
  engine.suggest = suggest;
  engine.contextualOrthographyV312 = (rawWord,context = {}) => contextualRepair(rawWord,baseCheck(rawWord,context),context);
  engine.stats = {
    ...(engine.stats || {}),
    contextualOrthography:'v312-local',
    contextualDoubleVowelRepair:true,
    genitivePossessiveRepair:true,
    localLanguageModelOrthography:true,
    externalDependencies:0
  };
})();