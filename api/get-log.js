import { Redis } from '@upstash/redis';

let redis;
try {
  if (!process.env.REDIS_URL) {
    throw new Error('Redis connection URL is missing');
  }
  redis = new Redis(process.env.REDIS_URL);
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (!redis) {
        throw new Error('Redis client is not initialized');
      }
      const logs = await redis.lrange('transcription_log', 0, -1);
      
      const parsedLogs = logs.map(log => JSON.parse(log));
      
      res.status(200).json({ message: 'Logs retrieved successfully', data: parsedLogs });
    } catch (error) {
      console.error('Error fetching log:', error);
      res.status(500).json({ error: 'Error fetching log', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}