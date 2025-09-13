import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, sql, getUsers } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeDatabase();

    if (req.method === 'POST') {
      const { criteriaId, userId } = req.body;
      
      if (!criteriaId || !userId) {
        return res.status(400).json({ error: 'criteriaId and userId are required' });
      }

      // Check if user is already a winner for this criteria
      const existingWinner = await sql`
        SELECT * FROM winners WHERE criteria_id = ${criteriaId} AND user_id = ${userId}
      `;

      if (existingWinner.rows.length > 0) {
        // Remove winner
        await sql`
          DELETE FROM winners WHERE criteria_id = ${criteriaId} AND user_id = ${userId}
        `;
        
        // Decrease user score
        await sql`
          UPDATE users SET score = score - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}
        `;
      } else {
        // Add winner
        await sql`
          INSERT INTO winners (criteria_id, user_id) VALUES (${criteriaId}, ${userId})
        `;
        
        // Increase user score
        await sql`
          UPDATE users SET score = score + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}
        `;
      }
      
      const users = await getUsers();
      res.status(200).json(users);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}