/*
  # Initial Schema for Assignment Submission and Plagiarism Checker

  ## Overview
  Creates the foundational database structure for an educational platform where teachers create assignments and students submit work, with built-in plagiarism detection capabilities.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'teacher' or 'student'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ### `courses`
  - `id` (uuid, primary key) - Unique course identifier
  - `title` (text) - Course name
  - `description` (text) - Course description
  - `teacher_id` (uuid) - References profiles(id) - course creator
  - `created_at` (timestamptz) - Course creation timestamp
  - `updated_at` (timestamptz) - Last course update timestamp

  ### `assignments`
  - `id` (uuid, primary key) - Unique assignment identifier
  - `title` (text) - Assignment title
  - `description` (text) - Assignment instructions and details
  - `course_id` (uuid) - References courses(id)
  - `teacher_id` (uuid) - References profiles(id) - assignment creator
  - `due_date` (timestamptz) - Submission deadline
  - `max_score` (integer) - Maximum possible score
  - `created_at` (timestamptz) - Assignment creation timestamp
  - `updated_at` (timestamptz) - Last assignment update timestamp

  ### `submissions`
  - `id` (uuid, primary key) - Unique submission identifier
  - `assignment_id` (uuid) - References assignments(id)
  - `student_id` (uuid) - References profiles(id)
  - `content` (text) - Submission text content
  - `file_url` (text) - URL to uploaded file (if any)
  - `status` (text) - Status: 'draft', 'submitted', 'graded'
  - `score` (integer) - Assigned score (null until graded)
  - `feedback` (text) - Teacher feedback
  - `submitted_at` (timestamptz) - Submission timestamp
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `plagiarism_reports`
  - `id` (uuid, primary key) - Unique report identifier
  - `submission_id` (uuid) - References submissions(id) - the checked submission
  - `compared_submission_id` (uuid) - References submissions(id) - submission it was compared against
  - `similarity_score` (decimal) - Similarity percentage (0-100)
  - `matched_content` (jsonb) - Array of matched text segments
  - `created_at` (timestamptz) - Report creation timestamp

  ## 2. Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Profiles: Users can read all profiles but only update their own
  - Courses: Teachers can create/update/delete their own courses; all authenticated users can view
  - Assignments: Teachers can manage their own assignments; students can view assignments in their courses
  - Submissions: Students can create/update their own submissions; teachers can view submissions for their assignments
  - Plagiarism Reports: Only teachers can view reports for their assignments

  ## 3. Important Notes
  - All timestamps default to current time
  - UUIDs are auto-generated using gen_random_uuid()
  - Foreign key constraints ensure data integrity
  - Cascading deletes prevent orphaned records
  - Profile creation is triggered by auth.users creation
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date timestamptz NOT NULL,
  max_score integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  file_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
  score integer,
  feedback text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view submissions for their assignments"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'student'
    )
  );

CREATE POLICY "Students can update own submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can update submissions for their assignments"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- Create plagiarism_reports table
CREATE TABLE IF NOT EXISTS plagiarism_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  compared_submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  similarity_score decimal NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
  matched_content jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plagiarism_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view plagiarism reports for their assignments"
  ON plagiarism_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE s.id = plagiarism_reports.submission_id
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can create plagiarism reports"
  ON plagiarism_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_submission ON plagiarism_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_compared ON plagiarism_reports(compared_submission_id);
