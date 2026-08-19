# Üçüncü Taraf Kaynaklar

Warext Turkish Spell Check çalışma zamanında harici API, model sunucusu veya üçüncü taraf servis kullanmaz.

Sözlük tabanının hazırlanmasında sabitlenmiş açık kaynak Türkçe kaynaklar kullanılır:

- `ekartal/turkce-kelime-database`, kaynak revizyonu `444dbcc53556618b0977a3d608cbf1402f7e9363`
- `tdd-ai/hunspell-tr`, kaynak revizyonu `7302eca5f3652fe7ae3d3ec06c44697c97342b4e`
- TDD Hunspell `.dic` ve `.aff` içeriği build aşamasında Warext derleyicisi tarafından işlenir; çalışma zamanında Hunspell motoru veya harici sözlük servisi gerekmez.
- Hunspell Türkçe kaynağının MPL-2.0 lisans metni eklenti kaynakları altında korunur.

Karşılaştırma amacıyla kullanıcı tarafından sağlanan başka bir eklenti arşivinden hiçbir kaynak kod, regex, veri dosyası, sözlük, kural listesi veya çalışma zamanı varlığı Warext kod tabanına kopyalanmamıştır. Benzer işlevler Warext mimarisi içinde bağımsız olarak uygulanmıştır.
