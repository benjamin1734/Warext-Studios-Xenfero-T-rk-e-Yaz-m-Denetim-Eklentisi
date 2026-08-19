# Warext Studios XenForo Türkçe Yazım Denetimi

Warext Spell Check 1.0.0, XenForo 2.3+ için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama ve bağlam denetimi eklentisidir. Harici API, Docker, Python çalışma zamanı, model sunucusu veya üçüncü taraf servis gerektirmez. Düzeltmeler otomatik uygulanmaz; kullanıcıya en fazla üç öneri sunulur.

## 1.0.0

- 117.000+ yerel kelime ve form tabanı
- Çok aşamalı Türkçe morfoloji, ek zinciri ve ses olayı denetimi
- Fiilimsi, çatı ve ek türetim katmanı
- de/da, ki, mı/mi/mu/mü ve birleşik-ayrı yazım kuralları
- Özne-yüklem kişi ve zaman uyumu kontrolleri
- Komşu cümle bağlamını kullanan uzun metin analizi
- 23 yaygın fiil ailesinde kişi duyarlı geçmiş/gelecek zaman kontrolü
- Özel ad, 81 il, kısaltma ve sayı eki denetimi
- 50+ teknik kısaltma ve teknoloji adında Türkçe ek/kesme denetimi
- Türkçe Q klavye komşuluğunu kullanan öneri sıralaması
- URL, domain, e-posta, IPv4, IPv6, MAC, UUID, hash, sürüm, tarih, saat, dosya yolu, CLI parametresi, ortam değişkeni, dotfile, kod ve emoji koruması
- Uzun metni cümlelere bölerek arka planda tarama ve değişmeyen cümleleri önbellekten kullanma
- Zengin editörde hata altı çizimi
- Kalıcı kişisel sözlük ve oturumluk yok sayma
- ACP forum özel sözlüğü ve özel isim listesi
- Kod dosyalarında açıklama/yorum satırı yok
- Çalışma zamanında dış ağ isteği yok

## Kurulum

1. `release/Warext-SpellCheck-1.0.0.zip` paketini kullanın.
2. XenForo ACP içinde **Add-ons → Install/upgrade from archive** alanını açın.
3. ZIP dosyasını yükleyin.
4. Eski Warext Spell Check sürümü kuruluysa doğrudan üzerine yükseltin.
5. Ek SQL içe aktarma gerekmez.

## Gereksinimler

- XenForo 2.3.0+
- XenForo 2.3 ile uyumlu PHP sürümü
- Modern JavaScript destekli tarayıcı

## Doğrulama

```bash
bash tools/build_release.sh
```

Komut JavaScript sözdizimini, yerel dil regresyonlarını, PHP sözdizimini, JSON/XML dosyalarını, yorum satırı kuralını ve çalışma zamanı ağ API'lerinin bulunmadığını doğrular; ardından `release/Warext-SpellCheck-1.0.0.zip` paketini üretir.

## Lisans

Proje MPL-2.0 lisansı altında yayımlanmaktadır. Kullanılan açık kaynak sözlük kaynakları `THIRD_PARTY.md` dosyasında belirtilmiştir.

## Geliştirici

Warext Studios
