# Warext Studios | Türkçe Yazım Denetimi

XenForo 2.3+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama, anlam ve paragraf bütünlüğü denetimi eklentisi.

## Doğrudan kurulum

Kurulum dosyası:

`Warext-Turkce-Yazim-Denetimi-V1.0.2-XenForo.zip`

ZIP dosyasını çıkarmadan XenForo yönetim panelindeki **Add-ons → Install/upgrade from archive** alanına yükleyin.

V1.0.2, önceki sürümlerin üzerine doğrudan yükseltilebilir. Statik JavaScript dosyalarında sürüm anahtarlı önbellek kırma kullanılır.

V1.0.2 ile yerel V3 semantik motoru eklendi. Sistem artık yalnızca kelime denetimi yapmaz; tüm paragrafı cümleler arası anlam ve mantık ilişkileriyle birlikte değerlendirir. Konu sürekliliği, neden-sonuç bağı, karşıtlık, nicelik ve varlık çelişkileri, zamir gönderimleri, zaman akışı, kişi sürekliliği, tekrar, konu sapması ve genel paragraf bütünlüğü birlikte analiz edilir. Analiz tamamen yereldir ve çalışma zamanında harici API, model veya servis kullanmaz.

XenForo arşiv kurucusu kapalıysa `src/config.php` içine aşağıdaki ayarın eklenmesi gerekir:

```php
$config['enableAddOnArchiveInstaller'] = true;
```

Manuel SQL içe aktarma gerekmez. Eklentiye ait tablolar kurulum sırasında otomatik oluşturulur.

## Depo yapısı

- `upload/`: XenForo'ya kurulacak eklenti dosyaları
- `source/`: dil motoru üretim kaynakları
- `tests/`: regresyon ve kalite testleri
- `tools/`: derleme ve doğrulama araçları

Lisans ve üçüncü taraf veri atıfları eklenti paketinin `Resources` dizininde tutulur.
