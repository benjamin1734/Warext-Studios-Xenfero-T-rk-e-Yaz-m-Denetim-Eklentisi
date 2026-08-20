(() => {
  'use strict';

  if (window.__warextQualityV220) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning || !engine?.analyzeMorphology || !engine?.parseDependencies) return;
  window.__warextQualityV220 = true;

  const VERSION = '2.2.0';
  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const basePunctuation = typeof engine.analyzePunctuation === 'function' ? engine.analyzePunctuation.bind(engine) : () => [];
  const baseSenses = typeof engine.disambiguateSenses === 'function' ? engine.disambiguateSenses.bind(engine) : () => [];
  const baseDependencies = engine.parseDependencies.bind(engine);
  const morphology = engine.analyzeMorphology.bind(engine);
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const SEMANTIC_RULE = /semantic|valency|subject|object|selection|frame|micro-model/iu;
  const HARD_SEMANTIC = /semantic-(?:subject|object)-frame|semantic-(?:subject|object)-selection/iu;
  const CLAUSE_WORDS = new Set(['ama','ancak','fakat','oysa','oysaki','çünkü','cunku','eğer','eger','şayet','sayet','halbuki','zira']);
  const EXTRA_OPENERS = new Map([
    ['sonuç olarak',0.96],['sonuc olarak',0.96],['öte yandan',0.95],['ote yandan',0.95],['bununla birlikte',0.95],['kısacası',0.96],['kisacasi',0.96],['özetle',0.96],['ozetle',0.96],['açıkçası',0.93],['acikcasi',0.93],['doğrusu',0.92],['dogrusu',0.92]
  ]);
  const ADDRESS_PREFIXES = new Set(['sayın','sayin','sevgili','değerli','degerli']);
  const SENSES = new Map([
    ['aç',[
      {id:'open',label:'açmak',cues:['kapı','kapi','dosya','pencere','uygulama','site','paket','kilit','sekme','menü','menu']},
      {id:'hungry',label:'açlık',cues:['yemek','karnım','karnim','acık','acik','tok','sabah','öğün','ogun']}
    ]],
    ['bağ',[
      {id:'connection',label:'bağlantı',cues:['ilişki','iliski','bağlantı','baglanti','ağ','ag','kablo','veri','sunucu','iletişim','iletisim']},
      {id:'vineyard',label:'üzüm bağı',cues:['üzüm','uzum','asma','bahçe','bahce','şarap','sarap','hasat']},
      {id:'tie',label:'bağlamak',cues:['ip','düğüm','dugum','bağla','bagla','çöz','coz']}
    ]],
    ['dal',[
      {id:'branch',label:'ağaç dalı',cues:['ağaç','agac','yaprak','gövde','govde','orman','kırıldı','kirildi','budak']},
      {id:'dive',label:'dalmak',cues:['su','deniz','havuz','göl','gol','yüz','yuz','dalgıç','dalgic','derin']},
      {id:'field',label:'uzmanlık dalı',cues:['bilim','alan','uzmanlık','uzmanlik','meslek','branş','brans','bölüm','bolum']}
    ]],
    ['dil',[
      {id:'language',label:'konuşma dili',cues:['türkçe','turkce','ingilizce','çeviri','ceviri','konuş','konus','kelime','gramer','yazım','yazim']},
      {id:'tongue',label:'ağız içindeki dil',cues:['ağız','agiz','tat','diş','dis','ısır','isir','yaralandı','yaralandi']}
    ]],
    ['kır',[
      {id:'break',label:'kırmak',cues:['cam','bardak','kemik','parça','parca','kırıldı','kirildi','kırmak','kirmak']},
      {id:'countryside',label:'kır/kırsal alan',cues:['köy','koy','ova','tarla','doğa','doga','kırsal','kirsal','piknik']},
      {id:'gray',label:'kır saç',cues:['saç','sac','sakal','beyaz','gri']}
    ]],
    ['oy',[
      {id:'vote',label:'oy kullanma',cues:['seçim','secim','sandık','sandik','aday','parti','kullan','ver','seçmen','secmen']},
      {id:'hollow',label:'oymak',cues:['tahta','duvar','kazı','kazi','oyuk','bıçak','bicak']}
    ]],
    ['sağ',[
      {id:'right',label:'sağ yön',cues:['sol','taraf','kol','el','yön','yon','şerit','serit','dön','don']},
      {id:'healthy',label:'sağlıklı/sağ',cues:['sağlık','saglik','hasta','iyileşti','iyilesti','canlı','canli']}
    ]],
    ['sol',[
      {id:'left',label:'sol yön',cues:['sağ','sag','taraf','kol','el','yön','yon','şerit','serit','dön','don']},
      {id:'fade',label:'solmak',cues:['çiçek','cicek','renk','yaprak','sarardı','sarardi','kurudu']}
    ]],
    ['saz',[
      {id:'instrument',label:'saz çalgısı',cues:['müzik','muzik','çal','cal','tel','bağlama','baglama','türkü','turku']},
      {id:'reed',label:'sazlık bitkisi',cues:['göl','gol','bataklık','bataklik','kamış','kamis','bitki','sazlık','sazlik']}
    ]],
    ['yol',[
      {id:'road',label:'yol/güzergâh',cues:['araba','trafik','cadde','sokak','otoyol','yürü','yuru','git','mesafe']},
      {id:'method',label:'yöntem/yol',cues:['yöntem','yontem','çözüm','cozum','yordam','biçim','bicim','strateji','usul']}
    ]],
    ['dolu',[
      {id:'full',label:'dolu/boş olmayan',cues:['boş','bos','kap','bardak','kutu','depo','hafıza','hafiza','disk']},
      {id:'hail',label:'dolu yağışı',cues:['yağmur','yagmur','fırtına','firtina','yağdı','yagdi','hava','buz','meteoroloji']}
    ]],
    ['ocak',[
      {id:'month',label:'Ocak ayı',cues:['ay','yıl','yil','şubat','subat','takvim','tarih','kış','kis']},
      {id:'stove',label:'mutfak ocağı',cues:['mutfak','yemek','ateş','ates','tencere','gaz','pişir','pisir']},
      {id:'institution',label:'ocak/kuruluş',cues:['dernek','kuruluş','kurulus','teşkilat','teskilat','üyeler','uyeler']}
    ]]
  ]);

  function tokenList(text) {
    const source = String(text || '');
    const re = new RegExp(`[${LETTERS}]+(?:['’][${LETTERS}]+)?`,'gu');
    const out = [];
    let match;
    while ((match = re.exec(source))) {
      const raw = match[0];
      const plain = raw.replace(/['’].*$/u,'');
      const analysis = morphology(raw) || {};
      out.push({raw,word:normalize(plain),root:normalize(analysis.root || plain),case:analysis.case || analysis.nounCase || '',start:match.index,end:match.index + raw.length,analysis});
    }
    return out;
  }

  function senseMatches(text) {
    const list = tokenList(text);
    const out = [];
    for (let index = 0; index < list.length; index++) {
      const token = list[index];
      const key = SENSES.has(token.root) ? token.root : SENSES.has(token.word) ? token.word : '';
      if (!key) continue;
      const options = SENSES.get(key);
      const scored = [];
      for (const option of options) {
        let score = 0;
        const matched = [];
        for (let cursor = Math.max(0,index - 5); cursor <= Math.min(list.length - 1,index + 5); cursor++) {
          if (cursor === index) continue;
          const candidate = list[cursor];
          const distance = Math.abs(cursor - index);
          for (const cueRaw of option.cues) {
            const cue = normalize(cueRaw);
            if (candidate.word === cue || candidate.root === cue) {
              const weight = 1 + Math.max(0,5 - distance) * 0.16;
              score += weight;
              matched.push(cue);
            }
          }
        }
        scored.push({option,score,matched:[...new Set(matched)]});
      }
      scored.sort((a,b) => b.score - a.score);
      const best = scored[0];
      const second = scored[1] || {score:0};
      const margin = best.score - second.score;
      if (best.score < 1.1 || margin < 0.28) continue;
      const confidence = Math.min(0.98,0.62 + Math.min(0.22,best.score * 0.055) + Math.min(0.12,margin * 0.06));
      out.push({word:token.raw,root:key,sense:best.option.id,label:best.option.label,confidence,start:token.start,end:token.end,cues:best.matched,margin});
    }
    return out;
  }

  function mergeSenses(primary,secondary) {
    const map = new Map();
    for (const item of [...(primary || []),...(secondary || [])]) {
      const key = `${item.start ?? -1}:${normalize(item.root || item.word)}:${item.sense || ''}`;
      const old = map.get(key);
      if (!old || Number(item.confidence || 0) > Number(old.confidence || 0)) map.set(key,item);
    }
    return [...map.values()].sort((a,b) => Number(a.start || 0) - Number(b.start || 0));
  }

  function protectedAt(context,start,end) {
    return (context?.protectedRanges || []).some(range => Number(range.start) < end && Number(range.end) > start);
  }

  function warning(rule,message,confidence,start,end,word = '') {
    return {rule,message,confidence,start,end,word};
  }

  function extraPunctuation(text,context = {}) {
    const source = String(text || '');
    const out = [];
    for (const [phrase,confidence] of EXTRA_OPENERS) {
      const pattern = new RegExp(`(^|[.!?]\\s+|\\n+)(${phrase.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')})(\\s+)(?![,;:])`,'giu');
      let match;
      while ((match = pattern.exec(source))) {
        const start = match.index + match[1].length;
        const end = start + match[2].length;
        if (protectedAt(context,start,end)) continue;
        out.push(warning('v220-punctuation-discourse-comma',`“${match[2]}” giriş ifadesinden sonra virgül beklenir.`,confidence,start,end,match[2]));
      }
    }
    const address = new RegExp(`(^|[.!?]\\s+|\\n+)(${[...ADDRESS_PREFIXES].join('|')})\\s+([A-ZÇĞİÖŞÜ][${LETTERS}]{1,31})(?=\\s+(?:lütfen|lutfen|merhaba|selam|yardım|yardim|bak|dinle|rica|teşekkür|tesekkur)|\\s*[.!?]?$)`,'giu');
    let match;
    while ((match = address.exec(source))) {
      const start = match.index + match[1].length;
      const end = start + match[2].length + 1 + match[3].length;
      if (protectedAt(context,start,end) || source[end] === ',') continue;
      out.push(warning('v220-punctuation-formal-address-comma',`“${match[2]} ${match[3]}” hitabından sonra virgül beklenir.`,0.97,start,end,`${match[2]} ${match[3]}`));
    }
    return out;
  }

  function mergeWarnings(items) {
    const map = new Map();
    for (const item of items || []) {
      const key = `${item.rule || ''}:${item.start || 0}:${item.end || 0}:${item.message || ''}`;
      const old = map.get(key);
      if (!old || Number(item.confidence || 0) > Number(old.confidence || 0)) map.set(key,item);
    }
    return [...map.values()];
  }

  function clauseSpans(text) {
    const source = String(text || '');
    const tokens = tokenList(source);
    const cuts = new Set([0,source.length]);
    for (let i = 0; i < source.length; i++) if (/[.!?;]/u.test(source[i])) cuts.add(i + 1);
    for (const token of tokens) if (CLAUSE_WORDS.has(token.word) && token.start > 0) cuts.add(token.start);
    const points = [...cuts].sort((a,b) => a - b);
    const spans = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const raw = source.slice(start,end).trim();
      if (!raw) continue;
      const leftTrim = source.slice(start,end).search(/\S/u);
      const realStart = start + Math.max(0,leftTrim);
      let realEnd = end;
      while (realEnd > realStart && /\s/u.test(source[realEnd - 1])) realEnd--;
      spans.push({start:realStart,end:realEnd,text:source.slice(realStart,realEnd)});
    }
    return spans;
  }

  function inSpan(item,span) {
    if (!item || !span) return false;
    const start = Number(item.start ?? item.index ?? -1);
    const end = Number(item.end ?? (start >= 0 ? start + String(item.raw || item.word || '').length : -1));
    if (start < 0) return true;
    return start < span.end && Math.max(end,start + 1) > span.start;
  }

  function syntaxReport(text) {
    const parsed = baseDependencies(text) || {};
    const spans = clauseSpans(text);
    const sentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
    const enriched = sentences.map((sentence,index) => {
      const predicate = sentence?.predicate || null;
      const span = spans.find(value => inSpan(predicate,value)) || spans[Math.min(index,Math.max(0,spans.length - 1))] || null;
      const subject = sentence?.subject || null;
      const object = sentence?.object || null;
      const complements = Array.isArray(sentence?.complements) ? sentence.complements : [];
      const crossClause = [];
      if (span && subject && !inSpan(subject,span)) crossClause.push('subject');
      if (span && object && !inSpan(object,span)) crossClause.push('object');
      const roleConfidence = {
        subject:subject ? (crossClause.includes('subject') ? 0.48 : 0.9) : 0,
        object:object ? (crossClause.includes('object') ? 0.48 : /Acc|accusative/iu.test(String(object.case || object.analysis?.case || object.analysis?.nounCase || '')) ? 0.97 : 0.88) : 0,
        complements:complements.map(item => ({word:item.raw || item.word || '',confidence:span && !inSpan(item,span) ? 0.5 : /Dat|Abl|Loc|Ins|dative|ablative|locative|instrumental/iu.test(String(item.case || item.analysis?.case || item.analysis?.nounCase || '')) ? 0.94 : 0.78}))
      };
      return {...sentence,clause:span,roleConfidence,crossClause};
    });
    return {...parsed,sentences:enriched,clauses:spans,version:VERSION};
  }

  function technicalDensity(text) {
    const pieces = String(text || '').split(/\s+/u).filter(Boolean);
    if (!pieces.length) return 0;
    let count = 0;
    for (const piece of pieces) if (/[_/@#:=<>\\]/u.test(piece) || /\.[A-Za-z0-9]{1,8}$/u.test(piece) || /^[A-Z0-9_-]{3,}$/u.test(piece) || /\d+\.\d+/u.test(piece)) count++;
    return count / pieces.length;
  }

  function ambiguityRisk(text,senses) {
    const ambiguous = tokenList(text).filter(token => SENSES.has(token.root) || SENSES.has(token.word));
    if (!ambiguous.length) return 0;
    const resolved = new Set((senses || []).filter(item => Number(item.confidence || 0) >= 0.76).map(item => `${item.start}:${normalize(item.root || item.word)}`));
    let unresolved = 0;
    for (const token of ambiguous) if (!resolved.has(`${token.start}:${SENSES.has(token.root) ? token.root : token.word}`)) unresolved++;
    return unresolved / ambiguous.length;
  }

  function feedbackPenalty(item) {
    try {
      const key = `warextNlpV220:${location.host}:${window.XF?.config?.userId || window.XF?.config?.user_id || '0'}:pairs`;
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const word = normalize(item.word || '');
      const rule = normalize(item.rule || '');
      const count = Number(data[`${rule}|${word}`]?.count || 0);
      if (count < 2) return 0;
      return Math.min(0.18,0.035 * Math.log2(count + 1));
    } catch (_) {
      return 0;
    }
  }

  function calibrateWarnings(items,text,senses,syntax) {
    const density = technicalDensity(text);
    const ambiguity = ambiguityRisk(text,senses);
    const clauseCount = Number(syntax?.clauses?.length || 1);
    return (items || []).map(item => {
      const copy = {...item};
      let confidence = Number(copy.confidence || 0);
      if (!Number.isFinite(confidence)) confidence = 0;
      if (!SEMANTIC_RULE.test(String(copy.rule || ''))) return copy;
      if (!HARD_SEMANTIC.test(String(copy.rule || ''))) {
        confidence -= Math.min(0.1,ambiguity * 0.1);
        if (clauseCount >= 3) confidence -= 0.04;
        if (density >= 0.15) confidence -= Math.min(0.1,density * 0.22);
      }
      confidence -= feedbackPenalty(copy);
      copy.confidence = Math.max(0.32,Math.min(0.995,confidence));
      return copy;
    });
  }

  function installFeedbackPairTracking() {
    const learning = engine.learning;
    if (!learning || typeof learning.falsePositive !== 'function' || learning.__v220PairTracking) return;
    const base = learning.falsePositive.bind(learning);
    learning.falsePositive = payload => {
      try {
        const key = `warextNlpV220:${location.host}:${window.XF?.config?.userId || window.XF?.config?.user_id || '0'}:pairs`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const pair = `${normalize(payload?.rule || 'unknown')}|${normalize(payload?.word || '')}`;
        const current = data[pair] && typeof data[pair] === 'object' ? data[pair] : {count:0};
        current.count = Number(current.count || 0) + 1;
        current.last = Date.now();
        data[pair] = current;
        const limited = Object.fromEntries(Object.entries(data).sort((a,b) => Number(b[1]?.last || 0) - Number(a[1]?.last || 0)).slice(0,1200));
        localStorage.setItem(key,JSON.stringify(limited));
      } catch (_) {}
      return base(payload);
    };
    learning.__v220PairTracking = true;
  }

  engine.disambiguateSenses = text => mergeSenses(baseSenses(text),senseMatches(text));
  engine.analyzePunctuation = (text,context = {}) => mergeWarnings([...basePunctuation(text,context),...extraPunctuation(text,context)]);
  engine.parseSyntaxV220 = syntaxReport;
  engine.analyzeMeaning = (text,context = {}) => {
    installFeedbackPairTracking();
    const report = baseMeaning(text,context) || {};
    const senses = engine.disambiguateSenses(text);
    const syntax = syntaxReport(text);
    const punctuation = extraPunctuation(text,context);
    const warnings = calibrateWarnings(mergeWarnings([...(report.warnings || []),...punctuation]),text,senses,syntax);
    return {...report,warnings,senses,syntaxV220:syntax,qualityV220:{technicalDensity:technicalDensity(text),ambiguityRisk:ambiguityRisk(text,senses),clauses:syntax.clauses?.length || 0,externalDependencies:0}};
  };
  engine.stats={...(engine.stats || {}),qualityLayer:'v220-syntax-wsd-calibration',contextWindowWsd:1,clauseAwareSyntax:1,feedbackPairCalibration:1,externalDependencies:0};
})();
