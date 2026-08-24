(() => {
  'use strict';

  if (window.__warextContextTuningV231) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeParagraph || !engine?.analyzeSentence) return;
  window.__warextContextTuningV231 = true;

  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const boundaryRegex = (body, flags = 'iu') => new RegExp(`(?<![${LETTERS}])(?:${body})(?![${LETTERS}])`,flags);
  const CAUSE_RE = boundaryRegex('çünkü|zira|nedeniyle|sebebiyle|dolayı|olduğu için|olduğundan dolayı|bu nedenle','giu');
  const RESULT_RE = boundaryRegex('bu yüzden|dolayısıyla|sonuç olarak|bunun sonucunda|bu sebeple','giu');

  function matches(text, regex) {
    const out = [];
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text))) {
      out.push({start:match.index,end:match.index + match[0].length,raw:match[0]});
      if (!match[0].length) regex.lastIndex++;
    }
    return out;
  }

  function personShiftFix(text) {
    const firstRe = new RegExp(`(?<![${LETTERS}])([${LETTERS}]{2,}?)([dt])([ıiuü])m(?![${LETTERS}])`,'giu');
    const thirdRe = new RegExp(`(?<![${LETTERS}])([${LETTERS}]{2,}?)([dt])([ıiuü])l[ae]r(?![${LETTERS}])`,'giu');
    const connectorRe = boundaryRegex('ve|ama|fakat|sonra|ardından');
    const subjectRe = boundaryRegex('ben|sen|biz|siz|o|onlar|bunlar|şunlar|kimse|herkes');
    const pluralSubjectRe = new RegExp(`(?<![${LETTERS}])[${LETTERS}]{3,}(?:lar|ler)(?![${LETTERS}])`,'iu');
    let first;
    while ((first = firstRe.exec(text))) {
      thirdRe.lastIndex = first.index + first[0].length;
      let third;
      while ((third = thirdRe.exec(text))) {
        const between = text.slice(first.index + first[0].length,third.index);
        if (!connectorRe.test(between)) continue;
        const parts = between.split(connectorRe);
        const afterConnector = parts.at(-1) || '';
        if (subjectRe.test(afterConnector) || pluralSubjectRe.test(afterConnector)) continue;
        return {
          start:third.index,
          end:third.index + third[0].length,
          suggestions:[`${third[1]}${third[2]}${third[3]}m`],
          rule:'v231-paragraph-person-continuity',
          confidence:0.95,
          category:'grammar',
          message:'Aynı özneyle sürdürülen cümlede kişi eki değişiyor.'
        };
      }
    }
    return null;
  }

  function unicodeStructuralWarnings(text) {
    const warnings = [];
    const causes = matches(text,CAUSE_RE);
    if (causes.length > 1) {
      const target = causes[1];
      warnings.push({
        start:target.start,
        end:target.end,
        rule:'v231-paragraph-causal-stack',
        confidence:0.94,
        category:'discourse',
        severity:'warning',
        message:'Aynı cümlede birden fazla neden bağı kurulmuş. Neden-sonuç ilişkisini ve olası anlam çelişkisini kontrol edin.'
      });
    }
    const results = matches(text,RESULT_RE);
    if (results.length > 1) {
      const target = results[1];
      warnings.push({
        start:target.start,
        end:target.end,
        rule:'v231-paragraph-result-stack',
        confidence:0.93,
        category:'discourse',
        severity:'warning',
        message:'Aynı cümlede birden fazla sonuç bağı kurulmuş. Anlatım akışını sadeleştirin.'
      });
    }
    return warnings;
  }

  function wrappedSentence(rawText, context = {}) {
    const text = String(rawText || '');
    const base = baseSentence(text,context) || [];
    const shift = personShiftFix(text);
    if (!shift) return base;
    const duplicate = base.some(item => /paragraph-person-continuity/u.test(item.rule || '') && item.start === shift.start && item.end === shift.end);
    if (duplicate) return base;
    return [...base,shift].sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedParagraph(rawText, context = {}) {
    const text = String(rawText || '');
    const base = baseParagraph(text,context) || {warnings:[],fixes:[]};
    const warnings = [...(base.warnings || [])];
    const seen = new Set(warnings.map(item => `${item.start}:${item.end}:${item.rule || ''}`));
    const segments = window.WarextTextCoreV110?.sentenceSegments?.(text) || [{start:0,end:text.length,text}];
    for (const segment of segments) {
      for (const warning of unicodeStructuralWarnings(segment.text)) {
        const mapped = {...warning,start:segment.start + warning.start,end:segment.start + warning.end};
        const key = `${mapped.start}:${mapped.end}:${mapped.rule}`;
        if (seen.has(key)) continue;
        seen.add(key);
        warnings.push(mapped);
      }
    }
    return {...base,warnings:warnings.sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start)};
  }

  engine.analyzeSentence = wrappedSentence;
  engine.analyzeParagraph = wrappedParagraph;
  engine.stats = {
    ...(engine.stats || {}),
    contextTuningLayer:'v231-unicode-boundary',
    externalDependencies:0
  };
})();
