-- Migration 002: Create user_tenants table for PostgreSQL
-- Based on DBML design for Datai project

CREATE TABLE user_tenants (
    user_id BIGINT NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_user_tenants_tenant_id ON user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_role ON user_tenants(role);
CREATE INDEX idx_user_tenants_joined_at ON user_tenants(joined_at); 