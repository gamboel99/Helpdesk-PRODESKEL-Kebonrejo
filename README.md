# Prodeskel Lite (Static HTML/JS)

Aplikasi ringan untuk membantu input data KK, skoring indikator, rekap hirarkis (Desa→Dusun→RW→RT→KK), dan ekspor Excel. Dirancang agar mudah di-host di **GitHub Pages** atau **Vercel** tanpa server.

> ⚠️ **Disclaimer:** Paket ini mengikuti struktur indikator umum (38 item) dan mekanisme skoring 0–4 yang dapat disesuaikan. Peraturan Prodeskel/Kemendagri dapat berbeda versi/daerah. Silakan sesuaikan `data/indicators.json`, bobot, dan ambang agar selaras dengan ketentuan resmi terbaru di wilayah Anda.

## Fitur
- Form dinamis berdasarkan `data/indicators.json` (38 indikator dalam 5 dimensi).
- Skor otomatis per dimensi → skor total 0–100 dengan bobot.
- Klasifikasi otomatis: **Tertinggal**, **Berkembang**, **Maju**, **Mandiri** (ambang dapat diubah).
- Rekap otomatis: **Desa**, **Dusun**, **RW**, **RT**.
- Ekspor **Excel** (SheetJS): `Data_KK`, `Rekap_RT`, `Rekap_RW`, `Rekap_Dusun`, `Rekap_Desa`.
- Simpanan **LocalStorage**, Ekspor/Impor JSON.
- Tanpa backend (static site).

## Deploy ke GitHub Pages
1. Buat repo baru, mis. `prodeskel-lite`.
2. Unggah semua file/folder dari ZIP ini.
3. Aktifkan **Settings → Pages → Deploy from branch** (root, `/`).
4. Akses situs dari URL GitHub Pages.

## Deploy ke Vercel
1. Import repo ini ke Vercel.
2. Framework: `Other` / `Static`.
3. Build & Output: tidak perlu (static). Vercel akan melayani `index.html` dan folder `assets`/`data`.
4. URL akan disediakan oleh Vercel.

## Sesuaikan Indikator
- Edit `data/indicators.json`:
  - `id`: unik (tanpa spasi)
  - `label`: teks pertanyaan/indikator
  - `dim`: salah satu dari `ekonomi|pendidikan|kesehatan|sanitasi|partisipasi`
  - `type`: `select` (saat ini)
  - `options`: daftar pilihan dengan `label` dan `score` (0–4)
- Tambahkan/hapus indikator sesuai instrumen Prodeskel yang berlaku.

## Pengaturan Bobot & Ambang
Atur via tab **Pengaturan** di aplikasi atau langsung di kode `defaultConfig` (`assets/app.js`).

## Konversi Skor
1. Rata-rata skor indikator **per dimensi** (skala 0–4).
2. Konversi ke 0–100 per dimensi, dikalikan **bobot** (%).
3. Jumlahkan seluruh dimensi → **skor total** (0–100).
4. Klasifikasi berdasarkan ambang:
   - `≤ low`: Tertinggal
   - `> low` & `< mid`: Berkembang
   - `≥ mid` & `< high`: Maju
   - `≥ high`: Mandiri

## Catatan Kepatuhan
- Karena regulasi bisa berubah, gunakan file indikator ini sebagai *template*.
- Jika Anda punya dokumen resmi instrumen (Permendagri/Prodeskel), mapkan 1:1 ke `indicators.json`. Label pilihan dapat mengandung uraian persis dari butir instrumen.

## Lisensi
MIT License – silakan gunakan dan kembangkan.

— Dibangun 2025-08-24
