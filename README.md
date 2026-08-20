# Warext Turkish Spell Check 2.0.0

XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, morfoloji, noktalama ve anlam denetim eklentisi.

Warext Turkish Spell Check; forum mesajları, konu içerikleri ve editör metinlerinde Türkçe hataları tespit eder, en fazla üç düzeltme önerisi sunar ve metni yalnızca kullanıcı öneriye tıkladığında değiştirir. Çalışma zamanında harici API, uzak model sunucusu, Python, Java veya Docker gerektirmez.

## Eklenti içeriği

| Alan | İçerik |
|---|---|
| Yazım denetimi | Hatalı kelime tespiti, Türkçe karakter farkları, klavye yakınlığı ve öneri sıralama |
| Morfoloji | Kök, ek, kişi, zaman, kip, hâl, olumsuzluk ve çekim yapılarının analizi |
| Bileşik zamanlar | Bileşik zaman ve kişi uyumu kontrolleri |
| Dilbilgisi | de/da, ki, soru eki, birleşik-ayrı yazım ve kişi uyumu kuralları |
| Noktalama | Noktalama çevresi boşlukları, tekrarlar, cümle sonları ve temel biçim kontrolleri |
| Bağlam denetimi | Önceki ve sonraki cümlelerden yararlanarak yüksek güvenli bağlam hatalarını değerlendirme |
| Anlam denetimi | Özne-yüklem, nesne-fiil ve sözcük sınıfı uyumsuzluklarını değerlendirme |
| Fiil istemi | Fiilin beklediği özne, nesne ve hâl ilişkilerini kontrol etme |
| Çok anlamlı kelimeler | Yakın bağlama göre sözcük anlamı ayrıştırma |
| Gönderim çözümleme | Zamir ve önceki öğe ilişkilerini bağlam içinde takip etme |
| Söylem denetimi | Zaman, koşul, karşıtlık, neden-sonuç, olumsuzluk ve çelişki kontrolleri |
| Deyim farkındalığı | Deyim ve kalıpları literal anlam hatası olarak işaretlememek için yerel deyim verisi |
| Özel ad desteği | Yer adı ve özel isim tanıma, apostrof kullanımı ve özel ad koruması |
| Teknik metin koruması | URL, e-posta, IP, port, sürüm, hash, dosya yolu, BBCode, HTML, Markdown, kod ve benzeri teknik içerikleri koruma |
| Uzun metin desteği | Uzun forum mesajları ve rehberlerde parçalı ve önbellekli denetim |
| Kişisel sözlük | Kullanıcının kabul ettiği özel kelimeleri saklama |
| Forum sözlüğü | Yönetici tarafından özel kelime ve özel ad tanımlama |
| Oturumluk yok sayma | Kullanıcının belirli uyarıları geçici olarak yok sayabilmesi |
| Yerel öğrenme | Kabul edilen öneri ve yanlış pozitif geri bildirimlerinden aynı XenForo kurulumu içinde kayıt üretme |
| ACP yönetimi | Öğrenme kayıtlarını görüntüleme, silme ve uygun adayları forum sözlüğüne aktarma |

## Teknik detaylar

| Teknik başlık | Değer |
|---|---:|
| Sürüm | 2.0.0 |
| XenForo version_id | 5000070 |
| Minimum XenForo | 2.3.0+ |
| Sunucu tarafı | PHP / XenForo eklenti sistemi |
| Tarayıcı tarafı | JavaScript yerel dil motoru |
| Çalışma modeli | Local-first / tamamen yerel runtime |
| Harici runtime API | Yok |
| Harici model sunucusu | Yok |
| Python / Java / Docker gereksinimi | Yok |
| Otomatik düzeltme | Yok |
| Öneri sayısı | Hata başına en fazla 3 |
| TDK tabanlı temel kelime | 60.711 |
| Hunspell kökü | 75.909 |
| Build aşamasında üretilen Hunspell biçimi | 420.000 |
| Ek geçerli biçim havuzu | 467.570 |
| Tahmini toplam geçerli kelime/biçim | 528.281 |
| Hunspell affix kuralı | 59.266 |
| Yer adı indeksi | 220.000 |
| Deyim / kalıp girdisi | 18.017 |
| Yerel dil modeli cümlesi | 48.517 |
| Bigram | 6.775 |
| Trigram | 7.061 |
| Mikro model örneği | 12.020 |
| Mikro model özellik boyutu | 256 |
| Mikro model kontrollü build test örneği | 1.803 |
| Mikro model kontrollü build test doğruluğu | %100 |
| Sözlük mimarisi | Lazy Bloom |
| Manuel SQL içe aktarma | Gerekmez |

> Mikro model doğruluk değeri kontrollü build/test veri kümesine aittir ve genel Türkçe için evrensel doğruluk iddiası değildir.

## Öne çıkan özellikler

- XenForo editörüyle doğrudan entegrasyon
- Yazım, gramer, morfoloji ve anlam denetiminin tek eklentide birleşmesi
- Teknik forum içeriklerinde kod ve altyapı terimlerini koruyan özel metin filtresi
- 220 bin yer adı ve 18 binden fazla deyim/kalıp içeren yerel veri katmanı
- Sembolik dil kuralları, yerel n-gram istatistikleri ve gömülü mikro modelin birlikte kullanılması
- Uzun metinlerde gereksiz tekrar analizini azaltan önbellekli yapı
- Kullanıcı tıklaması olmadan metni değiştirmeyen güvenli düzeltme sistemi
- Kişisel sözlük, forum özel sözlüğü ve oturumluk yok sayma desteği
- ACP üzerinden yerel öğrenme kayıtlarının yönetimi
- Kullanıcı metnini üçüncü taraf servislere göndermeyen yerel çalışma yapısı

## Teknik içerik koruması

Eklenti; URL, e-posta, domain, IPv4, IPv6, host:port, MAC, UUID, hash, sürüm numarası, tarih, saat, yüzde, para, Windows/Unix dosya yolu, dosya adı, dotfile, ortam değişkeni, CLI seçeneği, HTML, BBCode, fenced/inline code, Markdown bağlantısı, mention, hashtag ve emoji gibi alanları Türkçe kelime denetiminin dışında tutabilir.

## Kurulum

1. `Warext-SpellCheck-2.0.0.zip` paketini indirin.
2. XenForo ACP'de **Add-ons → Install/upgrade from archive** bölümünü açın.
3. ZIP paketini yükleyin ve kurulumu tamamlayın.
4. Ayarları **Setup → Options → Warext Türkçe Yazım Denetimi** bölümünden yönetin.

Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu veya yükseltmesi sırasında oluşturulur.

## Bağımsız çalışma

Çalışma zamanında harici API, uzak NLP modeli, Python, Java, Docker, WebSocket, EventSource veya üçüncü taraf servis kullanılmaz. Yerel öğrenme özelliği etkinse geri bildirim yalnızca aynı XenForo kurulumundaki same-origin rotaya gönderilir.

Build aşamasında kullanılan açık veri kaynakları sabit sürüm veya commitlerden işlenerek gerekli sonuçlar eklenti paketine yerel varlık olarak derlenir.

## Test durumu

2.0 NLP regresyon paketindeki kontrollü test setinde 55 doğru örnekte 0 yanlış alarm ve 35 hatalı örneğin 34'ünde tespit sonucu alınmıştır.
