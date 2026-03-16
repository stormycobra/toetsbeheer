/*
  # Add Supervisor and Location to Tests

  1. Changes
    - Add `supervisor` column to `tests` table to store the name of the supervisor/surveillant
    - Add `location` column to `tests` table to store the room/location where the test takes place
  
  2. Details
    - Both fields are optional (can be NULL)
    - Text data type for flexibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'supervisor'
  ) THEN
    ALTER TABLE tests ADD COLUMN supervisor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests' AND column_name = 'location'
  ) THEN
    ALTER TABLE tests ADD COLUMN location text;
  END IF;
END $$;
