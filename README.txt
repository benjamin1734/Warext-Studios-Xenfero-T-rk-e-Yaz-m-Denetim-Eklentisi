Warext Turkish Spell Check 2.1.0

XenForo 2.3.0+ için tamamen yerel Türkçe yazım, dilbilgisi, noktalama, morfoloji ve anlam denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-2.1.0.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

Temel teknik bilgiler
- Sürüm: 2.1.0
- XenForo version_id: 5100070
- XenForo: 2.3.0+
- Harici runtime API: Yok
- Harici model sunucusu: Yok
- Python / Java / Docker runtime gereksinimi: Yok
- Uzun metin: Var
- Kişisel sözlük: Var
- Forum özel sözlüğü: Var
- Yerel öğrenme: Var
- ACP yönetimi: Var

Dil motoru
- Yaklaşık 528.281 geçerli Türkçe kelime/biçim kapsamı
- 75.909 Hunspell kökü
- 420.000 build aşamasında türetilmiş Hunspell biçimi
- 59.266 affix kuralı
- 220.000 yer adı indeksi
- 18.017 deyim ve kalıp girdisi
- 48.517 cümlelik yerel dil modeli kaynağı
- 6.775 bigram
- 7.061 trigram
- 12.020 örnekli 256 özellikli gömülü mikro model

2.1 geliştirmeleri
- Giriş ve hitap yapıları için yüksek güvenli noktalama kontrolleri
- Çok anlamlı kelimelerde daha geniş bağlamsal anlam ayrıştırma
- Semantik yanlış pozitifleri azaltmak için güven kalibrasyonu
- Dependency rol adaylarının bağlam ve hâl bilgisine göre sıralanması
- 5.000+ doğal Türkçe cümle ile build aşamasında yüksek güvenli semantik false-positive benchmarkı

Denetim kapsamı
- Yazım hatası ve öneri üretimi
- Türkçe morfoloji ve ek zinciri
- Bileşik zaman ve kişi uyumu
- de/da, ki ve soru eki
- Birleşik-ayrı yazım
- Noktalama ve boşluk kuralları
- Özne-yüklem ve nesne-fiil anlam uyumu
- Fiil istemi ve hâl ilişkileri
- Çok anlamlı kelime çözümleme
- Hafif bağımlılık çözümleme
- Zamir ve gönderim çözümleme
- Cümleler arası bağlam
- Zaman çizgisi, neden-sonuç, koşul, karşıtlık ve olumsuzluk
- Deyim ve mecaz farkındalığı
- Yer adı ve özel isim koruması

Teknik içerik koruması
URL, e-posta, domain, IPv4, IPv6, port, MAC, UUID, hash, sürüm, tarih, saat, sayı, para, yüzde, Windows/Unix yolu, CLI seçeneği, ortam değişkeni, dotfile, dosya adı, HTML, BBCode, fenced/inline code, Markdown bağlantısı, mention, hashtag ve emoji alanları korunur.

Yerel çalışma
Çalışma zamanında harici API, uzak model, Python, Docker, Java NLP servisi, WebSocket, EventSource veya üçüncü taraf ağ servisi kullanılmaz. Kullanıcı geri bildirimi etkinse yalnızca aynı XenForo kurulumundaki same-origin geri bildirim rotası kullanılır.

SQL
Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu veya yükseltmesi sırasında otomatik oluşturulur.
