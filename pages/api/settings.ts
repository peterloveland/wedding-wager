import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, getGameSetting, setGameSetting } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      const { key } = req.query;
      
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'key parameter is required' });
      }

      const value = await getGameSetting(key);
      res.status(200).json({ key, value });
    } else if (req.method === 'POST') {
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value are required' });
      }

      await setGameSetting(key, value);
      res.status(200).json({ key, value });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}