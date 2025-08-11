-- Migration 0002: Drop user_follows table for PostgreSQL

-- Drop index on followee_id (the only extra one we created)
DROP INDEX IF EXISTS idx_user_follows_followee ON user_follows;

-- Drop the table (this will also drop the PRIMARY KEY and FOREIGN KEY constraints)
DROP TABLE IF EXISTS user_follows;
