-- Migration 003: Drop event_participants table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_event_participants_unique ON event_participants;
DROP INDEX IF EXISTS idx_event_participants_status ON event_participants;
DROP INDEX IF EXISTS idx_event_participants_user_id ON event_participants;
DROP INDEX IF EXISTS idx_event_participants_event_id ON event_participants;

-- Drop table
DROP TABLE IF EXISTS event_participants; 