# Üçüncü Taraf Kaynakları

Bu proje Türkçe sözlük verisini iki açık kaynak çalışmadan üretir.

## Türkçe kelime veritabanı

- Proje: `ekartal/turkce-kelime-database`
- Sabitlenen commit: `444dbcc53556618b0977a3d608cbf1402f7e9363`
- Kullanım: Yerel Türkçe kelime doğrulama ve öneri adaylarının oluşturulması

## Hunspell Türkçe

- Proje: `tdd-ai/hunspell-tr`
- Sabitlenen commit: `7302eca5f3652fe7ae3d3ec06c44697c97342b4e`
- Lisans: MPL-2.0
- Kullanım: Türkçe kök ve çekim doğrulama verisi

`tools/build_dictionary.py` bu iki kaynağın sabitlenmiş sürümlerini kullanarak tarayıcı tarafında çalışan sözlük dosyasını üretir. Derlenen kurulum paketinin içine Hunspell lisans metni de eklenir.
