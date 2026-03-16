/*
  # Add is_archived column to tests table

  1. Changes
    - Add is_archived boolean column to tests table (default false)
    - This allows tests to be archived separately from being deleted

  2. Notes
    - Archived tests can be moved to archive view
    - Different from soft delete (is_deleted)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE tests ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;