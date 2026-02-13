import { Client } from '@neondatabase/serverless';

const connectionString = process.env.EXPO_PUBLIC_NEON_DATABASE_URL!;

export const getDbClient = async () => {
  if (!connectionString) {
    console.error('Database connection string is missing');
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
    // Retry once
    try {
        console.log('Retrying connection...');
        const retryClient = new Client({ connectionString });
        await retryClient.connect();
        return retryClient;
    } catch (retryError) {
        console.error('Retry failed:', retryError);
        throw retryError;
    }
  }
};
