(() => {
  'use strict';

  if (window.__warextKnowledgeV200) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning || !engine?.analyzeSentence || !engine?.analyzeMorphology) return;
  window.__warextKnowledgeV200 = true;

  const VERSION = '2.0.0';
  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const morphology = engine.analyzeMorphology.bind(engine);
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const CASE_MAP = new Map([['Dat','dative'],['Acc','accusative'],['Loc','locative'],['Abl','ablative'],['Gen','genitive'],['Ins','instrumental']]);
  const PRONOUNS = new Set(['o','onu','ona','ondan','onda','onun','bu','bunu','buna','bundan','bunda','bunun','şu','şunu','şuna','şundan','şunda','şunun','kendisi','kendini','kendisine','kendinden']);
  const HUMAN_PRONOUNS = new Set(['ben','beni','bana','benden','sen','seni','sana','senden','biz','bizi','bize','bizden','siz','sizi','size','sizden','kim','kimi','kime']);
  const NEGATIONS = new Set(['değil','degil','yok','hiç','hic','asla','kesinlikle','yalnızca','yalnizca','sadece','her','bütün','butun','bazı','bazi','hiçbir','hicbir']);
  const TRANSITIONS = new Set(['ama','ancak','fakat','oysa','oysaki','artık','artik','şimdi','simdi','sonra','ardından','ardindan','önce','once','yeniden','tekrar','sonradan']);
  const CAUSE = ['çünkü','cunku','zira','nedeniyle','sebebiyle','-den dolayı','-dan dolayı'];
  const RESULT = ['bu yüzden','bu yuzden','dolayısıyla','dolayisiyla','sonuç olarak','sonuc olarak','bu sebeple','bu nedenle'];
  const CONDITION = ['eğer','eger','şayet','sayet','ise','-se','-sa'];
  const CONCESSION = ['rağmen','ragmen','karşın','karsin','buna rağmen','buna ragmen'];
  const TIME_PAST = new Set(['dün','dun','önce','once','geçen','gecen','az önce','az once']);
  const TIME_FUTURE = new Set(['yarın','yarin','sonra','gelecek','birazdan']);

  const PARENTS = new Map([
    ['human',['animate','physical','entity']],['animal',['animate','physical','entity']],['animate',['living','physical','entity']],['plant',['living','physical','entity']],['living',['physical','entity']],
    ['food',['consumable','physical','entity']],['beverage',['liquid','consumable','physical','entity']],['medicine',['consumable','physical','entity']],['liquid',['physical','entity']],
    ['text',['readable','information','entity']],['document',['text','readable','information','entity']],['message',['text','communication','information','digital','entity']],['code',['text','information','digital','entity']],
    ['software',['digital','entity']],['service',['digital','entity']],['network',['digital','entity']],['file',['digital','entity']],['data',['information','digital','entity']],['media',['digital','entity']],
    ['device',['tool','physical','entity']],['vehicle',['tool','physical','entity']],['tool',['physical','entity']],['clothing',['physical','entity']],['container',['physical','entity']],['place',['physical','entity']],
    ['organization',['social','abstract','entity']],['profession',['human','social','entity']],['language',['information','abstract','entity']],['money',['abstract','entity']],['time',['abstract','entity']],
    ['emotion',['abstract','entity']],['event',['abstract','entity']],['state',['abstract','entity']],['concept',['abstract','entity']],['information',['abstract','entity']],['communication',['information','abstract','entity']],
    ['abstract',['entity']],['physical',['entity']],['digital',['entity']],['social',['abstract','entity']]
  ]);

  const GRAPH = new Map();
  const CLASSES = new Map();
  const PROPERTIES = new Map();

  function expand(values) {
    const out = new Set(values || []);
    const queue = [...out];
    while (queue.length) {
      const value = queue.shift();
      for (const parent of PARENTS.get(value) || []) if (!out.has(parent)) { out.add(parent); queue.push(parent); }
    }
    return out;
  }

  function addClass(classes, words) {
    for (const raw of words) {
      const word = normalize(raw);
      if (!CLASSES.has(word)) CLASSES.set(word,new Set());
      for (const cls of classes) CLASSES.get(word).add(cls);
    }
  }

  function addProperty(property, words) {
    for (const raw of words) {
      const word = normalize(raw);
      if (!PROPERTIES.has(word)) PROPERTIES.set(word,new Set());
      PROPERTIES.get(word).add(property);
    }
  }

  function addEdge(subject,predicate,object) {
    const key = normalize(subject);
    if (!GRAPH.has(key)) GRAPH.set(key,[]);
    GRAPH.get(key).push({predicate,object:normalize(object)});
  }

  addClass(['human'],['insan','kişi','adam','kadın','erkek','çocuk','bebek','öğrenci','öğretmen','doktor','mühendis','oyuncu','kullanıcı','üye','yönetici','moderatör','arkadaş','anne','baba','kardeş','müşteri','satıcı','alıcı','yazar','okur','geliştirici','programcı','işçi','çalışan','patron','misafir','komşu','polis','asker','şoför','sürücü','sunucu','hakem','avukat','mimar','eczacı','hemşire','gazeteci','editör','tasarımcı','araştırmacı','uzman','teknisyen']);
  addClass(['animal'],['kedi','köpek','kuş','at','inek','koyun','keçi','balık','aslan','kaplan','ayı','kurt','tavşan','fare','tavuk','horoz','ördek','kaz','yılan','arı','sinek','kartal','güvercin','yunus','balina']);
  addClass(['food'],['yemek','ekmek','et','tavuk','balık','elma','armut','muz','portakal','çilek','pizza','hamburger','makarna','pilav','çorba','salata','peynir','yoğurt','yumurta','pasta','kek','bisküvi','çikolata','meyve','sebze','patates','domates','çekirdek','pirinç','bulgur','mercimek','fasulye']);
  addClass(['beverage'],['su','çay','kahve','süt','ayran','kola','gazoz','limonata','içecek','meyve suyu','şerbet']);
  addClass(['medicine'],['ilaç','antibiyotik','tablet','kapsül','şurup','aşı','vitamin']);
  addClass(['text'],['kitap','roman','hikâye','hikaye','makale','yazı','metin','rehber','belge','doküman','sayfa','paragraf','cümle','şiir','gazete','dergi','rapor','sözleşme','lisans','README']);
  addClass(['message'],['mesaj','yorum','gönderi','konu','başlık','bildirim','eposta','mail','e-posta','yanıt','cevap']);
  addClass(['code'],['kod','kaynak','script','betik','fonksiyon','sınıf','class','metot','method','sorgu','sql','json','xml','html','css','javascript','php','java','python','komut','regex','api']);
  addClass(['software'],['uygulama','program','yazılım','eklenti','plugin','mod','modül','paket','sürüm','işletim','sistem','minecraft','xenforo','android','çekirdek','sürücü','istemci','terminal','paper','velocity','fabric','forge']);
  addClass(['service'],['sunucu','api','servis','hizmet','site','forum','discord','github','gitlab','veritabanı','proxy','cdn']);
  addClass(['network'],['ağ','internet','ethernet','wifi','wi-fi','lan','wan','vpn','dns','tcp','udp','port','bağlantı','socket','ip']);
  addClass(['file'],['dosya','arşiv','zip','jar','apk','pdf','görsel','resim','fotoğraf','video','yedek','klasör','dizin']);
  addClass(['data'],['veri','kayıt','tablo','veritabanı','log','önbellek','hücre','alan','değer','anahtar','satır','kolon','indeks']);
  addClass(['media'],['video','film','dizi','görüntü','fotoğraf','resim','ekran','yayın','klip','grafik','müzik','şarkı','ses','podcast','radyo']);
  addClass(['device'],['telefon','bilgisayar','laptop','sunucu','modem','router','klavye','fare','ekran','monitör','işlemci','gpu','cpu','disk','ssd','hdd','kamera','mikrofon','kulaklık','terminal','yazıcı','tarayıcı']);
  addClass(['vehicle'],['araba','otomobil','otobüs','kamyon','tren','uçak','gemi','tekne','bisiklet','motosiklet','motor','taksi','metro','tramvay']);
  addClass(['clothing'],['elbise','gömlek','pantolon','ceket','mont','kazak','ayakkabı','çorap','şapka','forma','etek','kravat']);
  addClass(['place'],['ev','okul','iş','ofis','şehir','ülke','oda','salon','mutfak','bahçe','park','hastane','market','mağaza','dünya','köy','sokak','cadde','liman','terminal','alan','kanal','sunucu odası']);
  addClass(['container'],['kutu','şişe','bardak','fincan','çanta','dolap','çekmece','kasa','paket','kap','kavanoz']);
  addClass(['organization'],['şirket','kurum','üniversite','okul','bakanlık','belediye','takım','ekip','topluluk','firma','vakıf','dernek','stüdyo']);
  addClass(['money'],['para','bakiye','kredi','ücret','fiyat','maaş','gelir','borç','tl','dolar','euro','coin']);
  addClass(['time'],['zaman','gün','hafta','ay','yıl','saat','dakika','saniye','tarih','yaz','kış','bahar','dün','yarın','bugün']);
  addClass(['emotion'],['mutluluk','üzüntü','korku','öfke','sevgi','nefret','heyecan','endişe','kaygı','sevinç']);
  addClass(['concept'],['fikir','düşünce','plan','amaç','hedef','sorun','hata','özellik','ayar','kural','anlam','neden','sonuç','ihtimal','olasılık','karar','tercih','öneri','tavsiye','yardım','özür','mantık','bağlam']);
  addClass(['language'],['türkçe','ingilizce','almanca','fransızca','ispanyolca','arapça','rusça','italyanca','dil']);

  addProperty('edible',['yemek','ekmek','et','tavuk','balık','elma','armut','muz','pizza','makarna','pilav','çorba','salata','peynir','yoğurt','yumurta','pasta','kek']);
  addProperty('drinkable',['su','çay','kahve','süt','ayran','kola','gazoz','limonata','içecek']);
  addProperty('readable',['kitap','roman','hikâye','makale','yazı','metin','rehber','belge','doküman','mesaj','yorum','kod','rapor']);
  addProperty('runnable',['uygulama','program','yazılım','eklenti','script','kod','sunucu','servis']);
  addProperty('installable',['uygulama','program','yazılım','eklenti','plugin','mod','paket','sürücü']);
  addProperty('openable',['dosya','klasör','uygulama','program','kapı','pencere','kutu','paket','site','sayfa']);
  addProperty('downloadable',['dosya','arşiv','zip','jar','apk','pdf','video','görsel','paket','eklenti']);
  addProperty('sendable',['mesaj','dosya','veri','e-posta','yorum','bildirim','paket']);
  addProperty('wearable',['elbise','gömlek','pantolon','ceket','mont','kazak','ayakkabı','çorap','şapka','forma']);
  addProperty('driveable',['araba','otomobil','otobüs','kamyon','motosiklet','taksi']);

  for (const word of ['kitap','makale','roman','rapor']) { addEdge(word,'can','read'); addEdge(word,'is','text'); }
  for (const word of ['su','çay','kahve','süt']) { addEdge(word,'can','drink'); addEdge(word,'is','beverage'); }
  for (const word of ['araba','otomobil','otobüs','kamyon']) { addEdge(word,'can','drive'); addEdge(word,'is','vehicle'); }
  for (const word of ['dosya','zip','jar','apk','pdf']) { addEdge(word,'can','open'); addEdge(word,'can','delete'); addEdge(word,'can','download'); addEdge(word,'is','file'); }
  for (const word of ['sunucu','servis','site','forum']) { addEdge(word,'can','online'); addEdge(word,'can','offline'); addEdge(word,'is','service'); }
  for (const word of ['program','uygulama','yazılım','eklenti']) { addEdge(word,'can','run'); addEdge(word,'can','install'); addEdge(word,'is','software'); }

  const FRAMES = new Map();
  function frame(roots,subject,object,cases = {}) { for (const root of roots) FRAMES.set(normalize(root),{subject,object,...cases}); }
  frame(['iç','ic'],['animate'],['beverage','liquid']);
  frame(['ye'],['animate'],['food','consumable']);
  frame(['oku'],['human'],['readable','text','document','message','code']);
  frame(['yaz'],['human'],['text','message','code','document']);
  frame(['izle'],['human'],['media']);
  frame(['dinle'],['human'],['media','human']);
  frame(['giy'],['human'],['clothing']);
  frame(['sür','sur'],['human'],['vehicle']);
  frame(['kullan'],['human'],['tool','device','software','vehicle','file','service'],{objectCase:'accusative'});
  frame(['yükle','yukle'],['human'],['file','software','data']);
  frame(['indir'],['human'],['file','software','data']);
  frame(['sil'],['human'],['file','software','data','message','text']);
  frame(['kopyala'],['human'],['file','data','text','code']);
  frame(['taşı','tasi'],['human','vehicle'],['physical','file','data']);
  frame(['gönder','gonder'],['human','organization'],['message','file','data','physical']);
  frame(['kur'],['human','organization'],['software','service','network','device','physical']);
  frame(['güncelle','guncelle'],['human'],['software','file','data','device']);
  frame(['yenile'],['human'],['software','file','data','document','service']);
  frame(['aç','ac'],['human','software'],['file','software','device','service','container','physical','place']);
  frame(['kapat'],['human','software'],['file','software','device','service','container','physical','place']);
  frame(['bağlan','baglan'],['human','device','software'],['service','network','device'],{objectCase:'dative'});
  frame(['eriş','eris'],['human','software'],['service','file','data','device','place'],{objectCase:'dative'});
  frame(['tıkla','tikla'],['human'],['digital','software','text','device']);
  frame(['sat'],['human','organization'],['physical','software','service','file']);
  frame(['satın al','satin al'],['human','organization'],['physical','software','service','file']);
  frame(['öde','ode'],['human','organization'],['money']);
  frame(['pişir','pisir'],['human'],['food']);
  frame(['kokla'],['animate'],['food','beverage','plant','physical']);
  frame(['park et'],['human'],['vehicle']);
  frame(['sürükle','surukle'],['human'],['physical','file','software']);
  frame(['tak'],['human'],['clothing','device','tool','physical']);
  frame(['çıkar','cikar'],['human'],['clothing','device','tool','physical','file']);
  frame(['ara'],['human'],['human','organization','information','file'],{objectCase:'accusative'});
  frame(['bekle'],['animate'],['human','event','vehicle'],{objectCase:'accusative'});
  frame(['ziyaret et'],['human'],['human','place','organization']);
  frame(['sev'],['animate'],['animate','food','place','abstract','media','software']);
  frame(['nefret et'],['animate'],['animate','abstract'],{objectCase:'ablative'});
  frame(['kork'],['animate'],['animate','event','abstract','physical'],{objectCase:'ablative'});
  frame(['hoşlan','hoslan'],['animate'],['animate','abstract','place','media'],{objectCase:'ablative'});
  frame(['vazgeç','vazgec'],['human'],['abstract','event','physical'],{objectCase:'ablative'});
  frame(['bahset'],['human'],['entity'],{objectCase:'ablative'});
  frame(['inan'],['human'],['human','abstract','information'],{objectCase:'dative'});
  frame(['güven','guven'],['human'],['human','organization','service'],{objectCase:'dative'});
  frame(['katıl','katil'],['human'],['event','organization','abstract'],{objectCase:'dative'});
  frame(['ulaş','ulas'],['human','vehicle','information'],['human','place','service','information'],{objectCase:'dative'});
  frame(['yaklaş','yaklas'],['animate','vehicle'],['human','place','physical'],{objectCase:'dative'});
  frame(['başvur','basvur'],['human'],['organization','service'],{objectCase:'dative'});
  frame(['bak'],['animate'],['physical','human','place','media'],{objectCase:'dative'});
  frame(['konuş','konus'],['human'],['human','abstract'],{objectCase:'instrumental'});
  frame(['anlat'],['human'],['information','event','text']);
  frame(['söyle','soyle'],['human'],['information','text','message']);
  frame(['sor'],['human'],['information','human']);
  frame(['cevapla'],['human'],['message','human']);
  frame(['öğren','ogren'],['human'],['information','language','text']);
  frame(['öğret','ogret'],['human'],['information','language','text']);
  frame(['anla'],['human'],['information','text','message','code']);
  frame(['düşün','dusun'],['human'],['abstract','information']);
  frame(['hatırla','hatirla'],['human'],['event','information','human']);
  frame(['unut'],['human'],['event','information','physical']);
  frame(['çöz','coz'],['human'],['abstract','code','information']);
  frame(['derle'],['human','software'],['code','software']);
  frame(['kodla'],['human'],['code','software']);
  frame(['programla'],['human'],['software','device']);
  frame(['çalıştır','calistir'],['human','software'],['software','code','device','vehicle']);
  frame(['durdur'],['human','software'],['software','service','device','vehicle']);
  frame(['başlat','baslat'],['human','software'],['software','service','device','event']);
  frame(['yeniden başlat','yeniden baslat'],['human','software'],['software','service','device']);
  frame(['kaydet'],['human','software'],['file','data','document','message']);
  frame(['açıkla','acikla'],['human'],['information','abstract','event']);
  frame(['onayla'],['human'],['document','message','event','abstract']);
  frame(['reddet'],['human'],['document','message','event','abstract']);
  frame(['paylaş','paylas'],['human'],['file','data','message','text','media']);
  frame(['oluştur','olustur'],['human','software'],['file','data','document','software','abstract']);
  frame(['düzenle','duzenle'],['human'],['file','text','document','data','software']);
  frame(['kontrol et'],['human','software'],['file','data','device','software','service','text']);
  frame(['test et'],['human'],['software','code','device','service']);
  frame(['doğrula','dogrula'],['human','software'],['data','file','information','document']);
  frame(['karşılaştır','karsilastir'],['human','software'],['entity']);
  frame(['ölç','olc'],['human','device'],['physical','data','time']);
  frame(['hesapla'],['human','software'],['data','money','time','abstract']);
  frame(['say'],['human','software'],['physical','data','entity']);
  frame(['gör','gor'],['animate'],['physical','human','media','event']);
  frame(['duy'],['animate'],['media','human','event']);
  frame(['dokun'],['animate'],['physical','human'],{objectCase:'dative'});
  frame(['tut'],['animate'],['physical']);
  frame(['bırak','birak'],['animate'],['physical','abstract']);
  frame(['al'],['human'],['physical','file','data','money','service']);
  frame(['ver'],['human','organization'],['physical','file','data','money','information']);
  frame(['getir'],['human','vehicle'],['physical','file','data']);
  frame(['götür','gotur'],['human','vehicle'],['physical','human']);
  frame(['açıl','acil'],['file','software','service','device','container','physical'],null);
  frame(['kapan'],['software','service','device','container','physical'],null);
  frame(['çök','cok'],['software','service','physical'],null);
  frame(['don'],['software','device','liquid'],null);
  frame(['bozul'],['physical','device','software','service'],null);
  frame(['çalış','calis'],['human','software','service','device'],null);
  frame(['koş','kos'],['animate'],null);
  frame(['uyu'],['animate'],null);
  frame(['acık','acik'],['animate'],null);
  frame(['susa'],['animate'],null);
  frame(['ağla','agla'],['animate'],null);
  frame(['gül','gul'],['animate'],null);
  frame(['havla'],['animal'],null);
  frame(['miyavla'],['animal'],null);

  const IDIOM_HINTS = new Set(['göz at','goz at','kulak ver','el at','kafayı ye','kafayi ye','kafayı tak','kafayi tak','etekleri zil çal','etekleri zil cal','ağzından kaçır','agzindan kacir','gözden düş','gozden dus','yola koyul','yüz ver','yuz ver','dil dök','dil dok','baş kaldır','bas kaldir','elinden gel','içine sin','icine sin','ipleri kopar','pabucu dama at','yük ol','yuk ol','başına gel','basina gel','can at','göz kulak ol','goz kulak ol','aklına gel','aklina gel','burnundan getir','ayağa kalk','ayaga kalk']);

  function classesFor(root) {
    const direct = CLASSES.get(normalize(root));
    return direct ? expand(direct) : new Set();
  }

  function compatible(classes,allowed) {
    if (!allowed || !allowed.length || !classes || !classes.size) return true;
    for (const value of allowed) if (classes.has(value)) return true;
    return false;
  }

  function caseOf(token) {
    const features = token.morphology?.features || {};
    const raw = features.case || features.Case || '';
    return CASE_MAP.get(raw) || normalize(raw);
  }

  function tokensOf(text,context = {}) {
    const re = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,16})?`,'gu');
    const protectedRanges = context.protectedRanges || [];
    const tokens = [];
    let match;
    while ((match = re.exec(String(text || '')))) {
      const start = match.index;
      const end = start + match[0].length;
      if (protectedRanges.some(range => range.start < end && range.end > start)) continue;
      const raw = match[0];
      const m = morphology(raw) || null;
      let root = normalize(m?.root || raw.replace(/['’].*$/u,''));
      if (!CLASSES.has(root)) {
        const surface = normalize(raw.replace(/['’].*$/u,''));
        if (CLASSES.has(surface)) root = surface;
      }
      tokens.push({raw,root,start,end,morphology:m,classes:classesFor(root),case:caseOf({morphology:m}),sentence:0,clause:0});
    }
    let sentence = 0;
    let clause = 0;
    let cursor = 0;
    for (const token of tokens) {
      while (cursor < token.start) {
        const ch = text[cursor++];
        if (/[;:\n]/u.test(ch)) clause++;
        if (/[.!?\n]/u.test(ch)) { sentence++; clause++; }
      }
      token.sentence = sentence;
      token.clause = clause;
    }
    return tokens;
  }

  function finite(token) {
    if (!token) return false;
    if (token.morphology?.valid && token.morphology?.mode === 'verb') return true;
    if (FRAMES.has(token.root)) return /(?:dı|di|du|dü|tı|ti|tu|tü|yor|acak|ecek|mış|miş|muş|müş|malı|meli|sa|se|ar|er|ır|ir|ur|ür)(?:m|n|k|ız|iz|uz|üz|sınız|siniz|sunuz|sünüz|lar|ler)?$/u.test(normalize(token.raw));
    return false;
  }

  function predicateRoot(token) {
    if (!token) return '';
    if (FRAMES.has(token.root)) return token.root;
    const surface = normalize(token.raw);
    const keys = [...FRAMES.keys()].sort((a,b) => b.length - a.length);
    for (const key of keys) if (surface === key || (surface.startsWith(key) && surface.length >= key.length + 2)) return key;
    return token.root;
  }

  function parseDependencies(text,context = {}) {
    const tokens = tokensOf(text,context);
    const sentences = [];
    const maxSentence = tokens.reduce((m,t) => Math.max(m,t.sentence),0);
    for (let sid = 0; sid <= maxSentence; sid++) {
      const list = tokens.filter(t => t.sentence === sid);
      if (!list.length) continue;
      let predicateIndex = -1;
      for (let i = list.length - 1; i >= 0; i--) if (finite(list[i])) { predicateIndex = i; break; }
      if (predicateIndex < 0) continue;
      const predicate = list[predicateIndex];
      let subject = null;
      let object = null;
      const complements = [];
      for (let i = predicateIndex - 1; i >= 0; i--) {
        const token = list[i];
        if (PRONOUNS.has(token.root) || HUMAN_PRONOUNS.has(token.root)) {
          if (!subject && !token.case) subject = token;
          else complements.unshift(token);
          continue;
        }
        if (token.case === 'accusative' && !object) { object = token; continue; }
        if (['dative','ablative','locative','instrumental','genitive'].includes(token.case)) { complements.unshift(token); continue; }
        if (!subject && token.classes.size && !finite(token)) { subject = token; break; }
      }
      if (!object) {
        for (let i = predicateIndex - 1; i >= 0; i--) {
          const token = list[i];
          if (token === subject || finite(token) || token.case) continue;
          if (token.classes.size) { object = token; break; }
        }
      }
      sentences.push({sentence:sid,predicate:{...predicate,root:predicateRoot(predicate)},subject,object,complements,tokens:list});
    }
    return {version:VERSION,tokens,sentences};
  }

  function overlap(a,b) { return !!a && !!b && a.start < b.end && a.end > b.start; }

  function idiomRanges(text) {
    const normalized = normalize(text);
    const out = [];
    const external = window.WarextIdiomsV200;
    if (external?.find) {
      for (const item of external.find(text) || []) out.push(item);
    }
    for (const phrase of IDIOM_HINTS) {
      let at = normalized.indexOf(phrase);
      while (at >= 0) { out.push({start:at,end:at + phrase.length,phrase}); at = normalized.indexOf(phrase,at + 1); }
    }
    return out;
  }

  function frameWarnings(text,parse) {
    const warnings = [];
    const idioms = idiomRanges(text);
    for (const sentence of parse.sentences) {
      const frame = FRAMES.get(sentence.predicate.root);
      if (!frame) continue;
      const span = {start:sentence.tokens[0].start,end:sentence.tokens.at(-1).end};
      if (idioms.some(range => overlap(range,span))) continue;
      if (sentence.subject && frame.subject && !compatible(sentence.subject.classes,frame.subject)) warnings.push({start:sentence.subject.start,end:sentence.predicate.end,rule:'v200-semantic-subject-frame',confidence:0.955,category:'semantic',severity:'warning',message:`“${sentence.subject.raw}” öznesi ile “${sentence.predicate.raw}” yüklemi arasında güçlü bir anlam uyumsuzluğu var.`});
      if (sentence.object && frame.object && !compatible(sentence.object.classes,frame.object)) warnings.push({start:sentence.object.start,end:sentence.predicate.end,rule:'v200-semantic-object-frame',confidence:0.95,category:'semantic',severity:'warning',message:`“${sentence.object.raw}” nesnesi “${sentence.predicate.raw}” yüklemiyle doğal bir anlam ilişkisi kurmuyor.`});
      if (frame.objectCase) {
        const complement = sentence.object || sentence.complements.at(-1);
        if (complement && complement.case && complement.case !== frame.objectCase) warnings.push({start:complement.start,end:sentence.predicate.end,rule:'v200-semantic-valency-case',confidence:0.91,category:'semantic',severity:'warning',message:`“${sentence.predicate.raw}” yüklemi bu tamlayıcıyla genellikle ${frame.objectCase} hâlini bekliyor.`});
      }
    }
    return warnings;
  }

  function resolveCoreference(text,parse,context = {}) {
    const resolved = [];
    const memory = [];
    const previousText = String(context.previousSentence || '');
    if (previousText) {
      const prev = parseDependencies(previousText,{});
      for (const s of prev.sentences) for (const item of [s.subject,s.object]) if (item?.classes?.size) memory.push({root:item.root,raw:item.raw,classes:item.classes,source:'previous'});
    }
    for (const sentence of parse.sentences) {
      for (const token of sentence.tokens) {
        if (PRONOUNS.has(token.root)) {
          let best = null;
          for (let i = memory.length - 1; i >= 0; i--) {
            const candidate = memory[i];
            let score = 1;
            if (token.case && candidate.classes.has('entity')) score += 1;
            if (sentence.predicate.root && FRAMES.has(sentence.predicate.root)) {
              const f = FRAMES.get(sentence.predicate.root);
              const target = token === sentence.subject ? f.subject : f.object;
              if (target && compatible(candidate.classes,target)) score += 3;
            }
            if (!best || score > best.score) best = {candidate,score};
          }
          if (best && best.score >= 2) resolved.push({pronoun:token.raw,start:token.start,end:token.end,antecedent:best.candidate.raw,root:best.candidate.root,confidence:Math.min(0.96,0.58 + best.score * 0.08)});
        }
      }
      for (const item of [sentence.subject,sentence.object]) if (item?.classes?.size && !PRONOUNS.has(item.root)) memory.push({root:item.root,raw:item.raw,classes:item.classes,source:'current'});
    }
    return resolved;
  }

  function namedEntities(text,parse) {
    const out = [];
    const local = window.WarextEntitiesV200;
    const words = parse.tokens;
    for (const token of words) {
      const canonical = token.raw.replace(/['’].*$/u,'');
      const isCapital = /^[A-ZÇĞİÖŞÜ]/u.test(canonical);
      const location = local?.has?.(canonical) || local?.has?.(token.root);
      const tech = ['xenforo','minecraft','discord','github','gitlab','paper','velocity','fabric','forge','java','php','mysql','mariadb','linux','windows','android','ios'].includes(token.root);
      if (location) out.push({text:canonical,start:token.start,end:token.start + canonical.length,type:'location',confidence:0.98});
      else if (tech) out.push({text:canonical,start:token.start,end:token.start + canonical.length,type:'technology',confidence:0.98});
      else if (isCapital && token.start > 0) out.push({text:canonical,start:token.start,end:token.start + canonical.length,type:'proper',confidence:0.78});
    }
    return out;
  }

  function timeline(text,parse) {
    const events = [];
    const normalized = normalize(text);
    for (const sentence of parse.sentences) {
      const slice = normalize(text.slice(sentence.tokens[0].start,sentence.tokens.at(-1).end));
      let anchor = 'unknown';
      if ([...TIME_PAST].some(word => slice.includes(word))) anchor = 'past';
      if ([...TIME_FUTURE].some(word => slice.includes(word))) anchor = anchor === 'past' ? 'mixed' : 'future';
      const m = sentence.predicate.morphology;
      const tense = normalize(m?.features?.tense || m?.features?.Tense || '');
      events.push({sentence:sentence.sentence,predicate:sentence.predicate.root,anchor,tense,start:sentence.tokens[0].start,end:sentence.tokens.at(-1).end});
    }
    const warnings = [];
    for (const event of events) if (event.anchor === 'mixed') warnings.push({start:event.start,end:event.end,rule:'v200-discourse-time-anchor',confidence:0.91,category:'semantic',severity:'warning',message:'Aynı olay anlatımında geçmiş ve gelecek zaman çapaları çakışıyor.'});
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const cur = events[i];
      const between = normalized.slice(prev.end,cur.end);
      if (prev.anchor === 'future' && cur.anchor === 'past' && ![...TRANSITIONS].some(x => between.includes(x))) warnings.push({start:cur.start,end:cur.end,rule:'v200-discourse-event-order',confidence:0.82,category:'semantic',severity:'warning',message:'Olay sırası gelecekten geçmişe açıklamasız dönüyor; zaman akışını kontrol edin.'});
    }
    return {events,warnings};
  }

  function connectorWarnings(text) {
    const n = normalize(text);
    const warnings = [];
    const causeCount = CAUSE.filter(x => n.includes(x.replace(/^-/,''))).length;
    const resultCount = RESULT.filter(x => n.includes(x)).length;
    const conditionCount = CONDITION.filter(x => n.includes(x.replace(/^-/,''))).length;
    if (causeCount > 1 && ![...TRANSITIONS].some(x => n.includes(x))) warnings.push({start:0,end:Math.min(text.length,180),rule:'v200-discourse-cause-stack',confidence:0.84,category:'semantic',severity:'warning',message:'Aynı yargıda birden fazla neden bağlacı üst üste kullanılıyor.'});
    if (resultCount > 1 && ![...TRANSITIONS].some(x => n.includes(x))) warnings.push({start:0,end:Math.min(text.length,180),rule:'v200-discourse-result-stack',confidence:0.84,category:'semantic',severity:'warning',message:'Aynı yargıda birden fazla sonuç bağlacı üst üste kullanılıyor.'});
    if (conditionCount && !/(?:ise|sa|se|olursa|olmasa|olmazsa|olacaksa|yaparsa|gelirse|giderse)/u.test(n)) warnings.push({start:0,end:Math.min(text.length,180),rule:'v200-discourse-incomplete-condition',confidence:0.78,category:'semantic',severity:'warning',message:'Koşul bağlacı var ancak belirgin bir koşul yüklemi bulunamadı.'});
    if (CONCESSION.some(x => n.includes(x)) && !/(?:ama|ancak|fakat|yine|gene|de|da)/u.test(n)) warnings.push({start:0,end:Math.min(text.length,180),rule:'v200-discourse-concession',confidence:0.76,category:'semantic',severity:'warning',message:'Karşıtlık bildiren yapı eksik veya belirsiz görünüyor.'});
    return warnings;
  }

  function negationReport(text,parse) {
    const scopes = [];
    const warnings = [];
    for (const sentence of parse.sentences) {
      const list = sentence.tokens;
      for (let i = 0; i < list.length; i++) {
        const token = list[i];
        if (!NEGATIONS.has(token.root)) continue;
        const endToken = list[Math.min(list.length - 1,i + 4)];
        scopes.push({operator:token.root,start:token.start,end:endToken.end,sentence:sentence.sentence});
      }
      const roots = new Set(list.map(x => x.root));
      if ((roots.has('herkes') || roots.has('her')) && (roots.has('hiç') || roots.has('hiç kimse') || roots.has('hic'))) warnings.push({start:list[0].start,end:list.at(-1).end,rule:'v200-semantic-quantifier-scope',confidence:0.87,category:'semantic',severity:'warning',message:'Evrensel ve olumsuz niceleyiciler aynı kapsamda kullanılmış; anlamı kontrol edin.'});
      if (roots.has('kesinlikle') && (roots.has('belki') || roots.has('muhtemelen'))) warnings.push({start:list[0].start,end:list.at(-1).end,rule:'v200-semantic-certainty-scope',confidence:0.9,category:'semantic',severity:'warning',message:'Kesinlik ve olasılık ifadeleri aynı yargıda çelişiyor.'});
    }
    return {scopes,warnings};
  }

  function metaphorReport(text,parse) {
    const idioms = idiomRanges(text);
    const metaphors = idioms.map(item => ({start:item.start,end:item.end,phrase:item.phrase || text.slice(item.start,item.end),type:'idiom',confidence:0.98}));
    for (const sentence of parse.sentences) {
      const f = FRAMES.get(sentence.predicate.root);
      if (!f || !sentence.object || !sentence.object.classes.has('abstract')) continue;
      if (['ye','iç','ic','taşı','tasi','tut','at','çek','cek','yut'].includes(sentence.predicate.root)) metaphors.push({start:sentence.object.start,end:sentence.predicate.end,phrase:text.slice(sentence.object.start,sentence.predicate.end),type:'figurative-candidate',confidence:0.72});
    }
    return metaphors;
  }

  function languageModel(text) {
    const model = window.WarextLmV200;
    if (!model?.score) return {score:null,rare:[]};
    try { return model.score(text); } catch (_) { return {score:null,rare:[]}; }
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

  function meaning(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseMeaning(text,context) || {fixes:[],warnings:[]};
    if (context.semantic === false) return base;
    const parse = parseDependencies(text,context);
    const coreferences = resolveCoreference(text,parse,context);
    const entities = namedEntities(text,parse);
    const time = timeline(text,parse);
    const negation = negationReport(text,parse);
    const metaphors = metaphorReport(text,parse);
    const frame = frameWarnings(text,parse);
    const lm = languageModel(text);
    const warnings = unique([...(base.warnings || []),...frame,...time.warnings,...connectorWarnings(text),...negation.warnings]);
    if (lm.score != null && lm.score < 0.16 && text.length >= 18 && parse.tokens.length >= 4) warnings.push({start:0,end:Math.min(text.length,220),rule:'v200-local-language-model',confidence:Math.min(0.86,0.72 + (0.16 - lm.score)),category:'semantic',severity:'warning',message:'Yerel dil modeli bu kelime dizilişini alışılmadık buldu; cümle akışını kontrol edin.'});
    const classified = parse.tokens.filter(t => t.classes.size).length;
    const penalty = warnings.reduce((sum,item) => sum + Math.max(0,Number(item.confidence || 0) - 0.78),0);
    return {
      ...base,
      version:VERSION,
      warnings:unique(warnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      dependencies:parse.sentences.map(s => ({predicate:s.predicate.root,subject:s.subject?.root || '',object:s.object?.root || '',complements:s.complements.map(x => ({root:x.root,case:x.case}))})),
      coreferences,
      entities,
      timeline:time.events,
      negationScopes:negation.scopes,
      metaphors,
      languageModel:lm,
      knowledgeCoverage:parse.tokens.length ? classified / parse.tokens.length : 0,
      coherence:Math.max(0,Math.min(1,1 - penalty / Math.max(5,parse.tokens.length))),
      semanticExternalModel:0,
      externalDependencies:0
    };
  }

  function sentence(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseSentence(text,context) || [];
    if (context.semantic === false) return base;
    const report = meaning(text,context);
    const out = [...base];
    for (const warning of report.warnings || []) if (warning.suggestions?.length) out.push(warning);
    return unique(out).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function relations(word) { return (GRAPH.get(normalize(word)) || []).map(x => ({...x})); }
  function classList(word) { return [...classesFor(word)]; }
  function properties(word) { return [...(PROPERTIES.get(normalize(word)) || [])]; }

  engine.analyzeMeaning = meaning;
  engine.analyzeSentence = sentence;
  engine.parseDependencies = parseDependencies;
  engine.resolveCoreference = (text,context = {}) => { const parse = parseDependencies(String(text || ''),context); return resolveCoreference(String(text || ''),parse,context); };
  engine.knowledge = {classes:classList,relations,properties,frame:root => FRAMES.get(normalize(root)) || null};
  engine.stats = {
    ...(engine.stats || {}),
    semanticLayer:'v200-local-knowledge-parser-discourse',
    knowledgeWords:CLASSES.size,
    knowledgeGraphNodes:GRAPH.size,
    knowledgeProperties:PROPERTIES.size,
    valencyFrames:FRAMES.size,
    localDependencyParser:1,
    localCoreference:1,
    localNer:1,
    localIdiomMetaphor:1,
    localTimeline:1,
    localNegationScope:1,
    localStatisticalModel:1,
    semanticExternalModel:0,
    externalDependencies:0
  };
})();
