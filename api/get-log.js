import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const log = await kv.lrange('transcription_log', 0, -1);
      res.status(200).json(log.map(entry => JSON.parse(entry)));
    } catch (error) {
      console.error('Error fetching log:', error);
      res.status(500).json({ error: 'Error fetching log' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}