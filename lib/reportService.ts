import { getDbClient } from './db';
import type { ExportRecord } from './exportUtils';

export type ReportFilter = {
  startDate: Date;
  endDate: Date;
  divisiId?: string;
  gangId?: string;
};

export type HarvestRecordRaw = {
  id: string;
  tanggal: string;
  created_at: string;
  divisi_name: string;
  gang_name: string;
  blok_names: string[];
  pemanen_details: Array<{ operator_code: string; name: string }>;
  rotasi: number;
  nomor_panen: number;
  hasil_panen_jjg: number;
  nomor_tph: string;
  bjr: number;
  jumlah_brondolan_kg: number;
  buah_masak: number;
  buah_mentah: number;
  buah_mengkal: number;
  overripe: number;
  abnormal: number;
  buah_busuk: number;
  tangkai_panjang: number;
  jangkos: number;
  keterangan: string;
  foto_url: string | null;
  created_by_name: string;
};

export const fetchReportData = async (
  filter: ReportFilter
): Promise<HarvestRecordRaw[]> => {
  const db = await getDbClient();

  let query = `
      SELECT
        hr.id,
        hr.tanggal,
        hr.created_at,
        d.name as divisi_name,
        g.name as gang_name,
        b.name as blok_name,
        p.nik as operator_code,
        p.name as pemanen_name,
        hr.rotasi,
        hr.nomor_panen,
        hr.jumlah_jjg as hasil_panen_jjg,
        t.nomor_tph,
        hr.bjr,
        hr.hasil_panen_bjd as jumlah_brondolan_kg,
        hr.buah_masak,
        hr.buah_mentah,
        hr.buah_mengkal,
        hr.overripe,
        hr.abnormal,
        hr.buah_busuk,
        hr.tangkai_panjang,
        hr.jangkos,
        hr.keterangan,
        hr.foto_url,
        pr.full_name as created_by_name
      FROM harvest_records hr
      LEFT JOIN divisi d ON hr.divisi_id = d.id
      LEFT JOIN blok b ON hr.blok_id = b.id
      LEFT JOIN pemanen p ON hr.pemanen_id = p.id
      LEFT JOIN gang g ON p.gang_id = g.id
      LEFT JOIN tph t ON hr.tph_id = t.id
      LEFT JOIN profiles pr ON hr.created_by = pr.id
      WHERE hr.tanggal >= $1 AND hr.tanggal <= $2
    `;

  const params: any[] = [
    filter.startDate.toISOString().split('T')[0],
    filter.endDate.toISOString().split('T')[0]
  ];
  let paramCount = 2;

  if (filter.divisiId) {
    paramCount++;
    query += ` AND hr.divisi_id = $${paramCount}`;
    params.push(filter.divisiId);
  }

  if (filter.gangId) {
    paramCount++;
    query += ` AND p.gang_id = $${paramCount}`;
    params.push(filter.gangId);
  }

  query += ` ORDER BY hr.tanggal DESC, hr.created_at DESC`;

  try {
    const { rows } = await db.query(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      tanggal: typeof row.tanggal === 'string' ? row.tanggal : new Date(row.tanggal).toISOString(),
      created_at: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at).toISOString(),
      divisi_name: row.divisi_name || '-',
      gang_name: row.gang_name || '-',
      blok_names: [row.blok_name || '-'],
      pemanen_details: [{ operator_code: row.operator_code || '-', name: row.pemanen_name || '-' }],
      rotasi: row.rotasi,
      nomor_panen: row.nomor_panen ? parseInt(row.nomor_panen) : 0,
      hasil_panen_jjg: row.hasil_panen_jjg || 0,
      nomor_tph: row.nomor_tph || '-',
      bjr: row.bjr || 0,
      jumlah_brondolan_kg: parseFloat(row.jumlah_brondolan_kg) || 0,
      buah_masak: row.buah_masak || 0,
      buah_mentah: row.buah_mentah || 0,
      buah_mengkal: row.buah_mengkal || 0,
      overripe: row.overripe || 0,
      abnormal: row.abnormal || 0,
      buah_busuk: row.buah_busuk || 0,
      tangkai_panjang: row.tangkai_panjang || 0,
      jangkos: row.jangkos || 0,
      keterangan: row.keterangan || '-',
      foto_url: row.foto_url,
      created_by_name: row.created_by_name || 'Unknown',
    }));
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  } finally {
    await db.end();
  }
};

export const transformToExportFormat = (
  records: HarvestRecordRaw[]
): ExportRecord[] => {
  return records.map((record) => ({
    tanggal: formatDate(record.tanggal),
    waktu: formatTime(record.created_at),
    krani: record.created_by_name,
    divisi: record.divisi_name,
    gang: record.gang_name,
    blok: record.blok_names.join(', '),
    op: record.pemanen_details.map((p) => p.operator_code).join(', '),
    rotasi: record.rotasi,
    nama_pemanen: record.pemanen_details.map((p) => p.name).join(', '),
    nomor_panen: record.nomor_panen,
    hasil_panen_jjg: record.hasil_panen_jjg,
    nomor_tph: record.nomor_tph,
    bjr: record.bjr,
    brondolan_kg: record.jumlah_brondolan_kg,
    buah_masak: record.buah_masak,
    buah_mentah: record.buah_mentah,
    buah_mengkal: record.buah_mengkal,
    overripe: record.overripe,
    abnormal: record.abnormal,
    buah_busuk: record.buah_busuk,
    tangkai_panjang: record.tangkai_panjang,
    jangkos: record.jangkos,
    keterangan: record.keterangan || '',
  }));
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
