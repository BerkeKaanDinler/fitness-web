# BKD Fitness Lab

Ultimate fitness web deneyimi: bolgesel antrenmanlar, hazir programlar, teknik medya kutuphanesi, hesaplayicilar, takip paneli ve PWA destegi.

Kurucu: **Berke Kaan Dinler**

## Canli Link

- https://bkd-fitness-v2.vercel.app

## Ozellikler

- Bolgesel antrenman paneli (gogus, sirt, omuz, bacak, kol, core)
- Hazir programlar (Alpha, Titan, Cut & Core, Hybrid)
- Hedefe gore akilli program onerisi
- Gunluk Komuta Merkezi
- Egzersiz kutuphanesi (arama, filtreleme, favoriler, form videosu linkleri)
- Hizli seans uretici (30/45/60 dk, adim takibi)
- Kalori/makro hesaplayici
- 1RM ve yuzde tablo hesaplayici
- Su ihtiyaci hesaplayici
- Haftalik takip paneli + dinlenme zamanlayici
- Veri export/import (JSON)
- Medya galerisi ve YouTube teknik video bolumu
- PWA (install edilebilir) + service worker cache
- Mobil uyumlu tasarim

## Teknoloji

- HTML5
- CSS3
- Vanilla JavaScript (modulsuz)
- Vercel (hosting/deploy)

## Proje Yapisi

```text
.
├─ index.html
├─ styles.css
├─ script.js
├─ sw.js
├─ manifest.webmanifest
├─ icon.svg
└─ media/
```

## Lokal Calistirma

Statik bir proje oldugu icin herhangi bir local server ile calistirabilirsin:

```powershell
cd "C:\Users\berke\Desktop\web site"
python -m http.server 5500
```

Tarayici:

- http://localhost:5500

## Deploy (Vercel)

```powershell
cd "C:\Users\berke\Desktop\web site"
npx vercel --prod
```

## Guvenlik Notu

- Vercel tokenlarini repoya yazma/commit etme.
- Token paylasildiysa hemen revoke et ve yenisini olustur.
- `.vercel` klasoru `.gitignore` ile disarida tutulur.

## Yol Haritasi (Opsiyonel)

- Admin panel ile program/hareket yonetimi
- Uye girisi ve cloud tabanli veri senkronizasyonu
- Ilerleme grafikleri ve haftalik raporlama

