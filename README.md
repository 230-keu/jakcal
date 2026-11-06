# paJAK-CALculator 🧾

> **Kalkulator Pajak Invoice Dua Arah (PPN & PPh)** berbasis web dengan presisi standar regulasi perpajakan Republik Indonesia dan antarmuka modern terinspirasi dari **Apple Design System**.

![paJAK-CALculator Preview](favicon.svg)

---

## 🌟 Ringkasan Proyek

**paJAK-CALculator** dirancang khusus untuk mempermudah akuntan, tim *finance/procurement*, bendahara instansi/pemerintah, vendor, dan pekerja lepas (*freelancer*) dalam menghitung, merekonsiliasi, dan memvalidasi rincian pajak pada tagihan/invoice secara instan dan akurat.

Kalkulator ini bekerja secara **dua arah (*bidirectional*)**: Anda tidak hanya dapat menghitung dari nilai awal (DPP), melainkan dapat mengubah baris mana saja—seperti **Total Tagihan** atau nominal bersih **Diterima Vendor** (*Gross-Up*)—dan sistem akan secara otomatis menghitung mundur seluruh komponen perpajakan secara *real-time*.

Semua kalkulasi diproses **100% di browser pengguna (*client-side*)** tanpa mengirimkan data transaksi atau angka rahasia ke server luar (*zero data leakage / privacy-first*).

---

## ✨ Fitur Unggulan

### 1. Perhitungan Dua Arah (*Bidirectional Real-Time Recalculation*)
* **Hitung Maju**: Masukkan Harga Sebelum Pajak (DPP) $\rightarrow$ sistem menghitung PPN, Total Tagihan, potongan PPh, dan nominal diterima vendor.
* **Hitung Mundur (*Gross-Up*)**: Masukkan nominal bersih yang ingin diterima vendor $\rightarrow$ sistem otomatis mencari nilai DPP dan Total Tagihan yang tepat.
* **Penetapan Acuan Cepat**: Cukup ketik nominal di baris tabel mana pun; baris tersebut otomatis menjadi jangkar acuan kalkulasi (*active source*).

### 2. Kepatuhan Regulasi Pajak Indonesia Terkini
* **Tarif PPN Fleksibel**:
  * **12%** (*Default*) dengan opsi **DPP Nilai Lain (11/12 $\times$ harga)** sesuai UU HPP & PMK No. 11/2025.
  * **11%** (Standar umum).
  * **1,1%** (Besaran tertentu).
  * **0%** (Non-PKP / Bebas PPN).
* **PPN WAPU (Wajib Pungut)**:
  * Dukungan opsi PPN dipungut langsung oleh Bendahara Pemerintah / BUMN, sehingga vendor hanya menerima `DPP - PPh`.
* **Ragam Tarif Pemotongan PPh**:
  * PPh 21 Tenaga Ahli / Bukan Pegawai (2,5%).
  * PPh 22 Pembelian Barang oleh Bendahara Pemerintah (1,5%).
  * PPh 23 Jasa (2%).
  * PPh 23 Jasa Tanpa NPWP (4%).
  * PPh 23 Dividen / Bunga / Royalti (15%).
  * PPh Final 4(2) UMKM PP 55 (0,5%).
  * PPh Final 4(2) Jasa Konstruksi (1,75%, 2,65%, 3,5%).
  * PPh Final 4(2) Sewa Tanah & Bangunan (10%).
  * Bebas PPh (0%) atau **Tarif PPh Kustom (%)**.

### 3. Antarmuka Apple Design System
* **Tipografi**: Menggunakan keluarga font **SF Pro Display** & **SF Pro Text** dengan *negative letter-spacing* khas Apple serta format *tabular-nums* agar nilai digit Rupiah lurus vertikal.
* **Warna Aksen Tunggal**: Menggunakan **Apple Action Blue (`#0066cc`)** sebagai satu-satunya penanda interaktif utama.
* **Komponen Non-Native Kustom**:
  * *Custom Checklist*: Berbentuk squircle Apple (20×20px, radius 6px) dengan transisi centang putih bersih.
  * *Custom Popover Dropdown*: Menu melayang semi-transparan bergaya popover macOS/iOS dengan indikator centang biru aktif dan navigasi keyboard ramah pengguna (`Esc` / `Arrow`).
* **Header Frosted Glass Melayang**: Bilah navigasi `apple-subnav` menempel di atas layar (*sticky*) dengan efek `backdrop-filter: blur(20px)`.
* **Dark Mode Adaptif**: Dukungan penuh Mode Gelap (*Carbon / Void Black*) dan Mode Terang (*Parchment / Pure White*).
* **Desain Responsif Mobile-First**: Dioptimalkan untuk layar ponsel tanpa ada teks terpotong atau meluap (*overflow*).

### 4. Salin Cepat & Cetak Invoice Resmi (PDF)
* **Tombol SALIN**: Menyalin seluruh ringkasan penghitungan pajak ke clipboard dalam format teks terstruktur siap kirim via WhatsApp atau Email.
* **Tombol CETAK INVOICE**: Membuka format cetak faktur penagihan formal standar instansi/perusahaan, siap disimpan langsung sebagai dokumen PDF atau dicetak ke printer.

---

## 📁 Struktur Berkas

```
Kalkulator Pajak/
├── index.html           # Struktur antarmuka web & template cetak faktur invoice
├── style.css            # Desain lengkap (Apple tokens, responsif mobile, print styles)
├── app.js               # Pengendali DOM, event listener, dan custom dropdown
├── calculator.js        # Mesin kalkulasi matematika pajak murni (zero-dependency)
├── server.js            # Server lokal native Node.js (port 3000)
├── favicon.svg          # Ikon tab browser berbasis vektor kalkulator adaptif
├── test-calculator.js   # Unit test logika matematika pajak & gross-up
├── test-browser.js      # Unit test integrasi interaksi DOM & event browser
├── DESIGN.md            # Spesifikasi desain Apple yang aktif diterapkan
├── DESIGN.backup.md     # Salinan cadangan arsitektur desain sebelumnya
├── apple-Design.md      # Referensi analisis sistem desain Apple
└── package.json         # Konfigurasi npm scripts dan metadata proyek
```

---

## 🚀 Memulai (Panduan Instalasi & Penggunaan)

### Prasyarat
* [Node.js](https://nodejs.org/) (versi 16 atau lebih baru).
* Peramban modern (Google Chrome, Apple Safari, Microsoft Edge, Mozilla Firefox).

### 1. Kloning Repositori
```bash
git clone https://github.com/230-keu/jakcal230.git
cd jakcal230
```

### 2. Jalankan Server Lokal
Aplikasi ini dibuat murni tanpa dependensi eksternal (*zero external dependencies*):
```bash
node server.js
```
Atau jika menggunakan perintah npm:
```bash
npm start
```
Buka peramban di alamat: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Pengujian Otomatis (*Automated Testing*)

Proyek ini dilengkapi dengan rangkaian pengujian komprehensif untuk memastikan akurasi matematika pajak, pembulatan bilangan, konsistensi baris ledger, dan penanganan event browser:

```bash
npm test
```

Pengujian mencakup:
* ✅ Rekonsiliasi kasus acuan faktur standar (DPP 1.000.000, PPN 11/12%, PPh 2%).
* ✅ Verifikasi *reverse calculation* (*Gross-Up*) dari nominal diterima vendor.
* ✅ Konsistensi formula matematis `Total = DPP + PPN` dan `Vendor = Total - PPh`.
* ✅ Logika aktivasi dan hitung mundur DPP Nilai Lain 11/12.
* ✅ Simulasi pemotongan WAPU Bendahara Pemerintah.
* ✅ Click-through DOM simulation dan verifikasi template cetak invoice.

---

## ⚖️ Dasar Hukum & Regulasi Pajak

Perhitungan dalam aplikasi ini diselaraskan dengan peraturan perundang-undangan perpajakan Republik Indonesia:
1. **Undang-Undang No. 7 Tahun 2021** tentang Harmonisasi Peraturan Perpajakan (UU HPP).
2. **PMK No. 136/2023** dan **PMK No. 11/2025** mengenai ketentuan tarif Pajak Pertambahan Nilai (PPN) dan DPP Nilai Lain (11/12).
3. **UU PPh Pasal 21, Pasal 22, Pasal 23, dan Pasal 4 ayat (2)** tentang Pemotongan dan Pemungutan Pajak Penghasilan atas Barang dan Jasa.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT License**. Terbuka untuk digunakan oleh perusahaan, lembaga pendidikan, instansi pemerintah, maupun pengembang independen.
