(() => {
  'use strict';

  if (window.__warextSemanticContextV130) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning || !engine?.analyzeSentence) return;
  window.__warextSemanticContextV130 = true;

  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';

  const MAKE_FORMS = new Map([
    ['yapmak','INF'],['yaptı','P3'],['yaptım','P1'],['yaptın','P2'],['yaptık','P1P'],['yaptınız','P2P'],['yaptılar','P3P'],
    ['yapıyor','PR3'],['yapıyorum','PR1'],['yapıyorsun','PR2'],['yapıyoruz','PR1P'],['yapıyorsunuz','PR2P'],['yapıyorlar','PR3P'],
    ['yapacak','F3'],['yapacağım','F1'],['yapacaksın','F2'],['yapacağız','F1P'],['yapacaksınız','F2P'],['yapacaklar','F3P']
  ]);

  const TARGETS = {
    ver:{INF:'vermek',P3:'verdi',P1:'verdim',P2:'verdin',P1P:'verdik',P2P:'verdiniz',P3P:'verdiler',PR3:'veriyor',PR1:'veriyorum',PR2:'veriyorsun',PR1P:'veriyoruz',PR2P:'veriyorsunuz',PR3P:'veriyorlar',F3:'verecek',F1:'vereceğim',F2:'vereceksin',F1P:'vereceğiz',F2P:'vereceksiniz',F3P:'verecekler'},
    sor:{INF:'sormak',P3:'sordu',P1:'sordum',P2:'sordun',P1P:'sorduk',P2P:'sordunuz',P3P:'sordular',PR3:'soruyor',PR1:'soruyorum',PR2:'soruyorsun',PR1P:'soruyoruz',PR2P:'soruyorsunuz',PR3P:'soruyorlar',F3:'soracak',F1:'soracağım',F2:'soracaksın',F1P:'soracağız',F2P:'soracaksınız',F3P:'soracaklar'},
    et:{INF:'etmek',P3:'etti',P1:'ettim',P2:'ettin',P1P:'ettik',P2P:'ettiniz',P3P:'ettiler',PR3:'ediyor',PR1:'ediyorum',PR2:'ediyorsun',PR1P:'ediyoruz',PR2P:'ediyorsunuz',PR3P:'ediyorlar',F3:'edecek',F1:'edeceğim',F2:'edeceksin',F1P:'edeceğiz',F2P:'edeceksiniz',F3P:'edecekler'},
    çek:{INF:'çekmek',P3:'çekti',P1:'çektim',P2:'çektin',P1P:'çektik',P2P:'çektiniz',P3P:'çektiler',PR3:'çekiyor',PR1:'çekiyorum',PR2:'çekiyorsun',PR1P:'çekiyoruz',PR2P:'çekiyorsunuz',PR3P:'çekiyorlar',F3:'çekecek',F1:'çekeceğim',F2:'çekeceksin',F1P:'çekeceğiz',F2P:'çekeceksiniz',F3P:'çekecekler'},
    dile:{INF:'dilemek',P3:'diledi',P1:'diledim',P2:'diledin',P1P:'diledik',P2P:'dilediniz',P3P:'dilediler',PR3:'diliyor',PR1:'diliyorum',PR2:'diliyorsun',PR1P:'diliyoruz',PR2P:'diliyorsunuz',PR3P:'diliyorlar',F3:'dileyecek',F1:'dileyeceğim',F2:'dileyeceksin',F1P:'dileyeceğiz',F2P:'dileyeceksiniz',F3P:'dileyecekler'},
    kur:{INF:'kurmak',P3:'kurdu',P1:'kurdum',P2:'kurdun',P1P:'kurduk',P2P:'kurdunuz',P3P:'kurdular',PR3:'kuruyor',PR1:'kuruyorum',PR2:'kuruyorsun',PR1P:'kuruyoruz',PR2P:'kuruyorsunuz',PR3P:'kuruyorlar',F3:'kuracak',F1:'kuracağım',F2:'kuracaksın',F1P:'kuracağız',F2P:'kuracaksınız',F3P:'kuracaklar'}
  };

  const NOUN_TARGET = new Map([
    ['karar','ver'],['cevap','ver'],['fiyat','ver'],['sipariş','ver'],['siparis','ver'],['soru','sor'],['yardım','et'],['yardim','et'],['teşekkür','et'],['tesekkur','et'],['tercih','et'],['tavsiye','et'],['fotoğraf','çek'],['fotograf','çek'],['video','çek'],['özür','dile'],['ozur','dile'],['bağlantı','kur'],['baglanti','kur']
  ]);

  const CAUSE_MARKERS = ['çünkü','cunku','zira','nedeniyle','sebebiyle'];
  const RESULT_MARKERS = ['bu yüzden','bu yuzden','dolayısıyla','dolayisiyla','sonuç olarak','sonuc olarak'];
  const CONTRAST_MARKERS = ['ama','ancak','fakat','oysa','oysaki'];

  function words(text) {
    const re = new RegExp(`[${LETTERS}]{2,}`,'gu');
    const out = [];
    let match;
    while ((match = re.exec(String(text || '')))) out.push({raw:match[0],norm:normalize(match[0]),start:match.index,end:match.index + match[0].length});
    return out;
  }

  function unique(items) {
    const out = [];
    const seen = new Set();
    for (const item of items || []) {
      if (!item) continue;
      const key = `${item.start}:${item.end}:${item.rule || ''}:${item.suggestions?.[0] || item.message || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function collocationFixes(text) {
    const tokens = words(text);
    const fixes = [];
    for (let index = 0; index + 1 < tokens.length; index++) {
      const noun = tokens[index];
      const verb = tokens[index + 1];
      if (!/^\s*$/u.test(text.slice(noun.end,verb.start))) continue;
      const target = NOUN_TARGET.get(noun.norm);
      const slot = MAKE_FORMS.get(verb.norm);
      const replacementVerb = target && slot ? TARGETS[target]?.[slot] : '';
      if (!replacementVerb) continue;
      fixes.push({start:noun.start,end:verb.end,suggestions:[`${noun.raw} ${replacementVerb}`],rule:'v130-semantic-collocation-context',confidence:0.97,category:'semantic',message:'Bu ad-fiil birlikteliğinin Türkçede daha doğal ve yerleşik bir karşılığı var.'});
    }
    return fixes;
  }

  function connectorWarnings(text) {
    const normalized = normalize(text);
    const warnings = [];
    const causeCount = CAUSE_MARKERS.filter(marker => normalized.includes(marker)).length;
    const resultCount = RESULT_MARKERS.filter(marker => normalized.includes(marker)).length;
    if (causeCount > 1 && !CONTRAST_MARKERS.some(marker => normalized.includes(marker))) warnings.push({start:0,end:Math.min(text.length,180),rule:'v130-semantic-causal-stack',confidence:0.81,category:'semantic',severity:'warning',message:'Aynı yargıda birden fazla neden bağlacı üst üste kullanılmış; neden-sonuç yapısını kontrol edin.'});
    if (resultCount > 1 && !CONTRAST_MARKERS.some(marker => normalized.includes(marker))) warnings.push({start:0,end:Math.min(text.length,180),rule:'v130-semantic-result-stack',confidence:0.81,category:'semantic',severity:'warning',message:'Aynı yargıda birden fazla sonuç bağlacı üst üste kullanılmış; anlatım akışını kontrol edin.'});
    return warnings;
  }

  function repetitionWarnings(text) {
    const tokens = words(text);
    const warnings = [];
    for (let index = 0; index + 2 < tokens.length; index++) {
      const a = tokens[index];
      const b = tokens[index + 1];
      const c = tokens[index + 2];
      if (a.norm !== c.norm || a.norm === b.norm) continue;
      if (['çok','cok','daha','en','bir','ve','ile','de','da'].includes(a.norm)) continue;
      if (c.start - a.end > 35) continue;
      warnings.push({start:a.start,end:c.end,rule:'v130-semantic-local-repetition',confidence:0.83,category:'semantic',severity:'warning',message:`“${a.raw}” sözcüğü kısa aralıkta yineleniyor; anlatım gereksiz tekrar içeriyor olabilir.`});
    }
    return warnings;
  }

  function wrappedMeaning(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseMeaning(text,context) || {fixes:[],warnings:[]};
    return {
      ...base,
      version:'1.3.0',
      fixes:unique([...(base.fixes || []),...collocationFixes(text)]).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      warnings:unique([...(base.warnings || []),...connectorWarnings(text),...repetitionWarnings(text)]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      semanticExternalModel:0,
      externalDependencies:0
    };
  }

  function wrappedSentence(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseSentence(text,context) || [];
    if (context.semantic === false) return base;
    const report = wrappedMeaning(text,context);
    const out = [];
    const seen = new Set();
    for (const item of [...base,...(report.fixes || [])]) {
      if (!item?.suggestions?.length || item.end < item.start) continue;
      const key = `${item.start}:${item.end}:${normalize(item.suggestions[0])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  engine.analyzeMeaning = wrappedMeaning;
  engine.analyzeSentence = wrappedSentence;
  engine.stats = {
    ...(engine.stats || {}),
    semanticContextLayer:'v130-local-collocation-discourse',
    semanticContextCollocations:NOUN_TARGET.size,
    semanticExternalModel:0,
    externalDependencies:0
  };
})();
