import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, getUsers, updateUserScore, sql } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    if (req.method === 'GET') {
      const users = await getUsers();
      res.status(200).json(users);
    } else if (req.method === 'PUT') {
      const { userId, score } = req.body;
      
      if (!userId || score === undefined) {
        return res.status(400).json({ error: 'userId and score are required' });
      }

      await updateUserScore(userId, score);
      const users = await getUsers();
      res.status(200).json(users);
    } else if (req.method === 'POST') {
      const { id, name, isAdmin } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      // Check if user already exists
      const existingUsers = await getUsers();
      if (existingUsers.find(u => u.id === id)) {
        return res.status(400).json({ error: 'User with this ID already exists' });
      }

      // Create new user
      await sql`
        INSERT INTO users (id, name, is_admin, score)
        VALUES (${id}, ${name}, ${isAdmin || false}, 0)
      `;
      
      const users = await getUsers();
      res.status(201).json(users);
    } else if (req.method === 'DELETE') {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check if user exists and is not admin
      const existingUsers = await getUsers();
      const userToDelete = existingUsers.find(u => u.id === userId);
      
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userToDelete.is_admin) {
        return res.status(400).json({ error: 'Cannot delete admin user' });
      }

      // Delete user (CASCADE will handle related data)
      await sql`DELETE FROM users WHERE id = ${userId}`;
      
      const users = await getUsers();
      res.status(200).json(users);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'POST', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}