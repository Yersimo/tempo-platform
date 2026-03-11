-- Fix 1: Add acknowledged_at column to reviews table for review acknowledgment workflow
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;

-- Fix 2: Add course_id column to quiz_questions for direct course-level quizzes
-- and make course_content_id nullable (not all quizzes are tied to specific content modules)
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE quiz_questions ALTER COLUMN course_content_id DROP NOT NULL;
