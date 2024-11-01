import { createClient } from 'redis';

let redis = null;
let connectionPromise = null;

const initializeRedis = async () => {
  if (redis) return redis;

  try {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not configured');
    }

    // Parse the Redis URL to handle the connection manually
    const url = new URL(process.env.REDIS_URL);
    
    redis = createClient({
      username: url.username || 'default',
      password: url.password,
      socket: {
        host: url.hostname,
        port: parseInt(url.port),
        tls: true,
        servername: url.hostname, // Add SNI support
      }
    });

    // Error handling
    redis.on('error', (error) => {
      console.error('Redis Client Error:', error);
      redis = null;
      connectionPromise = null;
    });

    // Connect to Redis
    await redis.connect();
    console.log('Successfully connected to Redis');
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    redis = null;
    connectionPromise = null;
    throw error;
  }
};

// Get or create Redis connection
const getRedisClient = async () => {
  if (!connectionPromise) {
    connectionPromise = initializeRedis();
  }
  return connectionPromise;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await getRedisClient();
    
    // Use LRANGE to get all logs
    const logs = await client.lRange('transcription_log', 0, -1);
    const parsedLogs = logs.map(log => JSON.parse(log));

    return res.status(200).json({
      message: 'Logs retrieved successfully',
      data: parsedLogs
    });
  } catch (error) {
    console.error('Error in log handler:', error);
    // Reset connection on error
    redis = null;
    connectionPromise = null;
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}