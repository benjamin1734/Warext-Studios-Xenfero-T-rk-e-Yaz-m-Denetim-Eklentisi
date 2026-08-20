(() => {
  'use strict';

  if (window.__warextSemanticV120) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeSentence || !engine?.analyzeMorphology || !engine?.isValid) return;
  window.__warextSemanticV120 = true;

  const VERSION = '1.2.0';
  const baseAnalyzeSentence = engine.analyzeSentence.bind(engine);
  const baseAnalyzeMorphology = engine.analyzeMorphology.bind(engine);
  const baseIsValid = engine.isValid.bind(engine);
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const VOWELS = 'aeıioöuü';
  const VOICELESS = 'çfhkpsşt';
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const chars = value => Array.from(String(value || ''));
  const lastChar = value => chars(normalize(value)).at(-1) || '';

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

  function capitalize(value) {
    const source = String(value || '');
    if (!source) return source;
    return source[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR') + source.slice(1);
  }

  function preserveCase(source, replacement) {
    if (!source || !replacement) return replacement;
    return source[0] !== normalize(source[0]) ? capitalize(replacement) : replacement;
  }

  const CLASS_PARENTS = new Map([
    ['human',['animate','entity']],['animal',['animate','entity']],['animate',['entity']],['food',['consumable','physical','entity']],
    ['beverage',['liquid','consumable','physical','entity']],['liquid',['physical','entity']],['text',['readable','information','entity']],
    ['document',['text','readable','information','digital','entity']],['message',['text','communication','information','digital','entity']],
    ['code',['text','information','digital','entity']],['software',['digital','entity']],['file',['digital','entity']],['data',['information','digital','entity']],
    ['visual',['media','digital','entity']],['audio',['media','digital','entity']],['media',['digital','entity']],['device',['tool','physical','entity']],
    ['vehicle',['tool','physical','entity']],['tool',['physical','entity']],['clothing',['physical','entity']],['place',['physical','entity']],
    ['container',['physical','entity']],['money',['abstract','entity']],['time',['abstract','entity']],['emotion',['abstract','entity']],
    ['abstract',['entity']],['physical',['entity']],['information',['abstract','entity']],['communication',['abstract','entity']]
  ]);

  const LEXICAL_CLASSES = new Map();

  function register(classes, words) {
    for (const word of words) {
      const key = normalize(word);
      if (!LEXICAL_CLASSES.has(key)) LEXICAL_CLASSES.set(key,new Set());
      const target = LEXICAL_CLASSES.get(key);
      for (const cls of classes) target.add(cls);
    }
  }

  register(['human'],['insan','kişi','adam','kadın','erkek','çocuk','bebek','öğrenci','öğretmen','doktor','mühendis','oyuncu','kullanıcı','üye','yönetici','moderatör','arkadaş','anne','baba','kardeş','müşteri','satıcı','alıcı','yazar','okur','geliştirici','programcı','işçi','çalışan','patron','misafir','komşu','polis','asker','şoför']);
  register(['animal'],['kedi','köpek','kuş','at','inek','koyun','keçi','balık','aslan','kaplan','ayı','kurt','tavşan','fare','tavuk','horoz','ördek','kaz','yılan','arı','sinek']);
  register(['food'],['yemek','ekmek','et','tavuk','balık','elma','armut','muz','portakal','çilek','pizza','hamburger','makarna','pilav','çorba','salata','peynir','yoğurt','yumurta','pasta','kek','bisküvi','çikolata','meyve','sebze','patates','domates']);
  register(['beverage'],['su','çay','kahve','süt','ayran','kola','gazoz','limonata','meyve suyu','içecek']);
  register(['text'],['kitap','roman','hikâye','hikaye','makale','yazı','metin','rehber','belge','doküman','dokuman','sayfa','paragraf','cümle','cumle','şiir','siir','gazete','dergi']);
  register(['message'],['mesaj','yorum','gönderi','konu','başlık','bildirim','e-posta','eposta','mail']);
  register(['code'],['kod','kaynak','script','betik','fonksiyon','sınıf','class','metot','method','sorgu','sql','json','xml','html','css','javascript','php','java','python']);
  register(['software'],['uygulama','program','yazılım','yazilim','eklenti','plugin','mod','modül','modul','paket','sürüm','surum','işletim sistemi','sistem','minecraft','xenforo','android']);
  register(['file'],['dosya','arşiv','arsiv','zip','jar','apk','pdf','görsel','gorsel','resim','fotoğraf','fotograf']);
  register(['data'],['veri','kayıt','kayit','tablo','veritabanı','veritabani','log','önbellek','onbellek']);
  register(['visual'],['video','film','dizi','görüntü','goruntu','fotoğraf','fotograf','resim','ekran','yayın','yayin','klip']);
  register(['audio'],['müzik','muzik','şarkı','sarki','ses','podcast','radyo','kayıt','kayit']);
  register(['device'],['telefon','bilgisayar','laptop','sunucu','modem','router','klavye','fare','ekran','monitör','monitor','işlemci','islemci','gpu','cpu','disk','ssd','hdd','kamera','mikrofon','kulaklık','kulaklik']);
  register(['vehicle'],['araba','otomobil','otobüs','otobus','kamyon','tren','uçak','ucak','gemi','tekne','bisiklet','motosiklet','motor','taksi']);
  register(['clothing'],['elbise','gömlek','gomlek','pantolon','ceket','mont','kazak','ayakkabı','ayakkabi','çorap','corap','şapka','sapka','forma']);
  register(['place'],['ev','okul','iş','is','ofis','şehir','sehir','ülke','ulke','oda','salon','mutfak','bahçe','bahce','park','hastane','market','mağaza','magaza','forum','site','sunucu','dünya','dunya','köy','koy','sokak','cadde']);
  register(['container'],['kutu','şişe','sise','bardak','fincan','çanta','canta','dolap','çekmece','cekmece','kasa']);
  register(['physical'],['masa','sandalye','koltuk','yatak','kapı','kapi','pencere','duvar','taş','tas','top','kalem','anahtar','bıçak','bicak','tabak','kaşık','kasik','çatal','çekiç','cekic','vida','kablo','batarya','pil']);
  register(['money'],['para','bakiye','kredi','ücret','ucret','fiyat','maaş','maas','gelir','borç','borc','tl','dolar','euro']);
  register(['time'],['zaman','gün','gun','hafta','ay','yıl','yil','saat','dakika','saniye','tarih']);
  register(['emotion'],['mutluluk','üzüntü','uzuntu','korku','öfke','ofke','sevgi','nefret','heyecan','endişe','endise']);
  register(['abstract'],['fikir','düşünce','dusunce','plan','amaç','amac','hedef','sorun','hata','özellik','ozellik','ayar','kural','anlam','neden','sonuç','sonuc','ihtimal','olasılık','olasilik']);

  function expandClasses(classes) {
    const out = new Set(classes || []);
    const queue = [...out];
    while (queue.length) {
      const current = queue.shift();
      for (const parent of CLASS_PARENTS.get(current) || []) {
        if (out.has(parent)) continue;
        out.add(parent);
        queue.push(parent);
      }
    }
    return out;
  }

  function classesForRoot(root) {
    return expandClasses(LEXICAL_CLASSES.get(normalize(root)) || []);
  }

  const VERB_FRAMES = new Map([
    ['iç',{object:['beverage','liquid'],subject:['animate'],label:'içmek'}],
    ['ye',{object:['food'],subject:['animate'],label:'yemek'}],
    ['oku',{object:['readable','text','document','message','code'],subject:['human'],label:'okumak'}],
    ['izle',{object:['visual','media'],subject:['human'],label:'izlemek'}],
    ['dinle',{object:['audio','human'],subject:['human'],label:'dinlemek'}],
    ['giy',{object:['clothing'],subject:['human'],label:'giymek'}],
    ['sür',{object:['vehicle'],subject:['human'],label:'sürmek'}],
    ['derle',{object:['code','software'],subject:['human'],label:'derlemek'}],
    ['programla',{object:['software','device'],subject:['human'],label:'programlamak'}],
    ['kodla',{object:['code','software'],subject:['human'],label:'kodlamak'}],
    ['yükle',{object:['file','software','code','data','physical'],subject:['human'],label:'yüklemek'}],
    ['indir',{object:['file','software','data','human','physical'],subject:['human'],label:'indirmek'}],
    ['sil',{object:['file','software','data','message','text'],subject:['human'],label:'silmek'}],
    ['yaz',{object:['text','message','code','document'],subject:['human'],label:'yazmak'}],
    ['çiz',{object:['visual','document'],subject:['human'],label:'çizmek'}],
    ['konuş',{subject:['human'],label:'konuşmak'}],
    ['düşün',{subject:['human'],label:'düşünmek'}],
    ['uyu',{subject:['animate'],label:'uyumak'}],
    ['koş',{subject:['animate'],label:'koşmak'}],
    ['havla',{subject:['animal'],label:'havlamak'}],
    ['miyavla',{subject:['animal'],label:'miyavlamak'}],
    ['uç',{subject:['animate','vehicle'],label:'uçmak'}],
    ['yüz',{subject:['animate','vehicle'],label:'yüzmek'}]
  ]);

  const CASE_FRAMES = new Map([
    ['bak','dative'],['inan','dative'],['güven','dative'],['katıl','dative'],['ulaş','dative'],['yaklaş','dative'],['benze','dative'],['uy','dative'],['başla','dative'],
    ['bahset','ablative'],['kork','ablative'],['hoşlan','ablative'],['vazgeç','ablative'],['şüphelen','ablative'],['kaçın','ablative'],['ayrıl','ablative']
  ]);

  const COMPOUND_CASE_FRAMES = new Map([
    ['yardım et','dative'],['teşekkür et','dative'],['devam et','dative'],['itiraz et','dative'],['dikkat et','dative'],['engel ol','dative'],['ihtiyaç duy','dative'],['söz et','ablative']
  ]);

  const ANTONYM_PAIRS = new Set([
    'açık|kapalı','aktif|pasif','doğru|yanlış','var|yok','canlı|ölü','mümkün|imkânsız','mumkun|imkansiz','çevrimiçi|çevrimdışı','cevrimici|cevrimdisi','başarılı|başarısız','basarili|basarisiz','aynı|farklı','ayni|farkli','dolu|boş','dolu|bos','sıcak|soğuk','sicak|soguk'
  ]);

  const QUANTIFIERS = new Set(['her','hiçbir','hicbir','birçok','bircok','birkaç','birkac','pekçok','pekcok']);
  const SUBJECT_PRONOUNS = new Set(['ben','sen','o','biz','siz','onlar','bu','şu','su']);
  const PRONOUN_CASES = new Map([
    ['ben',{dative:'bana',accusative:'beni',locative:'bende',ablative:'benden',genitive:'benim'}],
    ['sen',{dative:'sana',accusative:'seni',locative:'sende',ablative:'senden',genitive:'senin'}],
    ['o',{dative:'ona',accusative:'onu',locative:'onda',ablative:'ondan',genitive:'onun'}],
    ['biz',{dative:'bize',accusative:'bizi',locative:'bizde',ablative:'bizden',genitive:'bizim'}],
    ['siz',{dative:'size',accusative:'sizi',locative:'sizde',ablative:'sizden',genitive:'sizin'}],
    ['onlar',{dative:'onlara',accusative:'onları',locative:'onlarda',ablative:'onlardan',genitive:'onların'}]
  ]);
  const CASE_NAMES = new Set(['dative','accusative','locative','ablative','genitive']);

  function isProtected(ranges,start,end) {
    return (ranges || []).some(range => range.start < end && range.end > start);
  }

  function tokenize(text,context = {}) {
    const source = String(text || '');
    const re = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,16})?`,'gu');
    const tokens = [];
    let match;
    while ((match = re.exec(source))) {
      const start = match.index;
      const end = start + match[0].length;
      if (isProtected(context.protectedRanges,start,end)) continue;
      const raw = match[0];
      const clean = raw.replace(/['’].*$/u,'');
      const morphology = baseAnalyzeMorphology(raw) || baseAnalyzeMorphology(clean) || null;
      const root = normalize(morphology?.root || clean);
      tokens.push({raw,start,end,root,morphology,classes:classesForRoot(root)});
    }
    return tokens;
  }

  function clauseIdFor(text,index) {
    let id = 0;
    for (let cursor = 0; cursor < index; cursor++) if (/[.!?;:\n]/u.test(text[cursor])) id++;
    return id;
  }

  function enrichClauses(text,tokens) {
    for (const token of tokens) token.clause = clauseIdFor(text,token.start);
    return tokens;
  }

  function compatible(actual,allowed) {
    if (!actual?.size || !allowed?.length) return true;
    return allowed.some(cls => actual.has(cls));
  }

  function finiteVerb(token) {
    return token?.morphology?.valid && token.morphology.mode === 'verb' && !!(token.morphology.features?.tense || token.morphology.features?.mood || token.morphology.features?.compound);
  }

  function caseName(token) {
    const value = token?.morphology?.features?.case || '';
    return CASE_NAMES.has(value) ? value : '';
  }

  function simpleNominal(token) {
    const analysis = token?.morphology;
    if (!analysis?.valid || analysis.mode !== 'noun' || !analysis.root) return false;
    if (analysis.features?.possessive) return false;
    if (analysis.features?.number === 'plural') return false;
    return true;
  }

  function softenedRoots(root) {
    const word = normalize(root);
    const out = [word];
    if (word.endsWith('p')) out.push(word.slice(0,-1) + 'b');
    if (word.endsWith('ç')) out.push(word.slice(0,-1) + 'c');
    if (word.endsWith('t')) out.push(word.slice(0,-1) + 'd');
    if (word.endsWith('k')) out.push(word.slice(0,-1) + 'ğ',word.slice(0,-1) + 'g');
    return [...new Set(out)];
  }

  function caseCandidates(root,target) {
    const base = normalize(root);
    const h2 = harmony2(base);
    const h4 = harmony4(base);
    if (!h2 || !h4) return [];
    const vowelEnd = VOWELS.includes(lastChar(base));
    if (target === 'dative') {
      const stems = vowelEnd ? [base] : softenedRoots(base);
      return stems.map(stem => `${stem}${vowelEnd ? 'y' : ''}${h2}`);
    }
    if (target === 'accusative') {
      const stems = vowelEnd ? [base] : softenedRoots(base);
      return stems.map(stem => `${stem}${vowelEnd ? 'y' : ''}${h4}`);
    }
    if (target === 'locative') {
      const lead = VOICELESS.includes(lastChar(base)) ? 't' : 'd';
      return [`${base}${lead}${h2}`];
    }
    if (target === 'ablative') {
      const lead = VOICELESS.includes(lastChar(base)) ? 't' : 'd';
      return [`${base}${lead}${h2}n`];
    }
    if (target === 'genitive') {
      const stems = vowelEnd ? [base] : softenedRoots(base);
      return stems.map(stem => `${stem}${vowelEnd ? 'n' : ''}${h4}n`);
    }
    return [];
  }

  function generateCase(token,target) {
    const pronoun = PRONOUN_CASES.get(token?.root);
    if (pronoun?.[target]) return preserveCase(token.raw,pronoun[target]);
    if (!simpleNominal(token)) return '';
    const current = caseName(token);
    if (current === target) return '';
    for (const candidate of caseCandidates(token.morphology.root,target)) {
      if (!candidate || normalize(candidate) === normalize(token.raw)) continue;
      if (baseIsValid(candidate) || engine.check?.(candidate,{properNames:true})?.correct) return preserveCase(token.raw,candidate);
    }
    return '';
  }

  function singularSuggestion(token) {
    const analysis = token?.morphology;
    if (!analysis?.valid || analysis.mode !== 'noun' || analysis.features?.number !== 'plural' || !analysis.root) return '';
    if (analysis.features?.possessive || analysis.features?.case) return '';
    const root = normalize(analysis.root);
    return baseIsValid(root) ? preserveCase(token.raw,root) : '';
  }

  function predicateKey(tokens,index) {
    const token = tokens[index];
    if (!token) return {key:'',componentIndex:-1};
    const root = token.root;
    const prev = tokens[index - 1];
    if (prev && prev.clause === token.clause) {
      const compound = `${prev.root} ${root}`;
      if (COMPOUND_CASE_FRAMES.has(compound)) return {key:compound,componentIndex:index - 1};
    }
    return {key:root,componentIndex:-1};
  }

  function nearbyArguments(tokens,index,componentIndex = -1) {
    const predicate = tokens[index];
    const before = [];
    for (let cursor = index - 1; cursor >= 0 && before.length < 6; cursor--) {
      const token = tokens[cursor];
      if (token.clause !== predicate.clause) break;
      if (cursor === componentIndex) continue;
      if (finiteVerb(token)) break;
      before.push(token);
    }
    return before;
  }

  function explicitSubject(tokens,index) {
    const predicate = tokens[index];
    for (let cursor = index - 1; cursor >= 0 && index - cursor <= 7; cursor--) {
      const token = tokens[cursor];
      if (token.clause !== predicate.clause) break;
      const c = caseName(token);
      if (c) continue;
      if (SUBJECT_PRONOUNS.has(token.root)) return token;
      if (token.classes.has('human') || token.classes.has('animal') || token.classes.has('animate') || token.classes.has('physical')) return token;
    }
    return null;
  }

  function directObject(tokens,index,componentIndex = -1) {
    const candidates = nearbyArguments(tokens,index,componentIndex);
    const accusative = candidates.find(token => caseName(token) === 'accusative');
    if (accusative) return accusative;
    const bare = candidates.find(token => !caseName(token) && !SUBJECT_PRONOUNS.has(token.root) && token.morphology?.mode === 'noun');
    return bare || null;
  }

  function addUnique(list,item) {
    if (!item) return;
    const key = `${item.start}:${item.end}:${item.rule}:${item.message || item.suggestions?.[0] || ''}`;
    if (list.some(existing => existing.__key === key)) return;
    item.__key = key;
    list.push(item);
  }

  function cleanIssue(issue) {
    const copy = {...issue};
    delete copy.__key;
    return copy;
  }

  function quantifierIssues(text,tokens) {
    const issues = [];
    for (let index = 0; index < tokens.length - 1; index++) {
      const first = tokens[index];
      const second = tokens[index + 1];
      if (first.clause !== second.clause) continue;
      const isNumber = /^\d+$/u.test(first.raw);
      if (!isNumber && !QUANTIFIERS.has(first.root)) continue;
      const replacement = singularSuggestion(second);
      if (!replacement) continue;
      addUnique(issues,{start:second.start,end:second.end,suggestions:[replacement],rule:'v120-semantic-quantifier-number',confidence:0.995,category:'semantic',message:'Sayı ve miktar belirten ifadelerden sonra ad genellikle tekil kullanılır.'});
    }
    const numericRe = /\b\d+[ \t]+([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{3,})/gu;
    let match;
    while ((match = numericRe.exec(text))) {
      const start = match.index + match[0].lastIndexOf(match[1]);
      const token = tokens.find(item => item.start === start);
      if (!token) continue;
      const replacement = singularSuggestion(token);
      if (replacement) addUnique(issues,{start:token.start,end:token.end,suggestions:[replacement],rule:'v120-semantic-numeral-plural',confidence:0.995,category:'semantic',message:'Sayılardan sonra çoğul eki gereksizdir.'});
    }
    return issues;
  }

  function caseFrameIssues(tokens) {
    const issues = [];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      if (!finiteVerb(token)) continue;
      const predicate = predicateKey(tokens,index);
      const expected = COMPOUND_CASE_FRAMES.get(predicate.key) || CASE_FRAMES.get(predicate.key);
      if (!expected) continue;
      const candidates = nearbyArguments(tokens,index,predicate.componentIndex);
      if (candidates.some(candidate => caseName(candidate) === expected)) continue;
      const wrong = candidates.find(candidate => CASE_NAMES.has(caseName(candidate)) && simpleNominal(candidate));
      const adjacentBare = candidates[0] && !caseName(candidates[0]) && simpleNominal(candidates[0]) ? candidates[0] : null;
      const target = wrong || adjacentBare;
      if (!target) continue;
      const replacement = generateCase(target,expected);
      if (!replacement) continue;
      const confidence = wrong ? 0.97 : 0.9;
      addUnique(issues,{start:target.start,end:target.end,suggestions:[replacement],rule:'v120-semantic-case-frame',confidence,category:'semantic',message:`${predicate.key} yüklemi bu tamlayıcıyla ${expected} hâlini bekliyor.`});
    }
    return issues;
  }

  function selectionalWarnings(tokens) {
    const warnings = [];
    for (let index = 0; index < tokens.length; index++) {
      const predicate = tokens[index];
      if (!finiteVerb(predicate)) continue;
      const frame = VERB_FRAMES.get(predicate.root);
      if (!frame) continue;
      const subject = explicitSubject(tokens,index);
      if (subject && frame.subject?.length && subject.classes.size && !compatible(subject.classes,frame.subject)) {
        addUnique(warnings,{start:subject.start,end:predicate.end,rule:'v120-semantic-subject-selection',confidence:0.94,category:'semantic',severity:'warning',message:`“${subject.raw}” öznesi ile “${frame.label}” yüklemi arasında güçlü bir anlam uyumsuzluğu var.`});
      }
      if (frame.object?.length) {
        const object = directObject(tokens,index);
        if (object && object.classes.size && !compatible(object.classes,frame.object)) {
          addUnique(warnings,{start:object.start,end:predicate.end,rule:'v120-semantic-object-selection',confidence:0.955,category:'semantic',severity:'warning',message:`“${object.raw}” nesnesi “${frame.label}” fiilinin beklediği anlam sınıfıyla uyuşmuyor.`});
        }
      }
    }
    return warnings;
  }

  function contradictionWarnings(text,tokens) {
    const warnings = [];
    const clauses = new Map();
    for (const token of tokens) {
      if (!clauses.has(token.clause)) clauses.set(token.clause,[]);
      clauses.get(token.clause).push(token);
    }
    for (const clauseTokens of clauses.values()) {
      const roots = new Set(clauseTokens.map(token => token.root));
      for (const pair of ANTONYM_PAIRS) {
        const [a,b] = pair.split('|');
        if (!roots.has(a) || !roots.has(b)) continue;
        const first = clauseTokens.find(token => token.root === a || token.root === b);
        const last = [...clauseTokens].reverse().find(token => token.root === a || token.root === b);
        const fragment = text.slice(first.start,last.end);
        const strong = /\bhem\b/iu.test(fragment) || /\b(?:aynı anda|eşzamanlı|eszamanli)\b/iu.test(fragment);
        addUnique(warnings,{start:first.start,end:last.end,rule:'v120-semantic-antonym-contradiction',confidence:strong ? 0.93 : 0.82,category:'semantic',severity:'warning',message:`Aynı yargıda “${a}” ve “${b}” karşıt anlamları birlikte kullanılmış; bağlamı kontrol edin.`});
      }
      const clauseText = text.slice(clauseTokens[0]?.start || 0,clauseTokens.at(-1)?.end || 0);
      if (/\bkesinlikle\b[\s\S]{0,80}\bbelki\b|\bbelki\b[\s\S]{0,80}\bkesinlikle\b/iu.test(clauseText)) {
        addUnique(warnings,{start:clauseTokens[0].start,end:clauseTokens.at(-1).end,rule:'v120-semantic-certainty-conflict',confidence:0.88,category:'semantic',severity:'warning',message:'“Kesinlikle” ve “belki” aynı yargıda farklı kesinlik seviyeleri bildiriyor.'});
      }
    }
    return warnings;
  }

  function collocationIssues(text) {
    const issues = [];
    const rules = [
      [/\bkarar[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'vermek').replace(/yaptı/iu,'verdi').replace(/yaptım/iu,'verdim').replace(/yaptın/iu,'verdin').replace(/yaptık/iu,'verdik').replace(/yaptınız/iu,'verdiniz')],
      [/\bsoru[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'sormak').replace(/yaptı/iu,'sordu').replace(/yaptım/iu,'sordum').replace(/yaptın/iu,'sordun').replace(/yaptık/iu,'sorduk').replace(/yaptınız/iu,'sordunuz')],
      [/\bcevap[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'vermek').replace(/yaptı/iu,'verdi').replace(/yaptım/iu,'verdim').replace(/yaptın/iu,'verdin').replace(/yaptık/iu,'verdik').replace(/yaptınız/iu,'verdiniz')],
      [/\byardım[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'etmek').replace(/yaptı/iu,'etti').replace(/yaptım/iu,'ettim').replace(/yaptın/iu,'ettin').replace(/yaptık/iu,'ettik').replace(/yaptınız/iu,'ettiniz')],
      [/\bteşekkür[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'etmek').replace(/yaptı/iu,'etti').replace(/yaptım/iu,'ettim').replace(/yaptın/iu,'ettin').replace(/yaptık/iu,'ettik').replace(/yaptınız/iu,'ettiniz')],
      [/\bfotoğraf[ \t]+(?:yapmak|yaptı|yaptım|yaptın|yaptık|yaptınız)\b/giu, value => value.replace(/yapmak/iu,'çekmek').replace(/yaptı/iu,'çekti').replace(/yaptım/iu,'çektim').replace(/yaptın/iu,'çektin').replace(/yaptık/iu,'çektik').replace(/yaptınız/iu,'çektiniz')]
    ];
    for (const [re,transform] of rules) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(text))) {
        const replacement = transform(match[0]);
        if (normalize(replacement) === normalize(match[0])) continue;
        issues.push({start:match.index,end:match.index + match[0].length,suggestions:[replacement],rule:'v120-semantic-collocation',confidence:0.94,category:'semantic',message:'Bu ad-fiil birleşimi Türkçede daha doğal bir eşdizimle kullanılır.'});
      }
    }
    return issues;
  }

  function comparativeIssues(text) {
    const issues = [];
    let match;
    const re = /\b(en)[ \t]+(daha)[ \t]+([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{3,})|\b(daha)[ \t]+(en)[ \t]+([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{3,})/giu;
    while ((match = re.exec(text))) {
      const adjective = match[3] || match[6];
      if (!adjective) continue;
      issues.push({start:match.index,end:match.index + match[0].length,suggestions:[`en ${adjective}`,`daha ${adjective}`],rule:'v120-semantic-comparative-stack',confidence:0.96,category:'semantic',message:'“En” ve “daha” aynı sıfat üzerinde birlikte kullanılmamalıdır.'});
    }
    return issues;
  }

  function discourseWarnings(text,tokens,context = {}) {
    const warnings = [];
    const current = normalize(text);
    const previous = normalize(context.previousSentence || '');
    const next = normalize(context.nextSentence || '');
    const future = /\b(?:yarın|öbür gün|gelecek hafta|gelecek ay|gelecek yıl)\b/u;
    const past = /\b(?:dün|evvelsi gün|geçen hafta|geçen ay|geçen yıl)\b/u;
    const hasFuture = future.test(current);
    const hasPast = past.test(current);
    const finiteCount = tokens.filter(finiteVerb).length;
    if (hasFuture && hasPast && finiteCount <= 1) {
      warnings.push({start:0,end:text.length,rule:'v120-semantic-temporal-conflict',confidence:0.88,category:'semantic',severity:'warning',message:'Aynı tek yargıda hem geçmiş hem gelecek zaman belirteci kullanılmış; zaman anlamını kontrol edin.'});
    }
    if (previous && current && future.test(previous) && past.test(current) && /^\s*(?:bu|o|aynı|ayni)\b/u.test(current)) {
      warnings.push({start:0,end:Math.min(text.length,120),rule:'v120-semantic-discourse-time-shift',confidence:0.78,category:'semantic',severity:'warning',message:'Önceki cümledeki gelecek zaman bağlamı bu cümlede geçmişe dönüyor; gönderimi kontrol edin.'});
    }
    if (next && current && past.test(next) && future.test(current) && /^\s*(?:bu|o|aynı|ayni)\b/u.test(normalize(next))) {
      warnings.push({start:0,end:Math.min(text.length,120),rule:'v120-semantic-discourse-time-shift',confidence:0.76,category:'semantic',severity:'warning',message:'Komşu cümleler arasında belirgin bir zaman sıçraması var.'});
    }
    return warnings;
  }

  function analyzeMeaning(rawText,context = {}) {
    const text = String(rawText || '');
    const tokens = enrichClauses(text,tokenize(text,context));
    const fixes = [
      ...quantifierIssues(text,tokens),
      ...caseFrameIssues(tokens),
      ...comparativeIssues(text),
      ...collocationIssues(text)
    ];
    const warnings = [
      ...selectionalWarnings(tokens),
      ...contradictionWarnings(text,tokens),
      ...discourseWarnings(text,tokens,context)
    ];
    const sortedFixes = fixes.map(cleanIssue).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
    const sortedWarnings = warnings.map(cleanIssue).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const known = tokens.filter(token => token.classes.size).length;
    return {
      version:VERSION,
      tokens:tokens.length,
      classifiedTokens:known,
      coverage:tokens.length ? known / tokens.length : 0,
      fixes:sortedFixes,
      warnings:sortedWarnings,
      externalDependencies:0
    };
  }

  function wrappedAnalyzeSentence(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseAnalyzeSentence(text,context) || [];
    const semantic = context.semantic === false ? {fixes:[]} : analyzeMeaning(text,context);
    const out = [];
    const seen = new Set();
    for (const issue of [...base,...semantic.fixes]) {
      if (!issue?.suggestions?.length || issue.end < issue.start) continue;
      const key = `${issue.start}:${issue.end}:${issue.suggestions[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  engine.version = VERSION;
  engine.analyzeMeaning = analyzeMeaning;
  engine.analyzeSentence = wrappedAnalyzeSentence;
  engine.semanticClassesFor = value => [...classesForRoot(value)];
  engine.semanticCompatibility = (value,allowed) => compatible(classesForRoot(value),Array.isArray(allowed) ? allowed : [allowed]);
  engine.stats = {
    ...(engine.stats || {}),
    semanticLayer:'v120-local-symbolic-context',
    semanticLexicon:LEXICAL_CLASSES.size,
    semanticVerbFrames:VERB_FRAMES.size,
    semanticCaseFrames:CASE_FRAMES.size + COMPOUND_CASE_FRAMES.size,
    semanticAntonymPairs:ANTONYM_PAIRS.size,
    semanticExternalModel:0,
    externalDependencies:0
  };

  if (typeof document === 'undefined') return;

  const config = document.getElementById('wtsc-config')?.dataset || {};
  const semanticEnabled = !['0','false','off','no'].includes(String(config.semantic ?? '1').toLowerCase());
  const sensitivity = Math.max(0.7,Math.min(0.99,Number(config.semanticSensitivity || 88) / 100));
  if (!semanticEnabled) return;

  const states = new WeakMap();

  function editorText(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value || '';
    if (el instanceof HTMLElement && el.isContentEditable) return el.innerText || el.textContent || '';
    return '';
  }

  function protectedRanges(text) {
    return window.WarextTextCoreV110?.protectedRanges?.(text) || [];
  }

  function panelAnchor(el) {
    if (el instanceof HTMLElement && el.isContentEditable) return el.closest('.fr-box') || el;
    return el.closest?.('.inputGroup') || el;
  }

  function ensurePanel(el) {
    const state = states.get(el);
    if (state?.panel?.isConnected) return state.panel;
    const anchor = panelAnchor(el);
    if (!anchor) return null;
    const panel = document.createElement('div');
    panel.className = 'wtsc-semantic-panel';
    panel.hidden = true;
    anchor.insertAdjacentElement('afterend',panel);
    return panel;
  }

  function installStyle() {
    if (document.getElementById('wtsc-semantic-style-v120')) return;
    const style = document.createElement('style');
    style.id = 'wtsc-semantic-style-v120';
    style.textContent = '.wtsc-semantic-panel{margin:6px 0 3px;padding:8px 10px;border:1px solid rgba(190,140,40,.42);border-radius:8px;background:rgba(190,140,40,.07);font-size:12px;line-height:1.35}.wtsc-semantic-panel[hidden]{display:none}.wtsc-semantic-item+ .wtsc-semantic-item{margin-top:5px;padding-top:5px;border-top:1px solid rgba(127,127,127,.14)}.wtsc-semantic-title{font-weight:650;margin-right:5px}';
    document.head.appendChild(style);
  }

  function renderWarnings(el,warnings) {
    const state = states.get(el);
    const panel = state?.panel;
    if (!panel) return;
    panel.textContent = '';
    const visible = (warnings || []).filter(item => (item.confidence || 0) >= sensitivity).slice(0,3);
    if (!visible.length) {
      panel.hidden = true;
      return;
    }
    for (const warning of visible) {
      const row = document.createElement('div');
      row.className = 'wtsc-semantic-item';
      const title = document.createElement('span');
      title.className = 'wtsc-semantic-title';
      title.textContent = 'Anlam denetimi:';
      const text = document.createElement('span');
      text.textContent = warning.message || 'Cümlede olası bir anlam uyumsuzluğu var.';
      row.append(title,text);
      panel.appendChild(row);
    }
    panel.hidden = false;
  }

  function analyzeElement(el) {
    const text = editorText(el);
    if (!text.trim() || text.length > 60000) {
      renderWarnings(el,[]);
      return;
    }
    const job = () => {
      const result = analyzeMeaning(text,{protectedRanges:protectedRanges(text),longText:text.length >= 700});
      renderWarnings(el,result.warnings);
    };
    if (typeof requestIdleCallback === 'function' && text.length > 1000) requestIdleCallback(job,{timeout:700});
    else job();
  }

  function attach(el) {
    if (!el || states.has(el)) return;
    if (el instanceof HTMLTextAreaElement && el.parentElement?.querySelector?.('.fr-box .fr-element[contenteditable="true"]')) return;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable))) return;
    const panel = ensurePanel(el);
    if (!panel) return;
    let timer = 0;
    const schedule = delay => {
      clearTimeout(timer);
      timer = window.setTimeout(() => analyzeElement(el),delay);
    };
    states.set(el,{panel,schedule});
    el.addEventListener('input',() => schedule(650),{passive:true});
    el.addEventListener('focus',() => schedule(180),{passive:true});
    schedule(300);
  }

  function scan(root = document) {
    if (root instanceof Element && root.matches?.('.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]')) attach(root);
    root.querySelectorAll?.('.fr-element[contenteditable="true"],textarea[name="message"],input[name="title"]').forEach(attach);
  }

  function boot() {
    installStyle();
    scan(document);
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) scan(node);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
