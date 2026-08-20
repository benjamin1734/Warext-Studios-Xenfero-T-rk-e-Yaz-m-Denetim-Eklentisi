# Warext Turkish Spell Check 2.2.0

XenForo 2.3.0+ için tamamen yerel çalışan gelişmiş Türkçe yazım, dilbilgisi, morfoloji, noktalama ve anlam denetim eklentisi.

Warext Turkish Spell Check; forum mesajları, konu içerikleri ve XenForo editöründeki Türkçe metinleri yazım kurallarından cümle anlamına kadar birden fazla dil katmanında analiz eder. Çalışma zamanında harici API veya uzak NLP servisi gerektirmez ve kullanıcı metnini üçüncü taraf servislere göndermez.

## Eklenti içeriği

| Alan | İçerik |
|---|---|
| Yazım denetimi | Türkçe yazım hatalarının tespiti ve bağlama uygun düzeltme adayları |
| Morfolojik analiz | Kök, ek, kişi, zaman, kip, hâl, olumsuzluk ve çekim yapılarının analizi |
| Dilbilgisi | de/da, ki, soru eki, birleşik-ayrı yazım, kişi uyumu ve Türkçe gramer kuralları |
| Noktalama | Noktalama işaretleri, boşluk kullanımı, giriş ifadeleri, hitap yapıları, resmî hitaplar ve cümle biçimi kontrolleri |
| Bağlam analizi | Cümle içi, cümlecik içi ve komşu cümlelerden yararlanarak bağlama duyarlı denetim |
| Anlam denetimi | Özne-yüklem, nesne-fiil ve sözcük sınıfı ilişkilerinin değerlendirilmesi |
| Fiil istemi | Fiillerin beklediği özne, nesne ve hâl ilişkilerinin kontrolü |
| Çok anlamlı kelimeler | Sözcük anlamının daha geniş bağlam penceresinde ayrıştırılması ve belirsizliğin uyarı güvenine yansıtılması |
| Sözdizim | Cümlecik sınırları, yüklem, özne, nesne ve tamlayıcı adaylarının yerel olarak sıralanması |
| Gönderim çözümleme | Zamir ve önceki öğeler arasındaki ilişkinin bağlam içinde izlenmesi |
| Söylem analizi | Zaman, koşul, karşıtlık, neden-sonuç, olumsuzluk ve mantıksal tutarlılık denetimi |
| Deyim ve kalıplar | Türkçe deyimlerin ve kalıplaşmış ifadelerin yerel olarak tanınması |
| Özel adlar | Yer adları, kurum/özel isimler ve Türkçe apostrof kullanımının desteklenmesi |
| Teknik metin koruması | Kod, URL, IP, sürüm, dosya yolu, BBCode, HTML, Markdown ve teknik tokenların korunması |
| Uzun metin | Uzun forum içeriklerinde parçalı ve önbellekli analiz |
| Özel sözlükler | Kullanıcı ve forum seviyesinde özel kelime desteği |
| Yerel öğrenme | Yanlış pozitif ve kabul edilen düzeltme geri bildirimlerinden yerel kayıt üretme |
| ACP yönetimi | Özel sözlük ve öğrenme kayıtlarının XenForo yönetim panelinden yönetilmesi |

## Teknik kapasite

| Teknik alan | Mevcut yapı |
|---|---:|
| Sürüm | 2.2.0 |
| XenForo desteği | 2.3.0+ |
| Çalışma modeli | Tamamen yerel / local-first |
| Tahmini geçerli Türkçe kelime ve biçim kapsamı | 528.281 |
| Build sırasında üretilen Hunspell türevi | 420.000 |
| Hunspell kökü | 75.909 |
| Hunspell affix kuralı | 59.266 |
| Yer adı indeksi | 220.000 |
| Deyim ve kalıp girdisi | 18.017 |
| Yerel dil modeli cümlesi | 48.517 |
| Bigram | 6.775 |
| Trigram | 7.061 |
| Gömülü mikro model örneği | 12.020 |
| Doğal Türkçe false-positive benchmarkı | 5.000+ cümle |
| UD Turkish BOUN dependency benchmarkı | 981 uygun cümle |
| Sözlük mimarisi | Lazy Bloom |
| Harici runtime bağımlılığı | Yok |

## 2.2 kalite geliştirmeleri

2.2 sürümü sözdizim, çok anlamlı kelime çözümleme ve gerçek corpus doğrulamasına odaklanır. Bağlam pencereli WSD genişletildi; cümlecik sınırlarını dikkate alan yerel sözdizim raporu, özne/nesne rol sıralaması ve yüksek güvenli özne toparlama kuralları eklendi.

Noktalama katmanı söylem girişleri ve resmî hitap yapılarıyla genişletildi. Semantik güven kalibrasyonu; kelime ve kural bazlı yanlış pozitif geçmişini, teknik metin yoğunluğunu, bağlamsal anlam belirsizliğini ve cümle karmaşıklığını birlikte değerlendirebilir.

Dependency geliştirmeleri yalnız sentetik örneklerle ölçülmez. CI zinciri sabitlenmiş UD Turkish BOUN verisinin geliştirme ve test kümelerini yalnız doğrulama amacıyla kullanır. Bu veri eklentinin çalışma zamanına veya dağıtım paketine eklenmez. 2.2 doğrulama turunda 981 uygun gerçek Türkçe cümlede parser çalışma hatası üretmeden benchmarkı tamamlamıştır.

## 2.1 kalite geliştirmeleri

2.1 sürümü; yüksek güvenli giriş ve hitap noktalama kontrolleri, daha geniş bağlamsal sözcük anlamı ayrıştırma, semantik uyarılarda yanlış pozitif azaltmaya yönelik güven kalibrasyonu ve dependency rol adaylarının yeniden sıralanması üzerine yoğunlaşır.

Semantik uyarı güveni; çok anlamlı sözcük bağlamı, deyim varlığı, cümle karmaşıklığı, teknik metin yoğunluğu ve kullanıcının daha önce bildirdiği yanlış pozitifler dikkate alınarak yeniden değerlendirilir. Böylece açık anlam hataları korunurken belirsiz cümlelerde gereksiz yüksek güvenli uyarıların azaltılması hedeflenir.

Build sürecinde gerçek günlük diyaloglardan seçilen en az 5.000 temiz Türkçe cümle üzerinde ayrıca yüksek güvenli semantik yanlış pozitif oranı ölçülür.

## Öne çıkan özellikler

- Yazım, dilbilgisi, morfoloji ve anlam denetiminin tek XenForo eklentisinde birleşmesi
- Cümlenin yalnızca kelime doğruluğunu değil, özne-nesne-fiil ilişkilerini de değerlendiren yerel semantik katman
- Cümlecik sınırları ve sözcük sırasını dikkate alan hafif yerel sözdizim çözümleme
- Çok anlamlı kelimeler, fiil istemleri, zamir/gönderim ilişkileri ve cümleler arası bağlam desteği
- 220 bin yer adı ile 18 binden fazla deyim ve kalıp içeren yerel veri katmanı
- Sembolik Türkçe dil kuralları, yerel n-gram istatistikleri ve gömülü mikro modelin birlikte kullanılması
- Teknik forum metinlerinde kod ve altyapı öğelerini yanlış yazım olarak değerlendirmemeye yönelik koruma sistemi
- Uzun içeriklerde tekrar analizi azaltan parçalı ve önbellekli yapı
- XenForo ACP ile bütünleşik özel sözlük ve yerel öğrenme yönetimi
- Kullanıcı metnini üçüncü taraf servislere göndermeyen bağımsız çalışma yapısı

## Teknik içerik koruması

Eklenti; URL, e-posta, domain, IPv4, IPv6, host:port, MAC, UUID, hash, sürüm numarası, tarih, saat, sayı biçimleri, Windows/Unix dosya yolları, dosya adları, ortam değişkenleri, CLI seçenekleri, HTML, BBCode, fenced/inline code, Markdown bağlantıları, mention, hashtag ve emoji gibi teknik alanları Türkçe dil denetiminden koruyabilir.

## Yerel çalışma

Dil motoru çalışma zamanında harici API, uzak model sunucusu, Python, Java, Docker, WebSocket, EventSource veya üçüncü taraf NLP servisine ihtiyaç duymaz. Gerekli sözlük, yer adı, deyim, dil modeli ve diğer dil kaynakları eklentiyle birlikte yerel olarak çalışır.

## Kurulum

`Warext-SpellCheck-2.2.0.zip` paketini XenForo ACP üzerindeki **Add-ons → Install/upgrade from archive** bölümünden yükleyebilirsiniz. Gerekli veritabanı yapıları eklenti kurulumu veya yükseltmesi sırasında oluşturulur.
