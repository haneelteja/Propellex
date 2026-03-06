-- Migration 003: Role-based access control + property documents

-- Add role column to users (manager | admin | client)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'client'
    CHECK (role IN ('manager', 'admin', 'client'));

-- Promote existing agency_manager users to admin role
UPDATE users SET role = 'admin' WHERE user_type = 'agency_manager';

-- Add uploaded_by (which admin uploaded this property)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id);

-- Add documents JSONB array: [{name, url, type}]
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]';

-- Add is_active flag to users for soft-delete by manager
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
