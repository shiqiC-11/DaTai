-- Migration 001: Drop tenants table for PostgreSQL

-- Drop indexes first
DROP INDEX IF EXISTS idx_tenants_created_at ON tenants;
DROP INDEX IF EXISTS idx_tenants_region ON tenants;

-- Drop table
DROP TABLE IF EXISTS tenants; 