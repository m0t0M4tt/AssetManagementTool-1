/*
  # Fix RLS Policies for Anonymous Access

  ## Changes
  - Update RLS policies to allow anonymous (anon) users to perform operations
  - This enables CSV imports and general application usage without authentication
  
  ## Security Note
  - These policies allow public access for demo/internal tool purposes
  - For production use with sensitive data, implement proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users directory is viewable by authenticated users" ON users_directory;
DROP POLICY IF EXISTS "Users directory is insertable by authenticated users" ON users_directory;
DROP POLICY IF EXISTS "Users directory is updatable by authenticated users" ON users_directory;
DROP POLICY IF EXISTS "Users directory is deletable by authenticated users" ON users_directory;

DROP POLICY IF EXISTS "Devices are viewable by authenticated users" ON devices;
DROP POLICY IF EXISTS "Devices are insertable by authenticated users" ON devices;
DROP POLICY IF EXISTS "Devices are updatable by authenticated users" ON devices;
DROP POLICY IF EXISTS "Devices are deletable by authenticated users" ON devices;

DROP POLICY IF EXISTS "Account configs are viewable by authenticated users" ON account_configs;
DROP POLICY IF EXISTS "Account configs are insertable by authenticated users" ON account_configs;
DROP POLICY IF EXISTS "Account configs are updatable by authenticated users" ON account_configs;
DROP POLICY IF EXISTS "Account configs are deletable by authenticated users" ON account_configs;

DROP POLICY IF EXISTS "Provisioning tasks are viewable by authenticated users" ON provisioning_tasks;
DROP POLICY IF EXISTS "Provisioning tasks are insertable by authenticated users" ON provisioning_tasks;
DROP POLICY IF EXISTS "Provisioning tasks are updatable by authenticated users" ON provisioning_tasks;
DROP POLICY IF EXISTS "Provisioning tasks are deletable by authenticated users" ON provisioning_tasks;

DROP POLICY IF EXISTS "Import history is viewable by authenticated users" ON import_history;
DROP POLICY IF EXISTS "Import history is insertable by authenticated users" ON import_history;

DROP POLICY IF EXISTS "Task templates are viewable by authenticated users" ON provisioning_task_templates;
DROP POLICY IF EXISTS "Task templates are insertable by authenticated users" ON provisioning_task_templates;
DROP POLICY IF EXISTS "Task templates are updatable by authenticated users" ON provisioning_task_templates;
DROP POLICY IF EXISTS "Task templates are deletable by authenticated users" ON provisioning_task_templates;

-- Create new policies that allow anon access
CREATE POLICY "Users directory is viewable by all"
  ON users_directory FOR SELECT
  USING (true);

CREATE POLICY "Users directory is insertable by all"
  ON users_directory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users directory is updatable by all"
  ON users_directory FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users directory is deletable by all"
  ON users_directory FOR DELETE
  USING (true);

CREATE POLICY "Devices are viewable by all"
  ON devices FOR SELECT
  USING (true);

CREATE POLICY "Devices are insertable by all"
  ON devices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Devices are updatable by all"
  ON devices FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Devices are deletable by all"
  ON devices FOR DELETE
  USING (true);

CREATE POLICY "Account configs are viewable by all"
  ON account_configs FOR SELECT
  USING (true);

CREATE POLICY "Account configs are insertable by all"
  ON account_configs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Account configs are updatable by all"
  ON account_configs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Account configs are deletable by all"
  ON account_configs FOR DELETE
  USING (true);

CREATE POLICY "Provisioning tasks are viewable by all"
  ON provisioning_tasks FOR SELECT
  USING (true);

CREATE POLICY "Provisioning tasks are insertable by all"
  ON provisioning_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Provisioning tasks are updatable by all"
  ON provisioning_tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Provisioning tasks are deletable by all"
  ON provisioning_tasks FOR DELETE
  USING (true);

CREATE POLICY "Import history is viewable by all"
  ON import_history FOR SELECT
  USING (true);

CREATE POLICY "Import history is insertable by all"
  ON import_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Task templates are viewable by all"
  ON provisioning_task_templates FOR SELECT
  USING (true);

CREATE POLICY "Task templates are insertable by all"
  ON provisioning_task_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Task templates are updatable by all"
  ON provisioning_task_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Task templates are deletable by all"
  ON provisioning_task_templates FOR DELETE
  USING (true);