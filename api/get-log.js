import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Check if the KV store is properly initialized
      if (!kv) {
        throw new Error('Vercel KV is not properly initialized');
      }

      const log = await kv.lrange('transcription_log', 0, -1);
      
      // Check if the log is empty
      if (!log || log.length === 0) {
        return res.status(200).json({ message: 'No logs found', data: [] });
      }

      const parsedLog = log.map(entry => {
        try {
          return JSON.parse(entry);
        } catch (parseError) {
          console.error('Error parsing log entry:', parseError);
          return null;
        }
      }).filter(entry => entry !== null);

      res.status(200).json({ message: 'Logs retrieved successfully', data: parsedLog });
    } catch (error) {
      console.error('Error fetching log:', error);
      res.status(500).json({ error: 'Error fetching log', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}