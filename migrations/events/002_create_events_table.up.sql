-- Migration 002: Create events table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    owner_nickname VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    primary_tag VARCHAR(100),
    secondary_tags JSONB,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location_type VARCHAR(20) CHECK (location_type IN ('online', 'offline', 'hybrid')) NOT NULL,
    location_detail TEXT,
    cover_image VARCHAR(500),
    require_approval BOOLEAN DEFAULT FALSE,
    participant_limit INT,
    group_id BIGINT,
    tenant_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES event_groups(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_events_owner_id ON events(owner_id);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_location_type ON events(location_type);
CREATE INDEX idx_events_primary_tag ON events(primary_tag); 