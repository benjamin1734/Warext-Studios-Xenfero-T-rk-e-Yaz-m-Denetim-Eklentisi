Warext Turkish Spell Check 1.1.0

XenForo 2.3.0+ için tamamen yerel Türkçe yazım ve dilbilgisi denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-1.1.0.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

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
- Kullanıcı yazarken otomatik düzeltme yapılmaz; en fazla 3 öneriden birini kullanıcı seçer.
- Kişisel sözlük, oturumluk yok sayma, forum özel sözlüğü ve forum özel isim listesi korunur.
- Çalışma zamanında harici API, Docker, Python, model sunucusu, fetch/XHR/WebSocket veya başka bir dış servis yoktur.
- Diğer eklenti arşivinden kod, regex, sözlük, veri dosyası veya kural alınmamıştır.

Sürüm
Görünen ürün sürümü 1.1.0'dır. XenForo dahili version_id değeri 4100070'tir.

SQL
Ek SQL içe aktarma gerekmez.
