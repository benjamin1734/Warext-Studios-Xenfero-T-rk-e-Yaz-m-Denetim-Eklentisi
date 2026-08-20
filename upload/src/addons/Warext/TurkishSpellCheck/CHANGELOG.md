# Değişiklik Geçmişi

## 2.0.0

Tamamen yerel v2 NLP mimarisi eklendi. Sözlük lazy Bloom indeksine taşındı; Hunspell kök ve ek kuralları build aşamasında genişletilerek yerel form havuzuna derlenir. Yerel bilgi grafiği, semantik sınıflar, fiil istemi, özne-nesne seçilim uyumu, bağımlılık çözümleme, zamir/gönderim takibi, zaman çizgisi, neden-sonuç, koşul, karşıtlık, olumsuzluk ve kapsam denetimleri eklendi. Açık veri kaynaklarından build aşamasında yerel deyim bilgisi, 100.000+ yer adı hedefli kompakt özel ad indeksi ve Türkçe n-gram dil modeli üretilir. 12.000+ örnekle oluşturulan gömülü mikro model sembolik motorla birleştirildi. Kullanıcı geri bildirimi ve kabul edilen öneriler için yalnızca aynı XenForo kurulumu içinde çalışan yerel öğrenme altyapısı ile ACP yönetim ekranı eklendi. Uzun metin taraması parçalı ve önbellekli yapıda geliştirildi. Otomatik düzeltme yapılmaz; öneriler yalnızca kullanıcı tıklamasıyla uygulanır. Çalışma zamanı harici API/model/servis bağımlılığı bulunmaz.

## 1.3.0

Tamamen yerel derin anlam katmanı eklendi. Çok anlamlı sözcükler için bağlamsal sözcük anlamı ayrıştırma, genişletilmiş semantik sınıflar, özne-nesne semantik rol çerçeveleri, özellik-varlık uyumu, fiil istemi ve hâl ilişkileri, kişi/zaman biçimini koruyan eşdizim düzeltmeleri, cümleler arası durum tutarlılığı, kapsam/kesinlik ve zaman çapası çelişkileri geliştirildi. Anlam raporu sözcük anlamları, semantik roller ve tutarlılık değeri üretebilir. Çalışma zamanı harici model, API veya servis bağımlılığı sıfırdır.

## 1.2.0

Tamamen yerel sembolik anlam motoru eklendi. Özne-nesne seçilim uyumu, fiil-tamlayıcı hâl ilişkileri, miktar yapıları, eşdizimler ve yüksek güvenli çelişki uyarıları geliştirildi.

## 1.1.0

Hunspell `.aff` kurallarını build aşamasında yerel form havuzuna dönüştüren sözlük genişletme katmanı eklendi. Bileşik zaman morfolojisi, kişi uyumu, soru eki, özel ad, noktalama ve uzun metin bağlam denetimi geliştirildi.

## 1.0.0

Warext Turkish Spell Check tamamen yerel nihai v1 mimarisine taşındı. Genişletilmiş morfoloji, teknik içerik koruması, bağlam ve önbellekli uzun metin taraması eklendi.
