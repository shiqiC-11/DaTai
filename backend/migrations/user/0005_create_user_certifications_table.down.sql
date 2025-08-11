-- Migration 0005: Drop user_certifications table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_certifications_status ON user_certifications;
DROP INDEX IF EXISTS idx_user_certifications_user_id ON user_certifications;

-- Drop table
DROP TABLE IF EXISTS user_certifications; 