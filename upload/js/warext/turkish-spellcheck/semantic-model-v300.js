(() => {
  'use strict';

  if (window.WarextSemanticModelV300) return;

  const VERSION = '3.0.0';
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const VECTOR_SIZE = 160;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const STOP = new Set('acaba ama ancak artık asla ayrıca az bazı belki ben beni benim beri bile bir biraz biz bize bizim bu buna bunda bundan bunu bunun çok çünkü da daha dahi de değil demek diye dolayısıyla dolayı eğer en fakat falan filan gene gibi göre hâlâ hem hep her herkes herhalde hiç için ile ise işte kadar ki kim kimi nasıl ne neden nereye niçin niye o olan olarak oldu onun oysa öyle rağmen sadece sanki sen seni sizin siz sonra şu şöyle tabii tüm ve veya vs ya yani yine yok zaten zira'.split(/\s+/u));
  const PRONOUNS = new Set('ben beni bana benden benim sen seni sana senden senin o onu ona ondan onun biz bizi bize bizden bizim siz sizi size sizden sizin onlar onları onlara onlardan onların bu bunu buna bundan bunun şu şunu şuna şundan şunun kendisi kendini kendisine kendinden'.split(/\s+/u));
  const NEGATION = new Set(['değil','degil','yok','hayır','hayir','hiç','hic','asla','olmadı','olmadi','olmaz','olmuyor','yapmadı','yapmadi','yapmaz','yapmıyor','yapmiyor']);
  const CERTAIN = new Set(['kesin','kesinlikle','mutlaka','şüphesiz','şuphesiz','elbette','kuşkusuz','kuskuşuz','kesindir','kanıtlandı','kanitlandi']);
  const POSSIBLE = new Set(['belki','muhtemelen','olasılıkla','olasilikla','ihtimal','sanırım','sanirim','galiba','olabilir','mümkün','mumkun']);
  const QUANTIFIERS = new Set(['hiç','hic','hiçbir','hicbir','tüm','tum','bütün','butun','hepsi','herkes','her','bazı','bazi','birkaç','birkac']);
  const TIME_WORDS = {
    past:new Set(['dün','dun','önce','once','geçen','gecen','önceki','onceki','azönce','evvel']),
    present:new Set(['bugün','bugun','şimdi','simdi','şuanda','halen','hâlen']),
    future:new Set(['yarın','yarin','gelecek','birazdan','sonra','ileride'])
  };

  const CONCEPTS = new Map([
    ['people','insan kişi kisi adam kadın kadin erkek çocuk cocuk öğrenci ogrenci öğretmen ogretmen arkadaş arkadas kullanıcı kullanici üye uye yönetici yonetici çalışan calisan müşteri musteri satıcı satici alıcı alici ekip takım takim topluluk aile anne baba kardeş kardes'.split(/\s+/u)],
    ['software','yazılım yazilim uygulama program eklenti plugin mod modül modul paket sürüm surum sistem script betik kod kaynak api servis framework kütüphane kutuphane xenforo wordpress java php javascript python'.split(/\s+/u)],
    ['hardware','bilgisayar telefon sunucu işlemci islemci ekran kartı karti gpu cpu ram disk ssd hdd modem router cihaz klavye fare monitör monitor batarya pil'.split(/\s+/u)],
    ['network','ağ ag internet bağlantı baglanti wifi ethernet lan wan vpn dns tcp udp port socket proxy cdn trafik paket sunucu'.split(/\s+/u)],
    ['text','metin yazı yazi paragraf cümle cumle kelime sözcük sozcuk kitap makale rapor mesaj yorum konu başlık baslik belge doküman dokuman içerik icerik'.split(/\s+/u)],
    ['language','dil türkçe turkce ingilizce gramer dilbilgisi yazım yazim noktalama anlam semantik sözdizimi sozdizimi imla telaffuz sözlük sozluk'.split(/\s+/u)],
    ['place','ev okul ofis iş is şehir sehir ülke ulke oda salon bahçe bahce park hastane market mağaza magaza kütüphane kutuphane kafe restoran sokak cadde'.split(/\s+/u)],
    ['transport','araba otomobil otobüs otobus tren uçak ucak gemi tekne bisiklet motosiklet taksi metro tramvay yol durak istasyon seyahat'.split(/\s+/u)],
    ['food','yemek ekmek et tavuk balık balik elma armut muz pizza makarna pilav çorba corba salata peynir yoğurt yogurt yumurta kahve çay cay su süt sut içecek icecek'.split(/\s+/u)],
    ['time','zaman gün gun hafta ay yıl yil saat dakika saniye tarih sabah öğle ogle akşam aksam gece bugün bugun dün dun yarın yarin önce once sonra gelecek'.split(/\s+/u)],
    ['money','para bakiye kredi ücret ucret fiyat maaş maas gelir borç borc tl dolar euro coin ödeme odeme satın satin satış satis'.split(/\s+/u)],
    ['education','okul üniversite universite ders sınav sinav öğrenci ogrenci öğretmen ogretmen eğitim egitim öğrenim ogrenim kitap kütüphane kutuphane araştırma arastirma'.split(/\s+/u)],
    ['work','iş is çalışma calisma çalışan calisan proje görev gorev plan toplantı toplanti şirket sirket firma yönetim yonetim ekip müşteri musteri üretim uretim'.split(/\s+/u)],
    ['health','sağlık saglik hastane doktor hemşire hemsire ilaç ilac tedavi hastalık hastalik ağrı agri ateş ates ameliyat hasta'.split(/\s+/u)],
    ['emotion','mutlu mutluluk üzgün uzgun üzüntü uzuntu korku öfke ofke sevgi nefret heyecan endişe endise kaygı kaygi memnun mutsuz şaşkın saskin'.split(/\s+/u)],
    ['quality','iyi kötü kotu güzel guzel çirkin cirkin doğru dogru yanlış yanlis başarılı basarili başarısız basarisiz kaliteli kalitesiz faydalı faydali zararlı zararli yararlı yararli'.split(/\s+/u)],
    ['state','açık acik kapalı kapali aktif pasif hazır hazir bozuk sağlam saglam dolu boş bos var yok mevcut eksik tamam çalışıyor calisiyor durmuş durmus'.split(/\s+/u)],
    ['quantity','çok cok az fazla eksik yeterli yetersiz tüm tum bütün butun bazı bazi birkaç birkac hiç hic tamamen kısmen kismen'.split(/\s+/u)],
    ['motion','git gel çık cik gir dön don yürü yuru koş kos ulaş ulas var hareket seyahat geç gec ilerle dur'.split(/\s+/u)],
    ['communication','konuş konus söyle soyle yaz oku mesaj cevap yanıt yanit soru sor açıkla acikla anlat bildir duyur iletişim iletisim görüş gorus'.split(/\s+/u)],
    ['decision','karar plan tercih seç sec düşün dusun değerlendirme degerlendirme amaç amac hedef niyet istemek kabul reddet çözüm cozum öneri oneri'.split(/\s+/u)],
    ['cause','neden sebep sonuç sonuc etki kaynak dolayı dolayi yüzünden yuzunden sayesinde için icin çünkü cunku zira'.split(/\s+/u)],
    ['security','güvenlik guvenlik güvenli guvenli saldırı saldiri açık acik zafiyet yetki izin parola şifre sifre doğrulama dogrulama koruma engel risk'.split(/\s+/u)],
    ['media','resim görsel gorsel fotoğraf fotograf video film dizi müzik muzik şarkı sarki ses yayın yayin ekran grafik'.split(/\s+/u)],
    ['nature','hava güneş gunes yağmur yagmur kar rüzgâr ruzgar deniz göl gol nehir dağ dag orman ağaç agac çiçek cicek toprak su'.split(/\s+/u)],
    ['measurement','boyut hız hiz ağırlık agirlik uzunluk sıcaklık sicaklik derece oran yüzde adet tane sayı sayi miktar'.split(/\s+/u)],
    ['forum','forum konu mesaj kullanıcı kullanici üye uye kategori moderatör moderator yönetici yonetici profil yorum etiket kaynak resource eklenti xenforo'.split(/\s+/u)],
    ['commerce','ürün urun mağaza magaza pazar market satıcı satici alıcı alici sipariş siparis sepet ödeme odeme fiyat satış satis satın satin teslimat'.split(/\s+/u)],
    ['game','oyun oyuncu bölüm bolum harita karakter boss görev gorev seviye minecraft sunucu blok dünya dunya savaş savas'.split(/\s+/u)],
    ['logic','mantık mantik çelişki celiski tutarlı tutarli tutarsız tutarsiz neden sonuç sonuc koşul kosul ihtimal olasılık olasilik kanıt kanit gerçek gercek'.split(/\s+/u)]
  ]);

  const CONCEPT_INDEX = new Map([...CONCEPTS.keys()].map((name,index) => [name,index]));
  const WORD_CONCEPTS = new Map();
  for (const [concept,words] of CONCEPTS) {
    for (const raw of words) {
      const word = normalize(raw);
      if (!WORD_CONCEPTS.has(word)) WORD_CONCEPTS.set(word,new Set());
      WORD_CONCEPTS.get(word).add(concept);
    }
  }

  const ANTONYM_PAIRS = [
    ['açık','kapalı'],['acik','kapali'],['doğru','yanlış'],['dogru','yanlis'],['var','yok'],['aktif','pasif'],['iyi','kötü'],['iyi','kotu'],['güzel','çirkin'],['guzel','cirkin'],['başarılı','başarısız'],['basarili','basarisiz'],['faydalı','zararlı'],['faydali','zararli'],['yararlı','zararlı'],['yararli','zararli'],['yüksek','düşük'],['yuksek','dusuk'],['çok','az'],['cok','az'],['fazla','eksik'],['dolu','boş'],['dolu','bos'],['erken','geç'],['erken','gec'],['sıcak','soğuk'],['sicak','soguk'],['hızlı','yavaş'],['hizli','yavas'],['büyük','küçük'],['buyuk','kucuk'],['arttı','azaldı'],['artti','azaldi'],['artıyor','azalıyor'],['artiyor','azaliyor'],['geldi','gitti'],['girdi','çıktı'],['girdi','cikti'],['kabul','ret'],['mümkün','imkânsız'],['mumkun','imkansiz'],['mevcut','eksik'],['çalışıyor','durmuş'],['calisiyor','durmus'],['başladı','bitti'],['basladi','bitti'],['aynı','farklı'],['ayni','farkli'],['önce','sonra'],['once','sonra'],['geçmiş','gelecek'],['gecmis','gelecek']
  ].map(([a,b]) => [normalize(a),normalize(b)]);

  const RELATIONS = [
    ['cause',/(?:^|\s)(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin)(?:\s|$)/iu],
    ['result',/(?:^|\s)(?:bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak)(?:\s|$)/iu],
    ['contrast',/(?:^|\s)(?:ama|ancak|fakat|oysa|oysaki|buna rağmen|buna ragmen|karşın|karsin)(?:\s|$)/iu],
    ['condition',/(?:^|\s)(?:eğer|eger|şayet|sayet|koşuluyla|kosuluyla)(?:\s|$)/iu],
    ['addition',/(?:^|\s)(?:ayrıca|ayrica|üstelik|ustelik|bunun yanında|bunun yaninda|ek olarak)(?:\s|$)/iu],
    ['sequence',/(?:^|\s)(?:sonra|ardından|ardindan|daha sonra|önce|once|ilk olarak|son olarak)(?:\s|$)/iu],
    ['explanation',/(?:^|\s)(?:yani|başka bir deyişle|baska bir deyisle|örneğin|ornegin|örnek olarak|ornek olarak)(?:\s|$)/iu]
  ];

  const SUFFIXES = ['lerinizden','larınızdan','larinizdan','lerinizde','larınızda','larinizda','lerinizin','larınızın','larinizin','lerinin','larının','larinin','lerden','lardan','lerin','ların','larin','leri','ları','lari','likten','lıktan','likten','lukten','lükten','lığın','liğin','luğun','lüğün','ligin','lugin','luk','lük','lık','lik','cılar','ciler','cular','cüler','dan','den','tan','ten','nın','nin','nun','nün','ın','in','un','ün','yla','yle','lar','ler','dır','dir','dur','dür','tır','tir','tur','tür','mış','miş','muş','müş','acak','ecek','yor','malı','meli','dı','di','du','dü','tı','ti','tu','tü','ya','ye','yı','yi','yu','yü','da','de','ta','te','ı','i','u','ü','a','e'];

  function simpleStem(raw) {
    const word = normalize(raw).replace(/['’].*$/u,'');
    if (word.length < 5) return word;
    for (const suffix of SUFFIXES) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) return word.slice(0,-suffix.length);
    }
    return word;
  }

  function words(text) {
    const source = String(text || '');
    const re = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,14})?`,'gu');
    const out = [];
    let match;
    while ((match = re.exec(source))) {
      const raw = match[0];
      const norm = normalize(raw.replace(/['’].*$/u,''));
      out.push({raw,norm,stem:simpleStem(norm),start:match.index,end:match.index + raw.length});
    }
    return out;
  }

  function hash(value,seed = 2166136261) {
    let h = seed >>> 0;
    for (const ch of String(value || '')) {
      h ^= ch.codePointAt(0) || 0;
      h = Math.imul(h,16777619) >>> 0;
    }
    return h >>> 0;
  }

  function addFeature(vector,key,weight = 1,offset = 32) {
    const width = VECTOR_SIZE - offset;
    const h = hash(key);
    const index = offset + (h % width);
    const sign = (h & 0x80000000) ? -1 : 1;
    vector[index] += weight * sign;
  }

  function normalizeVector(vector) {
    let sum = 0;
    for (const value of vector) sum += value * value;
    if (!sum) return vector;
    const scale = 1 / Math.sqrt(sum);
    for (let i = 0; i < vector.length; i++) vector[i] *= scale;
    return vector;
  }

  function vectorize(text,options = {}) {
    const vector = new Float32Array(VECTOR_SIZE);
    const tokenList = options.tokens || words(text);
    for (const token of tokenList) {
      if (STOP.has(token.norm) || token.norm.length < 2) continue;
      const weight = token.norm.length >= 7 ? 1.25 : token.norm.length >= 5 ? 1.1 : 1;
      const concepts = new Set([...(WORD_CONCEPTS.get(token.norm) || []),...(WORD_CONCEPTS.get(token.stem) || [])]);
      for (const concept of concepts) {
        const index = CONCEPT_INDEX.get(concept);
        if (index != null && index < 32) vector[index] += 2.4 * weight;
      }
      addFeature(vector,`w:${token.stem}`,1.45 * weight);
      addFeature(vector,`s:${token.norm.slice(0,4)}`,0.7 * weight);
      const chars = `^${token.norm}$`;
      for (let i = 0; i + 2 < chars.length; i++) addFeature(vector,`g:${chars.slice(i,i + 3)}`,0.22 * weight);
    }
    return normalizeVector(vector);
  }

  function cosine(a,b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0;
    let aa = 0;
    let bb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      aa += a[i] * a[i];
      bb += b[i] * b[i];
    }
    if (!aa || !bb) return 0;
    return dot / Math.sqrt(aa * bb);
  }

  function jaccard(a,b) {
    const left = a instanceof Set ? a : new Set(a || []);
    const right = b instanceof Set ? b : new Set(b || []);
    if (!left.size && !right.size) return 1;
    let overlap = 0;
    for (const value of left) if (right.has(value)) overlap++;
    return overlap / Math.max(1,left.size + right.size - overlap);
  }

  function relation(text) {
    const source = normalize(text);
    for (const [name,re] of RELATIONS) if (re.test(source)) return name;
    return 'none';
  }

  function antonymHits(leftText,rightText) {
    const left = new Set(words(leftText).flatMap(token => [token.norm,token.stem]));
    const right = new Set(words(rightText).flatMap(token => [token.norm,token.stem]));
    const out = [];
    for (const [a,b] of ANTONYM_PAIRS) {
      if ((left.has(a) && right.has(b)) || (left.has(b) && right.has(a))) out.push([a,b]);
    }
    return out;
  }

  function conceptProfile(tokenList) {
    const scores = new Map();
    for (const token of tokenList) {
      if (STOP.has(token.norm)) continue;
      const concepts = new Set([...(WORD_CONCEPTS.get(token.norm) || []),...(WORD_CONCEPTS.get(token.stem) || [])]);
      for (const concept of concepts) scores.set(concept,(scores.get(concept) || 0) + 1);
    }
    return [...scores.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0],'tr-TR'));
  }

  function namedEntities(text,tokenList) {
    const out = [];
    for (const token of tokenList) {
      const raw = token.raw.replace(/['’].*$/u,'');
      if (!/^[A-ZÇĞİÖŞÜ]/u.test(raw) || token.start === 0 || STOP.has(token.norm)) continue;
      out.push({text:raw,norm:token.norm,start:token.start,end:token.start + raw.length});
    }
    return out;
  }

  function quantities(text) {
    const source = String(text || '');
    const out = [];
    const re = /(?<![\p{L}\d])(-?\d+(?:[.,]\d+)?)(?:\s*%|\s*(?:adet|tane|kez|defa|kişi|kisi|gün|gun|saat|dakika|tl|lira|dolar|euro))?/gu;
    let match;
    while ((match = re.exec(source))) out.push({raw:match[0],value:Number(match[1].replace(',','.')),start:match.index,end:match.index + match[0].length});
    return out;
  }

  function timeAnchor(tokenList,text) {
    const set = new Set(tokenList.flatMap(token => [token.norm,token.stem]));
    const hits = [];
    for (const [anchor,items] of Object.entries(TIME_WORDS)) {
      if ([...items].some(item => set.has(item) || normalize(text).includes(item))) hits.push(anchor);
    }
    return hits.length === 1 ? hits[0] : hits.length > 1 ? 'mixed' : 'unknown';
  }

  function polarity(tokenList) {
    const values = new Set(tokenList.flatMap(token => [token.norm,token.stem]));
    const positive = ['iyi','güzel','guzel','doğru','dogru','başarılı','basarili','faydalı','faydali','yararlı','yararli','aktif','açık','acik','var','art','arttı','artti','yüksek','yuksek'];
    const negative = ['kötü','kotu','çirkin','cirkin','yanlış','yanlis','başarısız','basarisiz','zararlı','zararli','pasif','kapalı','kapali','yok','azal','azaldı','azaldi','düşük','dusuk','bozuk'];
    let score = 0;
    for (const item of positive) if (values.has(item)) score++;
    for (const item of negative) if (values.has(item)) score--;
    return score > 0 ? 1 : score < 0 ? -1 : 0;
  }

  function profile(text,options = {}) {
    const tokenList = words(text);
    const content = tokenList.filter(token => !STOP.has(token.norm) && !PRONOUNS.has(token.norm));
    const roots = new Set(content.map(token => token.stem));
    const concepts = conceptProfile(content);
    const normSet = new Set(tokenList.map(token => token.norm));
    const negated = tokenList.some(token => NEGATION.has(token.norm) || NEGATION.has(token.stem)) || /(?:m|ma|me)(?:dı|di|du|dü|mış|miş|muş|müş|yor|yacak|yecek|acak|ecek|z)(?:m|n|k|lar|ler)?\b/iu.test(normalize(text));
    const certainty = tokenList.some(token => CERTAIN.has(token.norm)) ? 1 : tokenList.some(token => POSSIBLE.has(token.norm)) ? -1 : 0;
    return {
      text:String(text || ''),
      tokens:tokenList,
      content,
      roots,
      vector:vectorize(text,{tokens:tokenList}),
      concepts,
      conceptSet:new Set(concepts.filter(([,score]) => score > 0).map(([name]) => name)),
      entities:namedEntities(text,tokenList),
      quantities:quantities(text),
      relation:relation(text),
      time:timeAnchor(tokenList,text),
      negated,
      certainty,
      polarity:polarity(tokenList),
      pronouns:tokenList.filter(token => PRONOUNS.has(token.norm)),
      quantifiers:tokenList.filter(token => QUANTIFIERS.has(token.norm)),
      normSet,
      length:String(text || '').length,
      options
    };
  }

  function similarity(left,right) {
    const a = left?.vector ? left : profile(left);
    const b = right?.vector ? right : profile(right);
    const semantic = cosine(a.vector,b.vector);
    const lexical = jaccard(a.roots,b.roots);
    const concepts = jaccard(a.conceptSet,b.conceptSet);
    return Math.max(-1,Math.min(1,semantic * 0.58 + lexical * 0.24 + concepts * 0.18));
  }

  window.WarextSemanticModelV300 = {
    VERSION,
    VECTOR_SIZE,
    normalize,
    words,
    stem:simpleStem,
    vectorize,
    cosine,
    jaccard,
    profile,
    similarity,
    relation,
    antonymHits,
    concepts:CONCEPTS,
    wordConcepts:WORD_CONCEPTS,
    stopwords:STOP,
    pronouns:PRONOUNS,
    antonyms:ANTONYM_PAIRS
  };
})();