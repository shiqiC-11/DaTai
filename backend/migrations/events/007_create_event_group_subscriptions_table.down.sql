-- Migration 007: Drop event_group_subscriptions table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_event_group_subscriptions_unique ON event_group_subscriptions;
DROP INDEX IF EXISTS idx_event_group_subscriptions_group_id ON event_group_subscriptions;
DROP INDEX IF EXISTS idx_event_group_subscriptions_user_id ON event_group_subscriptions;

-- Drop table
DROP TABLE IF EXISTS event_group_subscriptions; 