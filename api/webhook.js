import express from 'express';
import { kv } from '@vercel/kv';
import axios from 'axios';

const app = express();

app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  const event = req.body.event;

  if (event === 'meeting.transcription_updated') {
    const meetingId = req.body.payload.object.id;
    
    // Fetch the updated transcription from Zoom API
    try {
      const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}/transcription`, {
        headers: {
          'Authorization': `Bearer ${process.env.ZOOM_ACCESS_TOKEN}`
        }
      });

      const transcription = response.data;
      
      // Store the transcription log in Vercel KV
      await kv.lpush('transcription_log', JSON.stringify(transcription));
      
      // Keep only the last 100 entries
      await kv.ltrim('transcription_log', 0, 99);
    } catch (error) {
      console.error('Error fetching transcription:', error);
    }
  }

  res.status(200).send();
});

export default app;