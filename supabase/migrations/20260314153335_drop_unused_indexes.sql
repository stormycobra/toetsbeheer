/*
  # Drop Unused Indexes

  Removes two indexes that have never been used according to Supabase advisor:
  - idx_audit_logs_user_id on public.audit_logs
  - idx_grades_user_id on public.grades

  These indexes were flagged as unused and dropping them reduces write overhead
  without impacting query performance (since no queries use them).
*/

DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_grades_user_id;
