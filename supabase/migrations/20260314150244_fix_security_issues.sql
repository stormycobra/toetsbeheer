/*
  # Fix Security Issues

  1. Add indexes for unindexed foreign keys
     - `audit_logs.user_id`
     - `grades.user_id`

  2. Fix RLS policies to use `(select auth.uid())` instead of `auth.uid()`
     - classes: view, create, update, delete
     - students: view, create, update, delete
     - tests: view, create, update, delete
     - grades: view, create, update, delete
     - audit_logs: view, create

  3. Fix function search_path for update_updated_at_column

  4. Remove unused indexes
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON public.grades(user_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_tests_user_id;
DROP INDEX IF EXISTS audit_logs_created_at_idx;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix RLS policies for classes table
DROP POLICY IF EXISTS "Users can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can create own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can delete own classes" ON public.classes;

CREATE POLICY "Users can view own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own classes"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own classes"
  ON public.classes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix RLS policies for students table
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can create own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

CREATE POLICY "Users can view own students"
  ON public.students FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own students"
  ON public.students FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix RLS policies for tests table
DROP POLICY IF EXISTS "Users can view own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can create own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.tests;

CREATE POLICY "Users can view own tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own tests"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own tests"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tests"
  ON public.tests FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix RLS policies for grades table
DROP POLICY IF EXISTS "Users can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can create own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can update own grades" ON public.grades;
DROP POLICY IF EXISTS "Users can delete own grades" ON public.grades;

CREATE POLICY "Users can view own grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own grades"
  ON public.grades FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own grades"
  ON public.grades FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own grades"
  ON public.grades FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix RLS policies for audit_logs table
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create own audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
