# Custom Domain Setup (Vercel)

Hedef domain: `fitness.berkekaandinler.com`

## 1) Vercel'e domain ekle

Proje panelinden:

- Project -> Settings -> Domains -> Add
- `fitness.berkekaandinler.com` yaz ve ekle

CLI ile:

```powershell
cd "C:\Users\berke\Desktop\web site"
npx vercel domains add fitness.berkekaandinler.com
```

## 2) DNS kaydi olustur

Domain saglayicinda su CNAME kaydini ekle:

- Host/Name: `fitness`
- Type: `CNAME`
- Value/Target: `cname.vercel-dns.com`
- TTL: `Auto` veya `300`

## 3) Dogrulama

Vercel domain ekraninda status `Valid Configuration` olmali.

Kontrol:

```powershell
nslookup fitness.berkekaandinler.com
```

## 4) Primary domain

Domain dogrulandiktan sonra:

- Project -> Settings -> Domains
- `fitness.berkekaandinler.com` icin **Set as Primary** sec

## 5) SSL

Vercel SSL'i otomatik tanimlar. Son test:

- `https://fitness.berkekaandinler.com`
