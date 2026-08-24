(() => {
  'use strict';

  if (window.__warextSemanticDocumentV300) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const core = window.WarextTextCoreV110;
  const model = window.WarextSemanticModelV300;
  if (!engine?.analyzeSentence || !engine?.analyzeParagraph || !core?.sentenceSegments || !model?.profile) return;
  window.__warextSemanticDocumentV300 = true;

  const VERSION = '3.0.0';
  const baseSentence = engine.analyzeSentence.bind(engine);
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : null;
  const normalize = model.normalize;
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const FIRST = new Set(['ben','beni','bana','benden','benim']);
  const SECOND = new Set(['sen','seni','sana','senden','senin']);
  const FIRST_PL = new Set(['biz','bizi','bize','bizden','bizim']);
  const SECOND_PL = new Set(['siz','sizi','size','sizden','sizin']);
  const THIRD_PL = new Set(['onlar','onları','onlara','onlardan','onların']);
  const ZERO = new Set(['hiç','hic','hiçbir','hicbir','sıfır','sifir']);
  const RELATION_MARKERS = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|için|icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|ama|ancak|fakat|oysa|oysaki|rağmen|ragmen|eğer|eger|şayet|sayet|ayrıca|ayrica|üstelik|ustelik|sonra|ardından|ardindan|yani|örneğin|ornegin)\b/iu;
  const CAUSE_MARKER = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin)\b/iu;
  const RESULT_MARKER = /\b(?:bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak)\b/iu;
  const CONTRAST_MARKER = /\b(?:ama|ancak|fakat|oysa|oysaki|rağmen|ragmen|karşın|karsin)\b/iu;
  const FUTURE_MARKER = /\b(?:yarın|yarin|gelecek|birazdan|az sonra|ileride)\b/iu;
  const PAST_MARKER = /\b(?:dün|dun|geçen|gecen|az önce|az once|önceki|onceki)\b/iu;

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

  function morph(raw) {
    if (!morphology) return null;
    try { return morphology(raw) || null; } catch (_) { return null; }
  }

  function rootOf(token) {
    const analysis = morph(token.raw);
    let root = normalize(analysis?.root || token.stem || token.norm);
    if (!root) root = token.norm;
    return root;
  }

  function personOfToken(token) {
    const analysis = morph(token.raw);
    const person = normalize(analysis?.features?.person || analysis?.features?.Person || '');
    if (/1sg|1sing|first.*sing|1$/.test(person)) return '1sg';
    if (/2sg|2sing|second.*sing|2$/.test(person)) return '2sg';
    if (/1pl|1plur|first.*plur/.test(person)) return '1pl';
    if (/2pl|2plur|second.*plur/.test(person)) return '2pl';
    if (/3pl|3plur|third.*plur/.test(person)) return '3pl';
    if (/3sg|third.*sing/.test(person)) return '3sg';
    return '';
  }

  function tenseOfToken(token) {
    const analysis = morph(token.raw);
    const value = normalize(analysis?.features?.tense || analysis?.features?.Tense || analysis?.features?.mood || '');
    if (/past|geçmiş|gecmis/.test(value)) return 'past';
    if (/fut|future|gelecek/.test(value)) return 'future';
    if (/pres|aor|present|şimdiki|simdiki|geniş|genis/.test(value)) return 'present';
    const word = normalize(token.raw);
    if (/(?:acak|ecek|acağ|eceğ)(?:ım|im|um|üm|ız|iz|uz|üz|sın|sin|sun|sün|lar|ler)?$/u.test(word)) return 'future';
    if (/(?:dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş)(?:m|n|k|ız|iz|uz|üz|nız|niz|nuz|nüz|lar|ler)?$/u.test(word)) return 'past';
    if (/(?:yor|mekte|makta|ar|er|ır|ir|ur|ür)(?:um|üm|ım|im|uz|üz|ız|iz|sun|sün|sın|sin|lar|ler)?$/u.test(word)) return 'present';
    return '';
  }

  function predicateOf(profile) {
    for (let index = profile.tokens.length - 1; index >= 0; index--) {
      const token = profile.tokens[index];
      const analysis = morph(token.raw);
      if (analysis?.valid && analysis?.mode === 'verb') return {token,root:rootOf(token),person:personOfToken(token),tense:tenseOfToken(token)};
      const word = normalize(token.raw);
      if (/(?:yor|acak|ecek|dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|malı|meli|sa|se|ar|er|ır|ir|ur|ür)(?:m|n|k|ız|iz|uz|üz|sın|sin|sun|sün|nız|niz|nuz|nüz|lar|ler)?$/u.test(word)) return {token,root:rootOf(token),person:personOfToken(token),tense:tenseOfToken(token)};
    }
    return null;
  }

  function explicitPerson(profile) {
    for (const token of profile.tokens.slice(0,5)) {
      if (FIRST.has(token.norm)) return '1sg';
      if (SECOND.has(token.norm)) return '2sg';
      if (FIRST_PL.has(token.norm)) return '1pl';
      if (SECOND_PL.has(token.norm)) return '2pl';
      if (THIRD_PL.has(token.norm)) return '3pl';
    }
    return '';
  }

  function enrichedProfile(text) {
    const profile = model.profile(text);
    profile.semanticRoots = new Set(profile.content.map(rootOf).filter(Boolean));
    profile.predicate = predicateOf(profile);
    profile.person = explicitPerson(profile) || profile.predicate?.person || '';
    profile.tense = profile.predicate?.tense || '';
    return profile;
  }

  function sentenceList(text) {
    return core.sentenceSegments(String(text || '')).map((segment,index) => ({...segment,index,profile:enrichedProfile(segment.text)}));
  }

  function clauseParts(text) {
    const source = String(text || '');
    const re = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|ama|ancak|fakat|oysa|oysaki|rağmen|ragmen)\b/iu;
    const match = re.exec(source);
    if (!match?.index && match?.index !== 0) return null;
    const left = source.slice(0,match.index).trim();
    const right = source.slice(match.index + match[0].length).trim();
    if (!left || !right) return null;
    return {left,right,marker:match[0],index:match.index};
  }

  function wordRootSequence(profile) {
    return profile.tokens.map(token => ({...token,semanticRoot:rootOf(token)}));
  }

  function nearestContentRoot(tokens,index,direction) {
    for (let step = 1; step <= 5; step++) {
      const candidate = tokens[index + direction * step];
      if (!candidate) break;
      if (model.stopwords.has(candidate.norm) || model.pronouns.has(candidate.norm)) continue;
      if (/^\d/u.test(candidate.raw)) continue;
      return candidate.semanticRoot;
    }
    return '';
  }

  function quantityContradictions(text,offset = 0) {
    const profile = enrichedProfile(text);
    const tokens = wordRootSequence(profile);
    const zeroRoots = new Set();
    for (let index = 0; index < tokens.length; index++) {
      if (!ZERO.has(tokens[index].norm)) continue;
      const root = nearestContentRoot(tokens,index,1);
      if (root) zeroRoots.add(root);
    }
    if (!zeroRoots.size || !profile.quantities.some(item => Number.isFinite(item.value) && item.value > 0)) return [];
    const positiveRoots = new Set();
    for (const quantity of profile.quantities) {
      if (!(quantity.value > 0)) continue;
      let best = null;
      for (const token of tokens) {
        const distance = Math.min(Math.abs(token.start - quantity.end),Math.abs(token.end - quantity.start));
        if (distance > 36 || model.stopwords.has(token.norm) || model.pronouns.has(token.norm)) continue;
        if (!best || distance < best.distance) best = {root:token.semanticRoot,distance};
      }
      if (best?.root) positiveRoots.add(best.root);
    }
    const shared = [...zeroRoots].filter(root => positiveRoots.has(root));
    if (!shared.length) {
      for (const zero of zeroRoots) for (const positive of positiveRoots) {
        if (zero === positive || zero.startsWith(positive) || positive.startsWith(zero)) shared.push(zero);
      }
    }
    if (!shared.length) return [];
    return [{
      start:offset,
      end:offset + text.length,
      rule:'v300-semantic-quantity-contradiction',
      confidence:0.96,
      category:'logic',
      severity:'warning',
      message:'Aynı anlatımda bir varlık için “hiç/hiçbir” ifadesi kullanılırken pozitif bir miktar da belirtiliyor. Nicelik ve anlam yapısı birbiriyle çelişiyor.'
    }];
  }

  function internalContradictions(text,offset = 0) {
    const out = [];
    const parts = clauseParts(text);
    if (parts) {
      const hits = model.antonymHits(parts.left,parts.right);
      if (hits.length) {
        const relation = CAUSE_MARKER.test(text) || RESULT_MARKER.test(text) ? 'neden-sonuç' : CONTRAST_MARKER.test(text) ? 'karşıtlık' : 'bağlantı';
        const [a,b] = hits[0];
        out.push({
          start:offset,
          end:offset + text.length,
          rule:'v300-semantic-internal-contradiction',
          confidence:relation === 'neden-sonuç' ? 0.98 : 0.91,
          category:'logic',
          severity:'warning',
          message:`Cümlenin ${relation} yapısında “${a}” ve “${b}” karşıt durumları aynı olguya bağlanıyor. Anlam ilişkisi gerçekçi görünmüyor.`
        });
      }
      const left = enrichedProfile(parts.left);
      const right = enrichedProfile(parts.right);
      if ((CAUSE_MARKER.test(text) || RESULT_MARKER.test(text)) && model.similarity(left,right) < 0.045 && !left.semanticRoots.size === 0 && !right.semanticRoots.size === 0) {
        out.push({
          start:offset + parts.index,
          end:offset + text.length,
          rule:'v300-semantic-weak-causal-link',
          confidence:0.8,
          category:'discourse',
          severity:'warning',
          message:'Neden ve sonuç bölümleri arasında belirgin bir konu/olay bağı kurulamıyor. Bağlacın gerçekten neden-sonuç ilişkisi oluşturup oluşturmadığını kontrol edin.'
        });
      }
    }
    out.push(...quantityContradictions(text,offset));
    const p = enrichedProfile(text);
    if (p.certainty === 1 && /\b(?:belki|muhtemelen|galiba|sanırım|sanirim|olabilir)\b/iu.test(text)) out.push({
      start:offset,
      end:offset + text.length,
      rule:'v300-semantic-modal-contradiction',
      confidence:0.94,
      category:'logic',
      severity:'warning',
      message:'Aynı yargıda kesinlik ve olasılık ifadeleri birlikte kullanılıyor. İfade mantıksal olarak belirsizleşiyor.'
    });
    return out;
  }

  function sharedAnchor(a,b) {
    if (a.profile.entities.some(x => b.profile.entities.some(y => x.norm === y.norm))) return true;
    for (const root of a.profile.semanticRoots) if (b.profile.semanticRoots.has(root)) return true;
    return model.jaccard(a.profile.conceptSet,b.profile.conceptSet) >= 0.25;
  }

  function crossSentenceContradictions(previous,current) {
    const out = [];
    if (!sharedAnchor(previous,current)) return out;
    const antonyms = model.antonymHits(previous.text,current.text);
    if (antonyms.length) {
      const [a,b] = antonyms[0];
      out.push({
        start:current.start,
        end:current.end,
        rule:'v300-semantic-cross-sentence-contradiction',
        confidence:0.95,
        category:'logic',
        severity:'warning',
        message:`Önceki cümleyle aynı konu sürdürülürken “${a}” ve “${b}” karşıt durumları açıklamasız biçimde birlikte ileri sürülüyor.`
      });
    }
    const pa = previous.profile.predicate;
    const pb = current.profile.predicate;
    if (pa?.root && pb?.root && pa.root === pb.root && previous.profile.negated !== current.profile.negated && previous.profile.time === current.profile.time && !CONTRAST_MARKER.test(current.text)) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-semantic-predicate-negation-conflict',
      confidence:0.93,
      category:'logic',
      severity:'warning',
      message:'Aynı özne/konu ve zaman bağlamında aynı eylem önce olumlu, sonra olumsuz biçimde ileri sürülüyor. Aradaki durum değişimi açıklanmamış olabilir.'
    });
    return out;
  }

  function temporalWarnings(previous,current) {
    const out = [];
    const p = previous.profile;
    const c = current.profile;
    if (c.time === 'future' && c.tense === 'past' && !/\b(?:plan|beklenti|öngörü|ongoru|düşün|dusun|söyledi|soyledi)\b/iu.test(current.text)) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-semantic-future-past-conflict',
      confidence:0.9,
      category:'discourse',
      severity:'warning',
      message:'Gelecek zaman belirteciyle geçmiş zaman yüklemi aynı olay içinde çakışıyor.'
    });
    if (c.time === 'past' && c.tense === 'future' && !/\b(?:plan|beklenti|öngörü|ongoru|düşün|dusun|söyledi|soyledi)\b/iu.test(current.text)) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-semantic-past-future-conflict',
      confidence:0.9,
      category:'discourse',
      severity:'warning',
      message:'Geçmiş zaman belirteciyle gelecek zaman yüklemi aynı olay içinde çakışıyor.'
    });
    if (p.time === 'future' && c.time === 'past' && !/\b(?:önce|once|daha önce|daha once|hatırl|hatirla|geçmiş|gecmis)\b/iu.test(current.text)) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-semantic-timeline-jump',
      confidence:0.8,
      category:'discourse',
      severity:'warning',
      message:'Olay akışı gelecekten geçmişe açıklayıcı bir zaman geçişi olmadan dönüyor.'
    });
    return out;
  }

  function personWarnings(previous,current) {
    const p = previous.profile.person;
    const c = current.profile.person;
    if (!p || !c || p === c) return [];
    const explicitCurrent = explicitPerson(current.profile);
    if (explicitCurrent) return [];
    if (['1sg','1pl'].includes(p) && ['3sg','3pl'].includes(c) && sharedAnchor(previous,current)) return [{
      start:current.start,
      end:current.end,
      rule:'v300-semantic-person-continuity',
      confidence:0.9,
      category:'grammar',
      severity:'warning',
      message:'Özne açıkça değişmeden anlatıcı kişi değişiyor. Paragrafın kişi sürekliliğini kontrol edin.'
    }];
    return [];
  }

  function pronounWarnings(previous,current) {
    const pronouns = current.profile.pronouns;
    if (!pronouns.length) return [];
    const first = current.profile.tokens[0];
    if (!first || !model.pronouns.has(first.norm)) return [];
    const entities = new Map();
    for (const entity of previous.profile.entities) entities.set(entity.norm,entity);
    if (entities.size < 2) {
      const roots = [...previous.profile.semanticRoots].filter(root => root.length > 2);
      for (const root of roots.slice(0,5)) entities.set(root,{norm:root});
    }
    if (entities.size < 2) return [];
    return [{
      start:current.start + first.start,
      end:current.start + first.end,
      rule:'v300-semantic-ambiguous-reference',
      confidence:0.79,
      category:'discourse',
      severity:'warning',
      message:'Bu zamirin önceki cümlede hangi kişi/varlığa gönderme yaptığı belirsiz. Referansı açıklaştırmak anlam bütünlüğünü güçlendirir.'
    }];
  }

  function relationWarnings(previous,current,similarity) {
    const out = [];
    const relation = current.profile.relation;
    const antonyms = model.antonymHits(previous.text,current.text);
    if (relation === 'result' && similarity < 0.09) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-discourse-result-link',
      confidence:0.84,
      category:'discourse',
      severity:'warning',
      message:'“Bu yüzden/dolayısıyla” ile kurulan sonuç cümlesi önceki cümledeki olayla yeterli anlamsal bağ göstermiyor.'
    });
    if (relation === 'addition' && similarity < 0.075) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-discourse-addition-link',
      confidence:0.8,
      category:'discourse',
      severity:'warning',
      message:'Ek bilgi bağlacı kullanılmış ancak cümle önceki konudan belirgin biçimde uzaklaşıyor.'
    });
    if (relation === 'contrast' && !antonyms.length && previous.profile.negated === current.profile.negated && previous.profile.polarity === current.profile.polarity && similarity > 0.28) out.push({
      start:current.start,
      end:current.end,
      rule:'v300-discourse-weak-contrast',
      confidence:0.76,
      category:'discourse',
      severity:'warning',
      message:'Karşıtlık bağlacı kullanılmış ancak iki yargı arasında belirgin bir karşıtlık bulunamadı.'
    });
    return out;
  }

  function redundancyWarnings(previous,current,similarity) {
    if (similarity < 0.83) return [];
    const lexical = model.jaccard(previous.profile.semanticRoots,current.profile.semanticRoots);
    if (lexical < 0.5) return [];
    return [{
      start:current.start,
      end:current.end,
      rule:'v300-discourse-redundant-sentence',
      confidence:Math.min(0.96,0.8 + (similarity - 0.83)),
      category:'style',
      severity:'warning',
      message:'Bu cümle önceki cümlenin anlamını büyük ölçüde tekrar ediyor. Yeni bilgi eklenmiyorsa birleştirme veya sadeleştirme düşünülebilir.'
    }];
  }

  function topicDriftWarnings(list) {
    if (list.length < 3) return [];
    const out = [];
    const vectors = list.map(item => item.profile.vector);
    const centroid = new Float32Array(vectors[0]?.length || 160);
    for (const vector of vectors) for (let i = 0; i < centroid.length; i++) centroid[i] += vector[i] || 0;
    let norm = 0;
    for (const value of centroid) norm += value * value;
    if (norm) {
      const scale = 1 / Math.sqrt(norm);
      for (let i = 0; i < centroid.length; i++) centroid[i] *= scale;
    }
    for (let index = 1; index < list.length; index++) {
      const current = list[index];
      const previous = list[index - 1];
      const adjacent = model.similarity(previous.profile,current.profile);
      const global = model.cosine(current.profile.vector,centroid);
      const linked = RELATION_MARKERS.test(current.text);
      if (adjacent < 0.055 && global < 0.18 && !linked) out.push({
        start:current.start,
        end:current.end,
        rule:'v300-discourse-topic-drift',
        confidence:0.82,
        category:'discourse',
        severity:'warning',
        message:'Bu cümle hem önceki cümleden hem paragrafın ana konusundan ani biçimde uzaklaşıyor. Konu geçişini açıklayan bir bağlantı gerekebilir.'
      });
    }
    return out;
  }

  function numericFactWarnings(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const left = list[i];
      if (!left.profile.quantities.length) continue;
      for (let j = i + 1; j < Math.min(list.length,i + 4); j++) {
        const right = list[j];
        if (!right.profile.quantities.length || !sharedAnchor(left,right)) continue;
        if (left.profile.time !== 'unknown' && right.profile.time !== 'unknown' && left.profile.time !== right.profile.time) continue;
        const a = left.profile.quantities[0]?.value;
        const b = right.profile.quantities[0]?.value;
        if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue;
        const overlap = model.jaccard(left.profile.semanticRoots,right.profile.semanticRoots);
        if (overlap < 0.28) continue;
        out.push({
          start:right.start,
          end:right.end,
          rule:'v300-semantic-numeric-fact-conflict',
          confidence:0.82,
          category:'logic',
          severity:'warning',
          message:'Aynı konu hakkında yakın cümlelerde farklı sayısal değerler veriliyor ve değişimi açıklayan bir zaman/koşul ifadesi bulunmuyor.'
        });
      }
    }
    return out;
  }

  function documentAnalysis(text,context = {}) {
    const list = sentenceList(text);
    const warnings = [];
    const similarities = [];
    for (const sentence of list) warnings.push(...internalContradictions(sentence.text,sentence.start));
    for (let index = 1; index < list.length; index++) {
      const previous = list[index - 1];
      const current = list[index];
      const similarity = model.similarity(previous.profile,current.profile);
      similarities.push(similarity);
      warnings.push(...crossSentenceContradictions(previous,current));
      warnings.push(...temporalWarnings(previous,current));
      warnings.push(...personWarnings(previous,current));
      warnings.push(...pronounWarnings(previous,current));
      warnings.push(...relationWarnings(previous,current,similarity));
      warnings.push(...redundancyWarnings(previous,current,similarity));
    }
    warnings.push(...topicDriftWarnings(list));
    warnings.push(...numericFactWarnings(list));
    const meaningful = unique(warnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const averageSimilarity = similarities.length ? similarities.reduce((sum,value) => sum + value,0) / similarities.length : 1;
    let score = 100;
    for (const warning of meaningful) {
      const confidence = warning.confidence || 0.75;
      const weight = warning.category === 'logic' ? 12 : warning.category === 'discourse' ? 7 : 5;
      score -= weight * confidence;
    }
    if (list.length >= 3 && averageSimilarity < 0.08) score -= 8;
    score = Math.max(0,Math.min(100,Math.round(score)));
    const conceptTotals = new Map();
    for (const sentence of list) for (const [concept,value] of sentence.profile.concepts) conceptTotals.set(concept,(conceptTotals.get(concept) || 0) + value);
    const topics = [...conceptTotals.entries()].sort((a,b) => b[1] - a[1]).slice(0,5).map(([name,value]) => ({name,value}));
    return {
      version:VERSION,
      sentences:list.map(item => ({start:item.start,end:item.end,text:item.text,relation:item.profile.relation,time:item.profile.time,person:item.profile.person,tense:item.profile.tense,concepts:item.profile.concepts.slice(0,4)})),
      warnings:meaningful,
      coherence:{score,averageAdjacentSimilarity:Number(averageSimilarity.toFixed(4)),topics,sentenceCount:list.length},
      externalDependencies:0,
      localSemanticModel:true
    };
  }

  function wrappedSentence(rawText,context = {}) {
    const text = String(rawText || '');
    let base = [];
    try { base = baseSentence(text,context) || []; } catch (_) {}
    const extra = internalContradictions(text,0);
    return unique([...base,...extra]).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedParagraph(rawText,context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],fixes:[]};
    try { base = baseParagraph(text,context) || base; } catch (_) {}
    const semantic = documentAnalysis(text,context);
    return {
      ...base,
      version:VERSION,
      warnings:unique([...(base.warnings || []),...(semantic.warnings || [])]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      fixes:unique(base.fixes || []).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      semanticDocument:semantic,
      coherence:semantic.coherence,
      fullParagraphScan:true,
      localSemanticModel:true,
      externalDependencies:0
    };
  }

  engine.analyzeSentence = wrappedSentence;
  engine.analyzeParagraph = wrappedParagraph;
  engine.analyzeSemanticDocument = documentAnalysis;
  engine.stats = {
    ...(engine.stats || {}),
    semanticDocumentLayer:'v300-local-discourse-graph',
    semanticVectorSize:model.VECTOR_SIZE,
    paragraphMeaning:true,
    discourseCoherence:true,
    contradictionGraph:true,
    referenceTracking:true,
    temporalConsistency:true,
    localSemanticModel:true,
    externalDependencies:0
  };
})();