import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export const getLocalDb = async () => {
  if (db) return db;
  try {
    db = await SQLite.openDatabaseAsync('offline.db', { enableChangeListener: true });
    await initDb(db);
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

const initDb = async (database: SQLite.SQLiteDatabase) => {
  try {
    await database.execAsync("PRAGMA journal_mode = WAL");
    await database.execAsync("PRAGMA foreign_keys = ON");
    for (const statement of CREATE_TABLES) {
      await database.execAsync(statement);
    }
    console.log('Local database initialized');
  } catch (error) {
    console.error('Error initializing local database:', error);
    throw error;
  }
};

export const runQuery = async (query: string, params: any[] = []) => {
    const database = await getLocalDb();
    const safeParams = params.map(p => (p === undefined ? null : p));
    return await database.getAllAsync(query, safeParams);
};

export const runCommand = async (query: string, params: any[] = []) => {
    const database = await getLocalDb();
    const safeParams = params.map(p => (p === undefined ? null : p));
    return await database.runAsync(query, safeParams);
};
