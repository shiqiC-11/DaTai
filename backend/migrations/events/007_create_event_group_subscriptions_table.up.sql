-- Migration 007: Create event_group_subscriptions table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE event_group_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES event_groups(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_event_group_subscriptions_user_id ON event_group_subscriptions(user_id);
CREATE INDEX idx_event_group_subscriptions_group_id ON event_group_subscriptions(group_id);
CREATE UNIQUE INDEX idx_event_group_subscriptions_unique ON event_group_subscriptions(user_id, group_id); 