import { sql } from '@vercel/postgres';

// Database connection utility
export const db = sql;
export { sql };

// Initialize database with schema
export async function initializeDatabase() {
  try {
    // Check if users table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (!result.rows[0].exists) {
      console.log('Initializing database...');
      
      // Create users table
      await sql`
        CREATE TABLE users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          score INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create criteria table
      await sql`
        CREATE TABLE criteria (
          id VARCHAR(50) PRIMARY KEY,
          question TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create predictions table
      await sql`
        CREATE TABLE predictions (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          criteria_id VARCHAR(50) NOT NULL,
          answer TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
          UNIQUE(user_id, criteria_id)
        );
      `;

      // Create winners table
      await sql`
        CREATE TABLE winners (
          id SERIAL PRIMARY KEY,
          criteria_id VARCHAR(50) NOT NULL,
          user_id VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(criteria_id, user_id)
        );
      `;

      // Create game settings table
      await sql`
        CREATE TABLE game_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(50) UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Insert predefined users
      const predefinedUsers = [
        { id: 'pete', name: 'Sexy Peter', isAdmin: true },
        { id: 'penny', name: 'Penny', isAdmin: false },
        { id: 'hannah', name: 'HanTwat', isAdmin: false },
        { id: 'charlotte', name: 'Charlotte', isAdmin: false },
        { id: 'jack', name: 'Jack', isAdmin: false },
        { id: 'jess', name: 'Jess', isAdmin: false },
        { id: 'bromley', name: 'Bromley', isAdmin: false },
        { id: 'lucy', name: 'Lucy', isAdmin: false },
        { id: 'eddie', name: 'Eddie', isAdmin: false },
        { id: 'ben', name: 'Ben', isAdmin: false },
        { id: 'sophie', name: 'Sophie', isAdmin: false }
      ];

      for (const user of predefinedUsers) {
        await sql`
          INSERT INTO users (id, name, is_admin, score)
          VALUES (${user.id}, ${user.name}, ${user.isAdmin}, 0)
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Insert default game setting
      await sql`
        INSERT INTO game_settings (setting_key, setting_value)
        VALUES ('answers_locked', 'false')
        ON CONFLICT (setting_key) DO NOTHING;
      `;

      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper functions for database operations
export async function getUsers() {
  const result = await sql`SELECT * FROM users ORDER BY score DESC, name ASC`;
  return result.rows;
}

export async function updateUserScore(userId: string, newScore: number) {
  await sql`
    UPDATE users 
    SET score = ${newScore}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `;
}

export async function getCriteria() {
  const result = await sql`SELECT * FROM criteria ORDER BY created_at ASC`;
  return result.rows;
}

export async function getPredictions() {
  const result = await sql`SELECT * FROM predictions ORDER BY timestamp ASC`;
  return result.rows;
}

export async function getWinners() {
  const result = await sql`SELECT * FROM winners`;
  return result.rows;
}

export async function getGameSetting(key: string) {
  const result = await sql`SELECT setting_value FROM game_settings WHERE setting_key = ${key}`;
  return result.rows[0]?.setting_value;
}

export async function setGameSetting(key: string, value: string) {
  await sql`
    INSERT INTO game_settings (setting_key, setting_value)
    VALUES (${key}, ${value})
    ON CONFLICT (setting_key)
    DO UPDATE SET setting_value = ${value}, updated_at = CURRENT_TIMESTAMP
  `;
}