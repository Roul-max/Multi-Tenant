/*
  # Multi-Tenant SaaS Notes Application Schema

  1. New Tables
    - `tenants`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - tenant identifier (e.g. 'acme', 'globex')
      - `name` (text) - display name
      - `plan` (text) - subscription plan ('free' or 'pro')
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text) - encrypted password
      - `role` (text) - 'admin' or 'member'
      - `tenant_id` (uuid) - foreign key to tenants
      - `created_at` (timestamp)
    
    - `notes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `user_id` (uuid) - foreign key to users
      - `tenant_id` (uuid) - foreign key to tenants (for tenant isolation)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant isolation
    - Ensure users can only access their tenant's data

  3. Seed Data
    - Create 'acme' and 'globex' tenants
    - Create test users for both tenants
    - Both tenants start with 'free' plan
*/

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- RLS Policies for tenants
CREATE POLICY "Tenants are publicly readable"
  ON tenants
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policies for users
CREATE POLICY "Users can read users from their tenant"
  ON users
  FOR SELECT
  TO authenticated
  USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

-- RLS Policies for notes
CREATE POLICY "Users can read notes from their tenant"
  ON notes
  FOR SELECT
  TO authenticated
  USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "Users can insert notes to their tenant"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "Users can update notes from their tenant"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "Users can delete notes from their tenant"
  ON notes
  FOR DELETE
  TO authenticated
  USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

-- Insert seed data
-- Create tenants
INSERT INTO tenants (slug, name, plan) VALUES
  ('acme', 'Acme Corporation', 'free'),
  ('globex', 'Globex Corporation', 'free')
ON CONFLICT (slug) DO NOTHING;

-- Insert seed users (password hash for 'password')
INSERT INTO users (email, password_hash, role, tenant_id) VALUES
  ('admin@acme.test', '$2a$10$8K1p/a0dUrziIxiC8y4hwurBIwSqmgTUt8Xjh6kTDQnqK4n7/1QC2', 'admin', 
   (SELECT id FROM tenants WHERE slug = 'acme')),
  ('user@acme.test', '$2a$10$8K1p/a0dUrziIxiC8y4hwurBIwSqmgTUt8Xjh6kTDQnqK4n7/1QC2', 'member', 
   (SELECT id FROM tenants WHERE slug = 'acme')),
  ('admin@globex.test', '$2a$10$8K1p/a0dUrziIxiC8y4hwurBIwSqmgTUt8Xjh6kTDQnqK4n7/1QC2', 'admin', 
   (SELECT id FROM tenants WHERE slug = 'globex')),
  ('user@globex.test', '$2a$10$8K1p/a0dUrziIxiC8y4hwurBIwSqmgTUt8Xjh6kTDQnqK4n7/1QC2', 'member', 
   (SELECT id FROM tenants WHERE slug = 'globex'))
ON CONFLICT (email) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notes updated_at
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();