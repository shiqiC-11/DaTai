-- Migration 0003: Drop user_educations table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_educations_user_id ON user_educations;

-- Drop table
DROP TABLE IF EXISTS user_educations; 