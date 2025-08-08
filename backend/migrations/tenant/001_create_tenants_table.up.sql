-- Migration 001: Create tenants table for PostgreSQL
-- Based on DBML design for Datai project

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';


CREATE TABLE tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_tenants_region ON tenants(region);
CREATE INDEX idx_tenants_created_at ON tenants(created_at); 