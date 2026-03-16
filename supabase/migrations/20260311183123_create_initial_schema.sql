/*
  # Create Toetsen (Test Management) Database Schema

  ## Overview
  This migration creates the complete database schema for a Dutch secondary school test management application.
  Teachers can manage classes, tests, students, and grading workflows.

  ## New Tables

  ### `classes`
  - `id` (uuid, primary key) - Unique identifier for each class
  - `user_id` (uuid, foreign key) - References auth.users - teacher who owns this class
  - `name` (text) - Class name (e.g., "4 VWO A")
  - `subject` (text) - Subject area (e.g., "Biologie", "Frans")
  - `school_year` (text) - Academic year (e.g., "2023-2024")
  - `is_archived` (boolean) - Whether class is archived
  - `created_at` (timestamptz) - When class was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### `students`
  - `id` (uuid, primary key) - Unique identifier for each student
  - `class_id` (uuid, foreign key) - References classes table
  - `user_id` (uuid) - References auth.users - teacher who owns this student
  - `name` (text) - Student full name
  - `student_number` (text, optional) - Student identifier number
  - `created_at` (timestamptz) - When student was added

  ### `tests`
  - `id` (uuid, primary key) - Unique identifier for each test
  - `user_id` (uuid, foreign key) - References auth.users - teacher who created test
  - `class_id` (uuid, foreign key) - References classes table
  - `title` (text) - Test title (e.g., "Proefwerk Hoofdstuk 5")
  - `subject` (text) - Subject for the test
  - `scheduled_date` (timestamptz) - When test is scheduled
  - `description` (text, optional) - Additional details about the test
  - `status` (text) - Current status: 'gepland', 'klaar_voor_nakijken', 'nagekeken', 'afgerond'
  - `is_deleted` (boolean) - Soft delete flag (trash)
  - `created_at` (timestamptz) - When test was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### `grades`
  - `id` (uuid, primary key) - Unique identifier for each grade entry
  - `test_id` (uuid, foreign key) - References tests table
  - `student_id` (uuid, foreign key) - References students table
  - `user_id` (uuid) - References auth.users - teacher
  - `grade` (numeric, optional) - The actual grade/score
  - `is_graded` (boolean) - Whether this student has been graded
  - `notes` (text, optional) - Additional notes about the grade
  - `created_at` (timestamptz) - When grade entry was created
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Ensure users can only access their own classes, tests, students, and grades
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  school_year text NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  student_number text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  description text,
  status text DEFAULT 'gepland' NOT NULL,
  is_deleted boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('gepland', 'klaar_voor_nakijken', 'nagekeken', 'afgerond'))
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  grade numeric,
  is_graded boolean DEFAULT false NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(test_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes table
CREATE POLICY "Users can view own classes"
  ON classes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own classes"
  ON classes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for students table
CREATE POLICY "Users can view own students"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own students"
  ON students FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tests table
CREATE POLICY "Users can view own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests"
  ON tests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for grades table
CREATE POLICY "Users can view own grades"
  ON grades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own grades"
  ON grades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grades"
  ON grades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grades"
  ON grades FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_archived ON classes(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_class_id ON tests(class_id);
CREATE INDEX IF NOT EXISTS idx_tests_scheduled_date ON tests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tests_deleted ON tests(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_grades_test_id ON grades(test_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();