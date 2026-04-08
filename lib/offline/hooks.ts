import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getDbClient } from '../db';
import { runQuery, syncMasterData } from './index';
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
    // Local-first approach for faster UI
    return (await runQuery('SELECT * FROM divisi ORDER BY name')) as OfflineDivisi[];
  };

  const getGang = async (divisiId: string) => {
     return (await runQuery('SELECT * FROM gang WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineGang[];
  };

  const getBlok = async (divisiId: string) => {
      return (await runQuery('SELECT * FROM blok WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineBlok[];
  };

  const getPemanen = async (divisiId: string) => {
      // Join with gang to get correct division association if needed, 
      // but the local table already has divisi_id from sync
      return (await runQuery('SELECT * FROM pemanen WHERE divisi_id = ? AND active = 1 ORDER BY name', [divisiId])) as OfflinePemanen[];
  };

  const getTPH = async (divisiId: string, blokIds?: string[]) => {
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
