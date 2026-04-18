import { Client } from '@neondatabase/serverless';
import Constants from 'expo-constants';

const resolveDatabaseUrl = () => {
  const databaseUrlFromExtra = (Constants.expoConfig?.extra as { neonDatabaseUrl?: string } | undefined)?.neonDatabaseUrl;
  return process.env.EXPO_PUBLIC_NEON_DATABASE_URL || databaseUrlFromExtra || '';
};

export const hasDatabaseConfig = () => Boolean(resolveDatabaseUrl());

export const getDbClient = async () => {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    console.warn('Database connection string is missing');
    throw new Error('Database configuration error');
  }

  const client = new Client({
    connectionString,
  });

  // Handle unexpected errors on the idle client
  client.on('error', (err) => {
    console.error('Unexpected database client error:', err);
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error('Database connection failed:', error);
    // Remove the manual retry logic here to avoid "Body is unusable" issues
    // and let the application handle the failure (e.g., fallback to offline)
    throw error;
  }
};
