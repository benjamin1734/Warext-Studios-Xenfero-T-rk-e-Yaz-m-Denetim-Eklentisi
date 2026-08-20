Warext Turkish Spell Check 1.3.0

XenForo 2.3.0+ için tamamen yerel Türkçe yazım, dilbilgisi, morfoloji ve derin anlam denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-1.3.0.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

1.3.0
- Anlam motoru tamamen yerel çalışan yeni derin sembolik ve söylem katmanıyla genişletildi. Çalışma zamanında API, yapay zekâ modeli, Python, Docker, Java servisi veya uzak NLP sunucusu kullanılmaz.
- Sözcük anlamı ayrıştırma eklendi. yüz, gül, yaz, at, çay, dil, fare, ağ, anahtar, port, sürücü, sunucu, çekirdek, paket, terminal, kanal, alan, tablo, hücre, pencere ve model gibi çok anlamlı sözcüklerde çevredeki sözcükler ve morfoloji kullanılarak yerel anlam seçimi yapılır.
- Anlamsal sınıf sistemi insan, hayvan, canlı, bitki, yiyecek, içecek, sıvı, metin, belge, mesaj, kod, yazılım, servis, ağ, dosya, veri, medya, cihaz, araç, alet, giysi, yer, kap, vücut, doğal varlık, kurum, dil, para, zaman, duygu ve soyut kavram sınıflarını kapsayacak şekilde genişletildi.
- Fiiller için özne ve nesne semantik rol çerçeveleri genişletildi. Masa koştu, Bilgisayar acıktı ve Çocuk kitabı içti gibi sözcükleri tek tek doğru olmasına rağmen güçlü anlam uyumsuzluğu taşıyan cümleler yüksek güvenle uyarılabilir.
- Çocuk suyu içti, Çocuk kitabı okudu ve Adam arabayı sürdü gibi doğal ilişkiler yanlış pozitif üretmemek üzere regresyon testlerine dahil edildi.
- Fiil istemi ve hâl ilişkileri genişletildi. bakmak, inanmak, güvenmek, katılmak, ulaşmak, yaklaşmak, bağlanmak, erişmek, başvurmak, bahsetmek, korkmak, hoşlanmak, vazgeçmek, şüphelenmek, kaçınmak, ayrılmak, beklemek, aramak ve kullanmak gibi yüklemlerde tamlayıcı hâli denetlenir.
- Özellik-özne anlam uyumu eklendi. Aç, susamış, uykulu, hamile, lezzetli, okunaklı, yenilebilir, içilebilir, çevrimiçi, çevrimdışı, paslı ve şarjlı gibi özelliklerin hangi tür varlıklarla doğal kullanılabildiği yüksek güvenli durumlarda kontrol edilir.
- Eşdizim motoru genişletildi ve kişi/zaman biçimini korur. karar yapıyorum için karar veriyorum, soru yapacağım için soru soracağım, yardım yaptık için yardım ettik, fotoğraf yaptım için fotoğraf çektim gibi doğal karşılıklar üretilebilir.
- Cümleler arası durum tutarlılığı eklendi. Sunucu kapalı. Sunucu açık. gibi geçiş açıklaması bulunmayan ardışık karşıt durumlar uyarılabilir; Ancak şimdi sunucu açık gibi gerçek bir geçiş ifadesi varsa uyarı bastırılır.
- Karşıt durumlar, miktar yapıları, kesinlik ve kapsam çatışmaları ile tek yargıdaki geçmiş-gelecek zaman çapası çelişkileri yerel mantık katmanında değerlendirilir.
- Anlam raporu artık çözümlenen sözcük anlamlarını, özne-nesne rollerini ve metin tutarlılığı için yerel coherence değerini üretebilir.
- Anlam uyarıları kullanıcı metnini otomatik değiştirmez. Yüksek güvenli anlam sorunları ayrı denetim alanında gösterilir; düzeltilebilir yapılarda kullanıcı en fazla 3 öneriden birini seçer.
- Anlam uyarılarının hassasiyeti ACP üzerinden yüzde 70-99 arasında ayarlanabilir. Varsayılan değer yüzde 88'dir.
- Uzun mesajlarda derin anlam analizi cümle ve komşu cümle bağlamıyla çalışır; mevcut incremental tarama, önbellek ve tarayıcı boş-zaman işleme yaklaşımı korunur.
- Kod, URL, domain, e-posta, IPv4/IPv6, MAC, UUID, hash, sürüm, tarih/saat, dosya yolu, CLI, ortam değişkeni, dotfile, BBCode, HTML, Markdown, mention, hashtag ve emoji gibi teknik içerikler denetim dışında tutulur.
- Mevcut yaklaşık 528 bin yerel kelime/form havuzu, Hunspell build genişletmesi, morfoloji, bileşik zaman, kişi-zaman, soru eki, özel ad, noktalama, kişisel sözlük ve forum sözlüğü sistemleri korunur.
- Kullanıcı yazarken otomatik düzeltme yapılmaz.
- Diğer eklenti arşivinden kod, regex, sözlük, veri dosyası veya kural alınmamıştır.

1.2.0
- Tamamen yerel sembolik anlam katmanı eklendi.
- Özne-nesne seçilim uyumu, fiil-tamlayıcı hâl ilişkileri, miktar yapıları, eşdizimler ve yüksek güvenli çelişki uyarıları eklendi.
- ACP anlam denetimi ve hassasiyet ayarları eklendi.

1.1.0
- Açık kaynak TDK ve TDD Hunspell kaynakları build aşamasında birleştirilir.
- Hunspell .aff kuralları çalışma zamanına taşınmadan build aşamasında genişletilir ve yerel JS sözlüğüne derlenir.
- Bileşik zaman morfolojisi, kişi uyumu, genel zaman bağlamı, soru eki, geniş özel adlar, teknik içerik koruması ve uzun metin taraması geliştirildi.

Sürüm
Görünen ürün sürümü 1.3.0'dır. XenForo dahili version_id değeri 4300070'tir.

Bağımlılık
Çalışma zamanında harici API, model, Docker, Python, Java NLP servisi, fetch/XHR/WebSocket veya başka bir dış servis yoktur.

SQL
Ek SQL içe aktarma gerekmez.
