# Warext Turkish Spell Check 2.0.0

Warext Turkish Spell Check, XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama, morfoloji ve anlam denetim eklentisidir.

## 2.0.0 mimarisi

- Yerel TDK tabanlı sözlük ve Hunspell kök/ek kurallarından build aşamasında üretilen geniş Türkçe form havuzu
- Lazy Bloom sözlük indeksi ile daha düşük başlangıç bellek ve dosya yükü
- Türkçe morfoloji, ses olayları, ek uyumu, kişi ve bileşik zaman çözümleme
- de/da, ki, soru eki, birleşik-ayrı yazım, noktalama ve cümle bağlamı
- Sözcük anlamı ayrıştırma, semantik sınıflar, özne-nesne seçilim uyumu ve fiil istemi
- Hafif yerel bağımlılık çözümleme ve zamir/gönderim takibi
- Zaman çizgisi, neden-sonuç, koşul, karşıtlık, olumsuzluk ve kapsam denetimleri
- Yerel deyim ve kalıp bilgisi
- 100.000+ yer adı hedefli kompakt yerel özel ad indeksi
- Türkçe diyalog verisinden build aşamasında üretilen yerel n-gram dil modeli
- 12.000+ sentetik denetim örneğiyle oluşturulan gömülü mikro model
- Uzun metinlerde parçalı, önbellekli ve boş-zaman işleme
- Kullanıcı tıklamasıyla uygulanan en fazla üç öneri
- Kişisel sözlük, oturumluk yok sayma, forum özel sözlüğü ve özel isim listesi
- Yanlış pozitif ve kabul edilen öneriler için aynı XenForo kurulumu içindeki yerel öğrenme sistemi
- ACP üzerinden öğrenme kayıtlarını inceleme, silme ve uygun adayları forum sözlüğüne alma

## Teknik içerik koruması

URL, e-posta, domain, IPv4, IPv6, port, MAC, UUID, hash, semantik sürüm, tarih, saat, biçimlendirilmiş sayı, para, yüzde, Windows/Unix yolu, CLI seçeneği, ortam değişkeni, dotfile, dosya adı, kod sembolü, HTML, BBCode, fenced/inline code, mention, hashtag, Markdown bağlantısı ve emoji alanları dil denetiminden korunur.

## Yerel çalışma

Çalışma zamanında harici API, uzak model, Python, Docker, Java NLP servisi, WebSocket, EventSource veya üçüncü taraf ağ servisi kullanılmaz. Kullanıcı geri bildirimi etkinse yalnızca aynı XenForo kurulumundaki `warext-spell-feedback` rotasına same-origin istek gönderilir.

Açık veri kaynakları yalnızca build aşamasında sabit commit/sürümlerden işlenir ve gerekli sonuçlar eklenti paketine yerel varlık olarak derlenir.

## Kurulum

`release/Warext-SpellCheck-2.0.0.zip` dosyasını XenForo ACP üzerinden **Add-ons → Install/upgrade from archive** alanından yükleyin.

Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu/yükseltmesi sırasında oluşturulur.

## Bağımsız geliştirme

Karşılaştırma amacıyla sağlanan başka bir eklenti arşivinden kaynak kod, regex, sözlük, veri dosyası veya kural listesi kopyalanmamıştır. Benzer işlevler Warext mimarisi içinde bağımsız olarak uygulanmıştır.
