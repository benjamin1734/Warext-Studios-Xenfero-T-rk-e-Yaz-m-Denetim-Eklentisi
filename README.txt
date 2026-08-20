Warext Turkish Spell Check 1.2.0

XenForo 2.3.0+ için tamamen yerel Türkçe yazım, dilbilgisi ve anlam denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-1.2.0.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

1.2.0
- Tamamen yerel sembolik anlam katmanı eklendi; çalışma zamanında yapay zekâ modeli, API veya uzak servis kullanılmaz.
- Cümledeki sözcükler morfolojik kökleri üzerinden insan, canlı, yiyecek, içecek, metin, kod, yazılım, dosya, veri, medya, cihaz, araç, giysi, yer, nesne, zaman ve soyut kavram gibi anlam sınıflarına ayrılabilir.
- Fiiller için özne ve nesne seçim kısıtları eklendi. Çocuk kitabı içti ve Masa koştu gibi sözcükleri tek tek doğru olan fakat güçlü anlam uyumsuzluğu taşıyan cümleler uyarılabilir.
- Anlam uyumsuzlukları kullanıcı metnini otomatik değiştirmez; ayrı Anlam denetimi panelinde açıklayıcı uyarı olarak gösterilir.
- Fiil-tamlayıcı hâl ilişkileri eklendi. bakmak, inanmak, güvenmek, katılmak, bahsetmek, korkmak, hoşlanmak ve benzeri yüklemlerde yönelme/ayrılma hâli ilişkileri denetlenir.
- Yardım etmek, teşekkür etmek, devam etmek, itiraz etmek, ihtiyaç duymak gibi birleşik yüklem kalıpları için tamlayıcı ilişkileri desteklenir.
- Sayı ve miktar yapılarında gereksiz çoğul kullanımı denetlenir; 3 kitaplar gibi yapılar için kitap önerilebilir.
- en daha güzel ve daha en güzel gibi karşılaştırma yığılmaları denetlenir.
- karar yapmak, soru yapmak, cevap yapmak, yardım yapmak, teşekkür yapmak ve fotoğraf yapmak gibi doğal olmayan eşdizimler için Türkçedeki yerleşik karşılıklar önerilir.
- Aynı yargıda açık/kapalı, aktif/pasif, doğru/yanlış, var/yok, canlı/ölü, mümkün/imkânsız gibi karşıt anlamların çakışması yüksek güvenle uyarılabilir.
- kesinlikle ve belki gibi farklı kesinlik bildiren ifadelerin aynı yargıdaki çelişkili kullanımları uyarılabilir.
- Önceki ve sonraki cümle bağlamı zaman tutarlılığı denetiminde kullanılmaya devam eder; anlam katmanı komşu cümlelerde belirgin zaman sıçramalarını düşük öncelikli uyarı olarak değerlendirebilir.
- Anlam uyarıları için ACP üzerinden aç/kapat ve yüzde 70-99 arasında hassasiyet ayarı eklendi. Varsayılan değer yüzde 88'dir.
- Teknik içerik, kod, URL, domain, e-posta, IP, UUID, hash, dosya yolu, BBCode, Markdown ve benzeri korunan alanlar anlam denetiminden de dışlanır.
- Anlam analizi uzun metinde arayüzü kilitlememek için uygun durumlarda tarayıcının boş zamanında çalıştırılır.
- Mevcut yazım, morfoloji, bileşik zaman, kişi-zaman, soru eki, özel ad, noktalama, uzun metin, kişisel sözlük ve forum sözlüğü sistemleri korunur.
- Kullanıcı yazarken otomatik düzeltme yapılmaz; düzeltme gereken kurallarda en fazla 3 öneriden birini kullanıcı seçer.
- Diğer eklenti arşivinden kod, regex, sözlük, veri dosyası veya kural alınmamıştır.

1.1.0
- Açık kaynak TDK ve TDD Hunspell kaynakları build aşamasında birleştirilir.
- Hunspell .aff kuralları çalışma zamanına taşınmadan build aşamasında sınırlı ve doğrulanmış biçimde genişletilir; oluşan kelime/form havuzu tamamen yerel JS sözlüğüne derlenir.
- Bileşik zamanlı fiiller için yerel morfoloji eklendi: geliyordum, geliyormuşsun, geliyorsanız, gelmeliydim, gelseydim ve benzeri yapılar çözümlenir.
- Bileşik zamanlarda ben/sen/biz/siz kişi uyumu denetlenir.
- Zaman bağlamı artık sabit birkaç fiil listesiyle sınırlı değildir; çözümlenebilen düzenli fiillerde kökten geçmiş/gelecek çekimi üretilebilir.
- Soru eki denetimi genişletildi: geliyormusun, gelecekmiydin, güzelsinmi gibi birleşik yapılar ayrılır ve ses uyumu düzeltilir.
- Ülke, kurum ve teknoloji özel adları genişletildi; kesme işareti ve ek uyumu denetlenir.
- Teknik içerik koruması URL, domain, e-posta, IPv4/IPv6, MAC, UUID, hash, sürüm, tarih/saat, dosya yolu, CLI, ortam değişkeni, dotfile, kod sembolü, BBCode, HTML, Markdown, mention, hashtag ve emoji alanlarını kapsar.
- Büyük mesajlar cümle cümle boş zamanda taranır; önceki/sonraki cümle bağlamı ve değişmeyen cümle önbelleği kullanılır.
- Cümle başı büyük harf, noktalama çevresi boşlukları, tekrar eden kelimeler ve soru cümlesi sonlandırması genişletildi.

Sürüm
Görünen ürün sürümü 1.2.0'dır. XenForo dahili version_id değeri 4200070'tir.

SQL
Ek SQL içe aktarma gerekmez.
