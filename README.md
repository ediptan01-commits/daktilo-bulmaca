# Daktilo Bulmaca

Orta, zor ve usta düzeyinde 60 klasik Türkçe bulmaca sorusu; 6 sayfa. Paket: `com.teknolojix.daktilobulmaca`. Android 6.0 ve üzeri. İnternetsiz çalışır.

## Oyun

- Türkçe yuvarlak daktilo tuşları, mekanik vuruş ve şaryo sesleri, zil, hareketli harf kolu ve ilerleyen kâğıt.
- Harf kutusuna dokunarak düzeltme, silme, harf açma, soruyu sonraya bırakma.
- Her doğru cevap 100 puan; açılan her harf 15 puan düşürür (en az 20 puan). Her 5 doğru cevap 2 ipucu kazandırır.
- Bölüm/soru seçimi, cihazda otomatik kayıt, ses ve titreşim ayarları.
- Reklam, hesap, sunucu ve internet izni içermez.

## Derleme

JDK 17, Gradle 8.13, Android SDK 36 gerekir. GitHub Actions her main push işleminde `assembleRelease` ve `bundleRelease` görevlerini çalıştırır. Çıktılar Actions çalışmasındaki **Daktilo-Bulmaca-Android** artifact içindedir.

```sh
gradle :app:assembleRelease :app:bundleRelease
```

### Google Play imzası

İlk çıktılar **test anahtarıyla imzalanır**, telefonda denemek içindir. Google Play yayını için depoya şu Actions secrets eklenmelidir: `ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Workflow bunlar varsa üretim anahtarıyla imzalar. Özel anahtar kaynak koduna ya da artifact içine konulmaz. İlk Play yüklemesinden önce üretim anahtarını yapılandırın; güncellemelerde aynı anahtarı koruyun.

## Web önizleme

`app/src/main/assets` dizinini bir statik HTTP sunucusuyla açın. Android uygulaması bu varlıkları dış ağ bağlantısı olmadan yerel HTTPS kökeninden yükler. Önizleme ile Android'deki kayıtlar ayrıdır.

## Doğrulama

`node tools/check-content.mjs` soru havuzunu denetler. CI ayrıca Android lint çalıştırır. Gerçek cihazda ses, arka plana geçiş ve küçük ekran kontrolü yapılmalıdır.
