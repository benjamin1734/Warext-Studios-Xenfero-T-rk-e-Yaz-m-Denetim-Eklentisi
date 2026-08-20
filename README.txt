Warext Turkish Spell Check 2.0.0

XenForo 2.3.0+ için tamamen yerel Türkçe yazım, dilbilgisi, morfoloji ve anlam denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-2.0.0.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

2.0.0
- Sözlük mimarisi lazy Bloom indeksine taşındı ve geniş Türkçe form havuzu korunurken çekirdek sözlük yükü azaltıldı.
- Hunspell kök ve .aff kuralları build aşamasında işlenerek tamamen yerel çalışma zamanı sözlüğüne derlenir.
- Morfoloji, ses olayları, kişi, bileşik zaman, soru eki, özel ad, noktalama ve uzun metin sistemleri geliştirildi.
- Yerel bilgi grafiği, semantik sınıflar, fiil istemi, özne-nesne seçilim uyumu ve hafif bağımlılık çözümleme eklendi.
- Zamir/gönderim çözümleme, zaman çizgisi, neden-sonuç, koşul, karşıtlık, olumsuzluk ve kapsam denetimleri eklendi.
- Yerel deyim ve kalıp bilgisi build aşamasında derlenir.
- 100.000+ yer adı hedefli kompakt yerel özel ad indeksi eklendi.
- Türkçe diyalog verisinden yerel n-gram dil modeli build aşamasında derlenir.
- 12.000+ denetim örneğiyle oluşturulan 256 boyutlu gömülü mikro model eklendi.
- Sembolik anlam motoru, yerel dil modeli ve mikro model tek karar katmanında birleştirildi.
- Uzun metinlerde parçalı, önbellekli ve boş-zaman işleme korunarak geliştirildi.
- Kullanıcı yanlış pozitifleri Bu doğru eylemiyle raporlayabilir ve kabul edilen öneriler yerel öğrenme istatistiğine işlenebilir.
- Geri bildirim yalnızca aynı XenForo kurulumundaki same-origin rotaya gönderilir ve ACP üzerinden kapatılabilir.
- ACP içinde öğrenme kayıtlarını inceleme, silme ve uygun adayları forum özel sözlüğüne ekleme ekranı eklendi.
- URL, domain, e-posta, IPv4/IPv6, port, MAC, UUID, hash, sürüm, tarih/saat, sayı, para, yüzde, dosya yolu, CLI, ortam değişkeni, dotfile, kod, BBCode, HTML, Markdown, mention, hashtag ve emoji gibi teknik içerikler korunur.
- Kullanıcı yazarken otomatik düzeltme yapılmaz. Öneriler yalnızca kullanıcı tıklamasıyla uygulanır.
- Çalışma zamanında harici API, uzak model, Python, Docker, Java NLP servisi, WebSocket, EventSource veya üçüncü taraf servis kullanılmaz.
- Diğer eklenti arşivinden kod, regex, sözlük, veri dosyası veya kural alınmamıştır.

Sürüm
Görünen ürün sürümü 2.0.0'dır. XenForo dahili version_id değeri 5000070'tir.

SQL
Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu veya yükseltmesi sırasında otomatik oluşturulur.
