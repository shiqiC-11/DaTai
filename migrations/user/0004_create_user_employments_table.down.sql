-- Migration 0004: Drop user_employments table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_employments_user_id ON user_employments;

-- Drop table
DROP TABLE IF EXISTS user_employments; 