-- Migration 0004: Create user_employments table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_employments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_employments_user_id ON user_employments(user_id); 