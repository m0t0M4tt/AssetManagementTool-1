/*
  # Create User Provisioning Table

  1. New Tables
    - `user_provisioning`
      - `id` (uuid, primary key) - Unique identifier
      - `user_email` (text, unique, not null) - User's email address (indexed for lookups)
      - `user_name` (text, not null) - User's name for reference
      - `apx_next` (jsonb, not null) - APX Next provisioning steps
      - `apx_n70` (jsonb, not null) - APX N70 provisioning steps
      - `phone_apps` (jsonb, not null) - Phone applications provisioning steps
      - `svx_v700` (jsonb, not null) - SVX/V700 provisioning steps
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `user_provisioning` table
    - Add policy for authenticated users to read all provisioning data
    - Add policy for authenticated users to insert provisioning data
    - Add policy for authenticated users to update provisioning data

  3. Indexes
    - Index on user_email for fast lookups
*/

CREATE TABLE IF NOT EXISTS user_provisioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  user_name text NOT NULL,
  apx_next jsonb NOT NULL DEFAULT '{
    "createNextUser": false,
    "provisionP1UserRoles": false,
    "provisionP1ConcurrentLogins": false,
    "p1ProvisionUnitId": false,
    "p1UnitPreassignment": false,
    "placeUnitOnDutyPsap": false,
    "awareAddDevice": false,
    "p1AddDevice": false,
    "awareDataSharing": false
  }'::jsonb,
  apx_n70 jsonb NOT NULL DEFAULT '{
    "createNextUser": false,
    "provisionP1UserRoles": false,
    "provisionP1ConcurrentLogins": false,
    "p1ProvisionUnitId": false,
    "p1UnitPreassignment": false,
    "placeUnitOnDutyPsap": false,
    "awareAddDevice": false,
    "p1AddDevice": false,
    "awareDataSharing": false
  }'::jsonb,
  phone_apps jsonb NOT NULL DEFAULT '{
    "responderCoreIdPhone": false,
    "responderCoreIdPd": false,
    "rapidDeployMapping": false,
    "rapidDeployLightning": false
  }'::jsonb,
  svx_v700 jsonb NOT NULL DEFAULT '{
    "setupInDeviceManagement": false,
    "checkedOutToUser": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_provisioning_email ON user_provisioning(user_email);

ALTER TABLE user_provisioning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read provisioning data"
  ON user_provisioning
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert provisioning data"
  ON user_provisioning
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update provisioning data"
  ON user_provisioning
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
