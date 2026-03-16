/*
  # Add test_made_on field to tests table

  Adds a free-text field for "De toets wordt gemaakt op" on the cover sheet.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'test_made_on') THEN
    ALTER TABLE tests ADD COLUMN test_made_on text DEFAULT '';
  END IF;
END $$;
