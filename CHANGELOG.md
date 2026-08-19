# Değişiklik Geçmişi

## 3.1.0

- Uzun mesaj ve paragrafların tamamını arka planda tarayan uzun metin modu eklendi.
- Metin cümlelere ayrılarak aşamalı ve dağıtılmış biçimde analiz ediliyor.
- Önceki ve sonraki cümle analiz bağlamına aktarılıyor.
- Cümle sonuçları komşu bağlam imzasıyla önbelleğe alınıyor.
- Metinde tek bir cümle değiştiğinde değişmeyen cümleler tekrar hesaplanmıyor.
- Değişen cümlenin komşuları bağlam anahtarı nedeniyle otomatik yeniden analiz ediliyor.
- 1.800 karakteri aşan tek cümleler güvenli parçalara bölünüyor.
- requestIdleCallback destekli tarama ile uzun içerik analizi yazım akışından ayrıldı.
- requestIdleCallback bulunmayan tarayıcılar için zaman dilimli geri dönüş mekanizması eklendi.
- Zengin editörde uzun metnin tamamında bulunan tespitler toplu olarak işaretleniyor.
- URL, kod, BBCode, e-posta, domain, kullanıcı adı, IP ve dosya yolu koruması uzun metin moduna taşındı.
- Oturumluk yok sayma listesi uzun metin taramasında da dikkate alınıyor.
- ACP'ye uzun metin taraması açma-kapama, karakter eşiği ve maksimum tespit sayısı ayarları eklendi.
- 8.000+ karakter ve 120 cümlelik regresyon senaryosu eklendi.
- Kod yorum satırı kontrolü yeni uzun metin dosyalarını da kapsayacak şekilde genişletildi.

## 3.0.0

- Yerel Türkçe denetim motoru final mimarisine yükseltildi.
- 117.000+ yerel kelime ve form havuzu korundu.
- Morfoloji, ek zinciri ve Türkçe ses olayları geliştirildi.
- de/da, ki, mı/mi/mu/mü ve birleşik-ayrı yazım kuralları genişletildi.
- Özne-yüklem kişi ve yüksek güvenli zaman uyumu kontrolleri geliştirildi.
- Özel ad, 81 il, kısaltma ve sayı eki denetimi eklendi.
- URL, e-posta, domain, kullanıcı adı, IP, dosya yolu ve kod blokları denetim dışında tutuldu.
- Zengin editörde hata altı çizimi geliştirildi.
- Kalıcı kişisel sözlük, sözlük yönetimi ve oturumluk yok sayma eklendi.
- ACP forum özel sözlüğü, özel isim listesi ve modül ayarları tamamlandı.
- 1-3 arası ayarlanabilir öneri sayısı korundu.
- Yerel sonuç önbelleği eklendi.
- Eski tarayıcı motoru dosyaları kaldırıldı.
- Harici API, Docker, Python çalışma zamanı, model sunucusu veya üçüncü taraf servis bağımlılığı bulunmaz.
- Ürün kodundaki açıklama ve yorum satırları kaldırıldı.
- XenForo 2.3 uyumluluğu ve regresyon testleri güncellendi.
