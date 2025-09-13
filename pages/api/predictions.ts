import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, getPredictions, sql } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      const predictions = await getPredictions();
      res.status(200).json(predictions);
    } else if (req.method === 'POST') {
      const { userId, criteriaId, answer } = req.body;
      
      if (!userId || !criteriaId || !answer) {
        return res.status(400).json({ error: 'userId, criteriaId, and answer are required' });
      }

      const id = `${userId}-${criteriaId}`;
      const timestamp = Date.now();
      
      // Upsert prediction (insert or update if exists)
      await sql`
        INSERT INTO predictions (id, user_id, criteria_id, answer, timestamp)
        VALUES (${id}, ${userId}, ${criteriaId}, ${answer}, ${timestamp})
        ON CONFLICT (user_id, criteria_id)
        DO UPDATE SET answer = ${answer}, timestamp = ${timestamp}
      `;
      
      const predictions = await getPredictions();
      res.status(201).json(predictions);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}