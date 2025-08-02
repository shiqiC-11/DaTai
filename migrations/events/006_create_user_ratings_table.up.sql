-- Migration 006: Create user_ratings table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_ratings (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    rater_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_ratings_event_id ON user_ratings(event_id);
CREATE INDEX idx_user_ratings_rater_id ON user_ratings(rater_id);
CREATE INDEX idx_user_ratings_target_user_id ON user_ratings(target_user_id);
CREATE INDEX idx_user_ratings_score ON user_ratings(score);
CREATE UNIQUE INDEX idx_user_ratings_unique ON user_ratings(event_id, rater_id, target_user_id); 