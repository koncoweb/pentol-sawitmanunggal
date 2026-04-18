import { getDbClient, hasDatabaseConfig } from '../db';
import { getLocalDb, runCommand, runQuery } from './db';
import { HarvestRecordQueueItem } from './types';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';

let masterSyncPromise: Promise<void> | null = null;
let queueSyncPromise: Promise<void> | null = null;
let hasLoggedMissingDbConfigForMaster = false;
let hasLoggedMissingDbConfigForQueue = false;

const queryWithFallback = async (client: any, queries: string[]) => {
  let lastError: any;
  for (const query of queries) {
    try {
      return await client.query(query);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const toText = (value: any) => (value === null || value === undefined ? '' : String(value).trim());
const toNullableInt = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const dedupeById = <T extends { id: string }>(rows: T[]) => {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row.id) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
};

const runExclusiveWriteTransaction = async (database: any, task: (tx: any) => Promise<void>) => {
  if (typeof database.withExclusiveTransactionAsync === 'function') {
    await database.withExclusiveTransactionAsync(async (tx: any) => {
      await task(tx);
    });
    return;
  }

  await database.execAsync('BEGIN IMMEDIATE TRANSACTION');
  try {
    await task(database);
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isDatabaseLockedError = (error: any) => {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('database is locked') || message.includes('nativedatabase.execasync has been rejected');
};

const runMasterWriteTransactionWithRetry = async (database: any, task: (tx: any) => Promise<void>) => {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await runExclusiveWriteTransaction(database, task);
      return;
    } catch (error) {
      if (!isDatabaseLockedError(error) || attempt === maxAttempts) {
        throw error;
      }
      const backoffMs = attempt * 250;
      console.warn(`SQLite busy during master sync (attempt ${attempt}/${maxAttempts}), retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
};

type NormalizedDivisi = { id: string; name: string; estate_name: string; region_name: string };
type NormalizedGang = { id: string; divisi_id: string; name: string };
type NormalizedBlok = { id: string; divisi_id: string; name: string; tahun_tanam: number | null };
type NormalizedPemanen = { id: string; divisi_id: string; gang_id: string | null; operator_code: string; name: string; active: number };
type NormalizedTph = { id: string; divisi_id: string; blok_id: string; nomor_tph: string; active: number };

export const syncMasterData = async () => {
  if (masterSyncPromise) {
    console.log('Master sync already in progress, skipping...');
    await masterSyncPromise;
    return;
  }

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('Offline: Skipping master data sync');
    return;
  }

  if (!hasDatabaseConfig()) {
    if (!hasLoggedMissingDbConfigForMaster) {
      console.warn('Online master sync dilewati karena konfigurasi database Neon belum tersedia di runtime.');
      hasLoggedMissingDbConfigForMaster = true;
    }
    return;
  }

  masterSyncPromise = (async () => {
    let neonClient: any = null;
    let localDb: any = null;
    try {
      neonClient = await getDbClient();
      localDb = await getLocalDb();
    console.log('Syncing master data...');

    const { rows: divisiRows } = await queryWithFallback(neonClient, [
      `SELECT id, name, COALESCE(estate_name, '') AS estate_name, COALESCE(rayon_id::text, '') AS region_name
       FROM divisi
       WHERE id IS NOT NULL AND name IS NOT NULL`,
      `SELECT id, name, COALESCE(estate_name, '') AS estate_name, COALESCE(region_name, '') AS region_name
       FROM divisi
       WHERE id IS NOT NULL AND name IS NOT NULL`
    ]);

    const { rows: gangRows } = await neonClient.query(`
      SELECT id, divisi_id, name
      FROM gang
      WHERE id IS NOT NULL AND divisi_id IS NOT NULL AND name IS NOT NULL
    `);

    const { rows: blokRows } = await neonClient.query(`
      SELECT id, divisi_id, name, tahun_tanam
      FROM blok
      WHERE id IS NOT NULL AND divisi_id IS NOT NULL AND name IS NOT NULL
    `);

    const { rows: pemanenRows } = await queryWithFallback(neonClient, [
      `SELECT p.id, g.divisi_id, p.gang_id, COALESCE(p.nik, '') AS operator_code, p.name, COALESCE(p.status_aktif, true) AS active
       FROM pemanen p
       JOIN gang g ON p.gang_id = g.id
       WHERE p.id IS NOT NULL AND p.name IS NOT NULL AND g.divisi_id IS NOT NULL`,
      `SELECT p.id, COALESCE(p.divisi_id, g.divisi_id) AS divisi_id, p.gang_id, COALESCE(p.operator_code, '') AS operator_code, p.name, COALESCE(p.active, true) AS active
       FROM pemanen p
       LEFT JOIN gang g ON p.gang_id = g.id
       WHERE p.id IS NOT NULL AND p.name IS NOT NULL AND COALESCE(p.divisi_id, g.divisi_id) IS NOT NULL`
    ]);

    const { rows: tphRows } = await queryWithFallback(neonClient, [
      `SELECT t.id, b.divisi_id, t.blok_id, t.name AS nomor_tph, 1 AS active
       FROM tph t
       JOIN blok b ON t.blok_id = b.id
       WHERE t.id IS NOT NULL AND t.blok_id IS NOT NULL AND b.divisi_id IS NOT NULL AND t.name IS NOT NULL`,
      `SELECT t.id, COALESCE(t.divisi_id, b.divisi_id) AS divisi_id, t.blok_id, t.nomor_tph, COALESCE(t.active, true) AS active
       FROM tph t
       LEFT JOIN blok b ON t.blok_id = b.id
       WHERE t.id IS NOT NULL AND t.blok_id IS NOT NULL AND COALESCE(t.divisi_id, b.divisi_id) IS NOT NULL AND t.nomor_tph IS NOT NULL`
    ]);

    const normalizedDivisi: NormalizedDivisi[] = dedupeById<NormalizedDivisi>(
      divisiRows
        .map((row: any): NormalizedDivisi => ({
          id: toText(row.id),
          name: toText(row.name),
          estate_name: toText(row.estate_name),
          region_name: toText(row.region_name),
        }))
        .filter((row: NormalizedDivisi) => row.id && row.name)
    );
    const divisiIds = new Set(normalizedDivisi.map(row => row.id));

    const normalizedGang: NormalizedGang[] = dedupeById<NormalizedGang>(
      gangRows
        .map((row: any): NormalizedGang => ({
          id: toText(row.id),
          divisi_id: toText(row.divisi_id),
          name: toText(row.name),
        }))
        .filter((row: NormalizedGang) => row.id && row.divisi_id && row.name && divisiIds.has(row.divisi_id))
    );
    const gangIds = new Set(normalizedGang.map(row => row.id));

    const normalizedBlok: NormalizedBlok[] = dedupeById<NormalizedBlok>(
      blokRows
        .map((row: any): NormalizedBlok => ({
          id: toText(row.id),
          divisi_id: toText(row.divisi_id),
          name: toText(row.name),
          tahun_tanam: toNullableInt(row.tahun_tanam),
        }))
        .filter((row: NormalizedBlok) => row.id && row.divisi_id && row.name && divisiIds.has(row.divisi_id))
    );
    const blokIds = new Set(normalizedBlok.map(row => row.id));

    const normalizedPemanen: NormalizedPemanen[] = dedupeById<NormalizedPemanen>(
      pemanenRows
        .map((row: any): NormalizedPemanen => {
          const divisiId = toText(row.divisi_id);
          const gangId = toText(row.gang_id);
          return {
            id: toText(row.id),
            divisi_id: divisiId,
            gang_id: gangId && gangIds.has(gangId) ? gangId : null,
            operator_code: toText(row.operator_code),
            name: toText(row.name),
            active: row.active ? 1 : 0,
          };
        })
        .filter((row: NormalizedPemanen) => row.id && row.divisi_id && row.name && divisiIds.has(row.divisi_id))
    );

    const normalizedTph: NormalizedTph[] = dedupeById<NormalizedTph>(
      tphRows
        .map((row: any): NormalizedTph => ({
          id: toText(row.id),
          divisi_id: toText(row.divisi_id),
          blok_id: toText(row.blok_id),
          nomor_tph: toText(row.nomor_tph),
          active: row.active ? 1 : 0,
        }))
        .filter((row: NormalizedTph) =>
          row.id &&
          row.divisi_id &&
          row.blok_id &&
          row.nomor_tph &&
          divisiIds.has(row.divisi_id) &&
          blokIds.has(row.blok_id)
        )
    );

    console.log('Master sync normalized counts', {
      divisi: normalizedDivisi.length,
      gang: normalizedGang.length,
      blok: normalizedBlok.length,
      pemanen: normalizedPemanen.length,
      tph: normalizedTph.length,
    });

    await runMasterWriteTransactionWithRetry(localDb, async (tx: any) => {
      await tx.execAsync('DELETE FROM tph');
      await tx.execAsync('DELETE FROM pemanen');
      await tx.execAsync('DELETE FROM blok');
      await tx.execAsync('DELETE FROM gang');
      await tx.execAsync('DELETE FROM divisi');

      for (const row of normalizedDivisi) {
        await tx.runAsync(
          'INSERT OR REPLACE INTO divisi (id, name, estate_name, region_name) VALUES (?, ?, ?, ?)',
          [row.id, row.name, row.estate_name, row.region_name]
        );
      }

      for (const row of normalizedGang) {
        await tx.runAsync(
          'INSERT OR REPLACE INTO gang (id, divisi_id, name) VALUES (?, ?, ?)',
          [row.id, row.divisi_id, row.name]
        );
      }

      for (const row of normalizedBlok) {
        await tx.runAsync(
          'INSERT OR REPLACE INTO blok (id, divisi_id, name, tahun_tanam) VALUES (?, ?, ?, ?)',
          [row.id, row.divisi_id, row.name, row.tahun_tanam]
        );
      }

      for (const row of normalizedPemanen) {
        await tx.runAsync(
          'INSERT OR REPLACE INTO pemanen (id, divisi_id, gang_id, operator_code, name, active) VALUES (?, ?, ?, ?, ?, ?)',
          [row.id, row.divisi_id, row.gang_id, row.operator_code, row.name, row.active]
        );
      }

      for (const row of normalizedTph) {
        await tx.runAsync(
          'INSERT OR REPLACE INTO tph (id, divisi_id, blok_id, nomor_tph, active) VALUES (?, ?, ?, ?, ?)',
          [row.id, row.divisi_id, row.blok_id, row.nomor_tph, row.active]
        );
      }

      const [divisiCountRow, gangCountRow, blokCountRow, pemanenCountRow, tphCountRow] = await Promise.all([
        tx.getFirstAsync('SELECT COUNT(*) as count FROM divisi'),
        tx.getFirstAsync('SELECT COUNT(*) as count FROM gang'),
        tx.getFirstAsync('SELECT COUNT(*) as count FROM blok'),
        tx.getFirstAsync('SELECT COUNT(*) as count FROM pemanen'),
        tx.getFirstAsync('SELECT COUNT(*) as count FROM tph'),
      ]);

      const localCounts = {
        divisi: Number((divisiCountRow as any)?.count ?? 0),
        gang: Number((gangCountRow as any)?.count ?? 0),
        blok: Number((blokCountRow as any)?.count ?? 0),
        pemanen: Number((pemanenCountRow as any)?.count ?? 0),
        tph: Number((tphCountRow as any)?.count ?? 0),
      };
      const expectedCounts = {
        divisi: normalizedDivisi.length,
        gang: normalizedGang.length,
        blok: normalizedBlok.length,
        pemanen: normalizedPemanen.length,
        tph: normalizedTph.length,
      };

      if (
        localCounts.divisi !== expectedCounts.divisi ||
        localCounts.gang !== expectedCounts.gang ||
        localCounts.blok !== expectedCounts.blok ||
        localCounts.pemanen !== expectedCounts.pemanen ||
        localCounts.tph !== expectedCounts.tph
      ) {
        throw new Error(
          `Master sync integrity mismatch local=${JSON.stringify(localCounts)} expected=${JSON.stringify(expectedCounts)}`
        );
      }
    });

    console.log('Master data synced successfully');
    } catch (error) {
      console.error('Error syncing master data:', error);
      throw error;
    } finally {
      if (neonClient) {
        try {
          await neonClient.end();
        } catch (endError) {
          console.error('Error closing master sync db client:', endError);
        }
      }
      masterSyncPromise = null;
    }
  })();

  await masterSyncPromise;
};

export const syncHarvestQueue = async () => {
    if (queueSyncPromise) {
        console.log('Sync already in progress, skipping...');
        await queueSyncPromise;
        return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
        console.log('Offline: Skipping harvest queue sync');
        return;
    }

    if (!hasDatabaseConfig()) {
        if (!hasLoggedMissingDbConfigForQueue) {
            console.warn('Online queue sync dilewati karena konfigurasi database Neon belum tersedia di runtime.');
            hasLoggedMissingDbConfigForQueue = true;
        }
        return;
    }

    const pendingItems = (await runQuery(
        "SELECT * FROM harvest_records_queue WHERE status IN ('pending', 'error')"
    )) as HarvestRecordQueueItem[];

    if (pendingItems.length === 0) {
        return;
    }

    queueSyncPromise = (async () => {
    let neonClient: any = null;
    try {
        neonClient = await getDbClient();
        for (const item of pendingItems) {
            try {
                let photoId = null;
                let photoUrl = null;

                // Handle Photo Upload
                if (item.foto_path) {
                    try {
                        const fileInfo = await FileSystem.getInfoAsync(item.foto_path);
                        if (fileInfo.exists) {
                            const base64 = await FileSystem.readAsStringAsync(item.foto_path, {
                                encoding: FileSystem.EncodingType.Base64,
                            });
                            
                            const { rows } = await neonClient.query(`
                                INSERT INTO harvest_photos (photo_data, mime_type)
                                VALUES ($1, $2)
                                RETURNING id
                            `, [base64, 'image/jpeg']);
                            
                            if (rows && rows.length > 0) {
                                photoId = rows[0].id;
                                photoUrl = `db-photo://${photoId}`;
                            } else {
                                throw new Error('Failed to get photo ID after upload');
                            }
                        } else {
                            console.warn('Photo file not found at path:', item.foto_path);
                            // If the file is gone, we can't sync it. 
                            // Mark as synced with error? Or just skip? 
                            // Let's mark as synced but note the missing photo
                        }
                    } catch (photoError: any) {
                        console.error('Error uploading photo during sync:', photoError);
                        // IMPORTANT: If we have a photo path but upload fails, 
                        // we should THROW an error to skip syncing this record 
                        // and retry it later (when connection is better).
                        throw new Error(`Photo upload failed: ${photoError.message}`);
                    }
                }

                // Check if already synced or exists in server to prevent duplicates
                // Using nomor_panen as unique constraint if available, or combining fields
                const { rows: existing } = await neonClient.query(`
                    SELECT id FROM harvest_records 
                    WHERE nomor_panen = $1 AND tanggal = $2 AND pemanen_id = $3 AND (tph_id = $4 OR (tph_id IS NULL AND $4 IS NULL))
                `, [item.nomor_panen, item.tanggal, item.pemanen_id, item.tph_id || null]);

                if (existing.length > 0) {
                    console.log(`Record ${item.nomor_panen} already exists in server, marking as synced`);
                    await runCommand(
                        "UPDATE harvest_records_queue SET status = 'synced', sync_error = NULL WHERE local_id = ?",
                        [item.local_id]
                    );
                    continue;
                }

                // Insert into harvest_records
                await neonClient.query(`
                     INSERT INTO harvest_records (
                        tanggal, divisi_id, blok_id, pemanen_id, tph_id, rotasi,
                        hasil_panen_bjd, bjr, buah_masak, buah_mentah, buah_mengkal,
                        overripe, abnormal, buah_busuk, tangkai_panjang, jangkos,
                        keterangan, status, created_by, nomor_panen, jumlah_jjg,
                        foto_url, jumlah_brondolan_kg
                     ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                        $22, $23
                     )
                `, [
                    item.tanggal,
                    item.divisi_id,
                    item.blok_id,
                    item.pemanen_id,
                    item.tph_id || null,
                    item.rotasi,
                    item.hasil_panen_bjd,
                    item.bjr,
                    item.buah_masak,
                    item.buah_mentah,
                    item.buah_mengkal,
                    item.overripe,
                    item.abnormal,
                    item.buah_busuk,
                    item.tangkai_panjang,
                    item.jangkos,
                    item.keterangan || null,
                    'submitted', // When synced, it becomes submitted
                    item.created_by,
                    item.nomor_panen,
                    item.jumlah_jjg,
                    photoUrl,
                    item.jumlah_brondolan_kg
                ]);

                // Update local status
                await runCommand(
                    "UPDATE harvest_records_queue SET status = 'synced', sync_error = NULL WHERE local_id = ?",
                    [item.local_id]
                );

            } catch (recordError: any) {
                console.error('Error syncing record:', recordError);
                await runCommand(
                    "UPDATE harvest_records_queue SET status = 'error', sync_error = ? WHERE local_id = ?",
                    [recordError.message, item.local_id]
                );
            }
        }
    } catch (error) {
        console.error('Error during queue sync:', error);
    } finally {
        if (neonClient) {
            try {
                await neonClient.end();
            } catch (endError) {
                console.error('Error closing queue sync db client:', endError);
            }
        }
        queueSyncPromise = null;
    }
    })();

    await queueSyncPromise;
};
