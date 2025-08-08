-- Migration 0005: Create user_certifications table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_certifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cert_type VARCHAR(20) CHECK (cert_type IN ('education', 'employment', 'skill', 'other')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    proof TEXT,
    reviewer_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_certifications_user_id ON user_certifications(user_id);
CREATE INDEX idx_user_certifications_status ON user_certifications(status); 