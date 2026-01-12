import { Client } from '@neondatabase/serverless';

const connectionString = process.env.EXPO_PUBLIC_NEON_DATABASE_URL!;

export const getDbClient = async () => {
  const client = new Client({
    connectionString,
  });
  await client.connect();
  return client;
};
