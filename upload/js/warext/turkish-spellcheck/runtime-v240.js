(() => {
  'use strict';

  if (window.__warextRuntimeV240) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check || !engine?.isValid || !engine?.analyzeSentence) return;
  window.__warextRuntimeV240 = true;

  const VERSION = '2.4.0';
  const core = window.WarextTextCoreV110 || null;
  const baseCheck = engine.check.bind(engine);
  const baseIsValid = engine.isValid.bind(engine);
  const baseAnalyzeSentence = engine.analyzeSentence.bind(engine);
  const baseAnalyzeParagraph = typeof engine.analyzeParagraph === 'function' ? engine.analyzeParagraph.bind(engine) : null;
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();

  function spellingLike(item) {
    if (!item) return false;
    const category = normalize(item.category || '');
    const rule = normalize(item.rule || '');
    if (['grammar','semantic','syntax','punctuation','discourse','style'].includes(category)) return false;
    if (/(?:grammar|semantic|syntax|punctuation|agreement|person|temporal|case-government|collocation|discourse|paragraph)/u.test(rule)) return false;
    return !category || category === 'spelling' || /(?:spell|dictionary|unknown|typo|word|lexical)/u.test(rule);
  }

  function validWord(rawWord) {
    const word = String(rawWord || '').trim();
    if (!word || !new RegExp(`^[${LETTERS}]+$`,'u').test(word)) return false;
    try {
      return !!baseIsValid(word);
    } catch (_) {
      return false;
    }
  }

  function issueToken(text, issue) {
    const start = Math.max(0,Number(issue?.start) || 0);
    const end = Math.max(start,Number(issue?.end) || start);
    const raw = String(text || '').slice(start,end).trim();
    if (!raw || !new RegExp(`^[${LETTERS}]+$`,'u').test(raw)) return '';
    return raw;
  }

  function wrappedCheck(rawWord, context = {}) {
    let result;
    try {
      result = baseCheck(rawWord,context);
    } catch (_) {
      result = null;
    }
    if (!result) return {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v240-safe-fallback'};
    if (result.correct === false && spellingLike(result) && validWord(rawWord)) {
      return {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v240-validity-reconcile'};
    }
    return result;
  }

  function wrappedSentence(rawText, context = {}) {
    const text = String(rawText || '');
    let base;
    try {
      base = baseAnalyzeSentence(text,context) || [];
    } catch (_) {
      base = [];
    }
    const out = [];
    const seen = new Set();
    for (const issue of base) {
      if (!issue || issue.end < issue.start) continue;
      if (spellingLike(issue)) {
        const token = issueToken(text,issue);
        if (token && validWord(token)) continue;
      }
      const key = `${issue.start}:${issue.end}:${issue.rule || issue.category || ''}:${(issue.suggestions || []).join('|')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function segments(text) {
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

  function mapSentenceIssues(text, context = {}) {
    const list = segments(text);
    const fixes = [];
    const warnings = [];
    for (let index = 0; index < list.length; index++) {
      const segment = list[index];
      const issues = wrappedSentence(segment.text,{
        ...context,
        longText:true,
        semantic:context.semantic !== false,
        previousSentence:list[index - 1]?.text || '',
        nextSentence:list[index + 1]?.text || ''
      });
      for (const issue of issues) {
        const mapped = {
          ...issue,
          start:segment.start + Math.max(0,Number(issue.start) || 0),
          end:segment.start + Math.max(Number(issue.end) || 0,Number(issue.start) || 0),
          rule:`v240-paragraph-${issue.rule || issue.category || 'language'}`,
          message:issue.message || (spellingLike(issue) ? 'Sözcüğün yazımını kontrol edin.' : 'Cümlenin dilbilgisi ve bağlam yapısını kontrol edin.')
        };
        if (mapped.suggestions?.length) fixes.push(mapped);
        else warnings.push(mapped);
      }
    }
    return {fixes,warnings};
  }

  const ANTONYMS = [
    ['açık','kapalı'],['doğru','yanlış'],['var','yok'],['sıcak','soğuk'],['erken','geç'],['mümkün','imkânsız'],['aktif','pasif'],['başarılı','başarısız'],['arttı','azaldı'],['yüksek','düşük']
  ];
  const CAUSAL = /\b(?:çünkü|zira|nedeniyle|sebebiyle|dolayı|için|bu yüzden|dolayısıyla|bu nedenle|bu sebeple)\b/iu;

  function contradictionWarnings(text) {
    const out = [];
    for (const segment of segments(text)) {
      const norm = normalize(segment.text);
      if (!CAUSAL.test(norm)) continue;
      for (const [left,right] of ANTONYMS) {
        const leftRe = new RegExp(`(?<![${LETTERS}])${left}(?![${LETTERS}])`,'iu');
        const rightRe = new RegExp(`(?<![${LETTERS}])${right}(?![${LETTERS}])`,'iu');
        if (!leftRe.test(norm) || !rightRe.test(norm)) continue;
        out.push({
          start:segment.start,
          end:segment.end,
          rule:'v240-paragraph-semantic-contrast',
          confidence:0.86,
          category:'semantic',
          severity:'warning',
          message:`Aynı neden-sonuç yapısında “${left}” ve “${right}” karşıtlığı birlikte kullanılmış. Cümlenin anlam ilişkisini kontrol edin.`
        });
        break;
      }
    }
    return out;
  }

  function crossSentencePersonFixes(text) {
    const list = segments(text);
    const out = [];
    const firstPerson = new RegExp(`(?<![${LETTERS}])[${LETTERS}]{2,}[dt][ıiuü]m(?![${LETTERS}])`,'iu');
    const thirdPlural = new RegExp(`(?<![${LETTERS}])([${LETTERS}]{2,}[dt][ıiuü])l[ae]r(?![${LETTERS}])`,'iu');
    const explicitPlural = new RegExp(`(?<![${LETTERS}])(?:onlar|bunlar|şunlar|arkadaşlar|kişiler|kullanıcılar|öğrenciler|çalışanlar|yetkililer|üyeler)(?![${LETTERS}])`,'iu');
    for (let index = 1; index < list.length; index++) {
      const previous = list[index - 1];
      const current = list[index];
      if (!firstPerson.test(previous.text) || explicitPlural.test(current.text)) continue;
      const match = current.text.match(thirdPlural);
      if (!match?.index && match?.index !== 0) continue;
      const replacement = `${match[1]}m`;
      out.push({
        start:current.start + match.index,
        end:current.start + match.index + match[0].length,
        suggestions:[replacement],
        rule:'v240-paragraph-cross-sentence-person',
        confidence:0.9,
        category:'grammar',
        message:'Önceki cümledeki birinci tekil kişi öznesi açıkça değişmediği hâlde yüklem üçüncü çoğul kişiye geçmiş.'
      });
    }
    return out;
  }

  function unique(items) {
    const out = [];
    const seen = new Set();
    for (const item of items || []) {
      if (!item || item.end < item.start) continue;
      const key = `${item.start}:${item.end}:${item.rule || item.category || ''}:${item.message || ''}:${item.suggestions?.[0] || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function wrappedParagraph(rawText, context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],fixes:[]};
    if (baseAnalyzeParagraph) {
      try {
        base = baseAnalyzeParagraph(text,context) || base;
      } catch (_) {}
    }
    const sentence = mapSentenceIssues(text,context);
    const warnings = unique([...(base.warnings || []),...sentence.warnings,...contradictionWarnings(text)]);
    const fixes = unique([...(base.fixes || []),...sentence.fixes,...crossSentencePersonFixes(text)]);
    return {
      ...base,
      version:VERSION,
      warnings:warnings.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      fixes:fixes.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      fullParagraphScan:true,
      externalDependencies:0
    };
  }

  engine.check = wrappedCheck;
  engine.analyzeSentence = wrappedSentence;
  engine.analyzeParagraph = wrappedParagraph;
  engine.stats = {
    ...(engine.stats || {}),
    runtimeSafetyLayer:'v240-validity-reconcile',
    paragraphScanLayer:'v240-full-document',
    falsePositiveReconcile:true,
    fullParagraphScan:true,
    externalDependencies:0
  };
})();
