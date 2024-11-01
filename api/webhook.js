import express from 'express';
import { Redis } from '@upstash/redis';
import axios from 'axios';

let redis;
try {
  if (!process.env.REDIS_URL) {
    throw new Error('Redis connection URL is missing');
  }
  redis = new Redis(process.env.REDIS_URL);
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

const app = express();

app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  const event = req.body.event;

  if (event === 'meeting.transcription_updated') {
    const meetingId = req.body.payload.object.id;
    
    try {
      // Fetch the updated transcription from Zoom API
      const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}/transcription`, {
        headers: {
          'Authorization': `Bearer ${process.env.ZOOM_ACCESS_TOKEN}`
        }
      });

      const transcription = response.data;
      
      if (!redis) {
        return res.status(500).json({ error: 'Redis client is not initialized' });
      }
      // Store the transcription log in Redis
      await redis.lpush('transcription_log', JSON.stringify({
        meetingId,
        transcription,
        timestamp: new Date().toISOString()
      }));

      // Keep only the last 100 entries
      await redis.ltrim('transcription_log', 0, 99);

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Error processing webhook', details: error.message });
    }
  } else {
    res.status(200).json({ message: 'Event not relevant' });
  }
});

export default app;