# Üçüncü Taraf Kaynaklar

Warext Turkish Spell Check çalışma zamanında harici API, uzak model sunucusu veya üçüncü taraf servis kullanmaz.

Build aşamasında aşağıdaki açık kaynak ve açık veri kaynakları işlenir:

- `ekartal/turkce-kelime-database`, revizyon `444dbcc53556618b0977a3d608cbf1402f7e9363`
- `tdd-ai/hunspell-tr`, revizyon `7302eca5f3652fe7ae3d3ec06c44697c97342b4e`, MPL-2.0
- `ahakanacar/turkish-dictionary-dataset-and-statistics`, revizyon `5ef471d903d48010cd15f4d3a0bb18a19ba95137`, MIT
- `3nesdeniz/turkish-daily-dialogues-5k`, revizyon `ccd9f05c2f97684bbd9a55d818528da9dfb6bd5a`, CC BY 4.0, yazar Enes Deniz
- GeoNames `cities500`, CC BY 4.0

Hunspell verisi yerel sözlük yapılarına, deyim verisi yerel kalıp indeksine, diyalog verisi yerel n-gram istatistiğine ve GeoNames verisi kompakt yer adı üyelik indeksine dönüştürülür. Bu kaynaklar çalışma zamanında ağ bağlantısı gerektirmez.

İlgili lisans ve atıf bilgileri dağıtım paketinin `Resources` dizininde korunur.
