# Daktilo Bulmaca

Kolay başlayan 120 klasik Türkçe bulmaca sorusu; 12 sayfa. Sürüm 1.3.0 (7). İlk 30 soru kolay, sonraki 30 soru orta düzeydedir. Paket: `com.teknolojix.daktilobulmaca`. Android 6.0 ve üzeri. İnternetsiz çalışır.

## Oyun

- Onaylanan gerçekçi 3B görünümlü daktilo illüstrasyonu, görseldeki yuvarlak tuşlarla hizalanan Türkçe Q dokunma alanları, gerçek daktilo kayıtlarından vuruş/şaryo sesleri, zil ve hareketli harf kolu.
- Harf kutusuna dokunarak düzeltme, silme, harf açma, soruyu sonraya bırakma.
- Her doğru cevap 100 puan; açılan her harf 15 puan düşürür (en az 20 puan). Her 5 doğru cevap 2 ipucu kazandırır.
- Doğru cevaptan 850 ms sonra otomatik sonraki soruya geçiş; son soruda tamamlanma ekranı.
- Bölüm/soru seçimi, cihazda otomatik kayıt, ses ve titreşim ayarları.
- Kaydırma gerektirmeyen ekran düzeni: daktilo, görüntü oranı korunarak kalan yüksekliğe sığar.
- Reklam, hesap, sunucu ve internet izni içermez.

## Derleme

JDK 17, Gradle 8.13, Android SDK 36 gerekir. GitHub Actions her main push işleminde `assembleRelease` ve `bundleRelease` görevlerini çalıştırır. Çıktılar Actions çalışmasındaki **Daktilo-Bulmaca-Android** artifact içindedir.

```sh
gradle :app:assembleRelease :app:bundleRelease
```

### Google Play imzası

İlk çıktılar **test anahtarıyla imzalanır**, telefonda denemek içindir. Google Play yayını için depoya şu Actions secrets eklenmelidir: `ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Workflow bunlar varsa üretim anahtarıyla imzalar. Özel anahtar kaynak koduna ya da artifact içine konulmaz. Test anahtarı Actions cache içinde sonraki derlemeler için korunur; cache kalıcı bir üretim anahtarı yedeği değildir. İlk 1.0.0 test derlemesinde anahtar saklanmadığından 1.1.0 sürümü eski APK üzerine kurulamayabilir; eski uygulama kaldırılırsa Android yerel kaydı siler. Kod, aynı anahtarla güncellenen kurulumlarda eski 60 sorunun cevaplarını/puanlarını koruyup yeni kolay sorulara geçirir. İlk Play yüklemesinden önce üretim anahtarını yapılandırın; güncellemelerde aynı anahtarı koruyun.

## Web önizleme

`app/src/main/assets` dizinini bir statik HTTP sunucusuyla açın. Android uygulaması bu varlıkları dış ağ bağlantısı olmadan yerel HTTPS kökeninden yükler. Önizleme ile Android'deki kayıtlar ayrıdır.

## Doğrulama

`node tools/check-content.mjs` soru havuzunu denetler. `node tools/check-game.mjs` otomatik geçişi, yanlış cevap düzeltmesini, ipucuyla tamamlamayı ve son soru davranışını denetler. CI ayrıca Android lint çalıştırır. Sesler ve lisansları için `app/src/main/assets/sfx/CREDITS.md` dosyasına bakın. Gerçek cihazda ses, arka plana geçiş ve küçük ekran kontrolü yapılmalıdır.

1.2.1: Tuş görseli ve dokunma alanları korunarak harfler daha büyük çizilir. Boyut, daktiloyla aynı oranda ölçeklenir.

1.3.0: Fotoğraftaki özgün tuş dokuları geri getirildi. Canvas katmanı basılan tuşu çöktürür; 32 bağımsız harf kolu kendi pivotundan ortak baskı noktasına vurur. Harf ve vuruş sesi darbe anında işlenir; şaryo, kâğıt, şerit makaraları, geri silme ve satır dönüşü aynı mekanik kuyruğu kullanır. Bu, özgün 3B görünümlü resim üzerinde çalışan bir hareket simülasyonudur.
