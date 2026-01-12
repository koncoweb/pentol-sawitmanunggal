/*
  # Create Harvest Management Tables

  ## Overview
  Tables untuk mengelola data panen, blok, pemanen, dan TPH (Tempat Pengumpulan Hasil)

  ## New Tables

  ### 1. blok
  Menyimpan data blok kebun
  - `id` (uuid, PK)
  - `divisi_id` (uuid, FK) - Foreign key ke divisi
  - `name` (text) - Nama blok (contoh: C5, A.5, Y.5)
  - `tahun_tanam` (integer) - Tahun tanam blok
  - `luas_ha` (decimal) - Luas blok dalam hektar
  - `jumlah_pokok` (integer) - Jumlah pokok dalam blok
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. pemanen
  Menyimpan data pemanen/operator
  - `id` (uuid, PK)
  - `divisi_id` (uuid, FK) - Foreign key ke divisi
  - `gang_id` (uuid, FK, NULLABLE) - Foreign key ke gang
  - `operator_code` (text) - Kode operator (contoh: 2011, 2000)
  - `name` (text) - Nama pemanen
  - `active` (boolean) - Status aktif pemanen
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. tph
  Tempat Pengumpulan Hasil
  - `id` (uuid, PK)
  - `divisi_id` (uuid, FK) - Foreign key ke divisi
  - `blok_id` (uuid, FK) - Foreign key ke blok
  - `nomor_tph` (text) - Nomor TPH
  - `latitude` (decimal, NULLABLE) - GPS latitude
  - `longitude` (decimal, NULLABLE) - GPS longitude
  - `active` (boolean) - Status aktif TPH
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. harvest_records
  Data panen harian
  - `id` (uuid, PK)
  - `tanggal` (date) - Tanggal panen
  - `divisi_id` (uuid, FK) - Foreign key ke divisi
  - `blok_id` (uuid, FK) - Foreign key ke blok
  - `pemanen_id` (uuid, FK) - Foreign key ke pemanen
  - `tph_id` (uuid, FK, NULLABLE) - Foreign key ke TPH
  - `rotasi` (integer) - Rotasi panen
  - `hasil_panen_bjd` (decimal) - Hasil Panen BJD (Brondolan Jadi Ditimbang) dalam kg
  - `bjr` (integer) - Brondolan Janjang Raw
  - `jumlah_jjg` (integer) - Jumlah Janjang (Pokok Garis)
  - `buah_masak` (integer, DEFAULT 0) - Jumlah buah masak
  - `buah_mentah` (integer, DEFAULT 0) - Jumlah buah mentah
  - `buah_mengkal` (integer, DEFAULT 0) - Jumlah buah mengkal
  - `over_ipe` (integer, DEFAULT 0) - Over IPE
  - `abnormal` (integer, DEFAULT 0) - Buah abnormal
  - `buah_busuk` (integer, DEFAULT 0) - Buah busuk
  - `tangkai_panjang` (integer, DEFAULT 0) - Tangkai panjang
  - `jangkos` (integer, DEFAULT 0) - Jangkos
  - `keterangan` (text, NULLABLE) - Keterangan tambahan
  - `status` (text, DEFAULT 'draft') - Status: draft, submitted, approved
  - `created_by` (uuid, FK) - Foreign key ke profiles (krani panen yang input)
  - `approved_by` (uuid, FK, NULLABLE) - Foreign key ke profiles (mandor yang approve)
  - `created_at` (timestamptz, DEFAULT now())
  - `updated_at` (timestamptz, DEFAULT now())

  ## Security
  - Enable RLS pada semua tabel
  - Role-based access control

  ## Indexes
  - Foreign key indexes untuk performance
  - Index pada tanggal untuk query reporting
*/

-- Create blok table
CREATE TABLE IF NOT EXISTS blok (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisi_id uuid NOT NULL REFERENCES divisi(id) ON DELETE CASCADE,
  name text NOT NULL,
  tahun_tanam integer,
  luas_ha decimal(10, 2),
  jumlah_pokok integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(divisi_id, name)
);

-- Create pemanen table
CREATE TABLE IF NOT EXISTS pemanen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisi_id uuid NOT NULL REFERENCES divisi(id) ON DELETE CASCADE,
  gang_id uuid REFERENCES gang(id) ON DELETE SET NULL,
  operator_code text NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(divisi_id, operator_code)
);

-- Create tph table
CREATE TABLE IF NOT EXISTS tph (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  divisi_id uuid NOT NULL REFERENCES divisi(id) ON DELETE CASCADE,
  blok_id uuid REFERENCES blok(id) ON DELETE SET NULL,
  nomor_tph text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(divisi_id, nomor_tph)
);

-- Create harvest_records table
CREATE TABLE IF NOT EXISTS harvest_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal date NOT NULL,
  divisi_id uuid NOT NULL REFERENCES divisi(id) ON DELETE CASCADE,
  blok_id uuid NOT NULL REFERENCES blok(id) ON DELETE CASCADE,
  pemanen_id uuid NOT NULL REFERENCES pemanen(id) ON DELETE CASCADE,
  tph_id uuid REFERENCES tph(id) ON DELETE SET NULL,
  rotasi integer NOT NULL,
  hasil_panen_bjd decimal(10, 2) NOT NULL DEFAULT 0,
  bjr integer DEFAULT 0,
  jumlah_jjg integer NOT NULL DEFAULT 0,
  buah_masak integer DEFAULT 0,
  buah_mentah integer DEFAULT 0,
  buah_mengkal integer DEFAULT 0,
  over_ipe integer DEFAULT 0,
  abnormal integer DEFAULT 0,
  buah_busuk integer DEFAULT 0,
  tangkai_panjang integer DEFAULT 0,
  jangkos integer DEFAULT 0,
  keterangan text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blok_divisi ON blok(divisi_id);
CREATE INDEX IF NOT EXISTS idx_pemanen_divisi ON pemanen(divisi_id);
CREATE INDEX IF NOT EXISTS idx_pemanen_gang ON pemanen(gang_id);
CREATE INDEX IF NOT EXISTS idx_tph_divisi ON tph(divisi_id);
CREATE INDEX IF NOT EXISTS idx_tph_blok ON tph(blok_id);
CREATE INDEX IF NOT EXISTS idx_harvest_tanggal ON harvest_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_harvest_divisi ON harvest_records(divisi_id);
CREATE INDEX IF NOT EXISTS idx_harvest_status ON harvest_records(status);
CREATE INDEX IF NOT EXISTS idx_harvest_created_by ON harvest_records(created_by);

-- Enable RLS
ALTER TABLE blok ENABLE ROW LEVEL SECURITY;
ALTER TABLE pemanen ENABLE ROW LEVEL SECURITY;
ALTER TABLE tph ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blok
CREATE POLICY "Users can view blok based on role"
  ON blok FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('regional_gm', 'estate_manager')
        OR profiles.divisi_id = blok.divisi_id
      )
    )
  );

CREATE POLICY "Managers can insert blok"
  ON blok FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('regional_gm', 'estate_manager', 'asisten')
    )
  );

CREATE POLICY "Managers can update blok"
  ON blok FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('regional_gm', 'estate_manager', 'asisten')
    )
  );

-- RLS Policies for pemanen
CREATE POLICY "Users can view pemanen based on role"
  ON pemanen FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('regional_gm', 'estate_manager')
        OR profiles.divisi_id = pemanen.divisi_id
      )
    )
  );

CREATE POLICY "Managers can manage pemanen"
  ON pemanen FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('regional_gm', 'estate_manager', 'asisten', 'mandor')
    )
  );

-- RLS Policies for tph
CREATE POLICY "Users can view tph based on role"
  ON tph FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('regional_gm', 'estate_manager')
        OR profiles.divisi_id = tph.divisi_id
      )
    )
  );

CREATE POLICY "Managers can manage tph"
  ON tph FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('regional_gm', 'estate_manager', 'asisten', 'mandor')
    )
  );

-- RLS Policies for harvest_records
CREATE POLICY "Users can view harvest based on role"
  ON harvest_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('regional_gm', 'estate_manager')
        OR profiles.divisi_id = harvest_records.divisi_id
        OR profiles.id = harvest_records.created_by
      )
    )
  );

CREATE POLICY "Krani panen can insert harvest"
  ON harvest_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'krani_panen'
      AND auth.uid() = created_by
    )
  );

CREATE POLICY "Creator can update own draft harvest"
  ON harvest_records FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'draft'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Mandor can approve harvest"
  ON harvest_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('mandor', 'asisten', 'estate_manager', 'regional_gm')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('mandor', 'asisten', 'estate_manager', 'regional_gm')
    )
  );

-- Insert sample data for testing

-- Sample blok data
INSERT INTO blok (divisi_id, name, tahun_tanam, luas_ha, jumlah_pokok)
SELECT 
  d.id,
  blok_name,
  tahun,
  luas,
  pokok
FROM divisi d
CROSS JOIN (
  VALUES 
    ('A.5', 2015, 12.5, 1500),
    ('C5', 2016, 10.0, 1200),
    ('Y.5', 2014, 15.3, 1800),
    ('I.6', 2017, 11.2, 1350),
    ('R.6', 2015, 13.0, 1550),
    ('I.2', 2016, 9.8, 1180),
    ('I.7', 2014, 14.5, 1720),
    ('A10', 2018, 8.5, 1020)
) AS blocks(blok_name, tahun, luas, pokok)
WHERE d.name IN ('Divisi A', 'Divisi B')
ON CONFLICT (divisi_id, name) DO NOTHING;

-- Sample pemanen data
INSERT INTO pemanen (divisi_id, operator_code, name, active)
SELECT 
  d.id,
  op_code,
  op_name,
  true
FROM divisi d
CROSS JOIN (
  VALUES 
    ('2011', 'AGUS SANJAYA'),
    ('2000', 'HADI'),
    ('2003', 'RIVAN'),
    ('2010', 'ELY'),
    ('2002', 'RYAN'),
    ('2011', 'HADI'),
    ('2002', 'MAWAN'),
    ('2010', 'UDIN'),
    ('2001', 'LANDI'),
    ('2000', 'SAMSUL'),
    ('2001', 'BADAI')
) AS operators(op_code, op_name)
WHERE d.name IN ('Divisi A', 'Divisi B')
ON CONFLICT (divisi_id, operator_code) DO NOTHING;

-- Sample TPH data
INSERT INTO tph (divisi_id, nomor_tph, active)
SELECT 
  d.id,
  tph_number::text,
  true
FROM divisi d
CROSS JOIN generate_series(1, 20) AS tph_number
WHERE d.name IN ('Divisi A', 'Divisi B')
ON CONFLICT (divisi_id, nomor_tph) DO NOTHING;
