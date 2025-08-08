-- Migration 005: Create event_ratings table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE event_ratings (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    rater_id BIGINT NOT NULL,
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_event_ratings_event_id ON event_ratings(event_id);
CREATE INDEX idx_event_ratings_rater_id ON event_ratings(rater_id);
CREATE INDEX idx_event_ratings_score ON event_ratings(score);
CREATE UNIQUE INDEX idx_event_ratings_unique ON event_ratings(event_id, rater_id); 