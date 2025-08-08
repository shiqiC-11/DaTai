-- Migration 006: Drop user_ratings table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_ratings_unique ON user_ratings;
DROP INDEX IF EXISTS idx_user_ratings_score ON user_ratings;
DROP INDEX IF EXISTS idx_user_ratings_target_user_id ON user_ratings;
DROP INDEX IF EXISTS idx_user_ratings_rater_id ON user_ratings;
DROP INDEX IF EXISTS idx_user_ratings_event_id ON user_ratings;

-- Drop table
DROP TABLE IF EXISTS user_ratings; 