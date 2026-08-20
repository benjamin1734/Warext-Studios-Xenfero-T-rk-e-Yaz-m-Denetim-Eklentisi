(() => {
  'use strict';

  if (window.__warextSemanticDeepV130) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.analyzeMeaning || !engine?.analyzeSentence || !engine?.analyzeMorphology) return;
  window.__warextSemanticDeepV130 = true;

  const VERSION = '1.3.0';
  const baseAnalyzeMeaning = engine.analyzeMeaning.bind(engine);
  const baseAnalyzeSentence = engine.analyzeSentence.bind(engine);
  const baseMorphology = engine.analyzeMorphology.bind(engine);
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const CASE_NAMES = new Set(['dative','accusative','locative','ablative','genitive','instrumental']);
  const TRANSITION_WORDS = new Set(['ama','ancak','fakat','oysa','oysaki','artık','artik','şimdi','simdi','sonra','ardından','ardindan','önce','once','yeniden','tekrar','sonradan','halen','hâlen']);

  const CLASS_PARENTS = new Map([
    ['human',['animate','entity']],['animal',['animate','entity']],['animate',['physical','entity']],['plant',['living','physical','entity']],['living',['physical','entity']],
    ['food',['consumable','physical','entity']],['beverage',['liquid','consumable','physical','entity']],['liquid',['physical','entity']],
    ['text',['readable','information','entity']],['document',['text','readable','information','entity']],['message',['text','communication','information','digital','entity']],
    ['code',['text','information','digital','entity']],['software',['digital','entity']],['service',['digital','entity']],['network',['digital','entity']],['file',['digital','entity']],
    ['data',['information','digital','entity']],['visual',['media','digital','entity']],['audio',['media','digital','entity']],['media',['digital','entity']],
    ['device',['tool','physical','entity']],['vehicle',['tool','physical','entity']],['tool',['physical','entity']],['clothing',['physical','entity']],['place',['physical','entity']],
    ['container',['physical','entity']],['body',['physical','entity']],['natural',['physical','entity']],['organization',['abstract','entity']],['language',['information','abstract','entity']],
    ['money',['abstract','entity']],['time',['abstract','entity']],['emotion',['abstract','entity']],['event',['abstract','entity']],['state',['abstract','entity']],
    ['information',['abstract','entity']],['communication',['information','abstract','entity']],['abstract',['entity']],['physical',['entity']]
  ]);

  const LEXICON = new Map();

  function addClasses(classes, words) {
    for (const word of words) {
      const key = normalize(word);
      if (!LEXICON.has(key)) LEXICON.set(key,new Set());
      const target = LEXICON.get(key);
      for (const cls of classes) target.add(cls);
    }
  }

  addClasses(['human'],['insan','kişi','kisi','adam','kadın','kadin','erkek','çocuk','cocuk','bebek','öğrenci','ogrenci','öğretmen','ogretmen','doktor','mühendis','muhendis','oyuncu','kullanıcı','kullanici','üye','uye','yönetici','yonetici','moderatör','moderator','arkadaş','arkadas','anne','baba','kardeş','kardes','müşteri','musteri','satıcı','satici','alıcı','alici','yazar','okur','geliştirici','gelistirici','programcı','programci','işçi','isci','çalışan','calisan','patron','misafir','komşu','komsu','polis','asker','şoför','sofor','sürücü','surucu','sunucu']);
  addClasses(['animal'],['kedi','köpek','kopek','kuş','kus','at','inek','koyun','keçi','keci','balık','balik','aslan','kaplan','ayı','ayi','kurt','tavşan','tavsan','fare','tavuk','horoz','ördek','ordek','kaz','yılan','yilan','arı','ari','sinek']);
  addClasses(['food'],['yemek','ekmek','et','tavuk','balık','balik','elma','armut','muz','portakal','çilek','cilek','pizza','hamburger','makarna','pilav','çorba','corba','salata','peynir','yoğurt','yogurt','yumurta','pasta','kek','bisküvi','biskuvi','çikolata','cikolata','meyve','sebze','patates','domates','çekirdek','cekirdek']);
  addClasses(['beverage'],['su','çay','cay','kahve','süt','sut','ayran','kola','gazoz','limonata','içecek','icecek']);
  addClasses(['text'],['kitap','roman','hikâye','hikaye','makale','yazı','yazi','metin','rehber','belge','doküman','dokuman','sayfa','paragraf','cümle','cumle','şiir','siir','gazete','dergi','dil']);
  addClasses(['message'],['mesaj','yorum','gönderi','gonderi','konu','başlık','baslik','bildirim','eposta','mail','e-posta']);
  addClasses(['code'],['kod','kaynak','script','betik','fonksiyon','sınıf','sinif','class','metot','method','sorgu','sql','json','xml','html','css','javascript','php','java','python','komut']);
  addClasses(['software'],['uygulama','program','yazılım','yazilim','eklenti','plugin','mod','modül','modul','paket','sürüm','surum','işletim','isletim','sistem','minecraft','xenforo','android','çekirdek','cekirdek','sürücü','surucu','istemci','terminal']);
  addClasses(['service'],['sunucu','api','servis','hizmet','site','forum','discord','github','veritabanı','veritabani']);
  addClasses(['network'],['ağ','ag','internet','ethernet','wifi','wi-fi','lan','wan','vpn','dns','tcp','udp','port','bağlantı','baglanti']);
  addClasses(['file'],['dosya','arşiv','arsiv','zip','jar','apk','pdf','görsel','gorsel','resim','fotoğraf','fotograf','video','yedek']);
  addClasses(['data'],['veri','kayıt','kayit','tablo','veritabanı','veritabani','log','önbellek','onbellek','hücre','hucre','alan','değer','deger','anahtar']);
  addClasses(['visual'],['video','film','dizi','görüntü','goruntu','fotoğraf','fotograf','resim','ekran','yayın','yayin','klip','grafik','tablo']);
  addClasses(['audio'],['müzik','muzik','şarkı','sarki','ses','podcast','radyo','kayıt','kayit']);
  addClasses(['device'],['telefon','bilgisayar','laptop','sunucu','modem','router','klavye','fare','ekran','monitör','monitor','işlemci','islemci','gpu','cpu','disk','ssd','hdd','kamera','mikrofon','kulaklık','kulaklik','terminal']);
  addClasses(['vehicle'],['araba','otomobil','otobüs','otobus','kamyon','tren','uçak','ucak','gemi','tekne','bisiklet','motosiklet','motor','taksi']);
  addClasses(['clothing'],['elbise','gömlek','gomlek','pantolon','ceket','mont','kazak','ayakkabı','ayakkabi','çorap','corap','şapka','sapka','forma']);
  addClasses(['place'],['ev','okul','iş','is','ofis','şehir','sehir','ülke','ulke','oda','salon','mutfak','bahçe','bahce','park','hastane','market','mağaza','magaza','forum','site','dünya','dunya','köy','koy','sokak','cadde','liman','terminal','alan','kanal']);
  addClasses(['container'],['kutu','şişe','sise','bardak','fincan','çanta','canta','dolap','çekmece','cekmece','kasa','paket']);
  addClasses(['body'],['baş','bas','yüz','yuz','göz','goz','kulak','burun','ağız','agiz','dil','kol','el','ayak','bacak','kalp','mide','beyin','saç','sac','boyun']);
  addClasses(['plant'],['ağaç','agac','çiçek','cicek','gül','gul','dal','kök','kok','yaprak','ot','çimen','cimen']);
  addClasses(['natural'],['deniz','göl','gol','nehir','dere','çay','cay','dağ','dag','orman','toprak','hava','yağmur','yagmur','kar','ateş','ates','rüzgâr','ruzgar']);
  addClasses(['physical'],['masa','sandalye','koltuk','yatak','kapı','kapi','pencere','duvar','taş','tas','top','kalem','anahtar','bıçak','bicak','tabak','kaşık','kasik','çatal','catal','çekiç','cekic','vida','kablo','batarya','pil','paket']);
  addClasses(['organization'],['şirket','sirket','kurum','üniversite','universite','okul','bakanlık','bakanlik','belediye','takım','takim','ekip','topluluk','firma']);
  addClasses(['money'],['para','bakiye','kredi','ücret','ucret','fiyat','maaş','maas','gelir','borç','borc','tl','dolar','euro']);
  addClasses(['time'],['zaman','gün','gun','hafta','ay','yıl','yil','saat','dakika','saniye','tarih','yaz','kış','kis','bahar']);
  addClasses(['emotion'],['mutluluk','üzüntü','uzuntu','korku','öfke','ofke','sevgi','nefret','heyecan','endişe','endise']);
  addClasses(['abstract'],['fikir','düşünce','dusunce','plan','amaç','amac','hedef','sorun','hata','özellik','ozellik','ayar','kural','anlam','neden','sonuç','sonuc','ihtimal','olasılık','olasilik','karar','tercih','öneri','oneri','tavsiye','cevap','soru','yardım','yardim','özür','ozur']);
  addClasses(['language'],['türkçe','turkce','ingilizce','almanca','fransızca','fransizca','ispanyolca','arapça','arapca','rusça','rusca','dil']);

  function expandClasses(values) {
    const out = new Set(values || []);
    const queue = [...out];
    while (queue.length) {
      const item = queue.shift();
      for (const parent of CLASS_PARENTS.get(item) || []) {
        if (out.has(parent)) continue;
        out.add(parent);
        queue.push(parent);
      }
    }
    return out;
  }

  function rootAlternatives(root) {
    const word = normalize(root);
    const out = [word];
    if (word.endsWith('b')) out.push(word.slice(0,-1) + 'p');
    if (word.endsWith('c')) out.push(word.slice(0,-1) + 'ç');
    if (word.endsWith('d')) out.push(word.slice(0,-1) + 't');
    if (word.endsWith('ğ') || word.endsWith('g')) out.push(word.slice(0,-1) + 'k');
    return [...new Set(out)];
  }

  function lexicalClasses(root) {
    for (const candidate of rootAlternatives(root)) {
      if (LEXICON.has(candidate)) return expandClasses(LEXICON.get(candidate));
    }
    return new Set();
  }

  const SENSES = new Map([
    ['yüz',[{id:'face',classes:['body','physical'],mode:'noun',cues:['göz','goz','burun','ağız','agiz','saç','sac','insan','surat','yıka','yika']},{id:'swim',classes:['event'],mode:'verb',cues:['su','deniz','havuz','göl','gol','yüzme','yuzme']},{id:'hundred',classes:['abstract'],mode:'noun',cues:['sayı','sayi','lira','tl','adet','rakam']}]],
    ['gül',[{id:'flower',classes:['plant','physical'],mode:'noun',cues:['çiçek','cicek','bahçe','bahce','kırmızı','kirmizi','koku','diken']},{id:'laugh',classes:['event'],mode:'verb',cues:['komik','kahkaha','şaka','saka','espri','mutlu']}]],
    ['yaz',[{id:'summer',classes:['time','abstract'],mode:'noun',cues:['mevsim','sıcak','sicak','tatil','haziran','temmuz','ağustos','agustos']},{id:'write',classes:['event'],mode:'verb',cues:['metin','mesaj','kod','kitap','yorum','kalem','klavye']}]],
    ['at',[{id:'horse',classes:['animal','animate'],mode:'noun',cues:['bin','ahır','ahir','eyer','nal','koş','kos']},{id:'throw',classes:['event'],mode:'verb',cues:['top','çöp','cop','fırlat','firlat','mesaj','dosya']}]],
    ['çay',[{id:'drink',classes:['beverage','liquid'],mode:'noun',cues:['iç','ic','bardak','demle','şeker','seker','kahve']},{id:'stream',classes:['natural','place'],mode:'noun',cues:['dere','nehir','akarsu','köprü','kopru','vadi']}]],
    ['dil',[{id:'language',classes:['language','information'],mode:'noun',cues:['türkçe','turkce','ingilizce','konuş','konus','çeviri','ceviri','kelime','gramer']},{id:'tongue',classes:['body','physical'],mode:'noun',cues:['ağız','agiz','tat','diş','dis','yara']}]],
    ['fare',[{id:'animal',classes:['animal','animate'],mode:'noun',cues:['kedi','peynir','kemir','yuva']},{id:'mouse',classes:['device','tool'],mode:'noun',cues:['bilgisayar','tıkla','tikla','imleç','imlec','usb','klavye']}]],
    ['ağ',[{id:'network',classes:['network','digital'],mode:'noun',cues:['internet','sunucu','ip','tcp','wifi','bağlantı','baglanti','paket']},{id:'net',classes:['tool','physical'],mode:'noun',cues:['balık','balik','deniz','olta','yakala']},{id:'cry',classes:['event'],mode:'verb',cues:['üzül','uzul','gözyaşı','gozyasi','bebek']}]],
    ['anahtar',[{id:'key-object',classes:['tool','physical'],mode:'noun',cues:['kapı','kapi','kilit','araba','çevir','cevir']},{id:'key-data',classes:['data','digital'],mode:'noun',cues:['json','değer','deger','config','ayar','api','token']}]],
    ['port',[{id:'network-port',classes:['network','digital'],mode:'noun',cues:['tcp','udp','ip','sunucu','http','bağlantı','baglanti']},{id:'harbor',classes:['place','physical'],mode:'noun',cues:['gemi','liman','deniz','yük','yuk']}]],
    ['sürücü',[{id:'driver-human',classes:['human','animate'],mode:'noun',cues:['araba','otobüs','otobus','şoför','sofor','ehliyet']},{id:'driver-software',classes:['software','digital'],mode:'noun',cues:['ekran','kart','nvidia','amd','kur','güncelle','guncelle','windows']}]],
    ['sunucu',[{id:'server',classes:['device','service','digital'],mode:'noun',cues:['minecraft','ip','port','ram','cpu','hosting','bağlan','baglan','restart']},{id:'presenter',classes:['human','animate'],mode:'noun',cues:['program','yayın','yayin','televizyon','radyo']}]],
    ['çekirdek',[{id:'seed',classes:['food','plant','physical'],mode:'noun',cues:['ayçiçeği','aycicegi','kabuk','ye','tuzlu']},{id:'kernel',classes:['software','digital'],mode:'noun',cues:['linux','işletim','isletim','kernel','modül','modul','sistem']},{id:'core',classes:['abstract'],mode:'noun',cues:['merkez','temel','ana','işlemci','islemci']}]],
    ['paket',[{id:'parcel',classes:['container','physical'],mode:'noun',cues:['kargo','kutu','gönder','gonder','teslim']},{id:'software-package',classes:['software','file','digital'],mode:'noun',cues:['npm','apt','composer','kur','güncelle','guncelle','bağımlılık','bagimlilik']},{id:'network-packet',classes:['data','network','digital'],mode:'noun',cues:['tcp','udp','ağ','ag','trafik']}]],
    ['terminal',[{id:'station',classes:['place','physical'],mode:'noun',cues:['otobüs','otobus','uçak','ucak','yolcu','istasyon']},{id:'shell',classes:['software','digital'],mode:'noun',cues:['komut','bash','shell','linux','powershell','cmd']},{id:'device',classes:['device','tool'],mode:'noun',cues:['ekran','cihaz','pos']}]],
    ['kanal',[{id:'media-channel',classes:['media','communication'],mode:'noun',cues:['youtube','televizyon','yayın','yayin','video','abone']},{id:'water-channel',classes:['place','natural'],mode:'noun',cues:['su','nehir','sulama']},{id:'network-channel',classes:['network','digital'],mode:'noun',cues:['discord','iletişim','iletisim','mesaj','frekans']}]],
    ['alan',[{id:'place-area',classes:['place','physical'],mode:'noun',cues:['metrekare','arazi','bölge','bolge','geniş','genis']},{id:'data-field',classes:['data','digital'],mode:'noun',cues:['form','veri','tablo','kolon','değer','deger','input']},{id:'discipline',classes:['abstract'],mode:'noun',cues:['uzmanlık','uzmanlik','çalışma','calisma','bilim']}]],
    ['tablo',[{id:'data-table',classes:['data','digital'],mode:'noun',cues:['veritabanı','veritabani','sql','satır','satir','sütun','sutun']},{id:'visual-table',classes:['visual','document'],mode:'noun',cues:['grafik','rapor','hücre','hucre']},{id:'painting',classes:['visual','physical'],mode:'noun',cues:['duvar','ressam','resim']}]],
    ['hücre',[{id:'cell-data',classes:['data','digital'],mode:'noun',cues:['excel','tablo','satır','satir','sütun','sutun']},{id:'cell-biology',classes:['living','physical'],mode:'noun',cues:['biyoloji','doku','dna','organizma']},{id:'cell-room',classes:['place','physical'],mode:'noun',cues:['hapishane','mahkum','cezaevi']}]],
    ['pencere',[{id:'window-physical',classes:['physical'],mode:'noun',cues:['cam','ev','oda','aç','ac','kapat']},{id:'window-ui',classes:['software','digital'],mode:'noun',cues:['ekran','uygulama','tarayıcı','tarayici','arayüz','arayuz','buton']}]],
    ['model',[{id:'concept-model',classes:['abstract','information'],mode:'noun',cues:['veri','yapay','zeka','eğitim','egitim','makine','öğrenme','ogrenme']},{id:'person-model',classes:['human','animate'],mode:'noun',cues:['manken','fotoğraf','fotograf','podyum']},{id:'product-model',classes:['abstract'],mode:'noun',cues:['ürün','urun','telefon','araba','seri']}]]
  ]);

  function senseFor(token,tokens,index) {
    const senses = SENSES.get(token.root);
    if (!senses?.length) return null;
    const mode = token.morphology?.mode || '';
    const windowRoots = [];
    for (let cursor = Math.max(0,index - 6); cursor <= Math.min(tokens.length - 1,index + 6); cursor++) {
      if (cursor === index || tokens[cursor].clause !== token.clause) continue;
      windowRoots.push(tokens[cursor].root);
    }
    const scored = senses.map(sense => {
      let score = 0;
      if (sense.mode && mode) score += sense.mode === mode ? 4 : -3;
      for (const cue of sense.cues || []) if (windowRoots.includes(normalize(cue))) score += 2;
      return {sense,score};
    }).sort((a,b) => b.score - a.score);
    const best = scored[0];
    const second = scored[1];
    if (!best || best.score < 2 || (second && best.score - second.score < 2 && best.score < 5)) return null;
    return {id:best.sense.id,classes:expandClasses(best.sense.classes),score:best.score};
  }

  const FRAME_DEFS = {
    iç:{subject:['animate'],object:['beverage','liquid']},ye:{subject:['animate'],object:['food']},oku:{subject:['human'],object:['readable','text','document','message','code']},izle:{subject:['human'],object:['visual','media']},dinle:{subject:['human'],object:['audio','human']},giy:{subject:['human'],object:['clothing']},sür:{subject:['human'],object:['vehicle']},uyu:{subject:['animate']},koş:{subject:['animate']},uç:{subject:['animate','vehicle']},yüz:{subject:['animate','vehicle']},havla:{subject:['animal']},miyavla:{subject:['animal']},ağla:{subject:['animate']},gül:{subject:['animate']},acık:{subject:['animate']},susa:{subject:['animate']},konuş:{subject:['human']},düşün:{subject:['human']},öğren:{subject:['human'],object:['information','language','text']},anla:{subject:['human'],object:['information','text','message','code']},yaz:{subject:['human'],object:['text','message','code','document']},çiz:{subject:['human'],object:['visual','document']},derle:{subject:['human'],object:['code','software']},kodla:{subject:['human'],object:['code','software']},programla:{subject:['human'],object:['software','device']},çalıştır:{subject:['human'],object:['software','code','device','vehicle']},yükle:{subject:['human'],object:['file','software','data']},indir:{subject:['human'],object:['file','software','data']},sil:{subject:['human'],object:['file','software','data','message','text']},kopyala:{subject:['human'],object:['file','data','text','code']},taşı:{subject:['human','vehicle'],object:['physical','file','data']},gönder:{subject:['human'],object:['message','file','data','physical']},kur:{subject:['human'],object:['software','service','network','device','physical']},güncelle:{subject:['human'],object:['software','file','data','device']},yenile:{subject:['human'],object:['software','file','data','document','service']},aç:{subject:['human','software'],object:['file','software','device','service','container','physical','place']},kapat:{subject:['human','software'],object:['file','software','device','service','container','physical','place']},bağlan:{subject:['human','device','software'],object:['service','network','device']},eriş:{subject:['human','software'],object:['service','file','data','device','place']},tıkla:{subject:['human'],object:['digital','software','text']},satın:{subject:['human','organization'],object:['physical','software','service','file']},sat:{subject:['human','organization'],object:['physical','software','service','file']},öde:{subject:['human','organization'],object:['money']},pişir:{subject:['human'],object:['food']},kokla:{subject:['animate'],object:['food','beverage','plant','physical']},park:{subject:['human'],object:['vehicle']},sürükle:{subject:['human'],object:['physical','file','software']},tak:{subject:['human'],object:['clothing','device','tool','physical']},çıkar:{subject:['human'],object:['clothing','device','tool','physical','file']},ara:{subject:['human'],object:['human','organization','information','file']},bekle:{subject:['animate'],object:['human','event','vehicle']},ziyaret:{subject:['human'],object:['human','place','organization']},sev:{subject:['animate'],object:['animate','food','place','abstract','media','software']},nefret:{subject:['animate'],object:['animate','abstract']},kork:{subject:['animate'],object:['animate','event','abstract','physical']}
  };
  const DEEP_FRAMES = new Map(Object.entries(FRAME_DEFS));
  const FRAME_KEYS = [...DEEP_FRAMES.keys()].sort((a,b) => b.length - a.length);

  const PROPERTY_FRAMES = new Map([
    ['aç',['animate']],['ac',['animate']],['tok',['animate']],['susamış',['animate']],['susamis',['animate']],['uykulu',['animate']],['hamile',['human','animal']],['lezzetli',['food','beverage','consumable']],['okunaklı',['text','document']],['okunakli',['text','document']],['yenilebilir',['food','consumable']],['içilebilir',['beverage','liquid']],['icilebilir',['beverage','liquid']],['çevrimiçi',['human','software','service','device']],['cevrimici',['human','software','service','device']],['çevrimdışı',['human','software','service','device']],['cevrimdisi',['human','software','service','device']],['paslı',['tool','device','vehicle','physical']],['pasli',['tool','device','vehicle','physical']],['şarjlı',['device']],['sarjli',['device']],['şarjsız',['device']],['sarjsiz',['device']]
  ]);

  const CASE_EXPECTATIONS = new Map([
    ['bak','dative'],['inan','dative'],['güven','dative'],['guven','dative'],['katıl','dative'],['katil','dative'],['ulaş','dative'],['ulas','dative'],['yaklaş','dative'],['yaklas','dative'],['benze','dative'],['uy','dative'],['başla','dative'],['basla','dative'],['bağlan','dative'],['baglan','dative'],['eriş','dative'],['eris','dative'],['başvur','dative'],['basvur','dative'],['bahset','ablative'],['kork','ablative'],['hoşlan','ablative'],['hoslan','ablative'],['vazgeç','ablative'],['vazgec','ablative'],['şüphelen','ablative'],['suphelen','ablative'],['kaçın','ablative'],['kacin','ablative'],['ayrıl','ablative'],['ayril','ablative'],['bekle','accusative'],['ara','accusative'],['merak','accusative'],['kullan','accusative']
  ]);

  const STATE_PAIRS = new Map([
    ['açık','kapalı'],['acik','kapali'],['aktif','pasif'],['çevrimiçi','çevrimdışı'],['cevrimici','cevrimdisi'],['bağlı','bağlantısız'],['bagli','baglantisiz'],['dolu','boş'],['dolu','bos'],['canlı','ölü'],['canli','olu'],['kurulu','kaldırılmış'],['kurulu','kaldirilmis'],['çalışıyor','durdu'],['calisiyor','durdu'],['başarılı','başarısız'],['basarili','basarisiz'],['doğru','yanlış'],['dogru','yanlis'],['var','yok']
  ]);
  const OPPOSITE_STATE = new Map();
  for (const [a,b] of STATE_PAIRS) {
    OPPOSITE_STATE.set(a,b);
    OPPOSITE_STATE.set(b,a);
  }

  const MAKE_FORMS = new Map([
    ['yapmak','INF'],['yaptı','P3'],['yaptım','P1'],['yaptın','P2'],['yaptık','P1P'],['yaptınız','P2P'],['yaptılar','P3P'],['yapıyor','PR3'],['yapıyorum','PR1'],['yapıyorsun','PR2'],['yapıyoruz','PR1P'],['yapıyorsunuz','PR2P'],['yapıyorlar','PR3P'],['yapacak','F3'],['yapacağım','F1'],['yapacaksın','F2'],['yapacağız','F1P'],['yapacaksınız','F2P'],['yapacaklar','F3P']
  ]);
  const TARGET_FORMS = {
    ver:{INF:'vermek',P3:'verdi',P1:'verdim',P2:'verdin',P1P:'verdik',P2P:'verdiniz',P3P:'verdiler',PR3:'veriyor',PR1:'veriyorum',PR2:'veriyorsun',PR1P:'veriyoruz',PR2P:'veriyorsunuz',PR3P:'veriyorlar',F3:'verecek',F1:'vereceğim',F2:'vereceksin',F1P:'vereceğiz',F2P:'vereceksiniz',F3P:'verecekler'},
    sor:{INF:'sormak',P3:'sordu',P1:'sordum',P2:'sordun',P1P:'sorduk',P2P:'sordunuz',P3P:'sordular',PR3:'soruyor',PR1:'soruyorum',PR2:'soruyorsun',PR1P:'soruyoruz',PR2P:'soruyorsunuz',PR3P:'soruyorlar',F3:'soracak',F1:'soracağım',F2:'soracaksın',F1P:'soracağız',F2P:'soracaksınız',F3P:'soracaklar'},
    et:{INF:'etmek',P3:'etti',P1:'ettim',P2:'ettin',P1P:'ettik',P2P:'ettiniz',P3P:'ettiler',PR3:'ediyor',PR1:'ediyorum',PR2:'ediyorsun',PR1P:'ediyoruz',PR2P:'ediyorsunuz',PR3P:'ediyorlar',F3:'edecek',F1:'edeceğim',F2:'edeceksin',F1P:'edeceğiz',F2P:'edeceksiniz',F3P:'edecekler'},
    çek:{INF:'çekmek',P3:'çekti',P1:'çektim',P2:'çektin',P1P:'çektik',P2P:'çektiniz',P3P:'çektiler',PR3:'çekiyor',PR1:'çekiyorum',PR2:'çekiyorsun',PR1P:'çekiyoruz',PR2P:'çekiyorsunuz',PR3P:'çekiyorlar',F3:'çekecek',F1:'çekeceğim',F2:'çekeceksin',F1P:'çekeceğiz',F2P:'çekeceksiniz',F3P:'çekecekler'},
    dile:{INF:'dilemek',P3:'diledi',P1:'diledim',P2:'diledin',P1P:'diledik',P2P:'dilediniz',P3P:'dilediler',PR3:'diliyor',PR1:'diliyorum',PR2:'diliyorsun',PR1P:'diliyoruz',PR2P:'diliyorsunuz',PR3P:'diliyorlar',F3:'dileyecek',F1:'dileyeceğim',F2:'dileyeceksin',F1P:'dileyeceğiz',F2P:'dileyeceksiniz',F3P:'dileyecekler'},
    kur:{INF:'kurmak',P3:'kurdu',P1:'kurdum',P2:'kurdun',P1P:'kurduk',P2P:'kurdunuz',P3P:'kurdular',PR3:'kuruyor',PR1:'kuruyorum',PR2:'kuruyorsun',PR1P:'kuruyoruz',PR2P:'kuruyorsunuz',PR3P:'kuruyorlar',F3:'kuracak',F1:'kuracağım',F2:'kuracaksın',F1P:'kuracağız',F2P:'kuracaksınız',F3P:'kuracaklar'}
  };
  const COLLOCATION_TARGETS = new Map([
    ['karar','ver'],['cevap','ver'],['fiyat','ver'],['sipariş','ver'],['siparis','ver'],['soru','sor'],['yardım','et'],['yardim','et'],['teşekkür','et'],['tesekkur','et'],['tercih','et'],['tavsiye','et'],['fotoğraf','çek'],['fotograf','çek'],['video','çek'],['özür','dile'],['ozur','dile'],['bağlantı','kur'],['baglanti','kur']
  ]);

  function surfaceRoot(raw,morphology) {
    const clean = normalize(String(raw || '').replace(/['’].*$/u,''));
    const analyzed = normalize(morphology?.root || '');
    if (LEXICON.has(analyzed) || DEEP_FRAMES.has(analyzed) || CASE_EXPECTATIONS.has(analyzed) || SENSES.has(analyzed)) return analyzed;
    if (LEXICON.has(clean) || DEEP_FRAMES.has(clean) || CASE_EXPECTATIONS.has(clean) || SENSES.has(clean)) return clean;
    for (const key of FRAME_KEYS) if (clean === key || (clean.startsWith(key) && clean.length > key.length + 1)) return key;
    for (const candidate of rootAlternatives(analyzed || clean)) if (LEXICON.has(candidate)) return candidate;
    return analyzed || clean;
  }

  function tokenize(text,context = {}) {
    const source = String(text || '');
    const re = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,16})?`,'gu');
    const ranges = context.protectedRanges || [];
    const tokens = [];
    let match;
    while ((match = re.exec(source))) {
      const start = match.index;
      const end = start + match[0].length;
      if (ranges.some(range => range.start < end && range.end > start)) continue;
      const morphology = baseMorphology(match[0]) || null;
      const root = surfaceRoot(match[0],morphology);
      tokens.push({raw:match[0],start,end,root,morphology,classes:lexicalClasses(root),clause:0,sentence:0,sense:null});
    }
    let clause = 0;
    let sentence = 0;
    let cursor = 0;
    for (const token of tokens) {
      while (cursor < token.start) {
        const ch = source[cursor];
        if (/[;:\n]/u.test(ch)) clause++;
        if (/[.!?\n]/u.test(ch)) { sentence++; clause++; }
        cursor++;
      }
      token.clause = clause;
      token.sentence = sentence;
    }
    for (let index = 0; index < tokens.length; index++) {
      const sense = senseFor(tokens[index],tokens,index);
      if (!sense) continue;
      tokens[index].sense = sense;
      tokens[index].classes = sense.classes;
    }
    return tokens;
  }

  function finiteVerb(token) {
    if (!token) return false;
    if (token.morphology?.valid && token.morphology.mode === 'verb') return true;
    return DEEP_FRAMES.has(token.root) && /(?:dı|di|du|dü|tı|ti|tu|tü|yor|acak|ecek|mış|miş|muş|müş|malı|meli|sa|se|r|ar|er)(?:m|n|k|ız|iz|uz|üz|sınız|siniz|sunuz|sünüz|lar|ler)?$/u.test(normalize(token.raw));
  }

  function caseName(token) {
    const value = token?.morphology?.features?.case || '';
    return CASE_NAMES.has(value) ? value : '';
  }

  function compatible(classes,allowed) {
    if (!classes?.size || !allowed?.length) return true;
    return allowed.some(item => classes.has(item));
  }

  function subjectBefore(tokens,index) {
    const predicate = tokens[index];
    let fallback = null;
    for (let cursor = index - 1; cursor >= 0 && index - cursor <= 9; cursor--) {
      const token = tokens[cursor];
      if (token.clause !== predicate.clause) break;
      if (finiteVerb(token)) break;
      if (caseName(token)) continue;
      if (['ben','sen','o','biz','siz','onlar'].includes(token.root)) return token;
      if (token.classes.has('human') || token.classes.has('animal') || token.classes.has('animate') || token.classes.has('device') || token.classes.has('vehicle') || token.classes.has('physical') || token.classes.has('organization') || token.classes.has('software')) fallback = token;
    }
    return fallback;
  }

  function objectBefore(tokens,index) {
    const predicate = tokens[index];
    let bare = null;
    for (let cursor = index - 1; cursor >= 0 && index - cursor <= 8; cursor--) {
      const token = tokens[cursor];
      if (token.clause !== predicate.clause) break;
      if (finiteVerb(token)) break;
      const c = caseName(token);
      if (c === 'accusative') return token;
      if (!c && token.morphology?.mode === 'noun' && !['ben','sen','o','biz','siz','onlar'].includes(token.root) && !bare) bare = token;
    }
    return bare;
  }

  function argumentByCase(tokens,index,target) {
    const predicate = tokens[index];
    for (let cursor = index - 1; cursor >= 0 && index - cursor <= 8; cursor--) {
      const token = tokens[cursor];
      if (token.clause !== predicate.clause) break;
      if (caseName(token) === target) return token;
    }
    return null;
  }

  function pushUnique(list,item) {
    if (!item) return;
    const key = `${item.start}:${item.end}:${item.rule}:${item.message || item.suggestions?.[0] || ''}`;
    if (list.some(existing => existing.__key === key)) return;
    item.__key = key;
    list.push(item);
  }

  function clean(list) {
    return list.map(item => {
      const out = {...item};
      delete out.__key;
      return out;
    });
  }

  function frameWarnings(text,tokens) {
    const warnings = [];
    const roles = [];
    for (let index = 0; index < tokens.length; index++) {
      const predicate = tokens[index];
      if (!finiteVerb(predicate)) continue;
      const frame = DEEP_FRAMES.get(predicate.root);
      if (!frame) continue;
      const subject = subjectBefore(tokens,index);
      const object = objectBefore(tokens,index);
      roles.push({predicate:predicate.root,subject:subject?.root || '',object:object?.root || '',sentence:predicate.sentence});
      if (subject && frame.subject?.length && subject.classes.size && !compatible(subject.classes,frame.subject)) pushUnique(warnings,{start:subject.start,end:predicate.end,rule:'v130-semantic-subject-frame',confidence:0.95,category:'semantic',severity:'warning',message:`“${subject.raw}” öznesi ile “${predicate.raw}” yüklemi arasında güçlü bir anlam uyumsuzluğu var.`});
      if (object && frame.object?.length && object.classes.size && !compatible(object.classes,frame.object)) pushUnique(warnings,{start:object.start,end:predicate.end,rule:'v130-semantic-object-frame',confidence:0.96,category:'semantic',severity:'warning',message:`“${object.raw}” nesnesi “${predicate.raw}” yükleminin beklediği anlam türüyle uyuşmuyor.`});
    }
    return {warnings,roles};
  }

  function propertyWarnings(tokens) {
    const warnings = [];
    for (let index = 1; index < tokens.length; index++) {
      const property = normalize(tokens[index].root || tokens[index].raw);
      const allowed = PROPERTY_FRAMES.get(property);
      if (!allowed) continue;
      let subject = null;
      for (let cursor = index - 1; cursor >= 0 && index - cursor <= 5; cursor--) {
        if (tokens[cursor].clause !== tokens[index].clause) break;
        if (tokens[cursor].classes.size) { subject = tokens[cursor]; break; }
      }
      if (!subject || compatible(subject.classes,allowed)) continue;
      pushUnique(warnings,{start:subject.start,end:tokens[index].end,rule:'v130-semantic-property-frame',confidence:0.94,category:'semantic',severity:'warning',message:`“${property}” özelliği “${subject.raw}” için anlamsal olarak olağandışı görünüyor.`});
    }
    return warnings;
  }

  function caseWarnings(tokens) {
    const warnings = [];
    for (let index = 0; index < tokens.length; index++) {
      const predicate = tokens[index];
      if (!finiteVerb(predicate)) continue;
      const expected = CASE_EXPECTATIONS.get(predicate.root);
      if (!expected || argumentByCase(tokens,index,expected)) continue;
      let wrong = null;
      for (let cursor = index - 1; cursor >= 0 && index - cursor <= 5; cursor--) {
        const candidate = tokens[cursor];
        if (candidate.clause !== predicate.clause) break;
        const c = caseName(candidate);
        if (c && c !== expected) { wrong = candidate; break; }
      }
      if (!wrong) continue;
      pushUnique(warnings,{start:wrong.start,end:predicate.end,rule:'v130-semantic-valency-case',confidence:0.91,category:'semantic',severity:'warning',message:`“${predicate.raw}” yüklemi bu anlamda ${expected} hâlli bir tamlayıcı bekliyor; “${wrong.raw}” kullanımını kontrol edin.`});
    }
    return warnings;
  }

  function collocationFixes(text) {
    const fixes = [];
    const re = new RegExp(`\\b([${LETTERS}]{3,})[ \\t]+([${LETTERS}]{4,})`,'gu');
    let match;
    while ((match = re.exec(text))) {
      const noun = normalize(match[1]);
      const form = normalize(match[2]);
      const target = COLLOCATION_TARGETS.get(noun);
      const slot = MAKE_FORMS.get(form);
      const replacementVerb = target && slot ? TARGET_FORMS[target]?.[slot] : '';
      if (!replacementVerb) continue;
      pushUnique(fixes,{start:match.index,end:match.index + match[0].length,suggestions:[`${match[1]} ${replacementVerb}`],rule:'v130-semantic-collocation',confidence:0.965,category:'semantic',message:'Bu ad-fiil birlikteliğinin Türkçede daha doğal ve yerleşik bir karşılığı var.'});
    }
    return fixes;
  }

  function sentenceRanges(text) {
    const ranges = [];
    let start = 0;
    for (let index = 0; index < text.length; index++) {
      if (!/[.!?\n]/u.test(text[index])) continue;
      const end = index + 1;
      if (text.slice(start,end).trim()) ranges.push({start,end,text:text.slice(start,end)});
      start = end;
    }
    if (start < text.length && text.slice(start).trim()) ranges.push({start,end:text.length,text:text.slice(start)});
    return ranges;
  }

  function claimSubject(tokens,sentenceIndex,previousSubject = '') {
    const sentenceTokens = tokens.filter(token => token.sentence === sentenceIndex);
    for (const token of sentenceTokens) {
      if (['o','bu','şu','su'].includes(token.root) && previousSubject) return previousSubject;
      if (token.classes.size && !finiteVerb(token) && !caseName(token)) return token.root;
    }
    return previousSubject;
  }

  function stateOfSentence(text,tokens,sentenceIndex,previousSubject = '') {
    const sentenceTokens = tokens.filter(token => token.sentence === sentenceIndex);
    if (!sentenceTokens.length) return null;
    const subject = claimSubject(tokens,sentenceIndex,previousSubject);
    if (!subject) return null;
    for (const token of sentenceTokens) {
      const state = normalize(token.raw);
      if (OPPOSITE_STATE.has(state)) return {subject,state,start:sentenceTokens[0].start,end:sentenceTokens.at(-1).end};
    }
    return null;
  }

  function hasTransition(text) {
    const roots = normalize(text).split(/[^a-zçğıöşüâîû]+/u).filter(Boolean);
    return roots.some(root => TRANSITION_WORDS.has(root));
  }

  function discourseWarnings(text,tokens,context = {}) {
    const warnings = [];
    const ranges = sentenceRanges(text);
    let previousClaim = null;
    let previousSubject = '';
    for (let sentence = 0; sentence < ranges.length; sentence++) {
      const claim = stateOfSentence(text,tokens,sentence,previousSubject);
      if (!claim) continue;
      if (previousClaim && claim.subject === previousClaim.subject && OPPOSITE_STATE.get(previousClaim.state) === claim.state && !hasTransition(ranges[sentence].text)) pushUnique(warnings,{start:claim.start,end:claim.end,rule:'v130-semantic-discourse-state-conflict',confidence:0.91,category:'semantic',severity:'warning',message:`“${claim.subject}” için ardışık cümlelerde “${previousClaim.state}” ve “${claim.state}” durumları geçiş açıklaması olmadan çelişiyor.`});
      previousClaim = claim;
      previousSubject = claim.subject;
    }
    const previous = String(context.previousSentence || '');
    if (previous && ranges.length) {
      const prevTokens = tokenize(previous,{});
      const prevClaim = stateOfSentence(previous,prevTokens,0,'');
      const firstClaim = stateOfSentence(text,tokens,0,prevClaim?.subject || '');
      if (prevClaim && firstClaim && prevClaim.subject === firstClaim.subject && OPPOSITE_STATE.get(prevClaim.state) === firstClaim.state && !hasTransition(ranges[0].text)) pushUnique(warnings,{start:firstClaim.start,end:firstClaim.end,rule:'v130-semantic-neighbor-state-conflict',confidence:0.9,category:'semantic',severity:'warning',message:`Önceki cümlede “${prevClaim.subject}” için “${prevClaim.state}”, bu cümlede “${firstClaim.state}” deniyor; durum değişimini açıklayan bağlam görünmüyor.`});
    }
    return warnings;
  }

  function logicWarnings(text,tokens) {
    const warnings = [];
    const normalized = normalize(text);
    for (const [a,b] of [['herkes','hiç kimse'],['herkes','hic kimse'],['her zaman','asla'],['kesinlikle','imkânsız olabilir'],['kesinlikle','imkansiz olabilir']]) {
      const ai = normalized.indexOf(a);
      const bi = normalized.indexOf(b);
      if (ai < 0 || bi < 0) continue;
      const start = Math.min(ai,bi);
      const end = Math.max(ai + a.length,bi + b.length);
      if (/\b(?:ama|ancak|fakat|oysa)\b/u.test(normalized.slice(start,end))) continue;
      pushUnique(warnings,{start,end,rule:'v130-semantic-quantifier-polarity-conflict',confidence:0.89,category:'semantic',severity:'warning',message:`“${a}” ve “${b}” aynı yargıda çelişen kapsam veya kesinlik bildiriyor.`});
    }
    const match = text.match(/\b(?:dün|geçen hafta|geçen ay|geçen yıl)\b[\s\S]{0,90}\b(?:yarın|gelecek hafta|gelecek ay|gelecek yıl)\b/iu);
    if (match) {
      const finiteCount = tokens.filter(token => token.start >= match.index && token.end <= match.index + match[0].length && finiteVerb(token)).length;
      if (finiteCount <= 1) pushUnique(warnings,{start:match.index,end:match.index + match[0].length,rule:'v130-semantic-time-anchor-conflict',confidence:0.9,category:'semantic',severity:'warning',message:'Tek bir yargı içinde geçmiş ve gelecek zaman çapasının birlikte kullanımı anlamı çelişkili hale getiriyor.'});
    }
    return warnings;
  }

  function senseReport(tokens) {
    return tokens.filter(token => token.sense).map(token => ({word:token.raw,root:token.root,sense:token.sense.id,confidence:Math.min(0.99,0.65 + token.sense.score * 0.06),classes:[...token.sense.classes].slice(0,8)}));
  }

  function deepAnalyzeMeaning(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseAnalyzeMeaning(text,context) || {fixes:[],warnings:[],tokens:0,classifiedTokens:0,coverage:0};
    if (context.semantic === false) return base;
    const tokens = tokenize(text,context);
    const frames = frameWarnings(text,tokens);
    const fixes = [...(base.fixes || []),...collocationFixes(text)];
    const warnings = [...(base.warnings || []),...frames.warnings,...propertyWarnings(tokens),...caseWarnings(tokens),...discourseWarnings(text,tokens,context),...logicWarnings(text,tokens)];
    const uniqueFixes = [];
    const uniqueWarnings = [];
    for (const item of fixes) pushUnique(uniqueFixes,item);
    for (const item of warnings) pushUnique(uniqueWarnings,item);
    const classified = tokens.filter(token => token.classes.size).length;
    const localCoverage = tokens.length ? classified / tokens.length : 0;
    const warningPenalty = uniqueWarnings.reduce((sum,item) => sum + Math.max(0,Number(item.confidence || 0) - 0.75),0);
    return {
      ...base,
      version:VERSION,
      tokens:Math.max(Number(base.tokens || 0),tokens.length),
      classifiedTokens:Math.max(Number(base.classifiedTokens || 0),classified),
      coverage:Math.max(Number(base.coverage || 0),localCoverage),
      fixes:clean(uniqueFixes).sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0)),
      warnings:clean(uniqueWarnings).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      senses:senseReport(tokens),
      roles:frames.roles,
      coherence:Math.max(0,Math.min(1,1 - warningPenalty / Math.max(4,tokens.length))),
      semanticExternalModel:0,
      externalDependencies:0
    };
  }

  function deepAnalyzeSentence(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseAnalyzeSentence(text,context) || [];
    if (context.semantic === false) return base;
    const report = deepAnalyzeMeaning(text,context);
    const out = [];
    const seen = new Set();
    for (const issue of [...base,...(report.fixes || [])]) {
      if (!issue?.suggestions?.length || issue.end < issue.start) continue;
      const key = `${issue.start}:${issue.end}:${normalize(issue.suggestions[0])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  engine.analyzeMeaning = deepAnalyzeMeaning;
  engine.analyzeSentence = deepAnalyzeSentence;
  engine.stats = {
    ...(engine.stats || {}),
    semanticLayer:'v130-local-deep-symbolic-discourse',
    semanticDeepLexicon:LEXICON.size,
    semanticDeepFrames:DEEP_FRAMES.size,
    semanticSenseFamilies:SENSES.size,
    semanticPropertyFrames:PROPERTY_FRAMES.size,
    semanticValencyFrames:CASE_EXPECTATIONS.size,
    semanticDiscourseStates:OPPOSITE_STATE.size,
    semanticCollocations:COLLOCATION_TARGETS.size,
    semanticExternalModel:0,
    externalDependencies:0
  };
})();
