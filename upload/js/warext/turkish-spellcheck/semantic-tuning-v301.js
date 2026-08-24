(() => {
  'use strict';

  if (window.__warextSemanticTuningV301) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const core = window.WarextTextCoreV110;
  const model = window.WarextSemanticModelV300;
  if (!engine?.analyzeParagraph || !engine?.analyzeSemanticDocument || !core?.sentenceSegments || !model) return;
  window.__warextSemanticTuningV301 = true;

  const VERSION = '3.0.1';
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const baseDocument = engine.analyzeSemanticDocument.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : null;
  const normalize = model.normalize;
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const ZERO = new Set(['hiç','hic','hiçbir','hicbir','sıfır','sifir']);
  const PAIRS = [
    ['açık','kapalı'],['acik','kapali'],['doğru','yanlış'],['dogru','yanlis'],['var','yok'],['aktif','pasif'],['iyi','kötü'],['iyi','kotu'],['güzel','çirkin'],['guzel','cirkin'],['başarılı','başarısız'],['basarili','basarisiz'],['faydalı','zararlı'],['faydali','zararli'],['yararlı','zararlı'],['yararli','zararli'],['yüksek','düşük'],['yuksek','dusuk'],['çok','az'],['cok','az'],['fazla','eksik'],['dolu','boş'],['dolu','bos'],['erken','geç'],['erken','gec'],['sıcak','soğuk'],['sicak','soguk'],['hızlı','yavaş'],['hizli','yavas'],['büyük','küçük'],['buyuk','kucuk'],['art','azal'],['başla','bit'],['basla','bit'],['kabul','ret'],['mümkün','imkânsız'],['mumkun','imkansiz'],['mevcut','eksik'],['çalış','dur'],['calis','dur']
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

  function morphRoot(raw) {
    let root = '';
    if (morphology) {
      try { root = normalize(morphology(raw)?.root || ''); } catch (_) {}
    }
    if (!root) root = model.stem(raw);
    root = normalize(root);
    if (root.endsWith('b')) root = root.slice(0,-1) + 'p';
    else if (root.endsWith('c')) root = root.slice(0,-1) + 'ç';
    else if (root.endsWith('d')) root = root.slice(0,-1) + 't';
    else if (root.endsWith('ğ')) root = root.slice(0,-1) + 'k';
    return root;
  }

  function forms(text) {
    return model.words(text).map(token => ({...token,root:morphRoot(token.raw)}));
  }

  function matchesLexeme(token,lexeme) {
    const value = normalize(lexeme);
    const candidates = [token.norm,token.stem,token.root].filter(Boolean);
    for (const candidate of candidates) {
      if (candidate === value) return true;
      if (value.length >= 4 && candidate.startsWith(value)) return true;
      if (candidate.length >= 4 && value.startsWith(candidate)) return true;
    }
    return false;
  }

  function flexibleAntonyms(left,right) {
    const a = forms(left);
    const b = forms(right);
    const out = [];
    for (const [x,y] of PAIRS) {
      const leftX = a.some(token => matchesLexeme(token,x));
      const leftY = a.some(token => matchesLexeme(token,y));
      const rightX = b.some(token => matchesLexeme(token,x));
      const rightY = b.some(token => matchesLexeme(token,y));
      if ((leftX && rightY) || (leftY && rightX)) out.push([x,y]);
    }
    return out;
  }

  function relationSplit(text) {
    const source = String(text || '');
    const re = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|ama|ancak|fakat|oysa|oysaki|rağmen|ragmen)\b/iu;
    const match = re.exec(source);
    if (!match || match.index == null) return null;
    const left = source.slice(0,match.index).trim();
    const right = source.slice(match.index + match[0].length).trim();
    if (!left || !right) return null;
    return {left,right,marker:match[0],index:match.index};
  }

  function rootEquivalent(a,b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.startsWith(b) || b.startsWith(a)) return Math.min(a.length,b.length) >= 4;
    const soften = value => value.replace(/p$/u,'b').replace(/ç$/u,'c').replace(/t$/u,'d').replace(/k$/u,'ğ');
    return soften(a) === soften(b) || soften(a).startsWith(b) || soften(b).startsWith(a);
  }

  function quantityConflict(text,offset = 0) {
    const tokenList = forms(text);
    const zeroNouns = [];
    for (let index = 0; index < tokenList.length; index++) {
      if (!ZERO.has(tokenList[index].norm)) continue;
      for (let step = 1; step <= 4; step++) {
        const token = tokenList[index + step];
        if (!token) break;
        if (model.stopwords.has(token.norm) || model.pronouns.has(token.norm)) continue;
        zeroNouns.push(token.root);
        break;
      }
    }
    if (!zeroNouns.length) return [];
    const quantities = model.profile(text).quantities.filter(item => item.value > 0);
    if (!quantities.length) return [];
    const positiveNouns = [];
    for (const quantity of quantities) {
      let best = null;
      for (const token of tokenList) {
        if (model.stopwords.has(token.norm) || model.pronouns.has(token.norm)) continue;
        const distance = Math.min(Math.abs(token.start - quantity.end),Math.abs(token.end - quantity.start));
        if (distance > 48) continue;
        if (!best || distance < best.distance) best = {root:token.root,distance};
      }
      if (best?.root) positiveNouns.push(best.root);
    }
    const shared = zeroNouns.some(left => positiveNouns.some(right => rootEquivalent(left,right)));
    if (!shared) return [];
    return [{
      start:offset,
      end:offset + text.length,
      rule:'v301-semantic-existence-quantity-conflict',
      confidence:0.985,
      category:'logic',
      severity:'warning',
      message:'Metin aynı varlığın hiç bulunmadığını/yanında olmadığını söylerken hemen ardından o varlıktan pozitif bir miktar bulunduğunu ileri sürüyor. Bu, paragrafın gerçek anlamında doğrudan çelişki oluşturuyor.'
    }];
  }

  function clauseConflict(text,offset = 0) {
    const parts = relationSplit(text);
    if (!parts) return [];
    const hits = flexibleAntonyms(parts.left,parts.right);
    if (!hits.length) return [];
    const causal = /^(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple)$/iu.test(parts.marker);
    const [a,b] = hits[0];
    return [{
      start:offset,
      end:offset + text.length,
      rule:'v301-semantic-clause-state-conflict',
      confidence:causal ? 0.99 : 0.93,
      category:'logic',
      severity:'warning',
      message:causal
        ? `Neden-sonuç yapısında “${a}” ve “${b}” karşıt durumları birbirinin gerekçesi gibi kullanılıyor. Cümlenin gerçek anlamı kendi içinde çelişiyor.`
        : `Bağlanan iki cümlecikte “${a}” ve “${b}” karşıt durumları bulunuyor. Karşıtlığın anlatılmak istenen olaya gerçekten uyup uymadığını kontrol edin.`
    }];
  }

  function repeatedClaimConflict(sentences) {
    const out = [];
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < Math.min(sentences.length,i + 4); j++) {
        const left = sentences[i];
        const right = sentences[j];
        const hits = flexibleAntonyms(left.text,right.text);
        if (!hits.length) continue;
        const lp = model.profile(left.text);
        const rp = model.profile(right.text);
        const lexical = model.jaccard(new Set(forms(left.text).map(x => x.root)),new Set(forms(right.text).map(x => x.root)));
        const semantic = model.similarity(lp,rp);
        if (lexical < 0.12 && semantic < 0.12) continue;
        if (/\b(?:önce|once|sonra|artık|artik|daha sonra|başta|basta|sonradan|değişti|degisti)\b/iu.test(right.text)) continue;
        const [a,b] = hits[0];
        out.push({
          start:right.start,
          end:right.end,
          rule:'v301-semantic-document-state-conflict',
          confidence:0.9,
          category:'logic',
          severity:'warning',
          message:`Yakın cümlelerde aynı konu “${a}” ve “${b}” karşıt durumlarıyla anlatılıyor; ancak durumun değiştiğini açıklayan bir geçiş bulunmuyor.`
        });
      }
    }
    return out;
  }

  function causalReferenceWarnings(sentences) {
    const out = [];
    for (let index = 1; index < sentences.length; index++) {
      const current = sentences[index];
      if (!/^\s*(?:bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|bundan dolayı|bundan dolayi)/iu.test(current.text)) continue;
      const previous = sentences[index - 1];
      const sim = model.similarity(previous.text,current.text);
      const rootsA = new Set(forms(previous.text).map(x => x.root));
      const rootsB = new Set(forms(current.text).map(x => x.root));
      const lexical = model.jaccard(rootsA,rootsB);
      if (sim >= 0.08 || lexical >= 0.08) continue;
      out.push({
        start:current.start,
        end:current.end,
        rule:'v301-semantic-unsupported-result-reference',
        confidence:0.88,
        category:'discourse',
        severity:'warning',
        message:'Sonuç bağlacı önceki cümleye gönderme yapıyor ancak iki cümle arasında olay, varlık veya konu ortaklığı belirgin değil. Neden-sonuç zinciri kopuk görünüyor.'
      });
    }
    return out;
  }

  function tuningAnalysis(text) {
    const sentences = core.sentenceSegments(String(text || ''));
    const warnings = [];
    for (const sentence of sentences) {
      warnings.push(...clauseConflict(sentence.text,sentence.start));
      warnings.push(...quantityConflict(sentence.text,sentence.start));
    }
    warnings.push(...repeatedClaimConflict(sentences));
    warnings.push(...causalReferenceWarnings(sentences));
    return unique(warnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
  }

  function wrappedSentence(rawText,context = {}) {
    const text = String(rawText || '');
    let base = [];
    try { base = baseSentence(text,context) || []; } catch (_) {}
    return unique([...base,...clauseConflict(text,0),...quantityConflict(text,0)]).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedDocument(rawText,context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],coherence:{score:100}};
    try { base = baseDocument(text,context) || base; } catch (_) {}
    const extra = tuningAnalysis(text);
    const warnings = unique([...(base.warnings || []),...extra]);
    const baseScore = Number(base.coherence?.score ?? 100);
    const penalty = extra.reduce((sum,item) => sum + (item.category === 'logic' ? 11 : 6) * (item.confidence || 0.8),0);
    return {
      ...base,
      version:VERSION,
      warnings,
      coherence:{...(base.coherence || {}),score:Math.max(0,Math.min(100,Math.round(baseScore - penalty)))},
      tuningLayer:'v301-inflection-aware-logic',
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
      semanticTuning:true,
      externalDependencies:0
    };
  }

  engine.analyzeSentence = wrappedSentence;
  engine.analyzeSemanticDocument = wrappedDocument;
  engine.analyzeParagraph = wrappedParagraph;
  engine.stats = {
    ...(engine.stats || {}),
    semanticTuningLayer:'v301-inflection-aware-logic',
    inflectionAwareContradictions:true,
    quantityExistenceLogic:true,
    documentStateMemory:true,
    externalDependencies:0
  };
})();