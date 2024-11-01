import { createClient } from 'redis';

let redis = null;
let connectionPromise = null;

const initializeRedis = async () => {
  if (redis) return redis;

  try {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not configured');
    }

    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false // Required for some Redis Cloud configurations
      }
    });

    // Error handling
    redis.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });

    // Connect to Redis
    await redis.connect();
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    redis = null;
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
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}