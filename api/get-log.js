import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
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