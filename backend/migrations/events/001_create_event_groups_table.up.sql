-- Migration 001: Create event_groups table for PostgreSQL
-- Based on DBML design for Datai project
-- Trigger function (must exist in each DB)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TABLE event_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id BIGINT NOT NULL,
    description TEXT,
    tags JSONB,
    pictures JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    score_avg DECIMAL(3,2) DEFAULT 0.00,
    score_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    event_count INT DEFAULT 0,
    total_participants INT DEFAULT 0,
    rating_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_event_groups_owner_id ON event_groups(owner_id);
CREATE INDEX idx_event_groups_is_public ON event_groups(is_public);
CREATE INDEX idx_event_groups_score_avg ON event_groups(score_avg);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_groups_updated_at BEFORE UPDATE ON event_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 