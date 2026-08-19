# Warext Studios XenForo Türkçe Yazım Denetimi

XenForo 2.3 için tamamen yerel çalışan Türkçe yazım, dilbilgisi, noktalama ve bağlam denetimi eklentisidir. Harici API, Docker, Python çalışma zamanı, model sunucusu veya üçüncü taraf servis gerektirmez. Düzeltmeleri otomatik uygulamaz; kullanıcıya en fazla üç öneri gösterir.

## 3.0.0

- 117.000+ yerel kelime ve form havuzu
- Türkçe morfoloji, ek zinciri ve ses olayı denetimi
- de/da, ki, mı/mi/mu/mü ve birleşik-ayrı yazım kuralları
- Özne-yüklem kişi ve yüksek güvenli zaman uyumu kontrolleri
- Özel ad, 81 il, kısaltma ve sayı eki denetimi
- URL, e-posta, kullanıcı adı, domain, IP, dosya yolu ve kod bloklarını hariç tutma
- 1-3 arası ayarlanabilir öneri sayısı
- Zengin editörde hata altı çizimi
- Kalıcı kişisel sözlük, sözlük yönetimi ve oturumluk yok sayma
- ACP forum özel sözlüğü ve özel isim listesi
- ACP gramer, noktalama, özel ad, günlük yazım ve alt çizgi seçenekleri
- Yerel sonuç önbelleği
- Kod dosyalarında yorum satırı yok

## Kurulum

1. `release/Warext-SpellCheck-3.0.0.zip` dosyasını indirin.
2. XenForo ACP içinde **Add-ons → Install/upgrade from archive** alanını açın.
3. ZIP dosyasını yükleyin.
4. Mevcut sürüm varsa doğrudan üzerine yükseltin.
5. Ek SQL içe aktarma gerekmez.

## Gereksinimler

- XenForo 2.3.0+
- XenForo 2.3 ile uyumlu PHP sürümü
- Modern JavaScript destekli tarayıcı

## Kaynak yapısı

```text
upload/
├── js/warext/turkish-spellcheck/
│   ├── bootstrap-v300.js
│   ├── dictionary-v300.js
│   └── editor-v300.js
└── src/addons/Warext/TurkishSpellCheck/

source/dictionary/
└── engine-v300.part00...part08

source/editor/
└── editor-v300.part00...part04

tools/
├── build_dictionary.py
└── build_release.sh

tests/
├── dictionary-smoke.js
└── rules-regression.js
```

## Derleme

```bash
bash tools/build_release.sh
```

Derleme sözlük verilerini sabitlenmiş kaynak sürümlerinden alır, tarayıcı motorunu üretir, sözdizimi ve regresyon testlerini çalıştırır, kod yorum satırı kontrolünü uygular ve `release/Warext-SpellCheck-3.0.0.zip` paketini üretir. Çalışma zamanında ağ erişimi gerekmez.

## Lisans

Proje MPL-2.0 lisansı altında yayımlanmaktadır. Paketlenen sözlük kaynaklarının bilgileri `THIRD_PARTY.md` dosyasındadır.

## Geliştirici

Warext Studios
