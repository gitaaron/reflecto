import { Redis } from '@upstash/redis';

let redis = null;
let initializationError = null;

const initializeRedis = () => {
  if (redis) return; // Already initialized

  try {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not configured');
    }

    // Parse the original Redis URL
    const originalUrl = new URL(process.env.REDIS_URL);
    const password = originalUrl.password;
    const host = originalUrl.hostname;
    const port = originalUrl.port;

    // Construct the Upstash-compatible HTTPS URL
    const upstashUrl = `https://${host}:${port}`;
    
    // Initialize Redis with Upstash format
    redis = new Redis({
      url: upstashUrl,
      token: password
    });

  } catch (error) {
    initializationError = error;
    console.error('Failed to initialize Redis client:', error);
  }
};

// Initialize on module load
initializeRedis();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try to initialize Redis if it failed on startup
  if (!redis && !initializationError) {
    initializeRedis();
  }

  try {
    // Check if Redis is properly initialized
    if (!redis) {
      throw new Error(
        `Redis client is not initialized. Reason: ${
          initializationError ? initializationError.message : 'Unknown error'
        }`
      );
    }

    const logs = await redis.lrange('transcription_log', 0, -1);
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