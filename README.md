# Warext Turkish Spell Check 2.0.0

Warext Turkish Spell Check, XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama, morfoloji ve anlam denetim eklentisidir.

## Eklenti detayları

| Başlık | Detay |
|---|---|
| Eklenti | Warext Turkish Spell Check |
| Sürüm | 2.0.0 |
| Platform | XenForo 2.3.0+ |
| Çalışma modeli | XenForo + tarayıcı içinde tamamen yerel çalışma |
| Sunucu tarafı | PHP / XenForo eklenti altyapısı |
| İstemci tarafı | JavaScript tabanlı yerel dil motoru |
| Harici çalışma zamanı API'si | Yok |
| Harici model sunucusu | Yok |
| Python / Java / Docker gereksinimi | Yok |
| Otomatik düzeltme | Yok |
| Düzeltme yöntemi | Kullanıcının öneriye tıklamasıyla |
| Öneri sayısı | Hata başına en fazla 3 öneri |
| Uzun metin desteği | Var |
| Kişisel sözlük | Var |
| Forum özel sözlüğü | Var |
| Oturumluk yok sayma | Var |
| Özel isim desteği | Var |
| Yerel öğrenme sistemi | Var |
| ACP yönetimi | Var |
| Manuel SQL içe aktarma | Gerekmez |

## Özellik kapsamı

| Alan | İçerik |
|---|---|
| Yazım denetimi | Hatalı kelime tespiti, aday üretimi, Türkçe karakter ve klavye yakınlığına göre öneri sıralama |
| Türkçe morfoloji | Kök, ek, çekim, kişi, zaman, kip, hâl ve ek zinciri çözümleme |
| Ses olayları | Ünsüz yumuşaması, ünlü düşmesi, ek uyumları ve yaygın Türkçe biçimbilim dönüşümleri |
| Dilbilgisi | de/da, ki, soru eki, birleşik-ayrı yazım, kişi uyumu ve cümle içi kurallar |
| Noktalama | Cümle sonu, boşluk, noktalama çevresi ve temel yazım biçimi kontrolleri |
| Bağlam analizi | Önceki/sonraki cümle bağlamı, cümle içi kullanım ve bağlama göre yanlış pozitif azaltma |
| Anlam denetimi | Özne-yüklem ve nesne-fiil anlam uyumu, seçilim kısıtları ve fiil istemi |
| Bağımlılık çözümleme | Hafif yerel özne, nesne, yüklem ve tamlayıcı ilişkisi çıkarımı |
| Gönderim çözümleme | Zamir ve önceki öğe ilişkilerini yerel bağlam içinde takip etme |
| Söylem analizi | Zaman çizgisi, neden-sonuç, koşul, karşıtlık, olumsuzluk, kapsam ve kesinlik kontrolleri |
| Deyim farkındalığı | Deyim ve kalıpları literal anlam denetiminden ayırarak yanlış pozitifleri azaltma |
| Özel ad / yer adı | Yer adları ve özel adlar için yerel indeks ve apostrof kontrolleri |
| Uzun metin | Metni cümle/parça bazında işleme, değişen bölümü yeniden kontrol etme ve önbellek kullanma |
| Canlı öneriler | Hata için en fazla üç yerel aday üretme ve kullanıcı tıklamasıyla uygulama |
| Kişisel sözlük | Kullanıcıya özel kabul edilen sözcükleri tarayıcı tarafında saklama |
| Forum sözlüğü | Forum yöneticisinin özel kelime ve özel ad listesi tanımlayabilmesi |
| Yerel öğrenme | Kabul edilen öneriler ve yanlış pozitif geri bildirimlerinden aynı XenForo kurulumu içinde kayıt üretme |
| ACP öğrenme yönetimi | Öğrenme kayıtlarını görüntüleme, silme ve uygun adayları forum sözlüğüne aktarma |

## Teknik mimari

| Bileşen | Teknik yapı |
|---|---|
| Çekirdek sözlük | TDK tabanlı kelime havuzu + Hunspell kök ve ek kurallarından build aşamasında oluşturulan yerel Türkçe biçimler |
| Sözlük erişimi | Lazy Bloom tabanlı kompakt üyelik indeksi |
| Morfoloji motoru | Warext yerel Türkçe kök/ek, ses olayı ve çekim çözümleme katmanı |
| Dilbilgisi motoru | Kural tabanlı yerel gramer ve bağlam denetimi |
| Semantik motor | Sözcük sınıfları, fiil çerçeveleri, özne/nesne uyumu ve bağlam kuralları |
| Yerel bilgi katmanı | Sözcük sınıfları, özellikler, ilişkiler ve fiil istem çerçeveleri |
| Yer adı indeksi | GeoNames verisinden build aşamasında derlenen Bloom tabanlı yerel yer adı indeksi |
| Deyim katmanı | Build aşamasında derlenen yerel Türkçe deyim/kalıp verisi |
| Dil modeli | Türkçe diyalog verisinden build aşamasında üretilen yerel bigram/trigram istatistikleri |
| Mikro model | Yerel sentetik denetim örneklerinden oluşturulan gömülü kabul edilebilirlik modeli |
| Uzun metin motoru | Parçalı analiz, değişim aralığı algılama, bağlamlı cache ve idle-time çalışma |
| Teknik içerik koruması | Kod, URL, adres, sürüm, hash, dosya yolu ve benzeri teknik tokenları denetim dışında tutan koruma katmanı |
| Öğrenme katmanı | XenForo içi same-origin geri bildirim ve yönetilebilir yerel kayıt sistemi |
| Runtime ağ erişimi | Harici ağ servisi yok; öğrenme etkinse yalnızca aynı XenForo kurulumuna same-origin istek |

## Yerel veri ve model kapasitesi

| Veri / Model | Mevcut kapasite |
|---|---:|
| TDK tabanlı temel kelime | 60.711 |
| Hunspell kökü | 75.909 |
| Build aşamasında üretilen Hunspell türevi | 420.000 |
| Ek geçerli biçim havuzu | 467.570 |
| Tahmini toplam geçerli kelime/biçim kapsamı | 528.281 |
| Hunspell ek kuralı | 59.266 |
| Sözlük Bloom bit sayısı | 16.777.216 |
| Sözlük Bloom hash sayısı | 10 |
| Yer adı indeksi | 220.000 |
| Deyim / kalıp girdisi | 18.017 |
| Yerel dil modeli eğitim cümlesi | 48.517 |
| Yerel bigram | 6.775 |
| Yerel trigram | 7.061 |
| Mikro model örneği | 12.020 |
| Mikro model boyutu | 256 özellik |
| Mikro model test örneği | 1.803 |
| Mikro model build test doğruluğu | %100 |

> Mikro model doğruluk değeri, eklentinin build sürecindeki kontrollü yerel test veri kümesine aittir; genel Türkçe dili için evrensel doğruluk iddiası değildir.

## Çalışma zamanı modülleri

| Modül | Görev |
|---|---|
| `bootstrap-v110.js` | Yerel çalışma zamanı bileşenlerini doğru sırada yükler ve başlatır |
| `dictionary-v110.js` | Yazım, aday üretimi ve temel sözlük/morfoloji motorunu sağlar |
| `lexicon-v200.js` | Geniş geçerli biçim havuzuna kompakt üyelik erişimi sağlar |
| `corrections-v110.js` | Yerel düzeltme adayları ve sık hata eşlemelerini sağlar |
| `language-v110.js` | Türkçe biçimbilim ve gelişmiş dil kurallarını uygular |
| `semantic-v110.js` | Temel semantik denetim katmanını sağlar |
| `semantic-deep-v110.js` | Daha derin bağlam ve anlam ilişkilerini işler |
| `semantic-context-v110.js` | Cümleler arası ve yakın bağlam kontrollerini yürütür |
| `entities-v200.js` | Yer adı / varlık üyelik indeksini sağlar |
| `idioms-v200.js` | Deyim ve kalıp farkındalığını sağlar |
| `lm-v200.js` | Yerel n-gram dil modeli istatistiklerini sağlar |
| `micro-model-v200.js` | Gömülü yerel mikro model skorlamasını sağlar |
| `knowledge-v200.js` | Yerel bilgi grafiği, sınıf, ilişki, fiil çerçevesi ve söylem çözümlemesini sağlar |
| `micro-integration-v200.js` | Mikro model sonuçlarını sembolik semantik analizle birleştirir |
| `learning-v200.js` | Yerel kullanıcı geri bildirimi ve öğrenme akışını yönetir |
| `text-core-v110.js` | Teknik içerik koruması, metin bölme ve ortak metin araçlarını sağlar |
| `editor-v110.js` | XenForo editöründe hata işaretleme, öneri gösterme ve tıklamayla düzeltmeyi yönetir |
| `longtext-v110.js` | Uzun metinlerde parçalı ve önbellekli analiz yapar |
| `semantic-ui-v110.js` | Semantik uyarıların kullanıcı arayüzü entegrasyonunu sağlar |

## Teknik içerik koruması

| Korunan içerik | Örnek kapsam |
|---|---|
| URL ve bağlantılar | HTTP/HTTPS/FTP, `www`, Markdown bağlantıları |
| E-posta ve domain | E-posta adresleri, alan adları ve alt alan adları |
| Ağ adresleri | IPv4, IPv6, host:port, MAC adresi |
| Kimlikler | UUID, hash benzeri teknik kimlikler |
| Sürümler | `1.2.3`, `v2.0.0`, prerelease sürüm biçimleri |
| Tarih ve saat | Yaygın tarih biçimleri, 24 saat biçimleri, saniye ve saat dilimi örüntüleri |
| Sayısal değerler | Ondalık/binlik biçimler, yüzde ve para değerleri |
| Dosya sistemleri | Windows ve Unix yolları, dosya adları, dotfile ve ortam değişkenleri |
| Komut satırı | `--option`, `-x` gibi CLI seçenekleri |
| Kod alanları | BBCode code/php/html/icode/plain, fenced code, inline backtick, HTML ve kod sembolleri |
| Forum öğeleri | Mention, hashtag ve benzeri teknik/sosyal tokenlar |
| Emoji | Emoji ve emoticon benzeri alanlar |

## Uzun metin çalışma yapısı

| Özellik | Davranış |
|---|---|
| Metin bölme | Cümle ve paragraf bazlı parçalama |
| Büyük cümleler | Gerektiğinde daha küçük analiz parçalarına ayrılır |
| Değişiklik algılama | Önceki ve yeni metin arasındaki değişen aralığı belirler |
| Yeniden analiz | Değişen parça ve gerekli yakın bağlam tekrar işlenir |
| Bağlam | Önceki ve sonraki cümle bilgisi analize dahil edilir |
| Cache | Değişmeyen parçaların sonuçları yeniden kullanılır |
| Boş zaman işleme | Tarayıcı desteklediğinde `requestIdleCallback`, aksi durumda zamanlayıcı fallback kullanılır |
| İşaretleme | Tespit edilen sorunlar editör üzerinde yerel olarak işaretlenir |
| Düzeltme | Metin yalnızca kullanıcı öneriye tıkladığında değiştirilir |

## Yerel çalışma

Çalışma zamanında harici API, uzak model, Python, Docker, Java NLP servisi, WebSocket, EventSource veya üçüncü taraf ağ servisi kullanılmaz. Kullanıcı geri bildirimi etkinse yalnızca aynı XenForo kurulumundaki `warext-spell-feedback` rotasına same-origin istek gönderilir.

Açık veri kaynakları yalnızca build aşamasında sabit commit/sürümlerden işlenir ve gerekli sonuçlar eklenti paketine yerel varlık olarak derlenir.

## Kurulum

`release/Warext-SpellCheck-2.0.0.zip` dosyasını XenForo ACP üzerinden **Add-ons → Install/upgrade from archive** alanından yükleyin.

Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu/yükseltmesi sırasında oluşturulur.
