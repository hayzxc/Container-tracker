
1. **Diagnosa dan perbaiki error blank screen**
   - Buka kembali `src/integrations/supabase/client.ts` untuk memastikan ia memang hanya membaca `import.meta.env.VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Pastikan di root project ada file `.env` dengan tiga variabel environment:
     - `VITE_SUPABASE_PROJECT_ID`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_URL`
   - Jika file `.env` hilang atau isinya salah, buat/koreksi isinya agar persis seperti nilai yang sudah dikonfigurasi untuk project Anda.
   - Simpan file, lalu lakukan hard refresh pada preview.
   - Verifikasi di DevTools Console bahwa error “supabaseUrl is required” sudah hilang dan halaman login/utama kembali muncul.

2. **Batasi tombol Export PDF hanya untuk admin**
   - Di `ContainerList.tsx`, di bagian `CardHeader` yang menampilkan tombol Filter dan Export:
     - Ubah render tombol Export menjadi `isAdmin && totalContainers > 0 && (...)`, sehingga hanya user dengan `role='admin'` (berdasarkan tabel `user_roles` dan fungsi `checkAdminRole`) yang melihat tombol ini.
   - Pastikan fungsi `checkAdminRole` tetap dipanggil di `useEffect` saat komponen mount.

3. **Samakan data PDF dengan data yang sudah difilter di UI**
   - Pindahkan referensi di fungsi `exportToPDF` dari `for (const shipper of shippers)` menjadi `for (const shipper of filteredShippers)`, agar PDF hanya berisi shipper/container yang lolos filter nama, tanggal, dan status verifikasi.
   - Pastikan struktur `tableData` tetap sama (`shipper`, `containerPhoto`, `commodityPhoto`, `ispmPhoto`, `mapUrl`).

4. **Pertahankan layout PDF sesuai contoh**
   - Tetap gunakan `jsPDF('landscape')` dan konfigurasi `autoTable` yang sudah ada:
     - Header `["Nama Shipper", "Foto No Container", "Foto Komoditi", "Foto ISPM", "Lokasi Map"]`.
     - `headStyles.fillColor` biru dan `textColor` putih.
     - `columnStyles` dengan lebar kolom yang relatif kecil untuk setiap gambar agar tampilan rapat.
   - Jika diperlukan, kecilkan lagi `minCellHeight` dan/atau `cellWidth` kolom gambar untuk menyesuaikan dengan preferensi Anda, tapi struktur dasarnya tetap sama dengan screenshot.

5. **Uji akhir**
   - Login sebagai user biasa → pastikan:
     - Data tampil normal.
     - Tombol Export PDF tidak muncul.
   - Login sebagai admin:
     - Pastikan tombol Export PDF muncul.
     - Coba filter nama shipper, tanggal, dan status verifikasi → klik Export PDF.
     - Buka PDF dan verifikasi:
       - Layout header biru dan kolom‑kolom gambar sesuai contoh.
       - Hanya data yang sesuai filter yang muncul.
