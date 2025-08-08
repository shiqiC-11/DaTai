-- Migration 004: Drop event_comments table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_event_comments_created_at ON event_comments;
DROP INDEX IF EXISTS idx_event_comments_parent_id ON event_comments;
DROP INDEX IF EXISTS idx_event_comments_user_id ON event_comments;
DROP INDEX IF EXISTS idx_event_comments_event_id ON event_comments;

-- Drop table
DROP TABLE IF EXISTS event_comments; 