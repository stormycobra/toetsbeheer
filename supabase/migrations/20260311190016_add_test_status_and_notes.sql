/*
  # Add Test Status Tracking and Notes

  1. Changes
    - Add boolean columns to tests table for status tracking:
      - is_made (Gemaakt)
      - is_submitted (Ingeleverd)
      - is_collected (Opgehaald)
      - is_reviewed (Nagekeken)
      - is_discussed (Besproken)
      - grades_adjusted (Cijfers Aangepast)
      - accommodations_submitted (Faciliteiten Ingeleverd)
      - accommodations_collected (Faciliteiten Opgehaald)
    - Add notes text field
    - Create audit_logs table for tracking changes

  2. Security
    - Enable RLS on audit_logs table
    - Add policies for authenticated users to read their own audit logs
*/

-- Add status tracking columns to tests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_made'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_made boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_submitted'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_submitted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_collected'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_collected boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_reviewed'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_reviewed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_discussed'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_discussed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'grades_adjusted'
  ) THEN
    ALTER TABLE tests ADD COLUMN grades_adjusted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'accommodations_submitted'
  ) THEN
    ALTER TABLE tests ADD COLUMN accommodations_submitted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'accommodations_collected'
  ) THEN
    ALTER TABLE tests ADD COLUMN accommodations_collected boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'notes'
  ) THEN
    ALTER TABLE tests ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS audit_logs_test_id_idx ON audit_logs(test_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);