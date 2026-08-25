(() => {
  'use strict';

  if (window.__warextSemanticReasoningV310) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const core = window.WarextTextCoreV110;
  const model = window.WarextSemanticModelV300;
  const kb = window.WarextSemanticKnowledgeV310;
  const lm = window.WarextLmV200 || null;
  if (!engine?.analyzeParagraph || !engine?.analyzeSemanticDocument || !core?.sentenceSegments || !model?.profile || !kb) return;
  window.__warextSemanticReasoningV310 = true;

  const VERSION = '3.1.0';
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const baseDocument = engine.analyzeSemanticDocument.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : null;
  const normalize = kb.normalize;
  kb.stateIndex?.delete('oldu');
  const PRONOUNS = new Set('ben beni bana benden benim sen seni sana senden senin o onu ona ondan onun biz bizi bize bizden bizim siz sizi size sizden sizin onlar onları onlara onlardan onların bu bunu buna bundan bunun şu şunu şuna şundan şunun bunlar bunları bunlara bunlardan bunların şunlar şunları şunlara şunlardan şunların kendisi kendini kendisine kendinden'.split(/\s+/u));
  const PERSONAL = new Set('ben beni bana benden benim sen seni sana senden senin o onu ona ondan onun biz bizi bize bizden bizim siz sizi size sizden sizin onlar onları onlara onlardan onların kendisi kendini kendisine kendinden'.split(/\s+/u));
  const FIRST_PERSON = new Set('ben beni bana benden benim biz bizi bize bizden bizim'.split(/\s+/u));
  const SECOND_PERSON = new Set('sen seni sana senden senin siz sizi size sizden sizin'.split(/\s+/u));
  const DEMONSTRATIVE = new Set('bu bunu buna bundan bunun şu şunu şuna şundan şunun bunlar bunları bunlara bunlardan bunların şunlar şunları şunlara şunlardan şunların'.split(/\s+/u));
  const STOP_EXTRA = new Set('bir iki üç dört beş altı yedi sekiz dokuz on tane adet kez defa kadar gibi için ile ve veya ama ancak fakat çünkü zira sonra önce bugün dün yarın şimdi burada orada böyle şöyle çok daha en az fazla hâlâ halen hemen henüz zaten gerçekten gerçekten oldukça epey yalnız sadece tekrar yeniden'.split(/\s+/u));
  const NUMBER_WORDS = new Map([
    ['sıfır',0],['sifir',0],['bir',1],['iki',2],['üç',3],['uc',3],['dört',4],['dort',4],['beş',5],['bes',5],['altı',6],['alti',6],['yedi',7],['sekiz',8],['dokuz',9],
    ['on',10],['yirmi',20],['otuz',30],['kırk',40],['kirk',40],['elli',50],['altmış',60],['altmis',60],['yetmiş',70],['yetmis',70],['seksen',80],['doksan',90],['yüz',100],['yuz',100],['bin',1000],['milyon',1000000]
  ]);
  const UNITS = new Set('adet tane kişi kisi gün gun saat dakika saniye hafta ay yıl yil tl lira dolar euro yüzde yuzde mb gb tb kb metre km santimetre kilogram kg gram litre ml'.split(/\s+/u));
  const QUANTITY_CHANGE = /\b(?:arttı|artti|azaldı|azaldi|eklendi|çıkarıldı|cikarildi|satıldı|satildi|alındı|alindi|geldi|gitti|tüketildi|tuketildi|kullanıldı|kullanildi|değişti|degisti|güncellendi|guncellendi|yenilendi)\b/iu;
  const RESTORE = /\b(?:yeniden|tekrar|geri|restore|geri yüklendi|geri yuklendi|oluşturuldu|olusturuldu|eklendi|açıldı|acildi|başlatıldı|baslatildi|etkinleştirildi|etkinlestirildi)\b/iu;
  const NEG_SUFFIX = /(?:ma|me)(?:dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|yor|z|yacak|yecek|acak|ecek)(?:m|n|k|ız|iz|uz|üz|sın|sin|sun|sün|nız|niz|nuz|nüz|lar|ler)?$/u;
  const VERB_SUFFIX = /(?:yor|dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|acak|ecek|malı|meli|sa|se|ar|er|ır|ir|ur|ür|maz|mez)(?:m|n|k|ız|iz|uz|üz|sın|sin|sun|sün|nız|niz|nuz|nüz|lar|ler)?$/u;
  const COPULA_STATE = /(?:dır|dir|dur|dür|tır|tir|tur|tür|dı|di|du|dü|mış|miş|muş|müş)?$/u;
  const RELATION_RE = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak|ama|ancak|fakat|oysa|oysaki|rağmen|ragmen|eğer|eger|şayet|sayet|ayrıca|ayrica|üstelik|ustelik|sonra|ardından|ardindan|yani|örneğin|ornegin)\b/iu;
  const NOMINAL_SUFFIXES = ['larımızdan','lerimizden','larımızın','lerimizin','larınızdan','lerinizden','larınızın','lerinizin','larının','lerinin','larımız','lerimiz','larınız','leriniz','ımdan','imden','umdan','ümden','ından','inden','undan','ünden','ımızdan','imizden','umuzdan','ümüzden','ımızın','imizin','umuzun','ümüzün','ımın','imin','umun','ümün','ının','inin','unun','ünün','ımı','imi','umu','ümü','ını','ini','unu','ünü','ımızı','imizi','umuzu','ümüzü','ımız','imiz','umuz','ümüz','ım','im','um','üm','ın','in','un','ün','ı','i','u','ü','ya','ye','yı','yi','yu','yü','da','de','ta','te','dan','den','tan','ten','lar','ler'];

  function unique(items) {
    const out = [];
    const seen = new Set();
    for (const item of items || []) {
      if (!item || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.end < item.start) continue;
      const key = `${item.start}:${item.end}:${item.rule || ''}:${item.category || ''}:${item.message || ''}`;
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

  function harden(value) {
    let root = normalize(value).replace(/['’].*$/u,'');
    if (root.endsWith('b')) root = root.slice(0,-1) + 'p';
    else if (root.endsWith('c')) root = root.slice(0,-1) + 'ç';
    else if (root.endsWith('d')) root = root.slice(0,-1) + 't';
    else if (root.endsWith('ğ')) root = root.slice(0,-1) + 'k';
    return root;
  }

  function nominalFallback(raw) {
    let value = normalize(raw).replace(/['’].*$/u,'');
    for (let pass = 0; pass < 2; pass++) {
      let changed = false;
      for (const suffix of NOMINAL_SUFFIXES) {
        if (value.endsWith(suffix) && value.length - suffix.length >= 3) {
          value = value.slice(0,-suffix.length);
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
    return harden(value);
  }

  function rootOf(raw) {
    const analysis = morph(raw);
    const explicit = normalize(analysis?.root || '');
    if (explicit && explicit !== normalize(raw)) return harden(explicit);
    const stem = harden(model.stem(raw) || raw);
    const nominal = nominalFallback(raw);
    if (nominal.length >= 3 && nominal.length <= stem.length) return nominal;
    return stem;
  }

  function tokenList(text) {
    return model.words(text).map((token,index) => {
      const analysis = morph(token.raw);
      const root = rootOf(token.raw);
      const kinds = kb.kindsFor(token.norm);
      for (const kind of kb.kindsFor(root)) kinds.add(kind);
      return {...token,index,root,analysis,kinds};
    });
  }

  function isStateToken(token) {
    return !!(kb.statesFor(token.norm).length || kb.statesFor(token.root).length);
  }

  function isContent(token) {
    if (!token || token.norm.length < 2) return false;
    if (model.stopwords.has(token.norm) || PRONOUNS.has(token.norm) || STOP_EXTRA.has(token.norm) || NUMBER_WORDS.has(token.norm) || UNITS.has(token.norm)) return false;
    if (/^\d/u.test(token.raw)) return false;
    return true;
  }

  function rootEq(a,b) {
    const left = harden(a);
    const right = harden(b);
    if (!left || !right) return false;
    if (left === right || kb.equivalent?.(left,right)) return true;
    if (Math.min(left.length,right.length) >= 4 && (left.startsWith(right) || right.startsWith(left))) return true;
    return false;
  }

  function modes(text) {
    const source = String(text || '');
    return {
      conditional:kb.conditionalMarkers.test(source),
      hypothetical:kb.hypotheticalMarkers.test(source),
      question:kb.questionMarkers.test(source),
      reported:kb.quoteMarkers.test(source)
    };
  }

  function asserted(mode) {
    return !mode.conditional && !mode.question && !mode.reported;
  }

  function explicitNamedEntities(text,list) {
    const out = [];
    for (const token of list) {
      const raw = String(token.raw || '').replace(/['’].*$/u,'');
      if (!/^[A-ZÇĞİÖŞÜ][a-zçğıöşüâîû]{1,}$/u.test(raw)) continue;
      if (model.stopwords.has(token.norm) || STOP_EXTRA.has(token.norm)) continue;
      if (token.index === 0 && (/^(Bu|Şu|O|Ben|Sen|Biz|Siz|Onlar)$/u.test(raw) || token.kinds.size > 0)) continue;
      out.push({key:`name:${normalize(raw)}`,root:normalize(raw),raw,kinds:new Set(token.kinds),start:token.start,end:token.end,named:true});
    }
    return out;
  }

  function predicateToken(list) {
    for (let index = list.length - 1; index >= 0; index--) {
      const token = list[index];
      const mode = normalize(token.analysis?.mode || token.analysis?.pos || token.analysis?.features?.pos || '');
      if (mode.includes('verb') || mode.includes('fiil')) return token;
      const canonicalNorm = kb.canonicalPredicate(token.norm);
      const canonicalRoot = kb.canonicalPredicate(token.root);
      if (kb.frameFor(canonicalNorm) || kb.frameFor(canonicalRoot)) return token;
      if (VERB_SUFFIX.test(token.norm) || NEG_SUFFIX.test(token.norm)) return token;
    }
    return null;
  }

  function nearestContent(list,start,direction,exclude = new Set()) {
    for (let step = 1; step <= 8; step++) {
      const token = list[start + direction * step];
      if (!token) break;
      if (!isContent(token) || isStateToken(token) || exclude.has(token.index)) continue;
      return token;
    }
    return null;
  }

  function entityKey(root) {
    return `root:${kb.canonicalLexeme?.(root) || harden(root)}`;
  }

  function entityFromToken(token) {
    if (!token) return null;
    const key = entityKey(token.root);
    return {key,root:token.root,raw:token.raw,kinds:new Set(token.kinds),start:token.start,end:token.end,named:false};
  }

  function sentenceEntityCandidates(text,list,predicate) {
    const candidates = explicitNamedEntities(text,list);
    const used = new Set(candidates.map(item => item.start));
    for (const token of list) {
      if (!isContent(token) || isStateToken(token) || token === predicate || used.has(token.start)) continue;
      if (!token.kinds.size && token.root.length < 3) continue;
      candidates.push(entityFromToken(token));
    }
    const dedup = [];
    const keys = new Set();
    for (const item of candidates) {
      const key = `${item.key}:${item.start}`;
      if (keys.has(key)) continue;
      keys.add(key);
      dedup.push(item);
    }
    return dedup;
  }

  function explicitPronoun(list) {
    for (const token of list.slice(0,4)) {
      if (!PRONOUNS.has(token.norm)) continue;
      const next = list[token.index + 1]?.norm || '';
      if ((token.norm === 'bu' || token.norm === 'şu') && /^(?:yüzden|yuzden|nedenle|sebeple|durum|olay|karar|sorun|sonuç|sonuc)$/u.test(next)) continue;
      return token;
    }
    return null;
  }

  function subjectObject(text,list,predicate,candidates) {
    const pronoun = explicitPronoun(list);
    const predIndex = predicate?.index ?? list.length;
    const before = candidates.filter(item => item.start < (predicate?.start ?? Infinity));
    let subject = null;
    let object = null;
    if (!pronoun) {
      const namedBefore = before.filter(item => item.named);
      subject = namedBefore[0] || before[0] || candidates[0] || null;
    }
    if (before.length >= 2) object = before[before.length - 1];
    else if (before.length === 1 && subject && before[0].key !== subject.key) object = before[0];
    const frame = predicate ? kb.frameFor(kb.canonicalPredicate(predicate.root || predicate.norm)) : null;
    if (frame && before.length) {
      const subjectCandidate = before.find(item => {
        if (!frame.subjects?.length) return false;
        return [...item.kinds].some(kind => frame.subjects.includes(kind));
      });
      if (subjectCandidate) subject = subjectCandidate;
      const objectCandidate = [...before].reverse().find(item => {
        if (!frame.objects?.length) return false;
        if (subjectCandidate && item.start === subjectCandidate.start) return false;
        return [...item.kinds].some(kind => frame.objects.includes(kind));
      });
      if (objectCandidate) object = objectCandidate;
      if (before.length === 1 && objectCandidate && !subjectCandidate) subject = null;
    }
    if (predicate && !subject) {
      const token = nearestContent(list,predIndex,-1);
      subject = entityFromToken(token);
    }
    if (subject && object && subject.start === object.start) object = null;
    return {subject,object,pronoun};
  }

  function timeBucket(text,profile) {
    if (profile.time && profile.time !== 'unknown' && profile.time !== 'mixed') return profile.time;
    const source = normalize(text);
    if (/\b(?:şimdi|simdi|şu an|su an|bugün|bugun|halen|hâlen)\b/u.test(source)) return 'present';
    if (/\b(?:dün|dun|geçen|gecen|önce|once|az önce|az once)\b/u.test(source)) return 'past';
    if (/\b(?:yarın|yarin|gelecek|birazdan|ileride|az sonra)\b/u.test(source)) return 'future';
    return 'unknown';
  }

  const STATE_KIND = {
    openness:new Set(['access','container']),
    activity:new Set(['software','machine','network']),
    correctness:new Set(['software','document','file','abstract','account','transaction']),
    success:new Set(['human','software','machine','transaction','abstract']),
    fullness:new Set(['container','place','machine']),
    availability:new Set(['software','machine','account','network','access']),
    lock:new Set(['access','file','account']),
    connectivity:new Set(['network','machine','software']),
    visibility:new Set(['document','file','software','access']),
    permission:new Set(['account','human','software']),
    health:new Set(['human','animal','body']),
    alive:new Set(['human','animal']),
    temperature:new Set(['body','weather','machine','place','food']),
    approval:new Set(['transaction','account','abstract']),
    enabled:new Set(['software','machine','account']),
    possession:new Set(['human','account'])
  };

  function stateFits(entity,family) {
    if (!entity?.kinds?.size || family === 'existence' || family === 'level') return true;
    const allowed = STATE_KIND[family];
    if (!allowed) return true;
    return [...entity.kinds].some(kind => allowed.has(kind));
  }

  function localNegated(text,list,predicate) {
    if (!predicate) return kb.negationMarkers.test(text);
    if (NEG_SUFFIX.test(predicate.norm)) return true;
    for (const token of list) {
      if (Math.abs(token.index - predicate.index) > 3) continue;
      if (/^(?:değil|degil|yok|hayır|hayir)$/u.test(token.norm)) return true;
    }
    return false;
  }

  function stateClaims(text,list,subject,object,predicate,pronoun,mode,sentenceIndex,offset) {
    const claims = [];
    for (const token of list) {
      const rawStates = [...kb.statesFor(token.norm),...kb.statesFor(token.root)];
      if (!rawStates.length) continue;
      const states = [];
      const stateKeys = new Set();
      for (const state of rawStates) {
        const key = `${state.family}:${state.value}`;
        if (stateKeys.has(key)) continue;
        stateKeys.add(key);
        states.push(state);
      }
      const near = nearestContent(list,token.index,-1) || nearestContent(list,token.index,1);
      let entity = entityFromToken(near);
      if (!entity && subject) entity = subject;
      if (!entity && pronoun) entity = {key:`pronoun:${pronoun.norm}`,root:pronoun.norm,raw:pronoun.raw,kinds:new Set(),start:pronoun.start,end:pronoun.end,named:false};
      if (!entity) continue;
      const negNear = list.some(other => Math.abs(other.index - token.index) <= 3 && /^(?:değil|degil)$/u.test(other.norm));
      for (const state of states) {
        if (!stateFits(entity,state.family)) continue;
        claims.push({type:'state',entityKey:entity.key,entityRoot:entity.root,entityRaw:entity.raw,family:state.family,value:negNear ? (state.value === 'positive' ? 'negative' : 'positive') : state.value,source:'lexical',start:offset + token.start,end:offset + token.end,sentenceIndex,mode});
      }
    }
    if (predicate && !localNegated(text,list,predicate)) {
      const canonical = canonicalPredicateToken(predicate);
      const frame = kb.frameFor(canonical);
      if (frame?.effects?.length) {
        const target = object || subject || (pronoun ? {key:`pronoun:${pronoun.norm}`,root:pronoun.norm,raw:pronoun.raw,kinds:new Set(),start:pronoun.start,end:pronoun.end,named:false} : null);
        if (target) for (const [family,value] of frame.effects) claims.push({
          type:'state',entityKey:target.key,entityRoot:target.root,entityRaw:target.raw,family,value,source:'predicate',predicate:canonical,start:offset + predicate.start,end:offset + predicate.end,sentenceIndex,mode
        });
      }
    }
    return claims;
  }

  function numberAt(list,start) {
    let value = 0;
    let cursor = start;
    let consumed = 0;
    let currentGroup = 0;
    while (cursor < list.length && consumed < 5 && NUMBER_WORDS.has(list[cursor].norm)) {
      const n = NUMBER_WORDS.get(list[cursor].norm);
      if (n === 100) currentGroup = Math.max(1,currentGroup) * 100;
      else if (n >= 1000) {
        currentGroup = Math.max(1,currentGroup) * n;
        value += currentGroup;
        currentGroup = 0;
      } else currentGroup += n;
      cursor++;
      consumed++;
    }
    return {value:value + currentGroup,endIndex:cursor - 1,consumed};
  }

  function quantityClaims(text,list,mode,sentenceIndex,offset) {
    const out = [];
    const source = String(text || '');
    for (let index = 0; index < list.length; index++) {
      if (!NUMBER_WORDS.has(list[index].norm)) continue;
      const parsed = numberAt(list,index);
      if (!parsed.consumed) continue;
      let cursor = parsed.endIndex + 1;
      let unit = '';
      if (list[cursor] && UNITS.has(list[cursor].norm)) {
        unit = list[cursor].norm;
        cursor++;
      }
      let noun = null;
      for (let i = cursor; i < Math.min(list.length,cursor + 5); i++) {
        if (!isContent(list[i]) || isStateToken(list[i])) continue;
        noun = list[i];
        break;
      }
      if (noun) {
        const exact = !QUANTITY_CHANGE.test(source) && !/\bdaha\b/iu.test(source);
        out.push({type:'quantity',entityKey:entityKey(noun.root),entityRoot:noun.root,entityRaw:noun.raw,value:parsed.value,unit,start:offset + list[index].start,end:offset + (noun.end || list[parsed.endIndex].end),sentenceIndex,mode,exact});
      }
      index = parsed.endIndex;
    }
    const re = /(?<![\p{L}\d])-?\d+(?:[.,]\d+)?/gu;
    let match;
    while ((match = re.exec(source))) {
      const value = Number(match[0].replace(',','.'));
      if (!Number.isFinite(value)) continue;
      const after = list.filter(token => token.start >= match.index + match[0].length && token.start - (match.index + match[0].length) <= 70);
      let unit = '';
      let noun = null;
      for (const token of after) {
        if (!unit && UNITS.has(token.norm)) {
          unit = token.norm;
          continue;
        }
        if (!isContent(token) || isStateToken(token)) continue;
        noun = token;
        break;
      }
      if (noun) {
        const exact = !QUANTITY_CHANGE.test(source) && !/\bdaha\b/iu.test(source);
        out.push({type:'quantity',entityKey:entityKey(noun.root),entityRoot:noun.root,entityRaw:noun.raw,value,unit,start:offset + match.index,end:offset + noun.end,sentenceIndex,mode,exact});
      }
    }
    return out;
  }

  function zeroExistenceClaims(text,list,mode,sentenceIndex,offset) {
    const out = [];
    for (let index = 0; index < list.length; index++) {
      const token = list[index];
      if (!kb.zeroQuantifiers.has(token.norm) && !/^(?:hiç|hic|hiçbir|hicbir|sıfır|sifir)$/u.test(token.norm)) continue;
      const noun = nearestContent(list,index,1);
      if (!noun) continue;
      out.push({type:'state',entityKey:entityKey(noun.root),entityRoot:noun.root,entityRaw:noun.raw,family:'existence',value:'negative',source:'quantifier',start:offset + token.start,end:offset + noun.end,sentenceIndex,mode});
    }
    return out;
  }

  function canonicalPredicateToken(token) {
    if (!token) return '';
    const byNorm = kb.canonicalPredicate(token.norm);
    if (kb.frameFor(byNorm)) return byNorm;
    return kb.canonicalPredicate(token.root || token.norm);
  }

  function passivePredicate(token) {
    if (!token) return false;
    const value = normalize(token.norm);
    return /(?:ıldı|ildi|uldu|üldü|ındı|indi|undu|ündü|landı|lendi|landı|lendi|ilmiş|ılmış|ulmuş|ülmüş|lenmiş|lanmış)$/u.test(value);
  }

  function sentenceFrame(segment,index) {
    const text = String(segment.text || '');
    const list = tokenList(text);
    const profile = model.profile(text);
    const predicate = predicateToken(list);
    const candidates = sentenceEntityCandidates(text,list,predicate);
    const roles = subjectObject(text,list,predicate,candidates);
    const mode = modes(text);
    const predicateRoot = predicate ? canonicalPredicateToken(predicate) : '';
    const frame = {
      index,
      start:segment.start,
      end:segment.end,
      text,
      tokens:list,
      profile,
      vector:profile.vector,
      candidates,
      subject:roles.subject,
      object:roles.object,
      pronoun:roles.pronoun,
      predicate,
      predicateRoot,
      negated:localNegated(text,list,predicate),
      mode,
      time:timeBucket(text,profile),
      relation:profile.relation || 'none',
      states:[],
      quantities:[],
      references:[],
      resolvedSubject:null
    };
    frame.states.push(...stateClaims(text,list,frame.subject,frame.object,predicate,frame.pronoun,mode,index,segment.start));
    frame.states.push(...zeroExistenceClaims(text,list,mode,index,segment.start));
    frame.quantities.push(...quantityClaims(text,list,mode,index,segment.start));
    return frame;
  }

  function mergeKinds(target,source) {
    if (!target || !source) return;
    for (const kind of source) target.add(kind);
  }

  function buildEntityMemory(frames) {
    const memory = new Map();
    const recent = [];
    const referenceWarnings = [];
    for (const frame of frames) {
      const local = [];
      for (const candidate of frame.candidates) {
        let key = candidate.key;
        if (candidate.named) key = candidate.key;
        const existing = memory.get(key) || {key,root:candidate.root,raw:candidate.raw,kinds:new Set(),mentions:[],named:candidate.named};
        mergeKinds(existing.kinds,candidate.kinds);
        existing.mentions.push({sentenceIndex:frame.index,start:frame.start + candidate.start,end:frame.start + candidate.end,role:'mention'});
        memory.set(key,existing);
        local.push(existing);
      }
      if (frame.pronoun) {
        if (FIRST_PERSON.has(frame.pronoun.norm)) {
          frame.resolvedSubject = {key:'deictic:speaker',root:'speaker',raw:frame.pronoun.raw,kinds:new Set(['human']),mentions:[],named:false};
          frame.references.push({pronoun:frame.pronoun.norm,target:'deictic:speaker',ambiguous:false});
        } else if (SECOND_PERSON.has(frame.pronoun.norm)) {
          frame.resolvedSubject = {key:'deictic:listener',root:'listener',raw:frame.pronoun.raw,kinds:new Set(['human']),mentions:[],named:false};
          frame.references.push({pronoun:frame.pronoun.norm,target:'deictic:listener',ambiguous:false});
        } else {
        const isPersonal = PERSONAL.has(frame.pronoun.norm);
        const candidates = recent.filter(item => frame.index - item.lastSentence <= 3).map(item => memory.get(item.key)).filter(Boolean);
        const uniqueCandidates = [];
        const seen = new Set();
        for (const item of candidates) if (!seen.has(item.key)) { seen.add(item.key); uniqueCandidates.push(item); }
        const namedOrHuman = uniqueCandidates.filter(item => item.named || item.kinds.has('human'));
        const pool = isPersonal && namedOrHuman.length ? namedOrHuman : uniqueCandidates;
        if (pool.length === 1) {
          frame.resolvedSubject = pool[0];
          frame.references.push({pronoun:frame.pronoun.norm,target:pool[0].key,ambiguous:false});
        } else if (pool.length > 1) {
          const first = pool[0];
          const second = pool[1];
          const firstRecent = recent.find(item => item.key === first.key)?.lastSentence ?? -99;
          const secondRecent = recent.find(item => item.key === second.key)?.lastSentence ?? -99;
          const gap = Math.abs(firstRecent - secondRecent);
          if (gap === 0 || (frame.pronoun.norm === 'o' && pool.length >= 2)) {
            referenceWarnings.push({
              start:frame.start + frame.pronoun.start,
              end:frame.start + frame.pronoun.end,
              rule:'v310-reference-ambiguous-pronoun',
              confidence:0.9,
              category:'discourse',
              severity:'warning',
              message:`“${frame.pronoun.raw}” zamiri için önceki bağlamda birden fazla olası gönderim var. Hangi kişi/varlığın kastedildiğini açıkça belirtmek paragrafın anlam bütünlüğünü güçlendirir.`
            });
            frame.references.push({pronoun:frame.pronoun.norm,target:'',ambiguous:true,candidates:pool.slice(0,4).map(item => item.key)});
          } else {
            frame.resolvedSubject = first;
            frame.references.push({pronoun:frame.pronoun.norm,target:first.key,ambiguous:false});
          }
        } else if (frame.index > 0 && (PERSONAL.has(frame.pronoun.norm) || DEMONSTRATIVE.has(frame.pronoun.norm))) {
          referenceWarnings.push({
            start:frame.start + frame.pronoun.start,
            end:frame.start + frame.pronoun.end,
            rule:'v310-reference-unresolved',
            confidence:0.84,
            category:'discourse',
            severity:'warning',
            message:`“${frame.pronoun.raw}” ifadesinin önceki cümlelerde açık bir karşılığı bulunamadı. Gönderim zinciri kopuk olabilir.`
          });
        }
        }
      }
      if (!frame.resolvedSubject && frame.subject) frame.resolvedSubject = memory.get(frame.subject.key) || frame.subject;
      if (frame.resolvedSubject) {
        if (frame.states.length) for (const claim of frame.states) {
          if ((frame.subject && claim.entityKey === frame.subject.key && frame.pronoun) || claim.entityKey === `pronoun:${frame.pronoun?.norm || ''}`) {
            claim.entityKey = frame.resolvedSubject.key;
            claim.entityRoot = frame.resolvedSubject.root || claim.entityRoot;
            claim.entityRaw = frame.resolvedSubject.raw || claim.entityRaw;
          }
        }
      }
      for (const entity of local) {
        const existing = recent.find(item => item.key === entity.key);
        if (existing) existing.lastSentence = frame.index;
        else recent.unshift({key:entity.key,lastSentence:frame.index});
      }
      if (frame.resolvedSubject?.key) {
        const existing = recent.find(item => item.key === frame.resolvedSubject.key);
        if (existing) existing.lastSentence = frame.index;
        else recent.unshift({key:frame.resolvedSubject.key,lastSentence:frame.index});
      }
      recent.sort((a,b) => b.lastSentence - a.lastSentence);
      recent.splice(12);
    }
    return {memory,referenceWarnings};
  }

  function hasTransition(frames,from,to,entityKey) {
    if (from >= to) return false;
    for (let index = from + 1; index <= to; index++) {
      const frame = frames[index];
      if (!frame) continue;
      if (kb.transitionMarkers.test(frame.text) || QUANTITY_CHANGE.test(frame.text) || RESTORE.test(frame.text)) return true;
      if (frame.states.some(claim => claim.entityKey === entityKey && claim.source === 'predicate')) return true;
    }
    return false;
  }

  function timeCompatible(a,b) {
    if (a.time === 'unknown' || b.time === 'unknown') return true;
    return a.time === b.time;
  }

  function stateConflictWarnings(frames) {
    const out = [];
    const ledger = new Map();
    for (const frame of frames) {
      if (!asserted(frame.mode)) continue;
      for (const claim of frame.states) {
        if (!asserted(claim.mode)) continue;
        const key = `${claim.entityKey}:${claim.family}`;
        const previous = ledger.get(key) || [];
        for (let index = previous.length - 1; index >= 0; index--) {
          const older = previous[index];
          const olderFrame = frames[older.sentenceIndex];
          if (!olderFrame || older.value === claim.value) continue;
          if (!timeCompatible(olderFrame,frame)) continue;
          if (olderFrame.mode.hypothetical || frame.mode.hypothetical) continue;
          if (hasTransition(frames,older.sentenceIndex,frame.index,claim.entityKey)) continue;
          const distance = Math.max(1,frame.index - older.sentenceIndex);
          const confidence = Math.max(0.82,0.97 - (distance - 1) * 0.025);
          out.push({
            start:claim.start,
            end:Math.max(claim.end,frame.end),
            rule:'v310-graph-state-contradiction',
            confidence,
            category:'logic',
            severity:'warning',
            message:`“${claim.entityRaw}” için paragraf boyunca aynı durum ailesinde birbiriyle çelişen iki bilgi tutuluyor. Önceki durumun değiştiğini açıklayan bir olay veya zaman geçişi bulunamadı.`
          });
          break;
        }
        previous.push(claim);
        ledger.set(key,previous.slice(-8));
      }
    }
    return out;
  }

  function eventConflictWarnings(frames) {
    const out = [];
    const events = [];
    for (const frame of frames) {
      if (!asserted(frame.mode) || !frame.predicateRoot) continue;
      const subjectKey = frame.resolvedSubject?.key || frame.subject?.key || '';
      const objectKey = frame.object?.key || '';
      for (let index = events.length - 1; index >= 0; index--) {
        const prior = events[index];
        if (frame.index - prior.sentenceIndex > 8) break;
        if (!rootEq(frame.predicateRoot,prior.predicateRoot) || frame.negated === prior.negated) continue;
        const subjectMatch = subjectKey && prior.subjectKey && subjectKey === prior.subjectKey;
        const objectMatch = objectKey && prior.objectKey && objectKey === prior.objectKey;
        if (!subjectMatch && !objectMatch) continue;
        const previousFrame = frames[prior.sentenceIndex];
        if (!timeCompatible(previousFrame,frame) || frame.mode.hypothetical || previousFrame.mode.hypothetical) continue;
        if (hasTransition(frames,prior.sentenceIndex,frame.index,objectKey || subjectKey)) continue;
        out.push({
          start:frame.start,
          end:frame.end,
          rule:'v310-graph-event-polarity-conflict',
          confidence:0.94,
          category:'logic',
          severity:'warning',
          message:'Aynı özne/nesne ve aynı eylem paragraf içinde hem gerçekleşmiş hem gerçekleşmemiş olarak ileri sürülüyor. Durum değişimini açıklayan bir geçiş bulunamadı.'
        });
        break;
      }
      events.push({sentenceIndex:frame.index,predicateRoot:frame.predicateRoot,negated:frame.negated,subjectKey,objectKey});
      if (events.length > 80) events.shift();
    }
    return out;
  }

  function quantityConflictWarnings(frames) {
    const out = [];
    const ledger = new Map();
    for (const frame of frames) {
      if (!asserted(frame.mode)) continue;
      for (const claim of frame.quantities) {
        if (!claim.exact) continue;
        const unit = claim.unit || 'count';
        const key = `${claim.entityKey}:${unit}`;
        const previous = ledger.get(key) || [];
        for (let index = previous.length - 1; index >= 0; index--) {
          const older = previous[index];
          if (older.value === claim.value) continue;
          const previousFrame = frames[older.sentenceIndex];
          if (!timeCompatible(previousFrame,frame)) continue;
          if (hasTransition(frames,older.sentenceIndex,frame.index,claim.entityKey) || QUANTITY_CHANGE.test(frame.text)) continue;
          if (frame.index - older.sentenceIndex > 5) continue;
          out.push({
            start:claim.start,
            end:claim.end,
            rule:'v310-graph-quantity-conflict',
            confidence:0.88,
            category:'logic',
            severity:'warning',
            message:`“${claim.entityRaw}” için aynı bağlamda ${older.value} ve ${claim.value} ${unit === 'count' ? '' : unit} değerleri veriliyor. Miktarın değiştiğini açıklayan bir olay bulunmuyor.`
          });
          break;
        }
        previous.push(claim);
        ledger.set(key,previous.slice(-6));
      }
    }
    return out;
  }

  function existenceQuantityWarnings(frames) {
    const out = [];
    const missing = [];
    for (const frame of frames) {
      if (!asserted(frame.mode)) continue;
      for (const state of frame.states) if (state.family === 'existence' && state.value === 'negative') missing.push(state);
      for (const quantity of frame.quantities) {
        if (!(quantity.value > 0)) continue;
        for (let index = missing.length - 1; index >= 0; index--) {
          const zero = missing[index];
          if (!rootEq(zero.entityRoot,quantity.entityRoot)) continue;
          if (frame.index - zero.sentenceIndex > 5) break;
          if (hasTransition(frames,zero.sentenceIndex,frame.index,quantity.entityKey)) continue;
          out.push({
            start:quantity.start,
            end:quantity.end,
            rule:'v310-graph-existence-quantity-conflict',
            confidence:0.985,
            category:'logic',
            severity:'warning',
            message:`“${quantity.entityRaw}” için önce yokluk bilgisi kurulmuşken aynı paragrafta ${quantity.value} miktarında bulunduğu belirtiliyor. Arada varlığı yeniden oluşturan bir olay anlatılmadığı için anlam doğrudan çelişiyor.`
          });
          break;
        }
      }
    }
    return out;
  }

  function selectionalWarnings(frames) {
    const out = [];
    for (const frame of frames) {
      if (!asserted(frame.mode) || !frame.predicateRoot || frame.mode.hypothetical) continue;
      const spec = kb.frameFor(frame.predicateRoot);
      if (!spec || (frame.predicate && (isStateToken(frame.predicate) || passivePredicate(frame.predicate)))) continue;
      const subject = frame.resolvedSubject || frame.subject;
      if (subject && spec.subjects?.length && subject.kinds?.size) {
        const allowed = [...subject.kinds].some(kind => spec.subjects.includes(kind));
        if (!allowed) out.push({
          start:frame.start,
          end:frame.end,
          rule:'v310-semantic-role-subject-mismatch',
          confidence:0.81,
          category:'semantic',
          severity:'warning',
          message:`“${subject.raw}” varlığının türü, “${frame.predicate?.raw || frame.predicateRoot}” eyleminin beklenen özne rolüyle uyuşmuyor. Sözcükler doğru olsa da cümlenin gerçek dünya anlamı olağandışı olabilir.`
        });
      }
      if (frame.object && spec.objects?.length && frame.object.kinds?.size) {
        const allowed = [...frame.object.kinds].some(kind => spec.objects.includes(kind));
        if (!allowed) out.push({
          start:frame.start,
          end:frame.end,
          rule:'v310-semantic-role-object-mismatch',
          confidence:0.79,
          category:'semantic',
          severity:'warning',
          message:`“${frame.object.raw}” varlığının türü, “${frame.predicate?.raw || frame.predicateRoot}” eyleminin beklenen nesne rolüyle uyuşmuyor. Cümlenin anlamını kontrol edin.`
        });
      }
    }
    return out;
  }

  function causalEffectSignature(frame) {
    const predicate = frame.predicateRoot || '';
    const state = frame.states.find(item => item.source === 'predicate') || frame.states[0] || null;
    return {predicate,state:state ? `${state.family}:${state.value}` : ''};
  }

  function causalWarnings(frames) {
    const out = [];
    for (let index = 1; index < frames.length; index++) {
      const current = frames[index];
      if (!kb.resultStart.test(current.text)) continue;
      const previous = frames[index - 1];
      if (!asserted(current.mode) || !asserted(previous.mode)) continue;
      const effect = causalEffectSignature(current);
      const support = kb.causalSupport(previous.text,effect.predicate,effect.state);
      const semantic = model.similarity(previous.profile,current.profile);
      const sharedEntity = previous.candidates.some(a => current.candidates.some(b => rootEq(a.root,b.root))) || (previous.object && current.object && rootEq(previous.object.root,current.object.root));
      if (support >= 0.75) continue;
      if (sharedEntity && semantic >= 0.08) continue;
      if (semantic >= 0.16) continue;
      out.push({
        start:current.start,
        end:current.end,
        rule:'v310-causal-unsupported-inference',
        confidence:support > 0 ? 0.78 : 0.91,
        category:'logic',
        severity:'warning',
        message:'Sonuç cümlesi önceki olaydan çıkarılıyor ancak yerel neden-sonuç bilgi tabanı, ortak varlıklar ve semantik bağ birlikte değerlendirildiğinde bu çıkarım için yeterli destek bulunmuyor.'
      });
    }
    for (const frame of frames) {
      if (!kb.causalMarkers.test(frame.text)) continue;
      const source = String(frame.text || '');
      const marker = /\b(?:çünkü|cunku|zira|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|nedeniyle|sebebiyle|dolayı|dolayi)\b/iu.exec(source);
      if (!marker || marker.index == null) continue;
      const left = source.slice(0,marker.index).trim();
      const right = source.slice(marker.index + marker[0].length).trim();
      if (!left || !right) continue;
      const leftProfile = model.profile(left);
      const rightProfile = model.profile(right);
      const sim = model.similarity(leftProfile,rightProfile);
      if (sim > 0.2) continue;
      const leftTokens = tokenList(left);
      const rightTokens = tokenList(right);
      const lp = predicateToken(leftTokens);
      const rp = predicateToken(rightTokens);
      const supportLR = kb.causalSupport(left,rp ? kb.canonicalPredicate(rp.root || rp.norm) : '','');
      const supportRL = kb.causalSupport(right,lp ? kb.canonicalPredicate(lp.root || lp.norm) : '','');
      if (Math.max(supportLR,supportRL) >= 0.75) continue;
      const shared = leftTokens.filter(isContent).some(a => rightTokens.filter(isContent).some(b => rootEq(a.root,b.root)));
      if (!shared && sim < 0.05) out.push({
        start:frame.start + marker.index,
        end:frame.end,
        rule:'v310-causal-clause-gap',
        confidence:0.86,
        category:'discourse',
        severity:'warning',
        message:'Neden ve sonuç cümlecikleri arasında ortak olay, varlık, kavram veya yerel bilgi tabanıyla doğrulanabilen bir nedensel bağ bulunamadı.'
      });
    }
    return out;
  }

  function referenceChainWarnings(frames,memoryWarnings) {
    const out = [...memoryWarnings];
    for (let index = 1; index < frames.length; index++) {
      const current = frames[index];
      if (!kb.referenceStart.test(current.text)) continue;
      if (kb.resultStart.test(current.text)) continue;
      if (current.references.length) continue;
      const previous = frames[index - 1];
      const semantic = model.similarity(previous.profile,current.profile);
      const currentRoots = new Set(current.tokens.filter(isContent).map(token => token.root));
      const previousRoots = new Set(previous.tokens.filter(isContent).map(token => token.root));
      const lexical = model.jaccard(currentRoots,previousRoots);
      if (semantic >= 0.08 || lexical > 0) continue;
      out.push({
        start:current.start,
        end:current.end,
        rule:'v310-reference-discourse-gap',
        confidence:0.85,
        category:'discourse',
        severity:'warning',
        message:'Cümle “bu/şu/o” türü bir gönderimle önceki bağlama dayanıyor ancak önceki cümlelerde bu gönderimi taşıyacak yeterli anlamsal merkez bulunmuyor.'
      });
    }
    return out;
  }

  function topicMetrics(frames) {
    if (!frames.length) return {score:100,segments:0,isolated:0,averageBridge:1};
    const similarities = [];
    let segments = 1;
    let isolated = 0;
    for (let index = 1; index < frames.length; index++) {
      const current = frames[index];
      const previous = frames[index - 1];
      const adjacent = model.similarity(previous.profile,current.profile);
      let back = adjacent;
      for (let j = Math.max(0,index - 3); j < index; j++) back = Math.max(back,model.similarity(frames[j].profile,current.profile));
      similarities.push(back);
      if (back < 0.065 && !RELATION_RE.test(current.text)) {
        segments++;
        if (index < frames.length - 1) {
          const next = model.similarity(current.profile,frames[index + 1].profile);
          if (next < 0.065) isolated++;
        }
      }
    }
    const averageBridge = similarities.length ? similarities.reduce((sum,value) => sum + value,0) / similarities.length : 1;
    const score = Math.max(0,Math.min(100,Math.round(100 - Math.max(0,segments - 1) * 7 - isolated * 10 - Math.max(0,0.12 - averageBridge) * 70)));
    return {score,segments,isolated,averageBridge:Number(averageBridge.toFixed(4))};
  }

  function topicWarnings(frames,metrics) {
    if (frames.length < 4 || metrics.isolated < 1) return [];
    const out = [];
    for (let index = 1; index < frames.length - 1; index++) {
      const frame = frames[index];
      if (RELATION_RE.test(frame.text)) continue;
      const prev = model.similarity(frames[index - 1].profile,frame.profile);
      const next = model.similarity(frame.profile,frames[index + 1].profile);
      let global = 0;
      for (let j = 0; j < frames.length; j++) if (j !== index) global = Math.max(global,model.similarity(frames[j].profile,frame.profile));
      if (prev < 0.05 && next < 0.05 && global < 0.07) out.push({
        start:frame.start,
        end:frame.end,
        rule:'v310-discourse-isolated-proposition',
        confidence:0.83,
        category:'discourse',
        severity:'warning',
        message:'Bu cümle paragrafın önceki ve sonraki anlam merkezleriyle bağ kurmayan izole bir önerme gibi duruyor. Konu geçişi veya açıklayıcı bağ eksik olabilir.'
      });
    }
    return out;
  }

  function fluencyOutliers(frames) {
    if (!lm?.score || frames.length < 2) return [];
    const scored = [];
    for (const frame of frames) {
      if (frame.tokens.length < 6) continue;
      let report = null;
      try { report = lm.score(frame.text); } catch (_) {}
      const score = Number(report?.score);
      if (!Number.isFinite(score)) continue;
      scored.push({frame,score,rare:Array.isArray(report?.rare) ? report.rare.length : 0});
    }
    if (scored.length < 2) return [];
    const values = scored.map(item => item.score).sort((a,b) => a - b);
    const median = values[Math.floor(values.length / 2)];
    const out = [];
    for (const item of scored) {
      if (item.score >= 0.025 || item.rare < 3) continue;
      if (median > 0 && item.score > median * 0.3) continue;
      out.push({
        start:item.frame.start,
        end:item.frame.end,
        rule:'v310-local-language-model-outlier',
        confidence:0.76,
        category:'style',
        severity:'warning',
        message:'Cümlenin yerel dil modeli puanı yalnızca mutlak olarak değil, aynı paragraftaki diğer cümlelere göre de belirgin biçimde düşük. Sözcük dizilimi doğal Türkçe akışından sapıyor olabilir.'
      });
    }
    return out;
  }

  function calibrateBaseWarnings(baseWarnings,extraWarnings) {
    const strongExtra = extraWarnings.filter(item => (item.confidence || 0) >= 0.88);
    const out = [];
    for (const item of baseWarnings || []) {
      const rule = String(item.rule || '');
      if (/v300-semantic-ambiguous-reference/u.test(rule) && (item.confidence || 0) < 0.82) {
        const supported = strongExtra.some(extra => /reference/u.test(extra.rule || '') && Math.abs(extra.start - item.start) < 12);
        if (!supported) continue;
      }
      if (/v300-discourse-topic-drift/u.test(rule) && (item.confidence || 0) < 0.85) {
        const supported = extraWarnings.some(extra => /isolated-proposition/u.test(extra.rule || '') && Math.abs(extra.start - item.start) < 20);
        if (!supported) continue;
      }
      if (/weak-causal-link|unsupported-result/u.test(rule) && (item.confidence || 0) < 0.82) {
        const supported = extraWarnings.some(extra => /causal/u.test(extra.rule || '') && Math.abs(extra.start - item.start) < 30);
        if (!supported) continue;
      }
      out.push(item);
    }
    return out;
  }

  function analyzeGraph(text) {
    const source = String(text || '');
    const segments = core.sentenceSegments(source);
    const frames = segments.map((segment,index) => sentenceFrame(segment,index));
    const entityResult = buildEntityMemory(frames);
    const topic = topicMetrics(frames);
    const warnings = [];
    warnings.push(...stateConflictWarnings(frames));
    warnings.push(...eventConflictWarnings(frames));
    warnings.push(...quantityConflictWarnings(frames));
    warnings.push(...existenceQuantityWarnings(frames));
    warnings.push(...selectionalWarnings(frames));
    warnings.push(...causalWarnings(frames));
    warnings.push(...referenceChainWarnings(frames,entityResult.referenceWarnings));
    warnings.push(...topicWarnings(frames,topic));
    warnings.push(...fluencyOutliers(frames));
    const deduped = unique(warnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const logicCount = deduped.filter(item => item.category === 'logic').length;
    const semanticCount = deduped.filter(item => item.category === 'semantic').length;
    const referenceCount = deduped.filter(item => /reference/u.test(item.rule || '')).length;
    const entityCount = entityResult.memory.size;
    const propositionCount = frames.reduce((sum,frame) => sum + frame.states.length + frame.quantities.length + (frame.predicateRoot ? 1 : 0),0);
    const graphScore = Math.max(0,Math.min(100,Math.round(topic.score - logicCount * 10 - semanticCount * 4 - referenceCount * 3)));
    return {
      version:VERSION,
      warnings:deduped,
      graph:{
        score:graphScore,
        entityCount,
        propositionCount,
        sentenceCount:frames.length,
        topicSegments:topic.segments,
        isolatedPropositions:topic.isolated,
        averageBridgeSimilarity:topic.averageBridge,
        logicConflicts:logicCount,
        semanticRoleWarnings:semanticCount,
        referenceWarnings:referenceCount
      },
      frames:frames.map(frame => ({
        index:frame.index,
        start:frame.start,
        end:frame.end,
        predicate:frame.predicateRoot,
        negated:frame.negated,
        subject:frame.resolvedSubject?.key || frame.subject?.key || '',
        object:frame.object?.key || '',
        time:frame.time,
        mode:frame.mode,
        states:frame.states.map(item => ({entity:item.entityKey,family:item.family,value:item.value,source:item.source})),
        quantities:frame.quantities.map(item => ({entity:item.entityKey,value:item.value,unit:item.unit || 'count'})),
        references:frame.references
      })),
      externalDependencies:0,
      fullyLocal:true
    };
  }

  function wrappedSentence(rawText,context = {}) {
    const text = String(rawText || '');
    let base = [];
    try { base = baseSentence(text,context) || []; } catch (_) {}
    if (text.length < 4) return base;
    const graph = analyzeGraph(text);
    return unique([...base,...graph.warnings]).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedDocument(rawText,context = {}) {
    const text = String(rawText || '');
    let base = {warnings:[],coherence:{score:100}};
    try { base = baseDocument(text,context) || base; } catch (_) {}
    const graph = analyzeGraph(text);
    const calibratedBase = calibrateBaseWarnings(base.warnings || [],graph.warnings);
    const warnings = unique([...calibratedBase,...graph.warnings]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const baseScore = Number(base.coherence?.score ?? 100);
    const blended = Math.round(baseScore * 0.58 + graph.graph.score * 0.42);
    return {
      ...base,
      version:VERSION,
      warnings,
      coherence:{
        ...(base.coherence || {}),
        score:Math.max(0,Math.min(100,blended)),
        graphScore:graph.graph.score,
        topicSegments:graph.graph.topicSegments,
        isolatedPropositions:graph.graph.isolatedPropositions,
        entityCount:graph.graph.entityCount,
        propositionCount:graph.graph.propositionCount
      },
      semanticGraph:graph,
      reasoningLayer:'v310-local-proposition-graph',
      propositionGraph:true,
      entityMemory:true,
      coreferenceResolution:true,
      stateLedger:true,
      predicateEntailment:true,
      selectionalSemantics:true,
      causalKnowledgeBase:true,
      quantifierScope:true,
      assertionMode:true,
      localRelativeFluency:true,
      externalDependencies:0,
      fullyLocal:true
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
      semanticGraph:semanticDocument.semanticGraph,
      coherence:semanticDocument.coherence,
      fullParagraphMeaning:true,
      localPropositionGraph:true,
      externalDependencies:0,
      fullyLocal:true
    };
  }

  engine.analyzeSentence = wrappedSentence;
  engine.analyzeSemanticDocument = wrappedDocument;
  engine.analyzeParagraph = wrappedParagraph;
  engine.analyzeMeaningGraph = analyzeGraph;
  engine.stats = {
    ...(engine.stats || {}),
    semanticReasoningLayer:'v310-local-proposition-graph',
    localKnowledgeVersion:kb.VERSION,
    propositionGraph:true,
    entityMemory:true,
    coreferenceResolution:true,
    stateLedger:true,
    predicateEntailment:true,
    selectionalSemantics:true,
    causalKnowledgeBase:true,
    quantifierScope:true,
    assertionMode:true,
    localRelativeFluency:true,
    fullParagraphMeaning:true,
    externalDependencies:0
  };
})();