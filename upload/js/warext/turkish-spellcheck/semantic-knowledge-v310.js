(() => {
  'use strict';

  if (window.WarextSemanticKnowledgeV310) return;

  const VERSION = '3.1.0';
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const set = value => new Set(String(value || '').split(/\s+/u).map(normalize).filter(Boolean));
  const mapEntries = entries => new Map(entries.map(([key,value]) => [normalize(key),value]));

  const entityKinds = new Map();
  const kindGroups = {
    human:'insan kişi adam kadın erkek çocuk öğrenci öğretmen kullanıcı üye yönetici moderatör çalışan müşteri satıcı alıcı doktor hemşire anne baba kardeş arkadaş ekip oyuncu yazar sürücü yolcu ziyaretçi misafir personel geliştirici programcı mühendis'.split(/\s+/u),
    animal:'hayvan kedi köpek kuş balık at inek koyun keçi tavuk ördek aslan kaplan kurt ayı arı böcek sivrisinek'.split(/\s+/u),
    software:'yazılım uygulama program eklenti plugin mod modül paket sürüm sistem script betik kod api servis framework kütüphane xenforo wordpress veritabanı database site forum tema dosya klasör belge doküman kayıt veri tablo oturum hesap profil'.split(/\s+/u),
    machine:'bilgisayar telefon sunucu cihaz modem router işlemci gpu cpu ram disk ssd hdd monitör klavye fare yazıcı makine motor araç otomobil araba otobüs tren uçak gemi tekne motosiklet'.split(/\s+/u),
    place:'ev okul ofis işyeri şehir ülke oda salon bahçe park hastane market mağaza kütüphane kafe restoran sokak cadde depo bina sınıf laboratuvar sunucuodası garaj mutfak banyo balkon'.split(/\s+/u),
    container:'kutu çanta paket şişe bardak kase kavanoz depo sepet kasa klasör dizin arşiv'.split(/\s+/u),
    document:'kitap makale rapor mesaj yorum konu başlık metin paragraf cümle kelime sözlük form dilekçe sözleşme fatura sipariş bilet not günlük'.split(/\s+/u),
    food:'yemek ekmek et tavuk balık elma armut muz pizza makarna pilav çorba salata peynir yoğurt yumurta kahve çay süt içecek su'.split(/\s+/u),
    abstract:'fikir karar plan amaç hedef niyet sorun hata çözüm öneri düşünce bilgi haber olay durum sebep neden sonuç ilişki anlam mantık güvenlik risk izin yetki başarı başarısızlık kalite performans hız zaman fiyat ücret bakiye kredi'.split(/\s+/u),
    access:'kapı pencere geçit giriş çıkış kilit bariyer turnike bağlantı port oturum kanal rota yol'.split(/\s+/u),
    light:'ışık lamba ampul ekran monitör projektör'.split(/\s+/u),
    account:'hesap kullanıcı profil oturum üyelik abonelik davet kodu bağlantı token anahtar parola şifre'.split(/\s+/u),
    transaction:'ödeme sipariş satış satınalma iade transfer işlem kupon bakiye fatura'.split(/\s+/u),
    network:'internet ağ bağlantı wifi ethernet vpn dns port socket proxy cdn trafik sunucu modem router'.split(/\s+/u),
    file:'dosya klasör dizin arşiv paket zip json xml php javascript js css html belge resim görsel video'.split(/\s+/u),
    weather:'hava yağmur kar rüzgâr güneş fırtına sis sıcaklık'.split(/\s+/u),
    body:'baş kol el ayak göz kulak ağız kalp mide akciğer beden vücut'.split(/\s+/u)
  };
  for (const [kind,words] of Object.entries(kindGroups)) for (const word of words) {
    const key = normalize(word);
    if (!entityKinds.has(key)) entityKinds.set(key,new Set());
    entityKinds.get(key).add(kind);
  }

  const stateFamilies = {
    openness:{positive:set('açık acik açılmış acilmis açıldı acildi'),negative:set('kapalı kapali kapanmış kapanmis kapandı kapandi')},
    existence:{positive:set('var mevcut bulunuyor kaldı kaldi duruyor'),negative:set('yok eksik silindi silinmiş silinmis kaldırıldı kaldirildi kaldırılmış kaldirilmis bulunmuyor kalmadı kalmadi')},
    activity:{positive:set('aktif çalışıyor calisiyor çalışır calisir açık acik çevrimiçi cevrimici online'),negative:set('pasif durmuş durmus kapalı kapali çevrimdışı cevrimdisi offline devredışı devredisi')},
    correctness:{positive:set('doğru dogru geçerli gecerli doğrulanmış dogrulanmis'),negative:set('yanlış yanlis geçersiz gecersiz hatalı hatali bozuk')},
    success:{positive:set('başarılı basarili tamamlandı tamamlandi gerçekleşti gerceklesti onaylandı onaylandi'),negative:set('başarısız basarisiz başarısızlık basarisizlik reddedildi iptal başarısızoldu basarisizoldu')},
    fullness:{positive:set('dolu dolmuş dolmus'),negative:set('boş bos boşalmış bosalmis')},
    availability:{positive:set('hazır hazir kullanılabilir kullanilabilir erişilebilir erisilebilir müsait musait'),negative:set('hazırdeğil hazirdegil kullanılamaz kullanilamaz erişilemez erisilemez müsaitdeğil musaitdegil')},
    lock:{positive:set('kilitli kilitlenmiş kilitlenmis'),negative:set('kilitsiz kilidiaçık kilidiacik açılmış acilmis')},
    connectivity:{positive:set('bağlı bagli bağlıydı bagliydi bağlandı baglandi çevrimiçi cevrimici online'),negative:set('bağlantısız baglantisiz koptu kopuk çevrimdışı cevrimdisi offline bağlanmadı baglanmadi')},
    visibility:{positive:set('görünür gorunur görünüyor gorunuyor görüntülendi goruntulendi'),negative:set('gizli görünmez gorunmez görünmüyor gorunmuyor')},
    permission:{positive:set('izinli yetkili erişimli erisimli onaylı onayli'),negative:set('izinsiz yetkisiz engelli yasaklı yasakli reddedilmiş reddedilmis')},
    health:{positive:set('sağlıklı saglikli iyi iyileşti iyilesti sağlam saglam'),negative:set('hasta yaralı yarali bozuk kötü kotu')},
    alive:{positive:set('canlı canli yaşıyor yasiyor hayatta'),negative:set('ölü olu öldü oldu yaşamıyor yasamiyor')},
    temperature:{positive:set('sıcak sicak ısındı isindi'),negative:set('soğuk soguk soğudu sogudu')},
    level:{positive:set('yüksek yuksek arttı artti artıyor artiyor fazla'),negative:set('düşük dusuk azaldı azaldi azalıyor azaliyor az')},
    approval:{positive:set('kabul onaylandı onaylandi onaylı onayli'),negative:set('ret reddedildi reddedilmiş reddedilmis')},
    enabled:{positive:set('etkin etkinleştirildi etkinlestirildi açık acik aktif'),negative:set('devredışı devredisi pasif kapalı kapali etkisiz')},
    possession:{positive:set('sahip var yanında yaninda elinde'),negative:set('sahipdeğil sahipdegil yok')}
  };

  const stateIndex = new Map();
  for (const [family,values] of Object.entries(stateFamilies)) {
    for (const value of values.positive) {
      if (!stateIndex.has(value)) stateIndex.set(value,[]);
      stateIndex.get(value).push({family,value:'positive'});
    }
    for (const value of values.negative) {
      if (!stateIndex.has(value)) stateIndex.set(value,[]);
      stateIndex.get(value).push({family,value:'negative'});
    }
  }

  const predicates = mapEntries([
    ['aç',{subjects:['human','machine','software'],objects:['access','file','software','account'],effects:[['openness','positive']]}],
    ['kapat',{subjects:['human','machine','software'],objects:['access','software','machine','account'],effects:[['openness','negative'],['activity','negative']]}],
    ['başlat',{subjects:['human','software','machine'],objects:['software','machine','abstract'],effects:[['activity','positive']]}],
    ['durdur',{subjects:['human','software','machine'],objects:['software','machine','abstract'],effects:[['activity','negative']]}],
    ['sil',{subjects:['human','software'],objects:['file','software','account','document'],effects:[['existence','negative']]}],
    ['oluştur',{subjects:['human','software'],objects:['file','software','account','document','abstract'],effects:[['existence','positive']]}],
    ['ekle',{subjects:['human','software'],objects:['file','software','account','document','abstract'],effects:[['existence','positive']]}],
    ['kaldır',{subjects:['human','software'],objects:['file','software','account','document','abstract'],effects:[['existence','negative']]}],
    ['yükle',{subjects:['human','software'],objects:['file','software'],effects:[['existence','positive']]}],
    ['indir',{subjects:['human','software'],objects:['file','software'],effects:[['existence','positive']]}],
    ['bağlan',{subjects:['human','software','machine'],objects:['network','machine','software'],effects:[['connectivity','positive']]}],
    ['kop',{subjects:['network','machine','software'],objects:['network'],effects:[['connectivity','negative']]}],
    ['kilitle',{subjects:['human','software'],objects:['access','file','account'],effects:[['lock','positive']]}],
    ['kilidiaç',{subjects:['human','software'],objects:['access','file','account'],effects:[['lock','negative']]}],
    ['onayla',{subjects:['human','software'],objects:['transaction','account','abstract'],effects:[['approval','positive'],['success','positive']]}],
    ['reddet',{subjects:['human','software'],objects:['transaction','account','abstract'],effects:[['approval','negative'],['success','negative']]}],
    ['başar',{subjects:['human','software','machine'],objects:['abstract'],effects:[['success','positive']]}],
    ['başarısız',{subjects:['human','software','machine'],objects:['abstract'],effects:[['success','negative']]}],
    ['öl',{subjects:['human','animal'],objects:[],effects:[['alive','negative']]}],
    ['yaşa',{subjects:['human','animal'],objects:[],effects:[['alive','positive']]}],
    ['ye',{subjects:['human','animal'],objects:['food'],effects:[]}],
    ['iç',{subjects:['human','animal'],objects:['food'],effects:[]}],
    ['yürü',{subjects:['human','animal'],objects:['place'],effects:[]}],
    ['koş',{subjects:['human','animal'],objects:['place'],effects:[]}],
    ['konuş',{subjects:['human'],objects:['human','abstract'],effects:[]}],
    ['söyle',{subjects:['human'],objects:['human','abstract'],effects:[]}],
    ['düşün',{subjects:['human'],objects:['abstract'],effects:[]}],
    ['kararver',{subjects:['human','team'],objects:['abstract'],effects:[]}],
    ['satınal',{subjects:['human','account'],objects:['transaction','software','document','food','machine'],effects:[['possession','positive']]}],
    ['öde',{subjects:['human','account'],objects:['transaction'],effects:[['success','positive']]}],
    ['göster',{subjects:['human','software','machine'],objects:['document','file','abstract'],effects:[['visibility','positive']]}],
    ['gizle',{subjects:['human','software'],objects:['document','file','account'],effects:[['visibility','negative']]}],
    ['etkinleştir',{subjects:['human','software'],objects:['software','account','abstract'],effects:[['enabled','positive']]}],
    ['devredışıbırak',{subjects:['human','software'],objects:['software','account','abstract'],effects:[['enabled','negative']]}]
  ]);

  const predicateAliases = mapEntries([
    ['açtı','aç'],['açıldı','aç'],['açıyor','aç'],['açmak','aç'],['ac','aç'],['acti','aç'],['acildi','aç'],
    ['kapattı','kapat'],['kapandı','kapat'],['kapatmak','kapat'],['kapali','kapat'],['kapalı','kapat'],
    ['başladı','başlat'],['başlattı','başlat'],['çalıştırdı','başlat'],['calistirdi','başlat'],
    ['durdu','durdur'],['durdurdu','durdur'],['kapandı','durdur'],['çalışmadı','durdur'],['calismadi','durdur'],
    ['sildi','sil'],['silindi','sil'],['silmek','sil'],['kaldırdı','kaldır'],['kaldirildi','kaldır'],['kaldırıldı','kaldır'],
    ['oluşturdu','oluştur'],['olusturdu','oluştur'],['yarattı','oluştur'],['yaratıldı','oluştur'],
    ['ekledi','ekle'],['eklendi','ekle'],['yükledi','yükle'],['yukledi','yükle'],['yüklendi','yükle'],['yuklendi','yükle'],
    ['indirdi','indir'],['indirildi','indir'],['bağlandı','bağlan'],['baglandi','bağlan'],['bağlanıyor','bağlan'],['baglaniyor','bağlan'],
    ['koptu','kop'],['kopmuş','kop'],['kopmus','kop'],['kilitledi','kilitle'],['kilitlendi','kilitle'],
    ['onayladı','onayla'],['onaylandi','onayla'],['onaylandı','onayla'],['reddetti','reddet'],['reddedildi','reddet'],
    ['öldü','öl'],['ölmüş','öl'],['olmus','öl'],['yaşıyor','yaşa'],['yasiyor','yaşa'],['yaşadı','yaşa'],['yasadi','yaşa'],
    ['yedi','ye'],['yemek','ye'],['içti','iç'],['icti','iç'],['yürüdü','yürü'],['yurudu','yürü'],['koştu','koş'],['kosti','koş'],
    ['konuştu','konuş'],['konustu','konuş'],['söyledi','söyle'],['soyledi','söyle'],['düşündü','düşün'],['dusundu','düşün'],
    ['satınaldı','satınal'],['satın aldı','satınal'],['satin aldi','satınal'],['ödedi','öde'],['odedi','öde'],
    ['gösterdi','göster'],['gosterdi','göster'],['gizledi','gizle'],['etkinleştirdi','etkinleştir'],['etkinlestirdi','etkinleştir']
  ]);

  const causalLinks = [
    ['elektrik kes','kapat',0.96],['elektrik kes','durdur',0.94],['güç kes','kapat',0.96],['guc kes','kapat',0.96],
    ['internet kes','kop',0.96],['ağ kes','kop',0.94],['ag kes','kop',0.94],['bağlantı kes','kop',0.96],['baglanti kes','kop',0.96],
    ['şifre yanlış','reddet',0.91],['sifre yanlis','reddet',0.91],['yetki yok','reddet',0.94],['izin yok','reddet',0.94],
    ['disk dolu','başarısız',0.9],['depolama dolu','başarısız',0.9],['hata oluş','başarısız',0.86],['hata olus','başarısız',0.86],
    ['dosya sil','existence:negative',0.98],['hesap sil','existence:negative',0.98],['kapı kilit','openness:negative',0.82],['kapi kilit','openness:negative',0.82],
    ['ödeme başarılı','onayla',0.9],['odeme basarili','onayla',0.9],['ödeme başarısız','reddet',0.9],['odeme basarisiz','reddet',0.9],
    ['yağmur yağ','ıslak',0.84],['yagmur yag','islak',0.84],['ateş yüksek','hasta',0.72],['ates yuksek','hasta',0.72]
  ].map(([cause,effect,weight]) => ({cause:normalize(cause),effect:normalize(effect),weight}));

  const transitionPredicates = set('aç kapat başlat durdur sil oluştur ekle kaldır yükle indir bağlan kop kilitle kilidiaç onayla reddet öl doğ iyileş bozul art azal değiş dönüştür etkinleştir devredışıbırak'.replace(/ /g,' '));
  const transitionMarkers = /\b(?:sonra|daha sonra|ardından|ardindan|sonradan|artık|artik|başta|basta|önceden|onceden|ilk başta|ilk basta|zamanla|bir süre sonra|bir sure sonra|yeniden|tekrar|değişti|degisti|dönüştü|donustu|güncellendi|guncellendi)\b/iu;
  const conditionalMarkers = /\b(?:eğer|eger|şayet|sayet|ise|olsaydı|olsaydi|olursa|olduğunda|oldugunda|durumunda|koşuluyla|kosuluyla)\b/iu;
  const hypotheticalMarkers = /\b(?:belki|muhtemelen|galiba|sanırım|sanirim|olabilir|olmalı|olmali|bekleniyor|tahminen|ihtimal|varsayalım|varsayalim)\b/iu;
  const questionMarkers = /\?\s*$/u;
  const quoteMarkers = /(?:^|\s)(?:dedi|söyledi|soyledi|yazdı|yazdi|belirtti|iddia etti|iddiaetti)(?:\s|$)/iu;
  const negationMarkers = /\b(?:değil|degil|yok|hayır|hayir|asla|hiçbir zaman|hicbir zaman)\b|(?:ma|me)(?:dı|di|du|dü|mış|miş|muş|müş|yor|z|yacak|yecek|acak|ecek)(?:m|n|k|ız|iz|uz|üz|sın|sin|sun|sün|lar|ler)?\b/iu;
  const exactQuantifiers = set('tam kesin yalnızca sadece toplam net');
  const universalQuantifiers = set('her bütün tüm hepsi herkes daima sürekli herzaman');
  const zeroQuantifiers = set('hiç hiçbir sıfır yok');
  const existentialQuantifiers = set('bir bazı birkaç kimi enaz en az');
  const adversatives = /\b(?:ama|ancak|fakat|oysa|oysaki|buna rağmen|buna ragmen|karşın|karsin)\b/iu;
  const causalMarkers = /\b(?:çünkü|cunku|zira|nedeniyle|sebebiyle|dolayı|dolayi|olduğu için|oldugu icin|bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|sonuç olarak|sonuc olarak)\b/iu;
  const resultStart = /^\s*(?:bu yüzden|bu yuzden|dolayısıyla|dolayisiyla|bu nedenle|bu sebeple|bundan dolayı|bundan dolayi|sonuç olarak|sonuc olarak)\b/iu;
  const referenceStart = /^\s*(?:bu|şu|o|bunlar|şunlar|onlar|bunu|şunu|onu|buna|şuna|ona|bundan|şundan|ondan|bunun|şunun|onun|bu durum|bu olay|bu karar|bu sorun|bu sonuç|bu sonuc)\b/iu;

  const synonymGroups = [
    'sunucu server',
    'bilgisayar pc bilgisayarım bilgisayarim',
    'telefon mobil ceptelefonu',
    'otomobil araba araç arac',
    'uygulama program yazılım yazilim',
    'eklenti plugin addon',
    'hesap üyelik uyelik account',
    'dosya file belge doküman dokuman',
    'klasör dizin folder',
    'parola şifre sifre password',
    'kullanıcı üye uye user',
    'yönetici yonetici admin',
    'bağlantı baglanti connection',
    'ağ ag network',
    'mağaza magaza market',
    'ürün urun product',
    'satınalma satınalım satinalma satınalma',
    'hata sorun problem',
    'neden sebep gerekçe gerekce',
    'sonuç sonuc netice',
    'kapı kapi geçit gecit',
    'oda bölüm bolum alan',
    'kitap eser',
    'mesaj ileti iletişim iletisim',
    'cevap yanıt yanit',
    'başarı basari başarı',
    'başarısızlık basarisizlik hata',
    'sil kaldır kaldir temizle',
    'başlat çalıştır baslat calistir',
    'durdur kapat sonlandır sonlandir',
    'bağlan baglan eriş eris',
    'kop kesil ayrıl ayril',
    'oluştur olustur yarat üret uret',
    'ekle dahil et dahil',
    'göster goster görüntüle goruntule',
    'gizle sakla'
  ].map(group => new Set(group.split(/\s+/u).map(normalize)));
  const synonymIndex = new Map();
  synonymGroups.forEach((group,index) => { for (const item of group) { if (!synonymIndex.has(item)) synonymIndex.set(item,new Set()); synonymIndex.get(item).add(index); } });

  function equivalent(a,b) {
    const left = normalize(a);
    const right = normalize(b);
    if (!left || !right) return false;
    if (left === right) return true;
    const ai = synonymIndex.get(left);
    const bi = synonymIndex.get(right);
    if (ai && bi) for (const index of ai) if (bi.has(index)) return true;
    return false;
  }

  function canonicalLexeme(raw) {
    const value = normalize(raw);
    const indexes = synonymIndex.get(value);
    if (!indexes?.size) return value;
    const index = [...indexes].sort((a,b) => a - b)[0];
    const group = synonymGroups[index];
    return group?.values().next().value || value;
  }

  function kindsFor(word) {
    const key = normalize(word);
    const out = new Set(entityKinds.get(key) || []);
    for (const [known,kinds] of entityKinds) {
      if (known.length >= 4 && key.length >= 4 && (key.startsWith(known) || known.startsWith(key))) for (const kind of kinds) out.add(kind);
    }
    return out;
  }

  function canonicalPredicate(raw) {
    const value = normalize(raw).replace(/['’].*$/u,'');
    if (predicates.has(value)) return value;
    if (predicateAliases.has(value)) return predicateAliases.get(value);
    for (const [alias,target] of predicateAliases) if (alias.length >= 4 && (value.startsWith(alias) || alias.startsWith(value))) return target;
    for (const key of predicates.keys()) if (key.length >= 4 && (value.startsWith(key) || key.startsWith(value))) return key;
    return value;
  }

  function statesFor(raw) {
    const value = normalize(raw);
    const out = [];
    for (const [lexeme,items] of stateIndex) if (value === lexeme || (Math.min(value.length,lexeme.length) >= 4 && (value.startsWith(lexeme) || lexeme.startsWith(value)))) out.push(...items);
    return out;
  }

  function frameFor(raw) {
    return predicates.get(canonicalPredicate(raw)) || null;
  }

  function causalSupport(causeText,effectPredicate,effectState = '') {
    const cause = normalize(causeText);
    const effect = normalize(effectPredicate);
    let best = 0;
    for (const link of causalLinks) {
      const causeParts = link.cause.split(/\s+/u);
      if (!causeParts.every(part => cause.includes(part))) continue;
      if (link.effect.includes(':')) {
        if (effectState && link.effect === normalize(effectState)) best = Math.max(best,link.weight);
      } else {
        const target = canonicalPredicate(link.effect);
        if (target === canonicalPredicate(effect)) best = Math.max(best,link.weight);
      }
    }
    return best;
  }

  window.WarextSemanticKnowledgeV310 = {
    VERSION,
    normalize,
    entityKinds,
    kindGroups,
    stateFamilies,
    stateIndex,
    predicates,
    predicateAliases,
    causalLinks,
    transitionPredicates,
    transitionMarkers,
    conditionalMarkers,
    hypotheticalMarkers,
    questionMarkers,
    quoteMarkers,
    negationMarkers,
    exactQuantifiers,
    universalQuantifiers,
    zeroQuantifiers,
    existentialQuantifiers,
    adversatives,
    causalMarkers,
    resultStart,
    referenceStart,
    kindsFor,
    canonicalPredicate,
    statesFor,
    frameFor,
    causalSupport,
    synonymGroups,
    synonymIndex,
    equivalent,
    canonicalLexeme
  };
})();