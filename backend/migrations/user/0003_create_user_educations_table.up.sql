-- Migration 0003: Create user_educations table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_educations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    degree VARCHAR(100),
    major VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_educations_user_id ON user_educations(user_id); 