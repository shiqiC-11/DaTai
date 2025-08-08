-- Migration 0001: Create users table for PostgreSQL

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar VARCHAR(500),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    birth_year INT,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status INT DEFAULT 1,
    email VARCHAR(255),
    phone VARCHAR(20)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
