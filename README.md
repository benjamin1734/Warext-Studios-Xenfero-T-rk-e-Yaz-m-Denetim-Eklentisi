# Warext Studios XenForo Türkçe Yazım Denetimi

XenForo 2.3 için yerel çalışan Türkçe yazım, dilbilgisi, noktalama ve bağlam denetimi eklentisidir. Düzeltmeleri otomatik uygulamaz; kullanıcıya en fazla üç öneri gösterir ve seçim kullanıcıya bırakılır.

## Özellikler

- TDK tabanlı yerel kelime sözlüğü
- Hunspell kök verisiyle genişletilmiş kelime doğrulama
- Türkçe karakter hataları ve Q klavye yakın tuşlarına göre ağırlıklı öneri sıralama
- Damerau ve ağırlıklı kelime benzerliği
- Kelime tamamlama ve niyet odaklı öneriler
- `saol → sağ ol`, `patate → patates`, `nasilsin → nasılsın`, `dünyanin → dünyanın`
- Gelişmiş soru eki ve birleşik zaman biçimleri
- `tamammı → tamam mı`, `gelecekmisin → gelecek misin`, `güzeldimi → güzel miydi`, `yapacakmıydınız → yapacak mıydınız`
- Ayrı yazılmış soru ekinde ünlü uyumu: `daha mi → daha mı`
- `de/da` için yüksek güvenli bağlam kuralları
- `ki` bağlacı ve `-ki` eki için bağlam denetimi
- Cümlenin tamamını ve önceki kelimeleri geriye dönük tarama
- İmleç noktalama işaretinin sonundayken önceki cümlenin taranması
- Tamlayan eki ve cümle bağlamı önerileri
- Özel isim ve kesme işareti denetimi: `Ankaraya → Ankara'ya`, `Türkiyenin → Türkiye'nin`
- Cümle başı ve noktalama sonrası büyük harf denetimi
- Cümle sonu noktalama önerisi
- Noktalama öncesi/sonrası boşluk, tekrar eden işaret, çoklu boşluk, açık parantez ve tırnak denetimi
- `bir çok → birçok`, `hiç bir → hiçbir`, `her hangi → herhangi` gibi çok kelimeli kurallar
- Yüksek güvenli cümle yapısı ve gereksiz bağlaç tekrarı kontrolleri
- Hata türleri: Yazım, Dilbilgisi, Noktalama, Büyük harf, Özel isim, Cümle yapısı
- Destekleyen tarayıcılarda zengin editörde hata altı çizimi
- `Yoksay`, `Sözlüğe ekle` ve kullanıcı sözlüğü yönetimi
- ACP üzerinden forum özel sözlüğü ve özel isim listesi
- ACP üzerinden modülleri açıp kapatma ve 1–3 arası öneri sayısı ayarı
- Web Worker ile arka planda analiz
- Yalnız değişen cümleyi yeniden analiz eden performans yapısı
- Worker kullanılamadığında ana iş parçacığı yedeği
- XenForo zengin metin editörü, hızlı cevap ve konu başlığı desteği
- Harici API, Composer, SSH veya sunucu taraflı Hunspell gerektirmeyen çalışma modeli
- Otomatik smoke ve regresyon testleri

## Yönetici Ayarları

ACP içindeki Warext Türkçe Yazım Denetimi seçenek grubundan eklentiyi, dilbilgisi denetimini, noktalama denetimini, hata altı çizimini, özel isim denetimini, günlük konuşma önerilerini ve maksimum öneri sayısını yönetebilirsiniz. Forum özel sözlüğü ve özel isim listesi de aynı alandan düzenlenir.

## Kullanıcı Sözlüğü

Öneri panelindeki **Sözlüğe ekle** seçeneği kelimeyi kullanıcının tarayıcıdaki kişisel sözlüğüne ekler. **Sözlüğüm** alanından kelimeler görüntülenebilir ve kaldırılabilir. **Yoksay** seçeneği mevcut tarayıcı oturumu boyunca kelimeyi denetim dışında bırakır.

## Gereksinimler

- XenForo 2.3+
- XenForo 2.3 ile uyumlu PHP sürümü
- JavaScript etkin modern tarayıcı

PHP 8.4 ve XenForo 2.3 serisi hedeflenmektedir.

## Kurulum

1. `release/Warext-SpellCheck-1.zip` dosyasını indirin.
2. XenForo Yönetici Panelinde **Eklentiler → Arşivden yükle/yükselt** alanını açın.
3. ZIP dosyasını seçin.
4. Kurulum veya yükseltme işlemini tamamlayın.
5. Eski JavaScript önbelleği varsa bir kez zorla yenileyin.

## Kaynak Yapısı

```text
upload/
├── js/warext/turkish-spellcheck/
│   ├── bootstrap-v160.js
│   ├── dictionary-v160.js
│   ├── editor-v160.js
│   ├── rules-v160.js
│   └── worker-v160.js
└── src/addons/Warext/TurkishSpellCheck/
    ├── Resources/
    ├── _data/
    ├── Setup.php
    └── addon.json

source/dictionary/
├── engine.part0
└── engine.part1

tools/
├── build_dictionary.py
└── build_release.sh

tests/
├── dictionary-smoke.js
└── rules-regression.js
```

## Kaynak Koddan Derleme

```bash
bash tools/build_release.sh
```

Derleme işlemi sabitlenmiş sözlük kaynaklarını alır, tarayıcı sözlüğünü üretir, JavaScript/PHP/XML/JSON doğrulamalarını ve regresyon testlerini çalıştırır, kod yorum satırı kontrolünü uygular ve `release/Warext-SpellCheck-1.zip` paketini oluşturur.

## Lisans

Proje MPL-2.0 lisansı altında yayımlanmaktadır. Kullanılan üçüncü taraf sözlük/veri kaynakları `THIRD_PARTY.md` içinde belirtilir.

## Geliştirici

Warext Studios
