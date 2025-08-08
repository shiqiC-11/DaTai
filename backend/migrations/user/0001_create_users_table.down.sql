-- Migration 0001: Drop users table for PostgreSQL

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_status ON users;
DROP INDEX IF EXISTS idx_users_phone ON users;
DROP INDEX IF EXISTS idx_users_email ON users;

-- Drop table
DROP TABLE IF EXISTS users;

-- Drop function (only if no other tables are using it)
-- DROP FUNCTION IF EXISTS update_updated_at_column(); 