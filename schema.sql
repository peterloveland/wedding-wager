-- Wedding Wager Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criteria table (prediction questions)
CREATE TABLE IF NOT EXISTS criteria (
    id VARCHAR(50) PRIMARY KEY,
    question TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
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

-- Winners table (many-to-many relationship between criteria and users)
CREATE TABLE IF NOT EXISTS winners (
    id SERIAL PRIMARY KEY,
    criteria_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(criteria_id, user_id)
);

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined users
INSERT INTO users (id, name, is_admin, score) VALUES
    ('pete', 'Sexy Peter', TRUE, 0),
    ('penny', 'Penny', FALSE, 0),
    ('hannah', 'HanTwat', FALSE, 0),
    ('charlotte', 'Charlotte', FALSE, 0),
    ('jack', 'Jack', FALSE, 0),
    ('jess', 'Jess', FALSE, 0),
    ('bromley', 'Bromley', FALSE, 0),
    ('lucy', 'Lucy', FALSE, 0),
    ('eddie', 'Eddie', FALSE, 0),
    ('ben', 'Ben', FALSE, 0),
    ('sophie', 'Sophie', FALSE, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default game setting for answers locked state
INSERT INTO game_settings (setting_key, setting_value) VALUES
    ('answers_locked', 'false')
ON CONFLICT (setting_key) DO NOTHING;