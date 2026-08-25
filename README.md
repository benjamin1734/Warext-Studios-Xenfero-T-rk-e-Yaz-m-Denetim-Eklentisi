# Warext Studios | Türkçe Yazım Denetimi

XenForo 2.3+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama, anlam ve paragraf bütünlüğü denetimi eklentisi.

## Doğrudan kurulum

Kurulum dosyası:

`Warext-Turkce-Yazim-Denetimi-V1.0.3-XenForo.zip`

ZIP dosyasını çıkarmadan XenForo yönetim panelindeki **Add-ons → Install/upgrade from archive** alanına yükleyin.

V1.0.3, önceki sürümlerin üzerine doğrudan yükseltilebilir. Statik JavaScript dosyalarında sürüm anahtarlı önbellek kırma kullanılır.

V1.0.3 ile yerel V3.1 anlam motoru eklendi. Motor yalnızca kelime veya yan yana cümle benzerliği üzerinden çalışmaz; paragrafı önerme grafiğine dönüştürerek varlıkları, eylemleri, durumları, miktarları, zaman bilgisini ve cümleler arası gönderimleri bellekte izler. Aynı varlık hakkında ilerleyen cümlelerde kurulan durumlar karşılaştırılır, gerçek durum değişiklikleri ayrı tutulur, koşullu ve varsayımsal cümleler kesin olgu gibi değerlendirilmez, zamirlerin olası referansları izlenir, eylem-özne/nesne uyumu denetlenir ve yerel neden-sonuç bilgi tabanı ile çıkarımlar sınanır. Konu sapması, kopuk sonuç zinciri, nicelik çelişkisi, olayın olumlu/olumsuz anlatım çatışması ve doğal Türkçe akışından belirgin sapmalar belge bütünü içinde değerlendirilir.

Tüm sözlük, morfoloji, dil modeli, semantik bilgi tabanı ve anlam çıkarım bileşenleri eklenti paketinin içindedir. Çalışma zamanında harici API, bulut modeli, uzak yapay zekâ servisi veya başka bir ağ servisi kullanılmaz.

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
