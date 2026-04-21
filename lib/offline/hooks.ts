import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getDbClient } from '../db';
import { runQuery } from './db';
import { OfflineDivisi, OfflineGang, OfflineBlok, OfflinePemanen, OfflineTPH } from './types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const QUERY_TIMEOUT = 3000; // 3 seconds

const cache = new Map<string, CacheItem<any>>();

const isCacheValid = <T>(key: string): T | null => {
  const item = cache.get(key);
  if (!item) return null;
  
  const now = Date.now();
  if (now - item.timestamp > item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

const setCache = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const queryWithTimeout = async (promise: Promise<any>, timeout: number): Promise<any> => {
  let timerId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Query timeout')), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timerId!));
};

const queryOnlineWithFallback = async (
  queries: { text: string; params?: any[] }[],
  options: { forceOffline?: boolean; timeout?: number; cacheKey?: string; ttl?: number } = {}
) => {
  const { forceOffline = false, timeout = QUERY_TIMEOUT, cacheKey, ttl = DEFAULT_TTL } = options;

  // Always check cache first — forceOffline does NOT bypass valid cached data.
  // forceOffline only controls whether to attempt Neon DB queries.
  if (cacheKey) {
    const cachedData = isCacheValid(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${cacheKey}`);
      return { rows: cachedData };
    }
  }

  // Skip online queries if forced offline or no connection
  const netInfo = await NetInfo.fetch();
  if (forceOffline || !netInfo.isConnected) {
    console.log('Skipping online queries, using offline data only');
    throw new Error('Offline mode or no connection');
  }

  let lastError: any;
  for (const item of queries) {
    const client = await getDbClient();
    try {
      const result = await queryWithTimeout(
        client.query(item.text, item.params || []),
        timeout
      );

      // Cache successful result
      if (cacheKey) {
        setCache(cacheKey, result.rows, ttl);
      }

      return result;
    } catch (error) {
      lastError = error;
      console.warn('Query failed, trying next fallback:', error);
    } finally {
      try { await client.end(); } catch { /* ignore close errors */ }
    }
  }

  console.error('All online queries failed:', lastError);
  throw lastError;
};

const getDivisi = async (options: { forceOffline?: boolean } = {}) => {
  try {
    const { rows } = await queryOnlineWithFallback([
      { text: 'SELECT id, name, COALESCE(estate_name, \'\') as estate_name, COALESCE(rayon_id::text, \'\') as region_name FROM divisi WHERE id IS NOT NULL AND name IS NOT NULL ORDER BY name' },
      { text: 'SELECT id, name, COALESCE(estate_name, \'\') as estate_name, COALESCE(region_name, \'\') as region_name FROM divisi WHERE id IS NOT NULL AND name IS NOT NULL ORDER BY name' }
    ], { cacheKey: 'divisi', ...options });
    return rows as OfflineDivisi[];
  } catch (e) {
    console.warn('Failed to fetch divisi from NeonDB, falling back to SQLite', e);
    return (await runQuery('SELECT * FROM divisi ORDER BY name')) as OfflineDivisi[];
  }
};

const getGang = async (divisiId: string, options: { forceOffline?: boolean } = {}) => {
  try {
    const { rows } = await queryOnlineWithFallback([
      {
        text: 'SELECT id, divisi_id, name FROM gang WHERE divisi_id = $1 AND id IS NOT NULL AND name IS NOT NULL ORDER BY name',
        params: [divisiId]
      }
    ], { cacheKey: `gang_${divisiId}`, ...options });
    return rows as OfflineGang[];
  } catch (e) {
    console.warn('Failed to fetch gang from NeonDB, falling back to SQLite', e);
    return (await runQuery('SELECT * FROM gang WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineGang[];
  }
};

const getBlok = async (divisiId: string, options: { forceOffline?: boolean } = {}) => {
  try {
    const { rows } = await queryOnlineWithFallback([
      {
        text: 'SELECT id, divisi_id, name, tahun_tanam FROM blok WHERE divisi_id = $1 AND id IS NOT NULL AND name IS NOT NULL ORDER BY name',
        params: [divisiId]
      }
    ], { cacheKey: `blok_${divisiId}`, ...options });
    return rows as OfflineBlok[];
  } catch (e) {
    console.warn('Failed to fetch blok from NeonDB, falling back to SQLite', e);
    return (await runQuery('SELECT * FROM blok WHERE divisi_id = ? ORDER BY name', [divisiId])) as OfflineBlok[];
  }
};

const getPemanen = async (divisiId: string, options: { forceOffline?: boolean } = {}) => {
  try {
    const { rows } = await queryOnlineWithFallback([
      {
        text: `
          SELECT p.id, g.divisi_id, p.gang_id, COALESCE(p.nik, '') as operator_code, p.name, COALESCE(p.status_aktif, true) as active
          FROM pemanen p
          JOIN gang g ON p.gang_id = g.id
          WHERE g.divisi_id = $1 AND COALESCE(p.status_aktif, true) = true
          ORDER BY p.name
        `,
        params: [divisiId]
      }
    ], { cacheKey: `pemanen_${divisiId}`, ...options });
    return rows.map((r: any) => ({ ...r, active: r.active ? 1 : 0 })) as OfflinePemanen[];
  } catch (e: any) {
    console.warn('Failed to fetch pemanen from NeonDB, falling back to SQLite', e);
    return (await runQuery('SELECT * FROM pemanen WHERE divisi_id = ? AND active = 1 ORDER BY name', [divisiId])) as OfflinePemanen[];
  }
};

const getTPH = async (divisiId: string, blokIds?: string[], options: { forceOffline?: boolean } = {}) => {
  try {
    let queryNew = `
      SELECT t.id, b.divisi_id, t.blok_id, t.name as nomor_tph, 1 as active
      FROM tph t
      JOIN blok b ON t.blok_id = b.id
      WHERE b.divisi_id = $1
    `;
    const params: any[] = [divisiId];

    if (blokIds && blokIds.length > 0) {
      const placeholders = blokIds.map((_, i) => `$${i + 2}`).join(',');
      queryNew += ` AND t.blok_id IN (${placeholders})`;
      params.push(...blokIds);
    }
    queryNew += ' ORDER BY t.name';

    const cacheKey = `tph_${divisiId}_${blokIds?.join(',') || 'all'}`;
    const { rows } = await queryOnlineWithFallback([
      { text: queryNew, params }
    ], { cacheKey, ...options });
    return rows as OfflineTPH[];
  } catch (e) {
    console.warn('Failed to fetch TPH from NeonDB, falling back to SQLite', e);

    let query = 'SELECT * FROM tph WHERE divisi_id = ?';
    const params: any[] = [divisiId];

    if (blokIds && blokIds.length > 0) {
      const placeholders = blokIds.map(() => '?').join(',');
      query += ` AND blok_id IN (${placeholders})`;
      params.push(...blokIds);
    }
    query += ' ORDER BY nomor_tph';

    return (await runQuery(query, params)) as OfflineTPH[];
  }
};

const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  console.log(`Cache cleared${pattern ? ` for pattern: ${pattern}` : ' completely'}`);
};

const getCacheInfo = () => {
  const info: Record<string, { age: number; ttl: number }> = {};
  const now = Date.now();

  for (const [key, item] of cache.entries()) {
    info[key] = {
      age: now - item.timestamp,
      ttl: item.ttl
    };
  }

  return info;
};

export const useOfflineData = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  return {
    isOffline,
    getDivisi,
    getGang,
    getBlok,
    getPemanen,
    getTPH,
    clearCache,
    getCacheInfo
  };
};
