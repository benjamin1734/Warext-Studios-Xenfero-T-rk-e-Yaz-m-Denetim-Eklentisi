# Warext Turkish Spell Check V1

XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, morfoloji, noktalama, bağlam ve anlam denetimi eklentisi.

Warext Turkish Spell Check; konu, mesaj ve editör metinlerini yerel dil motoruyla analiz eder. Çalışma zamanında harici NLP API'si, uzak model sunucusu veya üçüncü taraf dil servisi kullanmaz.

## Eklenti içeriği

| Alan | İçerik |
|---|---|
| Yazım denetimi | Türkçe yazım hatalarını tespit eder ve kullanıcı seçimiyle uygulanabilen düzeltme adayları üretir |
| Morfolojik analiz | Kök, ek, kişi, zaman, kip, hâl, olumsuzluk ve çekim yapılarını değerlendirir |
| Dilbilgisi | de/da, ki, soru eki, birleşik-ayrı yazım, kişi uyumu ve Türkçe gramer kurallarını denetler |
| Noktalama | Noktalama işaretleri, boşluklar, giriş ifadeleri, hitaplar ve cümle biçimi kontrolleri yapar |
| Bağlam analizi | Cümle içi, cümlecik içi ve komşu cümle bağlamını denetime dahil eder |
| Anlam denetimi | Özne-yüklem, nesne-fiil ve sözcük sınıfı ilişkilerini değerlendirir |
| Fiil istemi | Fiillerin beklediği özne, nesne ve hâl ilişkilerini kontrol eder |
| Sözcük anlamı ayrıştırma | Çok anlamlı kelimeleri çevre bağlamına göre ayrıştırmaya çalışır |
| Sözdizim çözümleme | Yüklem, özne, nesne, tamlayıcı ve cümlecik sınırları için yerel rol analizi yapar |
| Gönderim çözümleme | Zamirlerle önceki öğeler arasındaki ilişkileri izler |
| Söylem analizi | Zaman, koşul, karşıtlık, neden-sonuç, olumsuzluk ve tutarlılık sinyallerini değerlendirir |
| Deyim ve kalıplar | Türkçe deyim ve kalıplaşmış ifadeleri yerel veri katmanıyla tanır |
| Özel adlar | Yer adları, kurum/özel isimler ve Türkçe apostrof kullanımını destekler |
| Teknik metin koruması | Kod, URL, IP, sürüm, dosya yolu, BBCode, HTML, Markdown ve teknik tokenları korur |
| Uzun metin | Büyük forum içeriklerini parçalı ve önbellekli biçimde analiz eder |
| Özel sözlükler | Kullanıcı ve forum seviyesinde özel kelime desteği sunar |
| Yerel öğrenme | Yanlış pozitif ve kabul edilen öneri geri bildirimlerini aynı XenForo kurulumu içinde kaydedebilir |
| ACP yönetimi | Özel sözlük ve öğrenme kayıtlarını XenForo yönetim panelinden yönetir |

## Teknik detaylar

| Teknik alan | V1 yapısı |
|---|---|
| XenForo desteği | 2.3.0+ |
| Çalışma modeli | Tamamen yerel / local-first |
| Türkçe kelime ve biçim kapsamı | Yaklaşık 528 bin |
| Hunspell kök tabanı | 75 binden fazla |
| Yer adı indeksi | 220 bin |
| Deyim ve kalıp katmanı | 18 binden fazla |
| Dil modeli | Yerel n-gram istatistikleri |
| Anlam motoru | Bilgi grafiği, semantik sınıflar, fiil çerçeveleri ve bağlam kuralları |
| Sözdizim motoru | Hafif yerel dependency/rol çözümleme ve cümlecik farkındalığı |
| Yanlış pozitif kontrolü | Güven kalibrasyonu, bağlam belirsizliği ve kullanıcı geri bildirimi |
| Sözlük mimarisi | Lazy Bloom tabanlı yerel indeks |
| Teknik içerik koruması | URL, e-posta, domain, IP, port, MAC, UUID, hash, sürüm, yol, kod ve işaretleme yapıları |
| Harici runtime bağımlılığı | Yok |
| Harici NLP/API/model gereksinimi | Yok |

## Yerel çalışma

Dil motoru çalışma zamanında harici API, uzak model sunucusu, Python, Java, Docker, WebSocket, EventSource veya üçüncü taraf NLP servisine ihtiyaç duymaz. Gerekli sözlük, yer adı, deyim, dil modeli ve dil kuralları paket içinde yerel olarak çalışır. Kullanıcı geri bildirimi etkinleştirildiğinde yalnızca aynı XenForo kurulumundaki same-origin geri bildirim rotası kullanılır.

## Teknik içerik koruması

URL, e-posta, domain, IPv4, IPv6, host:port, MAC, UUID, hash, sürüm numarası, tarih, saat, sayı biçimleri, Windows/Unix dosya yolları, dosya adları, ortam değişkenleri, CLI seçenekleri, HTML, BBCode, fenced/inline code, Markdown bağlantıları, mention, hashtag ve emoji alanları dil denetiminden korunabilir.

## Kurulum

`Warext-SpellCheck-V1.zip` dosyasını XenForo ACP içindeki **Add-ons → Install/upgrade from archive** bölümünden yükleyin. Eklentinin kullandığı veritabanı yapıları kurulum veya yükseltme sırasında otomatik oluşturulur; manuel SQL içe aktarma gerekmez.

## Lisans ve veri kaynakları

Proje lisansı ve build aşamasında kullanılan açık veri kaynaklarının lisans/atıf bilgileri depo içindeki `LICENSE`, `THIRD_PARTY.md` ve paket içindeki `Resources` dosyalarında bulunur.
