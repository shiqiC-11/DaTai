-- Migration 005: Drop event_ratings table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_event_ratings_unique ON event_ratings;
DROP INDEX IF EXISTS idx_event_ratings_score ON event_ratings;
DROP INDEX IF EXISTS idx_event_ratings_rater_id ON event_ratings;
DROP INDEX IF EXISTS idx_event_ratings_event_id ON event_ratings;

-- Drop table
DROP TABLE IF EXISTS event_ratings; 