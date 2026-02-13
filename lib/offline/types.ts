export interface OfflineDivisi {
  id: string;
  name: string;
  estate_name: string;
  region_name: string;
}

export interface OfflineGang {
  id: string;
  divisi_id: string;
  name: string;
}

export interface OfflineBlok {
  id: string;
  divisi_id: string;
  name: string;
  tahun_tanam: number;
}

export interface OfflinePemanen {
  id: string;
  divisi_id: string;
  gang_id: string | null;
  operator_code: string;
  name: string;
  active: number;
}

export interface OfflineTPH {
  id: string;
  divisi_id: string;
  blok_id: string;
  nomor_tph: string;
  active: number;
}

export interface HarvestRecordQueueItem {
  local_id?: number;
  id?: string;
  tanggal: string;
  divisi_id: string;
  blok_id: string;
  pemanen_id: string;
  tph_id?: string;
  rotasi: number;
  hasil_panen_bjd: number;
  bjr: number;
  buah_masak: number;
  buah_mentah: number;
  buah_mengkal: number;
  overripe: number;
  abnormal: number;
  buah_busuk: number;
  tangkai_panjang: number;
  jangkos: number;
  keterangan?: string;
  status: 'pending' | 'synced' | 'error';
  created_by: string;
  nomor_panen?: string;
  jumlah_jjg: number;
  foto_path?: string;
  jumlah_brondolan_kg: number;
  sync_error?: string;
  created_at?: string;
}
