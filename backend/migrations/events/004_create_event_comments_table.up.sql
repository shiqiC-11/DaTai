-- Migration 004: Create event_comments table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE event_comments (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_nickname VARCHAR(255),
    content TEXT NOT NULL,
    parent_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES event_comments(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_user_id ON event_comments(user_id);
CREATE INDEX idx_event_comments_parent_id ON event_comments(parent_id);
CREATE INDEX idx_event_comments_created_at ON event_comments(created_at); 