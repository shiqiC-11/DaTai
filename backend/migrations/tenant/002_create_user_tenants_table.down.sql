-- Migration 002: Drop user_tenants table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_tenants_joined_at ON user_tenants;
DROP INDEX IF EXISTS idx_user_tenants_role ON user_tenants;
DROP INDEX IF EXISTS idx_user_tenants_tenant_id ON user_tenants;

-- Drop table
DROP TABLE IF EXISTS user_tenants; 