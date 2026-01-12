/*
  # Tambah Field Foto ke Harvest Records

  ## Perubahan
  
  1. Menambah kolom untuk foto hasil panen:
    - `foto_url` (text, NULLABLE) - URL foto hasil panen dari Supabase Storage
    - `foto_thumbnail_url` (text, NULLABLE) - URL thumbnail foto untuk preview
  
  2. Notes:
    - Foto disimpan di Supabase Storage bucket
    - Field nullable karena foto adalah opsional
    - Thumbnail untuk performa saat load list
*/

-- Add foto columns to harvest_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'harvest_records' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE harvest_records ADD COLUMN foto_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'harvest_records' AND column_name = 'foto_thumbnail_url'
  ) THEN
    ALTER TABLE harvest_records ADD COLUMN foto_thumbnail_url text;
  END IF;
END $$;

-- Create storage bucket for harvest photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('harvest-photos', 'harvest-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload harvest photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view harvest photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own harvest photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own harvest photos" ON storage.objects;

-- Storage policies for harvest photos
CREATE POLICY "Authenticated users can upload harvest photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'harvest-photos');

CREATE POLICY "Anyone can view harvest photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'harvest-photos');

CREATE POLICY "Users can update own harvest photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'harvest-photos');

CREATE POLICY "Users can delete own harvest photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'harvest-photos');
