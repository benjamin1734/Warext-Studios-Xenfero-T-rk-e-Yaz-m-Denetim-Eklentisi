# Warext Studios | Türkçe Yazım Denetimi

XenForo 2.3+ için yerel çalışan Türkçe yazım ve dil denetimi eklentisi.

## Doğrudan kurulum

Kurulum dosyası:

`Warext-Turkce-Yazim-Denetimi-V1-XenForo.zip`

ZIP dosyasını çıkarmadan XenForo yönetim panelindeki **Add-ons → Install/upgrade from archive** alanına yükleyin.

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
