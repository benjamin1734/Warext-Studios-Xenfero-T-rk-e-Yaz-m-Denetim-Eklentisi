(() => {
  'use strict';

  if (window.__warextContextV230) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check || !engine?.isValid || !engine?.analyzeSentence) return;
  window.__warextContextV230 = true;

  const VERSION = '2.3.0';
  const baseCheck = engine.check.bind(engine);
  const baseIsValid = engine.isValid.bind(engine);
  const baseAnalyzeSentence = engine.analyzeSentence.bind(engine);
  const baseAnalyzeMeaning = typeof engine.analyzeMeaning === 'function' ? engine.analyzeMeaning.bind(engine) : null;
  const core = window.WarextTextCoreV110 || null;
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const VOWELS = 'aeıioöuü';
  const VOICELESS = 'çfhkpsşt';
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const chars = value => Array.from(String(value || ''));
  const lastChar = value => chars(value).at(-1) || '';

  function lastVowel(value) {
    const word = normalize(value);
    for (let index = word.length - 1; index >= 0; index--) if (VOWELS.includes(word[index])) return word[index];
    return '';
  }

  function harmony2(value) {
    const vowel = lastVowel(value);
    if ('aıou'.includes(vowel)) return 'a';
    if ('eiöü'.includes(vowel)) return 'e';
    return '';
  }

  function harmony4(value) {
    const vowel = lastVowel(value);
    if ('aı'.includes(vowel)) return 'ı';
    if ('ei'.includes(vowel)) return 'i';
    if ('ou'.includes(vowel)) return 'u';
    if ('öü'.includes(vowel)) return 'ü';
    return '';
  }

  function vowelEnd(value) {
    return VOWELS.includes(lastChar(normalize(value)));
  }

  function stemCandidates(surface, vowelInitial) {
    const word = normalize(surface);
    const out = [word];
    if (!vowelInitial || word.length < 3) return out;
    const last = lastChar(word);
    if (last === 'b') out.push(word.slice(0,-1) + 'p');
    if (last === 'c') out.push(word.slice(0,-1) + 'ç');
    if (last === 'd') out.push(word.slice(0,-1) + 't');
    if (last === 'ğ') out.push(word.slice(0,-1) + 'k');
    if (last === 'g' && word.at(-2) === 'n') out.push(word.slice(0,-1) + 'k');
    return [...new Set(out)];
  }

  const SUFFIX_RULES = [
    {
      name:'genitive',
      endings:['nın','nin','nun','nün','ın','in','un','ün'],
      vowelInitial:true,
      expected:stem => {
        const h4 = harmony4(stem);
        return h4 ? `${vowelEnd(stem) ? 'n' : ''}${h4}n` : '';
      }
    },
    {
      name:'accusative',
      endings:['yı','yi','yu','yü','ı','i','u','ü'],
      vowelInitial:true,
      expected:stem => {
        const h4 = harmony4(stem);
        return h4 ? `${vowelEnd(stem) ? 'y' : ''}${h4}` : '';
      }
    },
    {
      name:'dative',
      endings:['ya','ye','a','e'],
      vowelInitial:true,
      expected:stem => {
        const h2 = harmony2(stem);
        return h2 ? `${vowelEnd(stem) ? 'y' : ''}${h2}` : '';
      }
    },
    {
      name:'ablative',
      endings:['dan','den','tan','ten'],
      vowelInitial:false,
      expected:stem => {
        const h2 = harmony2(stem);
        const lead = VOICELESS.includes(lastChar(normalize(stem))) ? 't' : 'd';
        return h2 ? `${lead}${h2}n` : '';
      }
    },
    {
      name:'locative',
      endings:['da','de','ta','te'],
      vowelInitial:false,
      expected:stem => {
        const h2 = harmony2(stem);
        const lead = VOICELESS.includes(lastChar(normalize(stem))) ? 't' : 'd';
        return h2 ? `${lead}${h2}` : '';
      }
    },
    {
      name:'instrumental',
      endings:['yla','yle','la','le'],
      vowelInitial:false,
      expected:stem => {
        const h2 = harmony2(stem);
        return h2 ? `${vowelEnd(stem) ? 'y' : ''}l${h2}` : '';
      }
    },
    {
      name:'plural',
      endings:['lar','ler'],
      vowelInitial:false,
      expected:stem => {
        const h2 = harmony2(stem);
        return h2 ? `l${h2}r` : '';
      }
    }
  ];

  function parseNominal(word, depth = 0) {
    const value = normalize(word);
    if (!value || value.length < 2 || depth > 3) return null;
    if (baseIsValid(value)) return {valid:true,root:value,parts:[]};
    for (const rule of SUFFIX_RULES) {
      for (const ending of rule.endings) {
        if (!value.endsWith(ending) || value.length <= ending.length + 1) continue;
        const surface = value.slice(0,-ending.length);
        for (const candidate of stemCandidates(surface,rule.vowelInitial)) {
          if (rule.expected(candidate) !== ending) continue;
          const inner = parseNominal(candidate,depth + 1);
          if (!inner?.valid) continue;
          return {valid:true,root:inner.root,parts:[...(inner.parts || []),{kind:rule.name,suffix:ending}],surface:value};
        }
      }
    }
    return null;
  }

  function nominalMorphology(rawWord) {
    const raw = String(rawWord || '').trim();
    if (!raw || raw.includes("'") || raw.includes('’') || raw.length < 4 || raw.length > 72) return null;
    if (!new RegExp(`^[${LETTERS}]+$`,'u').test(raw)) return null;
    const parsed = parseNominal(raw);
    if (!parsed?.valid || normalize(parsed.root) === normalize(raw)) return null;
    return parsed;
  }

  function spellingLike(result) {
    if (!result || result.correct !== false) return false;
    const category = normalize(result.category || '');
    const rule = normalize(result.rule || '');
    if (['grammar','semantic','syntax','punctuation'].includes(category)) return false;
    if (/(?:agreement|semantic|syntax|punctuation|temporal|person|case-government)/u.test(rule)) return false;
    return true;
  }

  function wrappedCheck(rawWord, context = {}) {
    const result = baseCheck(rawWord,context) || {word:String(rawWord || ''),correct:true,suggestions:[]};
    if (result.correct !== false) return result;
    const morphology = nominalMorphology(rawWord);
    if (morphology?.valid && spellingLike(result)) return {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v230-nominal-morphology',morphology};
    return result;
  }

  function wrappedIsValid(rawWord) {
    if (baseIsValid(rawWord)) return true;
    return !!nominalMorphology(rawWord)?.valid;
  }

  function sentenceSegments(text) {
    if (core?.sentenceSegments) return core.sentenceSegments(text);
    const source = String(text || '');
    const out = [];
    const re = /[^.!?\n]+(?:[.!?]+|$)/gu;
    let match;
    while ((match = re.exec(source))) {
      const raw = match[0];
      const left = raw.search(/\S/u);
      if (left < 0) continue;
      const trimmed = raw.trimEnd();
      const start = match.index + left;
      const end = match.index + trimmed.length;
      if (end > start) out.push({start,end,text:source.slice(start,end)});
      if (!match[0].length) re.lastIndex++;
    }
    return out;
  }

  function words(text) {
    const re = new RegExp(`[${LETTERS}]{2,}`,'gu');
    const out = [];
    let match;
    while ((match = re.exec(String(text || '')))) out.push({raw:match[0],norm:normalize(match[0]),start:match.index,end:match.index + match[0].length});
    return out;
  }

  const CAUSE_RE = /\b(?:çünkü|zira|nedeniyle|sebebiyle|dolayı|olduğu için|olduğundan dolayı|bu nedenle)\b/giu;
  const RESULT_RE = /\b(?:bu yüzden|dolayısıyla|sonuç olarak|bunun sonucunda|bu sebeple)\b/giu;
  const CONNECTOR_RE = /\b(?:ve|ama|ancak|fakat|çünkü|zira|oysa|oysaki|sonra|ardından|bu yüzden|dolayısıyla|nedeniyle|dolayı|için)\b/giu;
  const TIME_FUTURE_RE = /\b(?:yarın|gelecek hafta|gelecek ay|gelecek yıl|birazdan|az sonra)\b/iu;
  const TIME_PAST_RE = /\b(?:dün|geçen hafta|geçen ay|geçen yıl|az önce|önceki gün)\b/iu;
  const TIME_ANY_RE = /\b(?:bugün|şimdi|yarın|dün|gelecek hafta|gelecek ay|gelecek yıl|geçen hafta|geçen ay|geçen yıl|az önce|birazdan|önceki gün|az sonra)\b/iu;
  const PAST_FINITE_RE = new RegExp(`\\b[${LETTERS}]{2,}?[dt][ıiuü](?:m|n|k|n[ıiuü]z|l[ae]r)?\\b`,'iu');
  const FUTURE_FINITE_RE = new RegExp(`\\b[${LETTERS}]{2,}?(?:acak|ecek|acağ|eceğ)[${LETTERS}]*\\b`,'iu');

  function allMatches(text, regex) {
    const out = [];
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text))) {
      out.push({raw:match[0],start:match.index,end:match.index + match[0].length});
      if (!match[0].length) regex.lastIndex++;
    }
    return out;
  }

  function personShiftFix(text) {
    const firstRe = new RegExp(`\\b([${LETTERS}]{2,}?)([dt])([ıiuü])m\\b`,'giu');
    const thirdRe = new RegExp(`\\b([${LETTERS}]{2,}?)([dt])([ıiuü])l[ae]r\\b`,'giu');
    let first;
    while ((first = firstRe.exec(text))) {
      thirdRe.lastIndex = first.index + first[0].length;
      let third;
      while ((third = thirdRe.exec(text))) {
        const between = text.slice(first.index + first[0].length,third.index);
        if (!/\b(?:ve|ama|fakat|sonra|ardından)\b/iu.test(between)) continue;
        const afterConnector = between.split(/\b(?:ve|ama|fakat|sonra|ardından)\b/iu).at(-1) || '';
        if (/\b(?:ben|sen|biz|siz|o|onlar|bunlar|şunlar|kimse|herkes)\b/iu.test(afterConnector)) continue;
        if (new RegExp(`\\b[${LETTERS}]{3,}(?:lar|ler)\\b`,'iu').test(afterConnector)) continue;
        const replacement = `${third[1]}${third[2]}${third[3]}m`;
        return {
          start:third.index,
          end:third.index + third[0].length,
          suggestions:[replacement],
          rule:'v230-paragraph-person-continuity',
          confidence:0.94,
          category:'grammar',
          message:'Aynı özneyle sürdürülen cümlede kişi eki değişiyor.'
        };
      }
    }
    return null;
  }

  function structuralWarnings(text, offset = 0) {
    const warnings = [];
    const causes = allMatches(text,CAUSE_RE);
    if (causes.length > 1) {
      const target = causes[1];
      warnings.push({
        start:offset + target.start,
        end:offset + target.end,
        rule:'v230-paragraph-causal-stack',
        confidence:0.92,
        category:'discourse',
        severity:'warning',
        message:'Aynı cümlede birden fazla neden bağı kurulmuş. Neden-sonuç ilişkisi çelişkili veya gereksiz tekrar içeriyor olabilir.'
      });
    }
    const results = allMatches(text,RESULT_RE);
    if (results.length > 1) {
      const target = results[1];
      warnings.push({
        start:offset + target.start,
        end:offset + target.end,
        rule:'v230-paragraph-result-stack',
        confidence:0.91,
        category:'discourse',
        severity:'warning',
        message:'Aynı cümlede birden fazla sonuç bağlacı kullanılmış. Sonuç ilişkisini sadeleştirin.'
      });
    }
    const tokenList = words(text);
    const connectors = allMatches(text,CONNECTOR_RE);
    if (tokenList.length >= 46 && connectors.length >= 4) {
      warnings.push({
        start:offset,
        end:offset + text.length,
        rule:'v230-paragraph-overloaded-sentence',
        confidence:0.86,
        category:'style',
        severity:'warning',
        message:'Cümle çok uzun ve çok sayıda bağlaç içeriyor. Anlam ilişkilerini koruyarak cümleyi bölmek okunabilirliği artırabilir.'
      });
    }
    return warnings;
  }

  function crossSentenceWarnings(previous, current, currentOffset) {
    const warnings = [];
    const prev = String(previous || '');
    const cur = String(current || '');
    if (!prev || !cur) return warnings;
    const prevNorm = normalize(prev);
    const curNorm = normalize(cur);
    if (prevNorm.length > 12 && prevNorm === curNorm) {
      warnings.push({
        start:currentOffset,
        end:currentOffset + cur.length,
        rule:'v230-paragraph-duplicate-sentence',
        confidence:0.98,
        category:'discourse',
        severity:'warning',
        message:'Önceki cümle aynı biçimde tekrarlanıyor.'
      });
    }
    if (!TIME_ANY_RE.test(cur)) {
      if (TIME_FUTURE_RE.test(prev) && PAST_FINITE_RE.test(cur)) {
        const match = cur.match(PAST_FINITE_RE);
        if (match?.index != null) warnings.push({
          start:currentOffset + match.index,
          end:currentOffset + match.index + match[0].length,
          rule:'v230-paragraph-future-past-shift',
          confidence:0.87,
          category:'discourse',
          severity:'warning',
          message:'Önceki cümlede gelecek zaman bağlamı kurulmuşken bu cümlede geçmiş zaman kullanılıyor. Zaman akışını kontrol edin.'
        });
      }
      if (TIME_PAST_RE.test(prev) && FUTURE_FINITE_RE.test(cur)) {
        const match = cur.match(FUTURE_FINITE_RE);
        if (match?.index != null) warnings.push({
          start:currentOffset + match.index,
          end:currentOffset + match.index + match[0].length,
          rule:'v230-paragraph-past-future-shift',
          confidence:0.84,
          category:'discourse',
          severity:'warning',
          message:'Önceki cümlede geçmiş zaman bağlamı kurulmuşken bu cümlede gelecek zaman kullanılıyor. Zaman akışını kontrol edin.'
        });
      }
    }
    return warnings;
  }

  function shouldSuppressIssue(text, issue) {
    if (!issue || issue.end <= issue.start) return false;
    const category = normalize(issue.category || '');
    const rule = normalize(issue.rule || '');
    if (['grammar','semantic','syntax','punctuation'].includes(category)) return false;
    if (/(?:agreement|semantic|syntax|punctuation|temporal|person|case-government)/u.test(rule)) return false;
    const raw = text.slice(issue.start,issue.end);
    if (!raw || !new RegExp(`^[${LETTERS}]+$`,'u').test(raw)) return false;
    return !!nominalMorphology(raw)?.valid;
  }

  function wrappedAnalyzeSentence(rawText, context = {}) {
    const text = String(rawText || '');
    const base = baseAnalyzeSentence(text,context) || [];
    const out = [];
    const seen = new Set();
    const add = issue => {
      if (!issue || issue.end < issue.start) return;
      const key = `${issue.start}:${issue.end}:${issue.rule || issue.category || ''}:${issue.suggestions?.[0] || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(issue);
    };
    for (const issue of base) if (!shouldSuppressIssue(text,issue)) add(issue);
    const shift = personShiftFix(text);
    if (shift) add(shift);
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function analyzeParagraph(rawText, context = {}) {
    const text = String(rawText || '');
    const segments = sentenceSegments(text);
    const warnings = [];
    const fixes = [];
    const seenWarnings = new Set();
    const seenFixes = new Set();
    const addWarning = warning => {
      if (!warning || warning.end <= warning.start) return;
      const key = `${warning.start}:${warning.end}:${warning.rule || ''}:${warning.message || ''}`;
      if (seenWarnings.has(key)) return;
      seenWarnings.add(key);
      warnings.push(warning);
    };
    const addFix = fix => {
      if (!fix?.suggestions?.length || fix.end < fix.start) return;
      const key = `${fix.start}:${fix.end}:${fix.rule || ''}:${fix.suggestions[0]}`;
      if (seenFixes.has(key)) return;
      seenFixes.add(key);
      fixes.push(fix);
    };

    if (baseAnalyzeMeaning) {
      try {
        const report = baseAnalyzeMeaning(text,{...context,semantic:true,longText:true,paragraph:true}) || {};
        for (const warning of report.warnings || []) addWarning(warning);
      } catch (_) {}
    }

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      for (const warning of structuralWarnings(segment.text,segment.start)) addWarning(warning);
      for (const warning of crossSentenceWarnings(segments[index - 1]?.text || '',segment.text,segment.start)) addWarning(warning);
      const shift = personShiftFix(segment.text);
      if (shift) addFix({...shift,start:segment.start + shift.start,end:segment.start + shift.end});
    }

    return {
      version:VERSION,
      warnings:warnings.sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      fixes:fixes.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      sentences:segments.length,
      characters:text.length,
      externalDependencies:0
    };
  }

  engine.check = wrappedCheck;
  engine.isValid = wrappedIsValid;
  engine.analyzeSentence = wrappedAnalyzeSentence;
  engine.analyzeParagraph = analyzeParagraph;
  engine.nominalMorphologyV230 = nominalMorphology;
  engine.stats = {
    ...(engine.stats || {}),
    contextLayer:'v230-local-paragraph-morphology',
    paragraphContext:true,
    nominalInflectionRules:SUFFIX_RULES.length,
    externalDependencies:0
  };
})();
