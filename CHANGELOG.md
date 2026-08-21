# Değişiklik Geçmişi

## V1

Warext Turkish Spell Check ilk kararlı nihai sürüm olarak yayımlandı.

- Tamamen yerel Türkçe yazım denetimi
- Türkçe morfoloji, ek zinciri, kişi, zaman, kip ve hâl analizi
- de/da, ki, soru eki, birleşik-ayrı yazım ve noktalama kontrolleri
- Bağlamsal sözcük anlamı ayrıştırma
- Bilgi grafiği, semantik sınıflar ve fiil istemi
- Özne, nesne, tamlayıcı ve cümlecik farkındalıklı hafif sözdizim çözümleme
- Zamir ve gönderim ilişkileri
- Zaman, neden-sonuç, koşul, karşıtlık, olumsuzluk ve tutarlılık analizi
- Yerel deyim ve kalıp katmanı
- Yer adı ve özel isim desteği
- Teknik metin, kod, URL ve işaretleme koruması
- Uzun metinlerde parçalı ve önbellekli analiz
- Kullanıcı ve forum özel sözlüğü
- Aynı XenForo kurulumu içinde çalışan yerel geri bildirim ve ACP öğrenme yönetimi
- Lazy Bloom tabanlı yerel sözlük mimarisi
- Harici NLP API'si, uzak model sunucusu veya üçüncü taraf runtime dil servisi gerektirmeyen çalışma yapısı
- Yükseltme sırasında çalışma zamanı JS dosyalarını silebilen eski temizleme adımı kaldırıldı
- ACP özel sözlük normalizasyonundan mbstring bağımlılığı kaldırıldı
- Geri bildirim alanlarında UTF-8 karakter sınırlandırması güvenli hale getirildi
- Tüm kaynak, runtime, veri tanımı, test, build ve paketleme zinciri için nihai doğrulama kontrolleri eklendi
