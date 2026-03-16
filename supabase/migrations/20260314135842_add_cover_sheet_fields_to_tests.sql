/*
  # Add cover sheet fields to tests table

  Adds fields needed for the "Voorblad Informatie" section in the test detail modal:
  - lesson_hour: the lesson hour (e.g. "3e uur")
  - student_count: number of students (pre-filled from class)
  - allowed_tools: allowed tools/aids (e.g. "Rekenmachine, Woordenboek")
  - pre_remarks: pre-test remarks (e.g. "Geen telefoons op tafel")
  - submit_to: name of teacher to submit to
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'lesson_hour') THEN
    ALTER TABLE tests ADD COLUMN lesson_hour text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'student_count') THEN
    ALTER TABLE tests ADD COLUMN student_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'allowed_tools') THEN
    ALTER TABLE tests ADD COLUMN allowed_tools text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'pre_remarks') THEN
    ALTER TABLE tests ADD COLUMN pre_remarks text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'submit_to') THEN
    ALTER TABLE tests ADD COLUMN submit_to text DEFAULT '';
  END IF;
END $$;
