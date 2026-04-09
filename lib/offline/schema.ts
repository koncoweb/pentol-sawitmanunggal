export const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS divisi (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    estate_name TEXT NOT NULL,
    region_name TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS gang (
    id TEXT PRIMARY KEY,
    divisi_id TEXT NOT NULL,
    name TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS blok (
    id TEXT PRIMARY KEY,
    divisi_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tahun_tanam INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS pemanen (
    id TEXT PRIMARY KEY,
    divisi_id TEXT NOT NULL,
    gang_id TEXT,
    operator_code TEXT NOT NULL,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );`,
  `CREATE TABLE IF NOT EXISTS tph (
    id TEXT PRIMARY KEY,
    divisi_id TEXT NOT NULL,
    blok_id TEXT NOT NULL,
    nomor_tph TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );`,
  `CREATE TABLE IF NOT EXISTS harvest_records_queue (
    local_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT, -- UUID from server if needed
    tanggal TEXT NOT NULL,
    divisi_id TEXT NOT NULL,
    blok_id TEXT NOT NULL,
    pemanen_id TEXT NOT NULL,
    tph_id TEXT,
    rotasi INTEGER,
    hasil_panen_bjd REAL,
    bjr INTEGER,
    buah_masak INTEGER,
    buah_mentah INTEGER,
    buah_mengkal INTEGER,
    overripe INTEGER,
    abnormal INTEGER,
    buah_busuk INTEGER,
    tangkai_panjang INTEGER,
    jangkos INTEGER,
    keterangan TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL,
    nomor_panen TEXT,
    jumlah_jjg INTEGER,
    foto_path TEXT,
    jumlah_brondolan_kg REAL,
    sync_error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`
];
