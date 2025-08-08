-- Migration 002: Drop events table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_events_primary_tag ON events;
DROP INDEX IF EXISTS idx_events_location_type ON events;
DROP INDEX IF EXISTS idx_events_start_time ON events;
DROP INDEX IF EXISTS idx_events_tenant_id ON events;
DROP INDEX IF EXISTS idx_events_group_id ON events;
DROP INDEX IF EXISTS idx_events_owner_id ON events;

-- Drop table
DROP TABLE IF EXISTS events; 