import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getDbClient } from '../db';
import { runQuery } from './index';
import { OfflineDivisi, OfflineGang, OfflineBlok, OfflinePemanen, OfflineTPH } from './types';

export const useOfflineData = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const getDivisi = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const client = await getDbClient();
        const { rows } = await client.query('SELECT id, name, estate_name, rayon_id as region_name FROM divisi ORDER BY name');
        await client.end();
        return rows as OfflineDivisi[];
      } catch (e) {
        console.error('Failed to fetch divisi from NeonDB, falling back to SQLite', e);
      }
    }
    return (await runQuery('SELECT * FROM divisi ORDER BY name')) as OfflineDivisi[];
  };

  const getGang = async (divisiId: string) => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const client = await getDbClient();
        const { rows } = await client.query('SELECT id, divisi_id, name FROM gang WHERE divisi_id = $1 ORDER BY name', [divisiId]);
        await client.end();
        return rows as OfflineGang[];
      } catch (e) {
        console.error('Failed to fetch gang from NeonDB, falling back to SQLite', e);
      }
    }
    return (await runQuery('SELECT * FROM gang WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineGang[];
  };

  const getBlok = async (divisiId: string) => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const client = await getDbClient();
        const { rows } = await client.query('SELECT id, divisi_id, name, tahun_tanam FROM blok WHERE divisi_id = $1 ORDER BY name', [divisiId]);
        await client.end();
        return rows as OfflineBlok[];
      } catch (e) {
        console.error('Failed to fetch blok from NeonDB, falling back to SQLite', e);
      }
    }
    return (await runQuery('SELECT * FROM blok WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineBlok[];
  };

  const getPemanen = async (divisiId: string) => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const client = await getDbClient();
        const { rows } = await client.query(`
          SELECT p.id, g.divisi_id, p.gang_id, COALESCE(p.nik, '') as operator_code, p.name, p.status_aktif as active 
          FROM pemanen p 
          JOIN gang g ON p.gang_id = g.id 
          WHERE g.divisi_id = $1 AND p.status_aktif = true 
          ORDER BY p.name
        `, [divisiId]);
        await client.end();
        return rows.map(r => ({ ...r, active: r.active ? 1 : 0 })) as OfflinePemanen[];
      } catch (e) {
        console.error('Failed to fetch pemanen from NeonDB, falling back to SQLite', e);
      }
    }
    return (await runQuery('SELECT * FROM pemanen WHERE divisi_id = ? AND active = 1 ORDER BY name', [divisiId])) as OfflinePemanen[];
  };

  const getTPH = async (divisiId: string, blokIds?: string[]) => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      try {
        const client = await getDbClient();
        let query = `
          SELECT t.id, b.divisi_id, t.blok_id, t.name as nomor_tph, 1 as active 
          FROM tph t 
          JOIN blok b ON t.blok_id = b.id 
          WHERE b.divisi_id = $1
        `;
        const params: any[] = [divisiId];
        
        if (blokIds && blokIds.length > 0) {
          const placeholders = blokIds.map((_, i) => `$${i + 2}`).join(',');
          query += ` AND t.blok_id IN (${placeholders})`;
          params.push(...blokIds);
        }
        query += ' ORDER BY t.name';
        
        const { rows } = await client.query(query, params);
        await client.end();
        return rows as OfflineTPH[];
      } catch (e) {
        console.error('Failed to fetch TPH from NeonDB, falling back to SQLite', e);
      }
    }

    let query = 'SELECT * FROM tph WHERE divisi_id = ?';
    const params: any[] = [divisiId];
    
    if (blokIds && blokIds.length > 0) {
        const placeholders = blokIds.map(() => '?').join(',');
        query += ` AND blok_id IN (${placeholders})`;
        params.push(...blokIds);
    }
    query += ' ORDER BY nomor_tph';

    return (await runQuery(query, params)) as OfflineTPH[];
  };

  return {
    isOffline,
    getDivisi,
    getGang,
    getBlok,
    getPemanen,
    getTPH
  };
};
