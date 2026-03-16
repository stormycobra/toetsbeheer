import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          subject: string;
          school_year: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          subject: string;
          school_year: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          subject?: string;
          school_year?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          user_id: string;
          name: string;
          student_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          user_id: string;
          name: string;
          student_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          user_id?: string;
          name?: string;
          student_number?: string | null;
          created_at?: string;
        };
      };
      tests: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          title: string;
          subject: string;
          scheduled_date: string;
          description: string | null;
          status: 'gepland' | 'klaar_voor_nakijken' | 'nagekeken' | 'afgerond';
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          title: string;
          subject: string;
          scheduled_date: string;
          description?: string | null;
          status?: 'gepland' | 'klaar_voor_nakijken' | 'nagekeken' | 'afgerond';
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          title?: string;
          subject?: string;
          scheduled_date?: string;
          description?: string | null;
          status?: 'gepland' | 'klaar_voor_nakijken' | 'nagekeken' | 'afgerond';
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          test_id: string;
          student_id: string;
          user_id: string;
          grade: number | null;
          is_graded: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          user_id: string;
          grade?: number | null;
          is_graded?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          student_id?: string;
          user_id?: string;
          grade?: number | null;
          is_graded?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
