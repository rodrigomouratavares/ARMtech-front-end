-- Migration: Create audit_logs table
-- Description: Adds audit logging functionality to track all system actions
-- Author: Flow CRM Team
-- Date: 2025-10-10

-- Create audit action enum type
CREATE TYPE audit_action AS ENUM ('login', 'logout', 'create', 'update', 'delete', 'view');

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  action audit_action NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores all important system actions for security and compliance';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.user_name IS 'Name of the user at the time of action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected (user, product, customer, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource (if applicable)';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the action occurred';

-- Partitioning strategy (optional, for high-volume systems)
-- Uncomment if needed for performance with millions of records
-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
