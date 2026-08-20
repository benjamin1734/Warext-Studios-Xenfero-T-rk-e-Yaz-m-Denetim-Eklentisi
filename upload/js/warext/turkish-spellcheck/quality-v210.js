(() => {
  'use strict';

  if (window.__warextQualityV210) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning) return;
  window.__warextQualityV210 = true;

  const VERSION = '2.1.0';
  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const SEMANTIC_RULE = /semantic|valency|subject|object|micro-model|selection|frame/iu;
  const COMPLEX_MARKERS = new Set(['çünkü','cunku','rağmen','ragmen','halbuki','oysa','ancak','fakat','ama','iken','ise','eğer','eger','şayet','sayet','dolayısıyla','dolayisiyla']);
  const OPENERS = new Map([
    ['evet',0.98],['hayır',0.98],['hayir',0.98],['peki',0.96],['tamam',0.94],['örneğin',0.96],['ornegin',0.96],['kısacası',0.95],['kisacasi',0.95],['özetle',0.95],['ozetle',0.95]
  ]);
  const VOCATIVE_WORDS = new Set(['arkadaşlar','arkadaslar','arkadaşım','arkadasim','hocam','admin','yönetici','yonetici','moderatör','moderator']);
  const VOCATIVE_FOLLOW = /^(?:lütfen|lutfen|bak|dinle|gel|gelsene|yardım|yardim|bekle|dur|şuna|suna|buna|bir\s+bakar|gelir\s+misin|gelir\s+mısın|gelir\s+musun|gelir\s+müsün|yardım\s+eder\s+misin|yardim\s+eder\s+misin)/iu;

  const SENSES = new Map([
    ['yüz',[
      {id:'face',label:'yüz/çehre',cues:['göz','goz','burun','yanak','saç','sac','ifade','surat','alın','alin','yüzünde','yuzunde']},
      {id:'swim',label:'yüzmek',cues:['havuz','deniz','göl','gol','su','kıyı','kiyi','sahil','yüzdü','yuzdu','yüzmek','yuzmek']},
      {id:'hundred',label:'yüz sayısı',cues:['lira','tl','metre','kişi','kisi','tane','adet','bin','milyon']}
    ]],
    ['gül',[
      {id:'flower',label:'gül çiçeği',cues:['çiçek','cicek','bahçe','bahce','kırmızı','kirmizi','pembe','diken','koku','vazo']},
      {id:'laugh',label:'gülmek',cues:['kahkaha','komik','espri','şaka','saka','güldü','guldu','gülmek','gulmek']}
    ]],
    ['at',[
      {id:'horse',label:'at/hayvan',cues:['ahır','ahir','eyer','nal','binmek','koşu','kosu','yarış','yaris','tay']},
      {id:'throw',label:'atmak',cues:['fırlat','firlat','top','çöp','cop','mesaj','dosya','atmak','attı','atti']}
    ]],
    ['kaz',[
      {id:'goose',label:'kaz/hayvan',cues:['kuş','kus','göl','gol','kanat','yumurta','sürü','suru']},
      {id:'dig',label:'kazmak',cues:['toprak','çukur','cukur','kürek','kurek','kazdı','kazdi','kazmak']}
    ]],
    ['düş',[
      {id:'dream',label:'düş/rüya',cues:['rüya','ruya','hayal','uyku','gece','gördüm','gordum']},
      {id:'fall',label:'düşmek',cues:['yere','aşağı','asagi','merdiven','düştü','dustu','düşmek','dusmek']}
    ]],
    ['yaz',[
      {id:'summer',label:'yaz mevsimi',cues:['sıcak','sicak','tatil','mevsim','haziran','temmuz','ağustos','agustos','kış','kis','bahar']},
      {id:'write',label:'yazmak',cues:['metin','mesaj','kod','kitap','makale','klavye','yazdı','yazdi','yazmak']}
    ]],
    ['çay',[
      {id:'tea',label:'çay/içecek',cues:['bardak','fincan','dem','şeker','seker','iç','ic','kahve','sıcak','sicak']},
      {id:'stream',label:'çay/akarsu',cues:['dere','akarsu','köprü','kopru','vadi','taştı','tasti','yatak']}
    ]],
    ['kol',[
      {id:'arm',label:'kol/uzuv',cues:['el','omuz','dirsek','bilek','kas','ağrı','agri','kırıldı','kirildi']},
      {id:'branch',label:'kol/dal',cues:['şube','sube','dal','hat','örgüt','orgut','birim']}
    ]],
    ['baş',[
      {id:'head',label:'baş/kafa',cues:['saç','sac','göz','goz','boyun','ağrı','agri','kafa']},
      {id:'start',label:'başlangıç',cues:['başında','basinda','başlangıç','baslangic','ilk','önce','once']},
      {id:'leader',label:'baş/yönetici',cues:['başkan','baskan','yönetici','yonetici','lider','sorumlu']}
    ]],
    ['el',[
      {id:'hand',label:'el/uzuv',cues:['parmak','bilek','avuç','avuc','kol','tut','yıka','yika']},
      {id:'other',label:'el/yabancı',cues:['alem','âlem','yabancı','yabanci','memleket','gurbette']}
    ]]
  ]);

  function protectedAt(context,start,end) {
    return (context?.protectedRanges || []).some(range => Number(range.start) < end && Number(range.end) > start);
  }

  function tokens(text) {
    const source = String(text || '');
    const re = new RegExp(`[${LETTERS}]+(?:['’][${LETTERS}]+)?`,'gu');
    const out = [];
    let match;
    while ((match = re.exec(source))) {
      const raw = match[0];
      const analysis = morphology ? morphology(raw) : null;
      out.push({raw,start:match.index,end:match.index + raw.length,word:normalize(raw.replace(/['’].*$/u,'')),root:normalize(analysis?.root || raw.replace(/['’].*$/u,'')),case:analysis?.case || analysis?.nounCase || '',analysis});
    }
    return out;
  }

  function senseReport(text) {
    const list = tokens(text);
    const words = list.map(item => item.word);
    const out = [];
    for (const token of list) {
      const key = SENSES.has(token.root) ? token.root : SENSES.has(token.word) ? token.word : '';
      if (!key) continue;
      const options = SENSES.get(key);
      let best = null;
      let second = 0;
      for (const option of options) {
        let score = 0;
        for (const cue of option.cues) {
          const normalizedCue = normalize(cue);
          if (words.includes(normalizedCue)) score += 1;
          if (normalize(text).includes(normalizedCue) && normalizedCue.includes(' ')) score += 1;
        }
        if (!best || score > best.score) {
          second = best?.score || 0;
          best = {option,score};
        } else if (score > second) second = score;
      }
      if (!best || best.score < 1) continue;
      const confidence = Math.min(0.97,0.66 + best.score * 0.09 + Math.max(0,best.score - second) * 0.04);
      out.push({word:token.raw,root:key,sense:best.option.id,label:best.option.label,confidence,start:token.start,end:token.end,cues:best.score});
    }
    return out;
  }

  function warning(rule,message,confidence,start,end,word = '') {
    return {rule,message,confidence,start,end,word};
  }

  function punctuationWarnings(text,context = {}) {
    const source = String(text || '');
    const out = [];
    const sentenceStart = /(^|[.!?]\s+|\n+)([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+)(\s+)(?![,;:])/gu;
    let match;
    while ((match = sentenceStart.exec(source))) {
      const word = normalize(match[2]);
      const confidence = OPENERS.get(word);
      if (!confidence) continue;
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      if (protectedAt(context,start,end)) continue;
      const rest = source.slice(end).trimStart();
      if (!rest || /^[.!?]/u.test(rest)) continue;
      out.push(warning('v210-punctuation-opening-comma',`“${match[2]}” giriş ifadesinden sonra virgül beklenir.`,confidence,start,end,match[2]));
    }

    const vocative = new RegExp(`(^|[.!?]\\s+|\\n+)([A-ZÇĞİÖŞÜ][${LETTERS}]{1,31})(\\s+)([^,.!?\\n]{1,80})`,'gu');
    while ((match = vocative.exec(source))) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      if (protectedAt(context,start,end)) continue;
      const first = normalize(match[2]);
      const rest = String(match[4] || '').trim();
      const direct = VOCATIVE_WORDS.has(first) || VOCATIVE_FOLLOW.test(rest);
      if (!direct) continue;
      const confidence = VOCATIVE_WORDS.has(first) ? 0.96 : 0.93;
      out.push(warning('v210-punctuation-vocative-comma',`Hitap edilen “${match[2]}” ifadesinden sonra virgül beklenir.`,confidence,start,end,match[2]));
    }

    const greeting = /(^|[.!?]\s+|\n+)(Merhaba|Selam|Günaydın|Gunaydin|İyi akşamlar|Iyi aksamlar|İyi geceler|Iyi geceler)\s+([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{1,31})(?=\s*(?:[.!?]|$)|\s+(?:nasılsın|nasilsin|naber|hoş geldin|hos geldin|bak|dinle|yardım|yardim))/gu;
    while ((match = greeting.exec(source))) {
      const start = match.index + match[1].length + match[2].length;
      const end = start + 1;
      if (source[start] === ',' || protectedAt(context,start,end)) continue;
      out.push(warning('v210-punctuation-greeting-comma',`“${match[2]}” selamlamasından sonra hitap adı geliyorsa virgül kullanılmalıdır.`,0.91,match.index + match[1].length,match.index + match[1].length + match[2].length,match[2]));
    }

    return out;
  }

  function technicalDensity(text) {
    const source = String(text || '');
    const pieces = source.split(/\s+/u).filter(Boolean);
    if (!pieces.length) return 0;
    let technical = 0;
    for (const piece of pieces) {
      if (/[_/@#:=<>\\]/u.test(piece) || /\.[A-Za-z0-9]{1,8}$/u.test(piece) || /^[A-Z0-9_-]{3,}$/u.test(piece) || /\d{1,5}\.\d/u.test(piece)) technical++;
    }
    return technical / pieces.length;
  }

  function complexScore(text) {
    const list = tokens(text);
    let markers = 0;
    for (const item of list) if (COMPLEX_MARKERS.has(item.word)) markers++;
    return {tokens:list.length,markers,complex:list.length > 24 || markers >= 2};
  }

  function overlapsSense(item,senses) {
    const start = Number(item?.start || 0);
    const end = Number(item?.end || start);
    return senses.some(sense => sense.confidence >= 0.75 && sense.start < Math.max(end,start + 1) && sense.end > start);
  }

  function learnedPenalty(rule) {
    try {
      const stats = engine.learning?.ruleStats?.() || [];
      const hit = stats.find(item => normalize(item.rule) === normalize(rule));
      const count = Number(hit?.count || 0);
      if (count < 3) return 0;
      return Math.min(0.14,0.025 * Math.log2(count + 1));
    } catch (_) {
      return 0;
    }
  }

  function calibrate(item,text,context,senses,report) {
    const copy = {...item};
    let confidence = Number(copy.confidence || 0);
    if (!Number.isFinite(confidence)) confidence = 0;
    if (String(copy.rule || '').startsWith('v210-punctuation-')) {
      copy.confidence = Math.max(0,Math.min(1,confidence));
      return copy;
    }
    if (SEMANTIC_RULE.test(String(copy.rule || ''))) {
      const complexity = complexScore(text);
      const density = technicalDensity(text);
      if (overlapsSense(copy,senses)) confidence -= 0.12;
      else if (senses.some(sense => sense.confidence >= 0.82)) confidence -= 0.04;
      if ((report?.metaphors || []).some(value => value?.type === 'idiom')) confidence -= 0.06;
      if (complexity.complex) confidence -= 0.05;
      if (density >= 0.18) confidence -= Math.min(0.12,density * 0.25);
      confidence -= learnedPenalty(copy.rule);
      if (context?.longText && complexity.tokens > 34) confidence -= 0.03;
    }
    copy.confidence = Math.max(0.35,Math.min(0.995,confidence));
    return copy;
  }

  function dedupe(items) {
    const map = new Map();
    for (const item of items || []) {
      const key = `${item.rule || ''}:${item.start || 0}:${item.end || 0}:${item.message || ''}`;
      const previous = map.get(key);
      if (!previous || Number(item.confidence || 0) > Number(previous.confidence || 0)) map.set(key,item);
    }
    return [...map.values()].sort((a,b) => Number(b.confidence || 0) - Number(a.confidence || 0));
  }

  function rankDependencyRoles(text) {
    const source = String(text || '');
    const sentences = source.split(/(?<=[.!?])\s+|\n+/u).map(value => value.trim()).filter(Boolean);
    return sentences.map(sentence => {
      const list = tokens(sentence);
      let predicateIndex = -1;
      for (let index = list.length - 1; index >= 0; index--) {
        const analysis = list[index].analysis;
        const root = normalize(analysis?.root || '');
        const verbLike = analysis?.type === 'verb' || analysis?.pos === 'verb' || analysis?.verb || (root && /(?:mak|mek)$/u.test(normalize(analysis?.lemma || '')));
        if (verbLike) { predicateIndex = index; break; }
      }
      if (predicateIndex < 0 && list.length) predicateIndex = list.length - 1;
      const roles = [];
      for (let index = 0; index < list.length; index++) {
        if (index === predicateIndex) continue;
        const item = list[index];
        const distance = Math.max(1,Math.abs(predicateIndex - index));
        const rawCase = normalize(item.case || '');
        let role = 'subject-candidate';
        let score = Math.max(0.28,0.74 - distance * 0.035);
        if (/acc|belirtme|accusative/u.test(rawCase)) { role = 'object-candidate'; score = 0.96; }
        else if (/dat|yonelme|dative/u.test(rawCase)) { role = 'dative-complement'; score = 0.95; }
        else if (/abl|ayrilma|ablative/u.test(rawCase)) { role = 'ablative-complement'; score = 0.95; }
        else if (/loc|bulunma|locative/u.test(rawCase)) { role = 'locative-complement'; score = 0.92; }
        else if (/ins|instrumental/u.test(rawCase)) { role = 'instrumental-complement'; score = 0.9; }
        else if (index === predicateIndex - 1) { role = 'bare-object-or-subject'; score = 0.67; }
        roles.push({word:item.raw,root:item.root,case:item.case || '',role,score:Number(score.toFixed(3)),index});
      }
      roles.sort((a,b) => b.score - a.score);
      return {sentence,predicate:predicateIndex >= 0 ? list[predicateIndex]?.raw || '' : '',predicateRoot:predicateIndex >= 0 ? list[predicateIndex]?.root || '' : '',roles};
    });
  }

  function analyzeQuality(text,context = {}) {
    const senses = senseReport(text);
    const punctuation = punctuationWarnings(text,context);
    const dependencyRoles = rankDependencyRoles(text);
    return {version:VERSION,senses,punctuation,dependencyRoles,technicalDensity:technicalDensity(text),complexity:complexScore(text),externalDependencies:0};
  }

  engine.disambiguateSenses = senseReport;
  engine.analyzePunctuation = punctuationWarnings;
  engine.rankDependencyRoles = rankDependencyRoles;
  engine.analyzeQuality = analyzeQuality;
  engine.analyzeMeaning = function analyzeMeaningV210(text,context = {}) {
    const report = baseMeaning(text,context) || {};
    const quality = analyzeQuality(text,context);
    const baseWarnings = Array.isArray(report.warnings) ? report.warnings : [];
    const calibrated = baseWarnings.map(item => calibrate(item,text,context,quality.senses,report));
    const warnings = dedupe([...calibrated,...quality.punctuation]);
    return {...report,warnings,senses:quality.senses,quality,qualityVersion:VERSION,externalDependencies:0};
  };
  engine.stats = {...(engine.stats || {}),qualityLayer:'v210-wsd-punctuation-calibration',contextualWsd:1,punctuationQuality:1,confidenceCalibration:1,dependencyRanking:1,externalDependencies:0};
})();
