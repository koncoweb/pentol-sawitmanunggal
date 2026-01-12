/*
  # Performance Optimization - Add Indexes

  1. Indexes
    - Add index on `blok.divisi_id` untuk mempercepat query blok per divisi
    - Add index on `pemanen.divisi_id` untuk mempercepat query pemanen per divisi
    - Add index on `tph.divisi_id` untuk mempercepat query TPH per divisi
    - Add index on `gang.divisi_id` untuk mempercepat query gang per divisi
    - Add index on `pemanen.active` untuk filter pemanen aktif
    - Add index on `tph.active` untuk filter TPH aktif
    - Add composite index untuk kombinasi filter yang sering dipakai

  2. Purpose
    - Mempercepat loading data pada form input panen
    - Mengurangi waktu query dari detik menjadi milidetik
    - Meningkatkan performa aplikasi di mobile device

  3. Impact
    - Query akan jauh lebih cepat
    - Mengurangi beban CPU pada database
    - Meningkatkan user experience
*/

-- Index untuk blok
CREATE INDEX IF NOT EXISTS idx_blok_divisi_id ON blok(divisi_id);
CREATE INDEX IF NOT EXISTS idx_blok_divisi_name ON blok(divisi_id, name);

-- Index untuk pemanen
CREATE INDEX IF NOT EXISTS idx_pemanen_divisi_id ON pemanen(divisi_id);
CREATE INDEX IF NOT EXISTS idx_pemanen_divisi_active ON pemanen(divisi_id, active);
CREATE INDEX IF NOT EXISTS idx_pemanen_active ON pemanen(active);

-- Index untuk TPH
CREATE INDEX IF NOT EXISTS idx_tph_divisi_id ON tph(divisi_id);
CREATE INDEX IF NOT EXISTS idx_tph_divisi_active ON tph(divisi_id, active);
CREATE INDEX IF NOT EXISTS idx_tph_active ON tph(active);

-- Index untuk gang
CREATE INDEX IF NOT EXISTS idx_gang_divisi_id ON gang(divisi_id);

-- Index untuk harvest_records (untuk future queries)
CREATE INDEX IF NOT EXISTS idx_harvest_records_divisi_id ON harvest_records(divisi_id);
CREATE INDEX IF NOT EXISTS idx_harvest_records_created_by ON harvest_records(created_by);
CREATE INDEX IF NOT EXISTS idx_harvest_records_status ON harvest_records(status);
CREATE INDEX IF NOT EXISTS idx_harvest_records_tanggal ON harvest_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_harvest_records_divisi_tanggal ON harvest_records(divisi_id, tanggal DESC);

-- Analyze tables untuk update statistics
ANALYZE blok;
ANALYZE pemanen;
ANALYZE tph;
ANALYZE gang;
ANALYZE harvest_records;
