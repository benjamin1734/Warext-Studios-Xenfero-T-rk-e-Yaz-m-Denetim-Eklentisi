# Warext Turkish Spell Check 1.1.0

Warext Turkish Spell Check, XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama ve bağlam denetim eklentisidir.

## Yerel mimari

Çalışma zamanında harici API, Docker, Python, model sunucusu, WebSocket, fetch/XHR veya başka bir dış servis kullanılmaz. Açık kaynak sözlük kaynakları yalnızca build aşamasında sabitlenmiş sürümlerden işlenir ve kurulum paketine yerel veri olarak derlenir.

## 1.1.0 dil motoru

- TDK kelime havuzu + TDD Hunspell kökleri
- Hunspell `.aff` kurallarının build aşamasında sınırlı form genişletmesi
- Büyük yerel kelime/form havuzu ve kompakt dağıtım
- TDD Türkçe yazım benchmarkından yerel düzeltme haritası
- İsim/fiil morfolojisi, ek zincirleri, ses olayları ve ek uyumu
- Bileşik fiil zamanları: geçmiş, rivayet ve şart katmanları
- Bileşik zamanlarda kişi uyumu
- Düzenli fiillerde kök tabanlı geçmiş/gelecek zaman bağlam düzeltmesi
- Genişletilmiş soru eki ayrımı ve ses uyumu
- de/da, ki, birleşik-ayrı yazım ve noktalama kuralları
- 81 il, özel adlar, ülkeler, kurumlar, teknik markalar, kısaltmalar ve sayı ekleri
- Türkçe Q klavye komşuluğu ve düzeltme korpusunu kullanan öneri sıralaması

## Teknik içerik koruması

URL, e-posta, domain, IPv4, IPv6, MAC, UUID, hash, semantik sürüm, tarih, saat, ondalık sayı, Windows/Unix yolu, CLI seçeneği, ortam değişkeni, dotfile, dosya adı, kod sembolü, HTML, BBCode, fenced/inline code, mention, hashtag, biçim kodu, Markdown bağlantısı ve emoji alanları dil denetiminden korunur.

## Uzun metin

Uzun mesajlar cümlelere ayrılır ve boş zamanda parça parça analiz edilir. Önceki ve sonraki cümle bağlamı kullanılır. Değişmeyen cümleler önbellekten alınır; tek bir cümle değiştiğinde tüm metin yeniden hesaplanmaz.

## Kullanım

Eklenti otomatik düzeltme yapmaz. Kullanıcı en fazla üç öneriden birini seçer. Kişisel sözlük, oturumluk yok sayma, forum özel sözlüğü ve özel isim listesi desteklenir.

## Kurulum

`release/Warext-SpellCheck-1.1.0.zip` dosyasını XenForo ACP üzerinden **Add-ons → Install/upgrade from archive** alanından yükleyin.

Ek SQL içe aktarma gerekmez.

## Bağımsız geliştirme

Karşılaştırma amacıyla sağlanan başka bir eklenti arşivinden kaynak kod, regex, sözlük, veri dosyası veya kural listesi kopyalanmamıştır. Benzer ihtiyaçlar Warext mimarisi içinde bağımsız olarak uygulanmıştır.
