export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'teacher' | 'student'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          course_id: string
          teacher_id: string
          due_date: string
          max_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          course_id: string
          teacher_id: string
          due_date: string
          max_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          course_id?: string
          teacher_id?: string
          due_date?: string
          max_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          content: string
          file_url: string | null
          status: 'draft' | 'submitted' | 'graded'
          score: number | null
          feedback: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          content?: string
          file_url?: string | null
          status?: 'draft' | 'submitted' | 'graded'
          score?: number | null
          feedback?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          content?: string
          file_url?: string | null
          status?: 'draft' | 'submitted' | 'graded'
          score?: number | null
          feedback?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plagiarism_reports: {
        Row: {
          id: string
          submission_id: string
          compared_submission_id: string
          similarity_score: number
          matched_content: Json
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          compared_submission_id: string
          similarity_score: number
          matched_content?: Json
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          compared_submission_id?: string
          similarity_score?: number
          matched_content?: Json
          created_at?: string
        }
      }
    }
  }
}
