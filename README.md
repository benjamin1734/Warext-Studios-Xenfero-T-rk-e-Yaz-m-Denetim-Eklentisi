# Warext Turkish Spell Check 2.0.0

XenForo 2.3.0+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, morfoloji, noktalama ve anlam denetim eklentisi.

## Genel durum

| Başlık | Değer |
|---|---|
| Ürün | Warext Turkish Spell Check |
| Sürüm | 2.0.0 |
| XenForo dahili sürüm | 5000070 |
| Platform | XenForo 2.3.0+ |
| Sunucu tarafı | PHP / XenForo eklenti sistemi |
| Tarayıcı tarafı | JavaScript yerel dil motoru |
| Çalışma modeli | Yerel / local-first |
| Harici runtime API | Yok |
| Harici model sunucusu | Yok |
| Python gereksinimi | Yok |
| Java gereksinimi | Yok |
| Docker gereksinimi | Yok |
| WebSocket / EventSource | Yok |
| Otomatik düzeltme | Yok |
| Düzeltme uygulama | Kullanıcı öneriye tıklayınca |
| Öneri sayısı | Hata başına en fazla 3 |
| Uzun metin | Desteklenir |
| Kişisel sözlük | Var |
| Forum özel sözlüğü | Var |
| Özel isim sistemi | Var |
| Yerel öğrenme | Var |
| ACP yönetimi | Var |
| Manuel SQL | Gerekmez |

## Dil motoru kapsamı

| Alan | Teknik içerik |
|---|---|
| Yazım denetimi | Geçerli kelime kontrolü, hata adayı üretimi, Türkçe karakter farkları, klavye yakınlığı ve aday sıralama |
| Morfoloji | Kök, ek, kişi, zaman, kip, hâl, olumsuzluk ve ek zinciri çözümleme |
| Bileşik çekimler | Bileşik zaman ve kişi uyumu kontrolleri |
| Ses olayları | Ünlü uyumu, ünsüz değişimleri, yaygın ses olayları ve ek geçişleri |
| de/da | Ayrı ve bitişik kullanım bağlamı |
| ki | Bağlaç ve ek kullanım ayrımı |
| Soru eki | `mi/mı/mu/mü` ve kişi/zaman devamları |
| Birleşik-ayrı yazım | Yaygın Türkçe birleşik ve ayrı yazım yapıları |
| Noktalama | Noktalama çevresi boşlukları, tekrarlar, cümle sonları ve biçim kontrolleri |
| Kişi uyumu | Özne ile fiil kişi biçiminin karşılaştırılması |
| Zaman bağlamı | Zaman belirteçleri ile fiil zamanı arasındaki yüksek güvenli uyuşmazlıklar |
| Eşdizim | Yaygın fiil-isim kalıpları ve çekimi koruyan düzeltmeler |
| Fiil istemi | Fiilin beklediği özne, nesne ve hâl ilişkileri |
| Semantik sınıflar | İnsan, canlı, cihaz, yazılım, dosya, veri, yiyecek, içecek, araç, yer, kurum ve benzeri sınıflar |
| Özne-anlam uyumu | Yüklemin beklediği özne sınıfıyla gerçek öznenin karşılaştırılması |
| Nesne-anlam uyumu | Fiilin beklediği nesne sınıfıyla gerçek nesnenin karşılaştırılması |
| Çok anlamlı kelime | Yakın bağlama göre sözcük anlamı ayrıştırma |
| Bağımlılık çözümleme | Hafif yerel özne, nesne, yüklem ve tamlayıcı ilişkisi çıkarımı |
| Gönderim çözümleme | Zamir ve önceki öğe ilişkilerinin bağlam içinde izlenmesi |
| Söylem | Komşu cümlelerde durum, karşıtlık ve bağlam ilişkileri |
| Mantıksal tutarlılık | Zaman çizgisi, kesinlik, olumsuzluk, koşul ve çelişki kontrolleri |
| Neden-sonuç | `çünkü`, `bu nedenle`, `dolayısıyla` gibi bağlayıcıların yerel değerlendirmesi |
| Koşul | `eğer`, `ise` ve koşullu yapıların bağlam takibi |
| Deyim farkındalığı | Deyim ve kalıpların literal anlam motorundan korunması |
| Yer/özel ad | Geniş yer adı üyelik indeksi ve özel ad/apostrof desteği |
| Teknik metin | Kod, URL, IP, sürüm, dosya yolu ve benzeri teknik öğelerin denetimden korunması |

## Yerel veri kapasitesi

| Veri | Kapasite |
|---|---:|
| TDK tabanlı temel kelime | 60.711 |
| Hunspell kökü | 75.909 |
| Build aşamasında türetilen Hunspell biçimi | 420.000 |
| Ek geçerli biçim havuzu | 467.570 |
| Tahmini toplam geçerli kelime/biçim | 528.281 |
| Hunspell affix kuralı | 59.266 |
| Sözlük Bloom bit sayısı | 16.777.216 |
| Sözlük Bloom hash sayısı | 10 |
| Yer adı indeksi | 220.000 |
| Deyim / kalıp girdisi | 18.017 |
| Yerel dil modeli cümlesi | 48.517 |
| Bigram | 6.775 |
| Trigram | 7.061 |
| Mikro model örneği | 12.020 |
| Mikro model özellik boyutu | 256 |
| Mikro model build test örneği | 1.803 |
| Mikro model kontrollü build test doğruluğu | %100 |

> Mikro model yüzdesi kontrollü build/test veri kümesine aittir ve genel Türkçe için evrensel doğruluk iddiası değildir.

## Teknik mimari

| Katman | Uygulama |
|---|---|
| Sözlük | TDK tabanlı havuz ve Hunspell kök/ek verisinden build sırasında oluşturulan yerel varlıklar |
| Sözlük indeksi | Lazy Bloom mimarisi ile kompakt üyelik kontrolü |
| Düzeltme adayları | Yerel hata eşlemeleri, edit uzaklığı ve dil kuralları |
| Morfoloji | Warext Türkçe kök/ek ve çekim analiz katmanı |
| Gramer | Kural tabanlı Türkçe dilbilgisi motoru |
| Semantik | Sözcük sınıfları, fiil çerçeveleri ve seçilim kısıtları |
| Bilgi katmanı | Varlık sınıfları, özellikler, ilişkiler ve fiil istemleri |
| Yer adı | Bloom tabanlı yerel özel ad üyelik indeksi |
| Deyim | Build sırasında derlenen yerel deyim/kalıp veri katmanı |
| Dil modeli | Yerel bigram/trigram olasılık istatistikleri |
| Mikro model | Gömülü kabul edilebilirlik skorlama katmanı |
| Hibrit karar | Sembolik kurallar + yerel n-gram + mikro model skorlarının birleştirilmesi |
| Uzun metin | Parçalı analiz, değişim algılama, cache ve idle-time yürütme |
| Öğrenme | XenForo içinde same-origin geri bildirim ve yönetilebilir kayıt sistemi |
| UI | XenForo editöründe yerel işaretleme ve kullanıcı tıklamasıyla düzeltme |

## Çalışma zamanı modülleri

| Dosya | Görev |
|---|---|
| `bootstrap-v110.js` | Bileşenleri doğru sırada yükler ve motoru başlatır |
| `text-core-v110.js` | Metin bölme, teknik alan koruması ve ortak metin araçları |
| `dictionary-v110.js` | Temel sözlük, geçerlilik, aday üretimi ve çekirdek motor |
| `lexicon-v200.js` | Geniş biçim havuzuna kompakt erişim |
| `corrections-v110.js` | Yerel düzeltme eşlemeleri |
| `language-v110.js` | Morfoloji ve gelişmiş Türkçe kuralları |
| `semantic-v110.js` | Temel anlam denetimi |
| `semantic-deep-v110.js` | Derin semantik ve bağlam ilişkileri |
| `semantic-context-v110.js` | Cümleler arası semantik bağlam |
| `entities-v200.js` | Yer adı / varlık indeksi |
| `idioms-v200.js` | Deyim ve kalıp üyelik katmanı |
| `lm-v200.js` | Yerel n-gram dil modeli |
| `micro-model-v200.js` | Gömülü mikro model |
| `knowledge-v200.js` | Bilgi grafiği, fiil istemleri, dependency ve söylem katmanı |
| `micro-integration-v200.js` | Mikro model ile sembolik analiz sonuçlarını birleştirir |
| `learning-v200.js` | Yerel kullanıcı geri bildirimi ve öğrenme akışı |
| `semantic-ui-v110.js` | Anlam uyarılarının XenForo arayüzüne bağlanması |
| `editor-v110.js` | Editör işaretleme, öneri listesi ve tıklamayla uygulama |
| `longtext-v110.js` | Uzun metinlerin parçalı ve önbellekli analizi |

## Teknik içerik koruması

| Korunan tür | Örnek kapsam |
|---|---|
| URL | HTTP/HTTPS/FTP ve `www` bağlantıları |
| E-posta | E-posta adresleri |
| Domain | Alan adı ve alt alan adları |
| Ağ | IPv4, IPv6, host:port, MAC |
| Kimlik | UUID ve uzun hash değerleri |
| Sürüm | SemVer, `v2.0.0`, prerelease biçimleri |
| Tarih/saat | Yaygın tarih ve 24 saat gösterimleri |
| Sayı | Ondalık, binlik, yüzde ve para biçimleri |
| Dosya yolu | Windows ve Unix yolları |
| Dosya adı | Uzantılı dosya adları ve dotfile |
| Sistem | Ortam değişkenleri ve CLI seçenekleri |
| Kod | HTML, BBCode code/php/html/icode/plain, fenced ve inline code |
| Kod sembolleri | Sınıf, yöntem ve teknik isim biçimleri |
| Markdown | Markdown bağlantıları ve inline kod |
| Forum | Mention ve hashtag |
| Emoji | Emoji ve emoticon alanları |

## Uzun metin motoru

| Özellik | Davranış |
|---|---|
| Parçalama | Metin cümle ve paragraf bazında bölünür |
| Büyük segment | Gerektiğinde daha küçük analiz parçalarına ayrılır |
| Değişiklik algılama | Önceki ve yeni metin arasındaki değişen aralık bulunur |
| Yeniden analiz | Yalnız değişen bölüm ve gerekli yakın bağlam tekrar işlenir |
| Komşu bağlam | Önceki ve sonraki cümle analize aktarılır |
| Cache | Değişmeyen parça sonuçları tekrar kullanılır |
| Boş zaman | `requestIdleCallback` varsa kullanılır, yoksa zamanlayıcı fallback çalışır |
| İşaretleme | Tespitler XenForo editöründe yerel olarak vurgulanır |
| Metin değişikliği | Yalnız kullanıcı bir öneriye tıklarsa yapılır |

## Öğrenme ve geri bildirim

| Özellik | Davranış |
|---|---|
| Yanlış pozitif bildirimi | Kullanıcı hatalı uyarıyı `Bu doğru` eylemiyle bildirebilir |
| Kabul edilen öneri | Kullanıcının seçtiği düzeltme yerel istatistiğe işlenebilir |
| Ağ sınırı | Geri bildirim yalnızca aynı XenForo kurulumundaki same-origin rotaya gider |
| ACP kayıtları | Yönetici öğrenme kayıtlarını görüntüleyebilir |
| Silme | Yönetici uygun olmayan öğrenme kayıtlarını silebilir |
| Forum sözlüğü | Uygun adaylar yönetici tarafından forum özel sözlüğüne alınabilir |
| Otomatik sözlük kirletme | Yok; kullanıcı geri bildirimi doğrudan ana sözlüğü değiştirmez |

## Gizlilik ve bağımsız çalışma

| Konu | Durum |
|---|---|
| Kullanıcı metninin harici API'ye gönderilmesi | Yok |
| Uzak NLP modeli | Yok |
| Runtime Python | Yok |
| Runtime Java | Yok |
| Runtime Docker | Yok |
| Harici WebSocket | Yok |
| Harici EventSource | Yok |
| Harici üçüncü taraf servis | Yok |
| Yerel geri bildirim | İsteğe bağlı, aynı XenForo origin'i |
| Build verileri | Sabit kaynak/sürümlerden build sırasında işlenip pakete derlenir |

## Kalite kontrolleri

| Kontrol | CI doğrulaması |
|---|---|
| JavaScript syntax | `node --check` |
| PHP syntax | `php -l` |
| JSON doğrulama | Var |
| XML doğrulama | Var |
| Sözlük regresyon testi | Var |
| Dil kuralları regresyon testi | Var |
| Morfoloji regresyon testi | Var |
| Semantik regresyon testi | Var |
| NLP 2.0 regresyon testi | Var |
| Kod yorum satırı taraması | Var |
| Harici runtime ağ çağrısı taraması | Var |
| Sözlük mimarisi/boyut eşiği | Var |
| Yer adı/deyim/dil modeli kapasite eşikleri | Var |

Son 2.0 NLP regresyon paketinde kontrollü test setinde **55 doğru örnekte 0 yanlış alarm** ve **35 hatalı örneğin 34'ünde tespit** sonucu alınmıştır.

## Kurulum

1. `Warext-SpellCheck-2.0.0.zip` paketini indirin.
2. XenForo ACP'de **Add-ons → Install/upgrade from archive** bölümünü açın.
3. ZIP paketini yükleyin.
4. Kurulum veya yükseltme işlemini tamamlayın.
5. **Setup → Options → Warext Türkçe Yazım Denetimi** bölümünden ayarları yönetin.

Ek SQL içe aktarma gerekmez. Gerekli tablolar kurulum/yükseltme sırasında eklenti tarafından oluşturulur.

## Paket

Nihai dağıtım dosyası:

`release/Warext-SpellCheck-2.0.0.zip`

Kaynak kod ve çalışma zamanı varlıkları doğrudan bu repository içinde tutulur.