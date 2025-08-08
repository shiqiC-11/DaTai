-- Migration 001: Drop event_groups table for PostgreSQL

-- Drop triggers first
DROP TRIGGER IF EXISTS update_event_groups_updated_at ON event_groups;

-- Drop indexes first
DROP INDEX IF EXISTS idx_event_groups_score_avg ON event_groups;
DROP INDEX IF EXISTS idx_event_groups_is_public ON event_groups;
DROP INDEX IF EXISTS idx_event_groups_owner_id ON event_groups;

-- Drop table
DROP TABLE IF EXISTS event_groups; 