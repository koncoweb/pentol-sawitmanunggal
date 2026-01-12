/*
  # Update Harvest Records Schema

  ## Perubahan
  Menyesuaikan struktur tabel `harvest_records` sesuai kebutuhan bisnis baru:
  
  1. **Hapus Kolom**
     - `jumlah_jjg` - Field ini tidak diperlukan lagi dalam form input panen
  
  2. **Rename Kolom**
     - `over_ipe` → `overripe` - Mengubah nama kolom untuk lebih jelas dan sesuai terminologi
  
  ## Alasan Perubahan
  - Simplifikasi form input panen dengan menghapus field yang tidak diperlukan
  - Peningkatan kejelasan terminologi dengan nama yang lebih deskriptif
  - Tangkai Panjang dan Jangkos tetap ada dan dipindahkan ke section "Kriteria Buah"
  
  ## Data Safety
  - Menggunakan IF EXISTS untuk mencegah error jika kolom sudah/belum ada
  - Rename kolom menggunakan ALTER COLUMN untuk mempertahankan data yang ada
*/

-- Rename kolom over_ipe menjadi overripe (jika belum direname)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'harvest_records' AND column_name = 'over_ipe'
  ) THEN
    ALTER TABLE harvest_records RENAME COLUMN over_ipe TO overripe;
  END IF;
END $$;

-- Hapus kolom jumlah_jjg (jika masih ada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'harvest_records' AND column_name = 'jumlah_jjg'
  ) THEN
    ALTER TABLE harvest_records DROP COLUMN jumlah_jjg;
  END IF;
END $$;