/*
  # Asset Management Tool - Initial Schema

  ## Overview
  This migration creates the complete database schema for an Asset Management Tool
  that tracks device configurations and user accounts across multiple territories.

  ## New Tables

  ### 1. `users_directory`
  Stores user information and organizational hierarchy
  - `id` (uuid, primary key)
  - `name` (text) - Full name of the user
  - `login_email` (text, unique) - Email used for login
  - `title` (text) - Job title
  - `department` (text) - Department name
  - `territory` (text) - Territory/Group assignment
  - `core_id` (text) - Core system identifier
  - `reports_to` (uuid, nullable) - Reference to manager's user ID
  - `status` (text) - User status (active, inactive, provisioning)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `devices`
  Tracks all devices and their serial numbers
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable) - Assigned user reference
  - `device_type` (text) - Type: APX_NEXT, N70, V700, SVX
  - `serial_number` (text, unique) - Device serial number
  - `device_id` (text) - Device identifier
  - `status` (text) - Device status (available, assigned, retired)
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `account_configs`
  Stores login credentials and account configurations per user
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique) - Reference to user
  - `vesta_nxt_login` (text) - VESTA NXT Login
  - `radio_next_login` (text) - Radio Next login
  - `radio_n70_login` (text) - N70 login
  - `rapid_deploy_login` (text) - Rapid Deploy Login
  - `phone_extension` (text) - Phone extension
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `provisioning_tasks`
  Tracks SET checklist items for each user
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Reference to user
  - `task_name` (text) - Name of the task
  - `task_order` (integer) - Display order
  - `completed` (boolean) - Completion status
  - `completed_at` (timestamptz, nullable) - When task was completed
  - `completed_by` (text) - Who completed the task
  - `notes` (text) - Task-specific notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `import_history`
  Tracks CSV import operations
  - `id` (uuid, primary key)
  - `filename` (text) - Original filename
  - `rows_processed` (integer) - Number of rows processed
  - `rows_success` (integer) - Successfully imported rows
  - `rows_failed` (integer) - Failed rows
  - `imported_by` (text) - User who performed import
  - `import_data` (jsonb) - Full import data and errors
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to read all data
  - Add policies for authenticated users to insert/update/delete data
  
  ## Indexes
  - Create indexes on foreign keys and commonly queried fields
  - Create indexes for search functionality
*/

-- Create ENUM types for consistency
DO $$ BEGIN
  CREATE TYPE device_type AS ENUM ('APX_NEXT', 'N70', 'V700', 'SVX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE device_status AS ENUM ('available', 'assigned', 'retired', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'provisioning', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE territory_type AS ENUM ('Central', 'Northeast', 'Southeast', 'West', 'Federal', 'Software', 'Video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users Directory Table
CREATE TABLE IF NOT EXISTS users_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  login_email text UNIQUE NOT NULL,
  title text DEFAULT '',
  department text DEFAULT '',
  territory territory_type,
  core_id text DEFAULT '',
  reports_to uuid REFERENCES users_directory(id) ON DELETE SET NULL,
  status user_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_directory(id) ON DELETE SET NULL,
  device_type device_type NOT NULL,
  serial_number text UNIQUE NOT NULL,
  device_id text DEFAULT '',
  status device_status DEFAULT 'available',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Account Configurations Table
CREATE TABLE IF NOT EXISTS account_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users_directory(id) ON DELETE CASCADE,
  vesta_nxt_login text DEFAULT '',
  radio_next_login text DEFAULT '',
  radio_n70_login text DEFAULT '',
  rapid_deploy_login text DEFAULT '',
  phone_extension text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Provisioning Tasks Table
CREATE TABLE IF NOT EXISTS provisioning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_directory(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_order integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Import History Table
CREATE TABLE IF NOT EXISTS import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  rows_processed integer DEFAULT 0,
  rows_success integer DEFAULT 0,
  rows_failed integer DEFAULT 0,
  imported_by text DEFAULT '',
  import_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_territory ON users_directory(territory);
CREATE INDEX IF NOT EXISTS idx_users_status ON users_directory(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users_directory(department);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_directory(login_email);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_account_configs_user_id ON account_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_user_id ON provisioning_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_completed ON provisioning_tasks(completed);

-- Enable Row Level Security
ALTER TABLE users_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_directory
CREATE POLICY "Users directory is viewable by authenticated users"
  ON users_directory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users directory is insertable by authenticated users"
  ON users_directory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users directory is updatable by authenticated users"
  ON users_directory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users directory is deletable by authenticated users"
  ON users_directory FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for devices
CREATE POLICY "Devices are viewable by authenticated users"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Devices are insertable by authenticated users"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Devices are updatable by authenticated users"
  ON devices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Devices are deletable by authenticated users"
  ON devices FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for account_configs
CREATE POLICY "Account configs are viewable by authenticated users"
  ON account_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Account configs are insertable by authenticated users"
  ON account_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Account configs are updatable by authenticated users"
  ON account_configs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Account configs are deletable by authenticated users"
  ON account_configs FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for provisioning_tasks
CREATE POLICY "Provisioning tasks are viewable by authenticated users"
  ON provisioning_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Provisioning tasks are insertable by authenticated users"
  ON provisioning_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Provisioning tasks are updatable by authenticated users"
  ON provisioning_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Provisioning tasks are deletable by authenticated users"
  ON provisioning_tasks FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for import_history
CREATE POLICY "Import history is viewable by authenticated users"
  ON import_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Import history is insertable by authenticated users"
  ON import_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_directory_updated_at ON users_directory;
CREATE TRIGGER update_users_directory_updated_at
  BEFORE UPDATE ON users_directory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_account_configs_updated_at ON account_configs;
CREATE TRIGGER update_account_configs_updated_at
  BEFORE UPDATE ON account_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_provisioning_tasks_updated_at ON provisioning_tasks;
CREATE TRIGGER update_provisioning_tasks_updated_at
  BEFORE UPDATE ON provisioning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default provisioning checklist template tasks
-- These will be auto-created for new users via application logic
CREATE TABLE IF NOT EXISTS provisioning_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  task_order integer NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE provisioning_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task templates are viewable by authenticated users"
  ON provisioning_task_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Task templates are insertable by authenticated users"
  ON provisioning_task_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Task templates are updatable by authenticated users"
  ON provisioning_task_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Task templates are deletable by authenticated users"
  ON provisioning_task_templates FOR DELETE
  TO authenticated
  USING (true);

-- Insert default SET checklist tasks
INSERT INTO provisioning_task_templates (task_name, task_order, description) VALUES
  ('Provision P1 User Roles', 1, 'Set up user roles in P1 system'),
  ('Place Unit on Duty', 2, 'Activate device and place on duty'),
  ('Aware - Add Device', 3, 'Register device in Aware system'),
  ('Configure VESTA NXT Access', 4, 'Set up VESTA NXT login credentials'),
  ('Configure Radio Access', 5, 'Set up Radio Next and N70 login credentials'),
  ('Configure Rapid Deploy', 6, 'Set up Rapid Deploy access'),
  ('Assign Phone Extension', 7, 'Configure phone extension'),
  ('Verify All Systems', 8, 'Final verification of all system access')
ON CONFLICT DO NOTHING;