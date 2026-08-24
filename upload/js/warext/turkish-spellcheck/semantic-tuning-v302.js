(() => {
  'use strict';

  if (window.__warextSemanticTuningV302) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const core = window.WarextTextCoreV110;
  const model = window.WarextSemanticModelV300;
  const lm = window.WarextLmV200 || null;
  if (!engine?.analyzeParagraph || !engine?.analyzeSemanticDocument || !core?.sentenceSegments || !model) return;
  window.__warextSemanticTuningV302 = true;

  const VERSION = '3.0.2';
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const baseDocument = engine.analyzeSemanticDocument.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : null;
  const normalize = model.normalize;
  const NUMBER = new Map([
    ['bir',1],['iki',2],['üç',3],['uc',3],['dört',4],['dort',4],['beş',5],['bes',5],['altı',6],['alti',6],['yedi',7],['sekiz',8],['dokuz',9],
    ['on',10],['yirmi',20],['otuz',30],['kırk',40],['kirk',40],['elli',50],['altmış',60],['altmis',60],['yetmiş',70],['yetmis',70],['seksen',80],['doksan',90],
    ['yüz',100],['yuz',100],['bin',1000]
  ]);
  const MEASURE = new Set(['tane','adet','kez','defa','kişi','kisi','gün','gun','saat','dakika','yıl','yil','ay','hafta','tl','lira','dolar','euro','yüzde','yuzde']);
  const ZERO = new Set(['hiç','hic','hiçbir','hicbir','sıfır','sifir']);
  const EXISTENCE_NEG = new Set(['yok','bulunmuyor','bulunmadı','bulunmadi','kalmadı','kalmadi','getirmedim','getirmediğim','getirmedigim','almadım','almadim','olmadı','olmadi']);
  const TRANSITION = /\b(?:önce|once|sonra|daha sonra|artık|artik|sonradan|başta|basta|değişti|degisti|dönüştü|donustu|buna rağmen|buna ragmen|oysa|fakat|ancak|ama)\b/iu;
  const CAUSAL = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak)\b/iu;
  const RESULT_START = /^\s*(?:bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|bundan dolayı|bundan dolayi|sonuç olarak|sonuc olarak)\b/iu;
  const PRONOUN_START = /^\s*(?:bu|şu|o|bunlar|şunlar|onlar|bu durum|bu nedenle|bu yüzden|bunun|buna|bundan)\b/iu;
  const STATE_PAIRS = [
    ['açık','kapalı'],['acik','kapali'],['var','yok'],['aktif','pasif'],['doğru','yanlış'],['dogru','yanlis'],['başarılı','başarısız'],['basarili','basarisiz'],
    ['faydalı','zararlı'],['faydali','zararli'],['yararlı','zararlı'],['yararli','zararli'],['art','azal'],['başla','bit'],['basla','bit'],['çalış','dur'],['calis','dur'],
    ['yüksek','düşük'],['yuksek','dusuk'],['dolu','boş'],['dolu','bos'],['mümkün','imkânsız'],['mumkun','imkansiz'],['kabul','ret'],['mevcut','eksik']
  ].map(([a,b]) => [normalize(a),normalize(b)]);

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

  function root(raw) {
    let value = '';
    if (morphology) {
      try { value = normalize(morphology(raw)?.root || ''); } catch (_) {}
    }
    if (!value) value = normalize(model.stem(raw));
    if (value.endsWith('b')) value = value.slice(0,-1) + 'p';
    else if (value.endsWith('c')) value = value.slice(0,-1) + 'ç';
    else if (value.endsWith('d')) value = value.slice(0,-1) + 't';
    else if (value.endsWith('ğ')) value = value.slice(0,-1) + 'k';
    return value;
  }

  function tokens(text) {
    return model.words(text).map(token => ({...token,root:root(token.raw)}));
  }

  function rootEq(a,b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (Math.min(a.length,b.length) >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
    const hard = value => value.replace(/b$/u,'p').replace(/c$/u,'ç').replace(/d$/u,'t').replace(/[ğg]$/u,'k');
    return hard(a) === hard(b);
  }

  function contentToken(token) {
    return token && !model.stopwords.has(token.norm) && !model.pronouns.has(token.norm) && !MEASURE.has(token.norm) && !NUMBER.has(token.norm) && !ZERO.has(token.norm);
  }

  function writtenNumberMentions(text) {
    const list = tokens(text);
    const out = [];
    for (let index = 0; index < list.length; index++) {
      const token = list[index];
      if (!NUMBER.has(token.norm)) continue;
      let value = 0;
      let endIndex = index;
      for (let cursor = index; cursor < Math.min(list.length,index + 4); cursor++) {
        const current = list[cursor];
        if (!NUMBER.has(current.norm)) break;
        const n = NUMBER.get(current.norm);
        if (n === 100 || n === 1000) value = Math.max(1,value) * n;
        else value += n;
        endIndex = cursor;
      }
      let noun = null;
      for (let cursor = endIndex + 1; cursor < Math.min(list.length,endIndex + 6); cursor++) {
        if (MEASURE.has(list[cursor].norm)) continue;
        if (!contentToken(list[cursor])) continue;
        noun = list[cursor];
        break;
      }
      if (value > 0) out.push({value,start:token.start,end:list[endIndex].end,nounRoot:noun?.root || '',nounRaw:noun?.raw || ''});
      index = endIndex;
    }
    return out;
  }

  function digitMentions(text) {
    const list = tokens(text);
    const out = [];
    const re = /(?<![\p{L}\d])-?\d+(?:[.,]\d+)?/gu;
    let match;
    while ((match = re.exec(String(text || '')))) {
      const value = Number(match[0].replace(',','.'));
      if (!(value > 0)) continue;
      let noun = null;
      for (const token of list) {
        if (token.start < match.index + match[0].length) continue;
        if (token.start - (match.index + match[0].length) > 55) break;
        if (MEASURE.has(token.norm) || !contentToken(token)) continue;
        noun = token;
        break;
      }
      out.push({value,start:match.index,end:match.index + match[0].length,nounRoot:noun?.root || '',nounRaw:noun?.raw || ''});
    }
    return out;
  }

  function zeroClaims(text) {
    const list = tokens(text);
    const claims = [];
    for (let index = 0; index < list.length; index++) {
      const token = list[index];
      if (!ZERO.has(token.norm)) continue;
      let noun = null;
      for (let cursor = index + 1; cursor < Math.min(list.length,index + 6); cursor++) {
        if (!contentToken(list[cursor])) continue;
        noun = list[cursor];
        break;
      }
      if (!noun) continue;
      const tail = normalize(String(text || '').slice(noun.end,Math.min(String(text || '').length,noun.end + 80)));
      const stronglyNegative = [...EXISTENCE_NEG].some(value => tail.includes(value)) || /(?:ma|me)(?:dı|di|du|dü|mış|miş|muş|müş|yor|z)(?:m|n|k|lar|ler)?\b/iu.test(tail);
      claims.push({root:noun.root,raw:noun.raw,start:token.start,end:noun.end,strong:stronglyNegative || token.norm.includes('hiçbir') || token.norm.includes('hicbir')});
    }
    return claims;
  }

  function quantityExistenceWarnings(text,offset = 0) {
    const zeros = zeroClaims(text);
    if (!zeros.length) return [];
    const positive = [...writtenNumberMentions(text),...digitMentions(text)].filter(item => item.value > 0 && item.nounRoot);
    for (const zero of zeros) {
      const hit = positive.find(item => rootEq(zero.root,item.nounRoot));
      if (!hit) continue;
      return [{
        start:offset + Math.min(zero.start,hit.start),
        end:offset + Math.max(zero.end,hit.end),
        rule:'v301-semantic-existence-quantity-conflict',
        confidence:zero.strong ? 0.995 : 0.97,
        category:'logic',
        severity:'warning',
        message:`“${zero.raw}” için yokluk/hiçlik bildirildikten sonra aynı varlıktan ${hit.value} miktarında bulunduğu söyleniyor. Paragrafın gerçek anlamı kendi içinde çelişiyor.`
      }];
    }
    return [];
  }

  function lexicalMatch(token,value) {
    const target = normalize(value);
    return [token.norm,token.stem,token.root].some(candidate => candidate === target || (Math.min(candidate.length,target.length) >= 4 && (candidate.startsWith(target) || target.startsWith(candidate))));
  }

  function stateHits(left,right) {
    const a = tokens(left);
    const b = tokens(right);
    const out = [];
    for (const [x,y] of STATE_PAIRS) {
      const ax = a.some(token => lexicalMatch(token,x));
      const ay = a.some(token => lexicalMatch(token,y));
      const bx = b.some(token => lexicalMatch(token,x));
      const by = b.some(token => lexicalMatch(token,y));
      if ((ax && by) || (ay && bx)) out.push([x,y]);
    }
    return out;
  }

  function causalSplit(text) {
    const source = String(text || '');
    const re = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak)\b/iu;
    const match = re.exec(source);
    if (!match || match.index == null) return null;
    const left = source.slice(0,match.index).trim();
    const right = source.slice(match.index + match[0].length).trim();
    if (!left || !right) return null;
    return {left,right,marker:match[0],start:match.index,end:match.index + match[0].length};
  }

  function causalWarnings(text,offset = 0) {
    const parts = causalSplit(text);
    if (!parts) return [];
    const opposites = stateHits(parts.left,parts.right);
    if (opposites.length) {
      const [a,b] = opposites[0];
      return [{
        start:offset,
        end:offset + text.length,
        rule:'v302-semantic-causal-state-contradiction',
        confidence:0.995,
        category:'logic',
        severity:'warning',
        message:`Neden-sonuç ilişkisinde “${a}” ve “${b}” karşıt durumları aynı olayın gerekçesi/sonucu gibi bağlanmış. Bu ilişki mantıksal olarak çelişkili görünüyor.`
      }];
    }
    const leftProfile = model.profile(parts.left);
    const rightProfile = model.profile(parts.right);
    const rootsLeft = new Set(tokens(parts.left).filter(contentToken).map(token => token.root));
    const rootsRight = new Set(tokens(parts.right).filter(contentToken).map(token => token.root));
    const similarity = model.similarity(leftProfile,rightProfile);
    const lexical = model.jaccard(rootsLeft,rootsRight);
    if (rootsLeft.size && rootsRight.size && similarity < 0.035 && lexical === 0) return [{
      start:offset + parts.start,
      end:offset + text.length,
      rule:'v302-semantic-weak-causal-link',
      confidence:0.84,
      category:'discourse',
      severity:'warning',
      message:'Neden ve sonuç bölümleri arasında ortak olay, varlık veya konu bağı kurulamıyor. Kullanılan neden-sonuç bağlacı anlamsal olarak desteklenmiyor olabilir.'
    }];
    return [];
  }

  function eventFrame(sentence) {
    const profile = model.profile(sentence.text);
    const list = tokens(sentence.text);
    let predicate = null;
    for (let index = list.length - 1; index >= 0; index--) {
      const token = list[index];
      let analysis = null;
      if (morphology) {
        try { analysis = morphology(token.raw); } catch (_) {}
      }
      if (analysis?.valid && analysis?.mode === 'verb') {
        predicate = token;
        break;
      }
      if (/(?:yor|dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|acak|ecek|malı|meli|sa|se)(?:m|n|k|ız|iz|uz|üz|sın|sin|sun|sün|lar|ler)?$/u.test(token.norm)) {
        predicate = token;
        break;
      }
    }
    const anchors = new Set();
    for (const entity of profile.entities) anchors.add(normalize(entity.norm || entity.text));
    for (const token of list) {
      if (!contentToken(token)) continue;
      if (predicate && token.start >= predicate.start) continue;
      anchors.add(token.root);
      if (anchors.size >= 5) break;
    }
    return {
      sentence,
      profile,
      predicateRoot:predicate ? predicate.root : '',
      negated:profile.negated,
      time:profile.time,
      anchors
    };
  }

  function eventConflictWarnings(sentences) {
    const frames = sentences.map(eventFrame);
    const out = [];
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < Math.min(frames.length,i + 5); j++) {
        const a = frames[i];
        const b = frames[j];
        if (!a.predicateRoot || !b.predicateRoot || !rootEq(a.predicateRoot,b.predicateRoot)) continue;
        if (a.negated === b.negated) continue;
        if (a.time !== 'unknown' && b.time !== 'unknown' && a.time !== b.time) continue;
        let shared = false;
        for (const anchor of a.anchors) if ([...b.anchors].some(other => rootEq(anchor,other))) { shared = true; break; }
        if (!shared || TRANSITION.test(b.sentence.text)) continue;
        out.push({
          start:b.sentence.start,
          end:b.sentence.end,
          rule:'v302-semantic-event-polarity-conflict',
          confidence:0.93,
          category:'logic',
          severity:'warning',
          message:'Aynı konu ve aynı eylem yakın cümlelerde hem gerçekleşmiş hem gerçekleşmemiş gibi anlatılıyor; durum değişimini açıklayan bir geçiş bulunmuyor.'
        });
      }
    }
    return out;
  }

  function crossSentenceQuantityWarnings(sentences) {
    const out = [];
    for (let i = 0; i < sentences.length; i++) {
      const zeros = zeroClaims(sentences[i].text);
      if (!zeros.length) continue;
      for (let j = i; j < Math.min(sentences.length,i + 3); j++) {
        const positives = [...writtenNumberMentions(sentences[j].text),...digitMentions(sentences[j].text)];
        for (const zero of zeros) {
          const hit = positives.find(item => item.value > 0 && rootEq(zero.root,item.nounRoot));
          if (!hit) continue;
          if (j > i && TRANSITION.test(sentences[j].text)) continue;
          out.push({
            start:sentences[j].start + hit.start,
            end:sentences[j].start + Math.max(hit.end,hit.start + 1),
            rule:'v302-semantic-cross-sentence-quantity-conflict',
            confidence:0.96,
            category:'logic',
            severity:'warning',
            message:`Önceki bağlamda “${zero.raw}” için yokluk bildirilmişken yakın cümlede aynı varlıktan ${hit.value} miktarında bulunduğu belirtiliyor.`
          });
        }
      }
    }
    return out;
  }

  function referenceWarnings(sentences) {
    const out = [];
    for (let index = 1; index < sentences.length; index++) {
      const current = sentences[index];
      if (!PRONOUN_START.test(current.text)) continue;
      const previous = sentences[index - 1];
      const similarity = model.similarity(previous.text,current.text);
      const left = new Set(tokens(previous.text).filter(contentToken).map(token => token.root));
      const right = new Set(tokens(current.text).filter(contentToken).map(token => token.root));
      const lexical = model.jaccard(left,right);
      if (similarity >= 0.06 || lexical > 0) continue;
      out.push({
        start:current.start,
        end:current.end,
        rule:'v302-semantic-dangling-reference',
        confidence:0.82,
        category:'discourse',
        severity:'warning',
        message:'Cümle önceki bağlama “bu/o/şu” türü bir gönderimle bağlanıyor ancak gönderimin açık bir anlamsal karşılığı bulunamıyor.'
      });
    }
    return out;
  }

  function resultChainWarnings(sentences) {
    const out = [];
    for (let index = 1; index < sentences.length; index++) {
      const current = sentences[index];
      if (!RESULT_START.test(current.text)) continue;
      const previous = sentences[index - 1];
      const similarity = model.similarity(previous.text,current.text);
      const left = new Set(tokens(previous.text).filter(contentToken).map(token => token.root));
      const right = new Set(tokens(current.text).filter(contentToken).map(token => token.root));
      const lexical = model.jaccard(left,right);
      if (similarity >= 0.07 || lexical > 0.04) continue;
      out.push({
        start:current.start,
        end:current.end,
        rule:'v302-semantic-unsupported-result-chain',
        confidence:0.9,
        category:'discourse',
        severity:'warning',
        message:'Sonuç cümlesi önceki cümledeki olaydan türetilmiş görünüyor ancak ortak olay/varlık/konu bağı bulunamadığı için neden-sonuç zinciri kopuk.'
      });
    }
    return out;
  }

  function fluencyWarnings(sentences) {
    if (!lm?.score) return [];
    const out = [];
    for (const sentence of sentences) {
      const count = model.words(sentence.text).length;
      if (count < 7) continue;
      let report = null;
      try { report = lm.score(sentence.text); } catch (_) {}
      if (!report || !Number.isFinite(Number(report.score))) continue;
      const score = Number(report.score);
      if (score >= 0.025) continue;
      if ((report.rare || []).length < 3) continue;
      out.push({
        start:sentence.start,
        end:sentence.end,
        rule:'v302-semantic-local-fluency-anomaly',
        confidence:0.72,
        category:'style',
        severity:'warning',
        message:'Cümlenin yerel Türkçe dil modeli puanı çok düşük. Sözcükler tek tek doğru olsa bile dizilim doğal Türkçe kullanımından belirgin biçimde sapıyor olabilir.'
      });
    }
    return out;
  }

  function analyze(text) {
    const source = String(text || '');
    const sentences = core.sentenceSegments(source);
    const warnings = [];
    for (const sentence of sentences) {
      warnings.push(...quantityExistenceWarnings(sentence.text,sentence.start));
      warnings.push(...causalWarnings(sentence.text,sentence.start));
    }
    warnings.push(...crossSentenceQuantityWarnings(sentences));
    warnings.push(...eventConflictWarnings(sentences));
    warnings.push(...referenceWarnings(sentences));
    warnings.push(...resultChainWarnings(sentences));
    warnings.push(...fluencyWarnings(sentences));
    return unique(warnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
  }

  function wrappedSentence(rawText,context = {}) {
    const text = String(rawText || '');
    let base = [];
    try { base = baseSentence(text,context) || []; } catch (_) {}
    return unique([...base,...quantityExistenceWarnings(text,0),...causalWarnings(text,0)]).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedDocument(rawText,context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],coherence:{score:100}};
    try { base = baseDocument(text,context) || base; } catch (_) {}
    const extra = analyze(text);
    const warnings = unique([...(base.warnings || []),...extra]);
    const penalty = extra.reduce((sum,item) => sum + (item.category === 'logic' ? 10.5 : item.category === 'discourse' ? 6.2 : 2.5) * (item.confidence || 0.75),0);
    const baseScore = Number(base.coherence?.score ?? 100);
    return {
      ...base,
      version:VERSION,
      warnings,
      coherence:{...(base.coherence || {}),score:Math.max(0,Math.min(100,Math.round(baseScore - penalty)))},
      tuningLayer:'v302-local-document-reasoning',
      writtenNumberReasoning:true,
      eventMemory:true,
      causalGraph:true,
      referenceContinuity:true,
      localFluencyModel:!!lm?.score,
      externalDependencies:0
    };
  }

  function wrappedParagraph(rawText,context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],fixes:[]};
    try { base = baseParagraph(text,context) || base; } catch (_) {}
    const semanticDocument = wrappedDocument(text,context);
    return {
      ...base,
      version:VERSION,
      warnings:unique([...(base.warnings || []),...(semanticDocument.warnings || [])]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      semanticDocument,
      coherence:semanticDocument.coherence,
      fullDocumentReasoning:true,
      externalDependencies:0
    };
  }

  engine.analyzeSentence = wrappedSentence;
  engine.analyzeSemanticDocument = wrappedDocument;
  engine.analyzeParagraph = wrappedParagraph;
  engine.stats = {
    ...(engine.stats || {}),
    semanticReasoningLayer:'v302-local-document-reasoning',
    writtenNumberReasoning:true,
    eventMemory:true,
    causalGraph:true,
    referenceContinuity:true,
    localFluencyModel:!!lm?.score,
    externalDependencies:0
  };
})();