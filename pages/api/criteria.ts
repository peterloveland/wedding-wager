import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, getCriteria, sql } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      const criteria = await getCriteria();
      
      // Get winners for each criterion
      const criteriaWithWinners = await Promise.all(
        criteria.map(async (criterion: any) => {
          const winnersResult = await sql`
            SELECT user_id FROM winners WHERE criteria_id = ${criterion.id}
          `;
          return {
            ...criterion,
            winners: winnersResult.rows.map((row: any) => row.user_id)
          };
        })
      );
      
      res.status(200).json(criteriaWithWinners);
    } else if (req.method === 'POST') {
      const { question, description } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const id = Date.now().toString();
      
      await sql`
        INSERT INTO criteria (id, question, description)
        VALUES (${id}, ${question}, ${description || ''})
      `;
      
      const criteria = await getCriteria();
      const criteriaWithWinners = await Promise.all(
        criteria.map(async (criterion: any) => {
          const winnersResult = await sql`
            SELECT user_id FROM winners WHERE criteria_id = ${criterion.id}
          `;
          return {
            ...criterion,
            winners: winnersResult.rows.map((row: any) => row.user_id)
          };
        })
      );
      
      res.status(201).json(criteriaWithWinners);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}