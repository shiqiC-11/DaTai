-- Migration 0002: Create user_follows table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_follows (
    follower_id BIGINT NOT NULL,
    followee_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Only one extra index needed (to support querying by followee_id)
CREATE INDEX idx_user_follows_followee ON user_follows(followee_id);