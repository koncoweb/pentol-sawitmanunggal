import { getDbClient } from '../db';
import { getLocalDb, runCommand, runQuery } from './db';
import { HarvestRecordQueueItem } from './types';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';

let isSyncingQueue = false;

export const syncMasterData = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    console.log('Offline: Skipping master data sync');
    return;
  }

  const neonClient = await getDbClient();

  try {
    console.log('Syncing master data...');

    // 1. Sync Divisi
    const { rows: divisiRows } = await neonClient.query('SELECT id, name, estate_name, rayon_id FROM divisi');
    for (const row of divisiRows) {
      await runCommand(
        'INSERT OR REPLACE INTO divisi (id, name, estate_name, region_name) VALUES (?, ?, ?, ?)',
        [row.id, row.name, row.estate_name, row.rayon_id || ''] // Using rayon_id as region_name for now
      );
    }

    // 2. Sync Gang
    const { rows: gangRows } = await neonClient.query('SELECT id, divisi_id, name FROM gang');
    for (const row of gangRows) {
      await runCommand(
        'INSERT OR REPLACE INTO gang (id, divisi_id, name) VALUES (?, ?, ?)',
        [row.id, row.divisi_id, row.name]
      );
    }

    // 3. Sync Blok
    const { rows: blokRows } = await neonClient.query('SELECT id, divisi_id, name, tahun_tanam FROM blok');
    for (const row of blokRows) {
        await runCommand(
            'INSERT OR REPLACE INTO blok (id, divisi_id, name, tahun_tanam) VALUES (?, ?, ?, ?)',
            [row.id, row.divisi_id, row.name, row.tahun_tanam]
        );
    }

    // 4. Sync Pemanen
    const { rows: pemanenRows } = await neonClient.query(`
        SELECT p.id, g.divisi_id, p.gang_id, COALESCE(p.nik, '') as operator_code, p.name, p.status_aktif as active
        FROM pemanen p
        JOIN gang g ON p.gang_id = g.id
    `);
    for (const row of pemanenRows) {
        await runCommand(
            'INSERT OR REPLACE INTO pemanen (id, divisi_id, gang_id, operator_code, name, active) VALUES (?, ?, ?, ?, ?, ?)',
            [row.id, row.divisi_id, row.gang_id, row.operator_code, row.name, row.active ? 1 : 0]
        );
    }

    // 5. Sync TPH
    const { rows: tphRows } = await neonClient.query(`
        SELECT t.id, b.divisi_id, t.blok_id, t.name as nomor_tph, 1 as active 
        FROM tph t 
        JOIN blok b ON t.blok_id = b.id
    `);
    for (const row of tphRows) {
        await runCommand(
            'INSERT OR REPLACE INTO tph (id, divisi_id, blok_id, nomor_tph, active) VALUES (?, ?, ?, ?, ?)',
            [row.id, row.divisi_id, row.blok_id, row.nomor_tph, row.active]
        );
    }

    // 6. Sync Estates (Optional but good for completeness)
    try {
        const { rows: estateRows } = await neonClient.query('SELECT id, name FROM estates');
        await runCommand('DELETE FROM estates').catch(() => {}); // Table might not exist in local schema yet
        // If we want to support estates locally, we'd need to add the table to schema.ts
    } catch (e) {
        // Ignore if estates table doesn't exist in local or server
    }

    console.log('Master data synced successfully');
  } catch (error) {
    console.error('Error syncing master data:', error);
    throw error;
  } finally {
    await neonClient.end();
  }
};

export const syncHarvestQueue = async () => {
    if (isSyncingQueue) {
        console.log('Sync already in progress, skipping...');
        return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
        console.log('Offline: Skipping harvest queue sync');
        return;
    }

    const pendingItems = (await runQuery(
        "SELECT * FROM harvest_records_queue WHERE status IN ('pending', 'error')"
    )) as HarvestRecordQueueItem[];

    if (pendingItems.length === 0) {
        return;
    }

    isSyncingQueue = true;
    const neonClient = await getDbClient();

    try {
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
        await neonClient.end();
        isSyncingQueue = false;
    }
};
