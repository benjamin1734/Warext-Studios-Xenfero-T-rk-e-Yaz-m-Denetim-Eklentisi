# Warext Studios XenForo Türkçe Yazım Denetimi

XenForo 2.3 için geliştirilmiş, tarayıcı tarafında çalışan Türkçe yazım denetimi ve akıllı öneri eklentisidir.

## Özellikler

- Yazım hatalarında en fazla 3 düzeltme önerisi
- Türkçe karakter hataları için akıllı öneriler
- Kelime tamamlama önerileri
- Yaygın yanlış yazım kalıplarının düzeltilmesi
- `mı / mi / mu / mü` soru ekinin ayrı yazım kontrolü
- Soru ekinde ünlü uyumu kontrolü
- Cümle içindeki önceki kelimelerin geriye dönük taranması
- Cümle başında büyük harf önerisi
- Cümle sonu noktalama önerisi
- Noktalama öncesi ve sonrası boşluk kontrolü
- Tekrarlanan noktalama ve kelime kontrolü
- Bağlama ve kullanıcı niyetine göre öneri sıralama
- XenForo zengin metin editörü ve başlık alanı desteği
- Otomatik düzeltme yapmadan kullanıcı seçimiyle değiştirme
- Harici API veya ayrı bir yazım denetimi sunucusu gerektirmeyen yerel motor

## Örnekler

| Yazılan | Öneri |
| --- | --- |
| `yanlız` | `yalnız` |
| `saol` | `sağ ol` |
| `patate` | `patates` |
| `tamammı` | `tamam mı` |
| `daha mi` | `daha mı` |
| `dünyanin` | `dünyanın` |
| `nasilsin` | `nasılsın` |

## Gereksinimler

- XenForo 2.3 veya üzeri
- XenForo 2.3 ile uyumlu PHP sürümü
- JavaScript etkin modern tarayıcı

PHP 8.4 ve XenForo 2.3 serisi ile test edilmiştir.

## Kurulum

1. `release/Warext-SpellCheck-1.zip` dosyasını indirin.
2. XenForo Yönetici Paneline girin.
3. **Eklentiler → Arşivden yükle/yükselt** bölümünü açın.
4. ZIP dosyasını seçin.
5. **Kur** veya mevcut kurulumda **Yükselt** işlemini tamamlayın.

Eklenti için SSH, Composer, Hunspell kurulumu veya ayrı bir servis gerekmez.

## Kaynak Yapısı

```text
upload/
├── js/warext/turkish-spellcheck/
│   ├── bootstrap-v142.js
│   ├── dictionary-v142.js
│   └── editor-v142.js
└── src/addons/Warext/TurkishSpellCheck/
    ├── Resources/
    ├── _data/
    ├── Setup.php
    └── addon.json
```

## Geliştirme

Hata bildirimleri ve geliştirme önerileri GitHub Issues üzerinden paylaşılabilir. Kod katkıları Pull Request olarak gönderilebilir.

## Lisans

Proje MPL-2.0 lisansı altında yayımlanmaktadır. Sözlük/veri bileşenleriyle ilgili lisans metni ayrıca eklenti paketinin `Resources` dizininde tutulur.

## Geliştirici

Warext Studios
