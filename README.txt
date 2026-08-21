Warext Turkish Spell Check V1

XenForo 2.3.0+ için tamamen yerel Türkçe yazım, dilbilgisi, noktalama, morfoloji, bağlam ve anlam denetimi.

Kurulum
1. XenForo yönetim panelinde Add-ons bölümünü açın.
2. Warext-SpellCheck-V1.zip dosyasını arşivden yükleyin.
3. Eklentiyi kurun veya mevcut Warext Turkish Spell Check kurulumunu yükseltin.
4. Setup > Options > Warext Türkçe Yazım Denetimi bölümünden ayarları yönetin.

Temel teknik bilgiler
- Sürüm: V1
- XenForo: 2.3.0+
- Harici runtime API: Yok
- Harici model sunucusu: Yok
- Python / Java / Docker runtime gereksinimi: Yok
- Uzun metin analizi: Var
- Kişisel sözlük: Var
- Forum özel sözlüğü: Var
- Yerel öğrenme: Var
- ACP yönetimi: Var

Dil motoru
- Yaklaşık 528 bin Türkçe kelime ve biçim kapsamı
- 75 binden fazla Hunspell kökü
- 220 bin yer adı indeksi
- 18 binden fazla deyim ve kalıp
- Yerel n-gram dil modeli
- Yerel bilgi grafiği ve semantik sınıflar
- Fiil istemi ve hâl ilişkileri
- Cümlecik farkındalıklı hafif sözdizim çözümleme
- Bağlamsal sözcük anlamı ayrıştırma
- Yanlış pozitif güven kalibrasyonu

Denetim kapsamı
- Yazım hatası ve düzeltme adayları
- Türkçe morfoloji ve ek zinciri
- Bileşik zaman ve kişi uyumu
- de/da, ki ve soru eki
- Birleşik-ayrı yazım
- Noktalama ve boşluk kuralları
- Özne-yüklem ve nesne-fiil anlam uyumu
- Fiil istemi ve hâl ilişkileri
- Çok anlamlı kelime çözümleme
- Hafif dependency çözümleme
- Zamir ve gönderim çözümleme
- Cümleler arası bağlam
- Zaman, neden-sonuç, koşul, karşıtlık ve olumsuzluk
- Deyim ve mecaz farkındalığı
- Yer adı ve özel isim koruması

Teknik içerik koruması
URL, e-posta, domain, IPv4, IPv6, port, MAC, UUID, hash, sürüm, tarih, saat, sayı, para, yüzde, Windows/Unix yolu, CLI seçeneği, ortam değişkeni, dotfile, dosya adı, HTML, BBCode, fenced/inline code, Markdown bağlantısı, mention, hashtag ve emoji alanları korunur.

Yerel çalışma
Çalışma zamanında harici API, uzak model, Python, Docker, Java NLP servisi, WebSocket, EventSource veya üçüncü taraf ağ servisi kullanılmaz. Kullanıcı geri bildirimi etkinse yalnızca aynı XenForo kurulumundaki same-origin geri bildirim rotası kullanılır.

SQL
Ek SQL içe aktarma gerekmez. Gerekli tablolar eklenti kurulumu veya yükseltmesi sırasında otomatik oluşturulur.
