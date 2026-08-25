# Warext Studios | Türkçe Yazım Denetimi

XenForo 2.3+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama, anlam ve paragraf bütünlüğü denetimi eklentisi.

## Doğrudan kurulum

Kurulum dosyası:

`Warext-Turkce-Yazim-Denetimi-V1.0.3-XenForo.zip`

ZIP dosyasını çıkarmadan XenForo yönetim panelindeki **Add-ons → Install/upgrade from archive** alanına yükleyin.

V1.0.3 önceki sürümlerin üzerine doğrudan yükseltilebilir. Statik çalışma zamanı dosyalarında sürüm anahtarlı önbellek kırma kullanılır.

## Yerel V3.1.1 anlam motoru

V1.0.3 içindeki V3.1.1 katmanı metni yalnızca kelime veya yan yana cümle benzerliği üzerinden değerlendirmez. Paragraf; varlık, eylem, durum, miktar, zaman ve gönderim ilişkilerinden oluşan yerel bir önerme grafiğine dönüştürülür.

Motor aynı varlık hakkında ilerleyen cümlelerde kurulan bilgileri bellekte izler. Gerçek durum değişiklikleri ile çelişkiler ayrılır; koşullu, sorulu, aktarılmış ve varsayımsal cümleler kesin olgu gibi değerlendirilmez. Nicelik değişimi bildiren “dört kutu daha eklendi” türü ifadeler toplam stok değeriyle karıştırılmaz. Zamirlerin olası referansları izlenir, birden fazla kişiye gidebilen gönderimler işaretlenir, eylem-özne/nesne semantik rolleri denetlenir ve yerel neden-sonuç bilgi tabanı ile çıkarımlar sınanır.

Belge düzeyinde konu sapması, kopuk neden-sonuç zinciri, durum ve olay kutupluluk çatışması, nicelik tutarsızlığı, gönderim belirsizliği ve doğal Türkçe akışından belirgin sapmalar birlikte değerlendirilir.

Tüm sözlük, morfoloji, yerel dil modeli, semantik bilgi tabanı ve anlam çıkarım bileşenleri eklenti paketinin içindedir. Çalışma zamanında harici API, bulut modeli, uzak yapay zekâ servisi, CDN tabanlı NLP veya başka bir ağ servisi kullanılmaz.

XenForo arşiv kurucusu kapalıysa `src/config.php` içine aşağıdaki ayarın eklenmesi gerekir:

```php
$config['enableAddOnArchiveInstaller'] = true;
```

Manuel SQL içe aktarma gerekmez. Eklentiye ait tablolar kurulum sırasında otomatik oluşturulur.

## Kalite doğrulaması

Paketleme hattı JavaScript, PHP, shell, Python, XML ve JSON doğrulamalarına ek olarak sözlük, dilbilgisi, sözdizimi, uzun metin ve V3.1.1 semantik regresyon/benchmark testlerini çalıştırır. Paket yalnızca bu kontroller ve dosya bütünlüğü denetimi başarılı olduğunda oluşturulur.

## Depo yapısı

- `upload/`: XenForo'ya kurulacak eklenti dosyaları
- `source/`: dil motoru üretim kaynakları
- `tests/`: regresyon, benchmark ve kalite testleri
- `tools/`: tamamen yerel derleme ve doğrulama araçları

Lisans ve üçüncü taraf veri atıfları eklenti paketinin `Resources` dizininde tutulur.
