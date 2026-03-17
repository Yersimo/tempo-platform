-- 0006: Seed data for Academy module (Ecobank demo org)
-- This creates a demo academy matching the existing UI's hardcoded data

-- NOTE: This seed runs only for the Ecobank demo org.
-- Replace the org_id, employee_id, and course_ids with your actual UUIDs.
-- The script uses subqueries to resolve IDs dynamically.

DO $$
DECLARE
  v_org_id uuid;
  v_creator_id uuid;
  v_academy_id uuid;
  v_cohort_1_id uuid;
  v_cohort_2_id uuid;
  v_course_1_id uuid;
  v_course_2_id uuid;
  v_course_3_id uuid;
  v_course_4_id uuid;
  v_course_5_id uuid;
  v_course_6_id uuid;
  v_ac_1_id uuid;
  v_ac_2_id uuid;
  v_ac_3_id uuid;
  v_ac_4_id uuid;
  v_ac_5_id uuid;
  v_ac_6_id uuid;
  v_part_1_id uuid;
  v_part_2_id uuid;
  v_part_3_id uuid;
  v_part_4_id uuid;
  v_part_5_id uuid;
  v_session_1_id uuid;
  v_session_2_id uuid;
  v_session_3_id uuid;
  v_assignment_1_id uuid;
  v_assignment_2_id uuid;
BEGIN
  -- Find Ecobank org
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'ecobank' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Ecobank org not found, skipping academy seed';
    RETURN;
  END IF;

  -- Find creator (Amara Kone, admin)
  SELECT id INTO v_creator_id FROM employees WHERE org_id = v_org_id AND email = 'amara.kone@ecobank.com' LIMIT 1;

  -- ==========================================================
  -- ACADEMY
  -- ==========================================================
  INSERT INTO academies (id, org_id, name, description, slug, brand_color, welcome_message, enrollment_type, status, community_enabled, languages, completion_rules, created_by)
  VALUES (
    gen_random_uuid(), v_org_id,
    'Ecobank SME Academy 2026',
    'A 12-week intensive programme to help SME owners across West Africa build bankable businesses, improve financial literacy, and access Ecobank growth financing.',
    'ecobank-sme-2026',
    '#2563eb',
    'Welcome to the Ecobank SME Academy! Over the next 12 weeks, you will gain practical skills in financial management, business planning, and growth strategies tailored for West African markets.',
    'private',
    'active',
    true,
    '["en", "fr"]',
    '{"min_courses": 5, "require_assessment": true, "require_certificate": true}',
    v_creator_id
  ) RETURNING id INTO v_academy_id;

  -- ==========================================================
  -- COHORTS
  -- ==========================================================
  INSERT INTO academy_cohorts (id, org_id, academy_id, name, start_date, end_date, facilitator_name, facilitator_email, max_participants, status)
  VALUES (gen_random_uuid(), v_org_id, v_academy_id, 'Cohort Alpha — Lagos', '2026-03-01', '2026-05-31', 'Dr. Ngozi Adeyemi', 'ngozi.adeyemi@ecobank.com', 30, 'active')
  RETURNING id INTO v_cohort_1_id;

  INSERT INTO academy_cohorts (id, org_id, academy_id, name, start_date, end_date, facilitator_name, facilitator_email, max_participants, status)
  VALUES (gen_random_uuid(), v_org_id, v_academy_id, 'Cohort Beta — Accra', '2026-04-15', '2026-07-15', 'Kwame Mensah', 'kwame.mensah@ecobank.com', 25, 'upcoming')
  RETURNING id INTO v_cohort_2_id;

  -- ==========================================================
  -- COURSES (create 6 academy courses linked to existing LMS)
  -- First find or create courses
  -- ==========================================================

  -- Create 6 courses for the academy curriculum
  INSERT INTO courses (id, org_id, title, description, category, duration_hours, format, level, is_mandatory)
  VALUES
    (gen_random_uuid(), v_org_id, 'Financial Foundations for SMEs', 'Understanding cash flow, profit margins, and financial statements for small business owners.', 'Finance', 8, 'blended', 'beginner', true),
    (gen_random_uuid(), v_org_id, 'Business Model Canvas Workshop', 'Design and validate your business model using the Business Model Canvas framework.', 'Strategy', 6, 'online', 'intermediate', true),
    (gen_random_uuid(), v_org_id, 'Digital Marketing for African Markets', 'Leverage social media, mobile marketing, and e-commerce for growth across West Africa.', 'Marketing', 10, 'online', 'beginner', true),
    (gen_random_uuid(), v_org_id, 'Access to Finance & Credit Management', 'Navigate bank lending, microfinance, and alternative financing options for SMEs.', 'Finance', 8, 'blended', 'intermediate', true),
    (gen_random_uuid(), v_org_id, 'Supply Chain & Operations Excellence', 'Optimize your supply chain, inventory management, and operational efficiency.', 'Operations', 6, 'classroom', 'intermediate', false),
    (gen_random_uuid(), v_org_id, 'Leadership & People Management', 'Build high-performing teams and develop essential leadership skills for growing businesses.', 'Leadership', 8, 'blended', 'advanced', true)
  ;

  -- Get the course IDs we just created
  SELECT id INTO v_course_1_id FROM courses WHERE org_id = v_org_id AND title = 'Financial Foundations for SMEs' LIMIT 1;
  SELECT id INTO v_course_2_id FROM courses WHERE org_id = v_org_id AND title = 'Business Model Canvas Workshop' LIMIT 1;
  SELECT id INTO v_course_3_id FROM courses WHERE org_id = v_org_id AND title = 'Digital Marketing for African Markets' LIMIT 1;
  SELECT id INTO v_course_4_id FROM courses WHERE org_id = v_org_id AND title = 'Access to Finance & Credit Management' LIMIT 1;
  SELECT id INTO v_course_5_id FROM courses WHERE org_id = v_org_id AND title = 'Supply Chain & Operations Excellence' LIMIT 1;
  SELECT id INTO v_course_6_id FROM courses WHERE org_id = v_org_id AND title = 'Leadership & People Management' LIMIT 1;

  -- Link courses to academy
  INSERT INTO academy_courses (id, org_id, academy_id, course_id, module_number, is_required)
  VALUES
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_1_id, 1, true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_2_id, 2, true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_3_id, 3, true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_4_id, 4, true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_5_id, 5, false),
    (gen_random_uuid(), v_org_id, v_academy_id, v_course_6_id, 6, true)
  ;

  SELECT id INTO v_ac_1_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 1 LIMIT 1;
  SELECT id INTO v_ac_2_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 2 LIMIT 1;
  SELECT id INTO v_ac_3_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 3 LIMIT 1;
  SELECT id INTO v_ac_4_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 4 LIMIT 1;
  SELECT id INTO v_ac_5_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 5 LIMIT 1;
  SELECT id INTO v_ac_6_id FROM academy_courses WHERE academy_id = v_academy_id AND module_number = 6 LIMIT 1;

  -- ==========================================================
  -- PARTICIPANTS
  -- ==========================================================

  -- Password hash is a placeholder for demo data.
  -- In production, passwords are hashed via PBKDF2-SHA512 with salt at /api/academy/auth (verify-invite action).
  INSERT INTO academy_participants (id, org_id, academy_id, cohort_id, full_name, email, business_name, country, language, password_hash, status, progress, enrolled_date, last_active_at, email_verified)
  VALUES
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Amara Okonkwo', 'amara.okonkwo@gmail.com', 'Okonkwo Textiles Ltd', 'Nigeria', 'en', 'a6b8e32c1f9d4e5a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', 'active', 68, '2026-02-15', NOW() - INTERVAL '2 hours', true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Fatou Diallo', 'fatou.diallo@yahoo.fr', 'Diallo Agritech', 'Senegal', 'fr', 'a6b8e32c1f9d4e5a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', 'active', 45, '2026-02-15', NOW() - INTERVAL '5 hours', true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Kofi Asante', 'kofi.asante@outlook.com', 'Asante Electronics', 'Ghana', 'en', 'a6b8e32c1f9d4e5a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', 'active', 82, '2026-02-15', NOW() - INTERVAL '1 hour', true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Chidinma Eze', 'chidinma.eze@gmail.com', 'Eze Fashion House', 'Nigeria', 'en', 'a6b8e32c1f9d4e5a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4', 'active', 30, '2026-02-20', NOW() - INTERVAL '3 days', true),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_2_id, 'Moussa Traore', 'moussa.traore@gmail.com', 'Traore Construction', 'Mali', 'fr', NULL, 'inactive', 0, '2026-03-01', NULL, false)
  ;

  SELECT id INTO v_part_1_id FROM academy_participants WHERE academy_id = v_academy_id AND email = 'amara.okonkwo@gmail.com' LIMIT 1;
  SELECT id INTO v_part_2_id FROM academy_participants WHERE academy_id = v_academy_id AND email = 'fatou.diallo@yahoo.fr' LIMIT 1;
  SELECT id INTO v_part_3_id FROM academy_participants WHERE academy_id = v_academy_id AND email = 'kofi.asante@outlook.com' LIMIT 1;
  SELECT id INTO v_part_4_id FROM academy_participants WHERE academy_id = v_academy_id AND email = 'chidinma.eze@gmail.com' LIMIT 1;
  SELECT id INTO v_part_5_id FROM academy_participants WHERE academy_id = v_academy_id AND email = 'moussa.traore@gmail.com' LIMIT 1;

  -- ==========================================================
  -- PARTICIPANT PROGRESS
  -- ==========================================================

  -- Amara: completed modules 1-3, in progress on 4
  INSERT INTO academy_participant_progress (org_id, participant_id, academy_course_id, status, progress, score, time_spent_minutes, started_at, completed_at)
  VALUES
    (v_org_id, v_part_1_id, v_ac_1_id, 'completed', 100, 92, 480, NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '4 weeks'),
    (v_org_id, v_part_1_id, v_ac_2_id, 'completed', 100, 88, 360, NOW() - INTERVAL '4 weeks', NOW() - INTERVAL '2 weeks'),
    (v_org_id, v_part_1_id, v_ac_3_id, 'completed', 100, 95, 600, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '3 days'),
    (v_org_id, v_part_1_id, v_ac_4_id, 'in_progress', 45, NULL, 180, NOW() - INTERVAL '3 days', NULL);

  -- Kofi: completed modules 1-4, in progress on 5
  INSERT INTO academy_participant_progress (org_id, participant_id, academy_course_id, status, progress, score, time_spent_minutes, started_at, completed_at)
  VALUES
    (v_org_id, v_part_3_id, v_ac_1_id, 'completed', 100, 96, 420, NOW() - INTERVAL '7 weeks', NOW() - INTERVAL '5 weeks'),
    (v_org_id, v_part_3_id, v_ac_2_id, 'completed', 100, 91, 340, NOW() - INTERVAL '5 weeks', NOW() - INTERVAL '3 weeks'),
    (v_org_id, v_part_3_id, v_ac_3_id, 'completed', 100, 89, 550, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '10 days'),
    (v_org_id, v_part_3_id, v_ac_4_id, 'completed', 100, 94, 470, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
    (v_org_id, v_part_3_id, v_ac_5_id, 'in_progress', 30, NULL, 120, NOW() - INTERVAL '3 days', NULL);

  -- Fatou: completed module 1-2, in progress on 3
  INSERT INTO academy_participant_progress (org_id, participant_id, academy_course_id, status, progress, score, time_spent_minutes, started_at, completed_at)
  VALUES
    (v_org_id, v_part_2_id, v_ac_1_id, 'completed', 100, 85, 510, NOW() - INTERVAL '5 weeks', NOW() - INTERVAL '3 weeks'),
    (v_org_id, v_part_2_id, v_ac_2_id, 'completed', 100, 78, 400, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '8 days'),
    (v_org_id, v_part_2_id, v_ac_3_id, 'in_progress', 35, NULL, 210, NOW() - INTERVAL '8 days', NULL);

  -- ==========================================================
  -- SESSIONS
  -- ==========================================================

  INSERT INTO academy_sessions (id, org_id, academy_id, cohort_id, title, description, type, scheduled_date, scheduled_time, duration_minutes, instructor, meeting_url)
  VALUES
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Cash Flow Masterclass — Live Q&A', 'Interactive session on managing cash flow for growing businesses.', 'webinar', '2026-03-20', '10:00 AM WAT', 90, 'Dr. Ngozi Adeyemi', 'https://meet.ecobank.com/sme-cashflow'),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'Business Plan Workshop', 'Hands-on workshop to build your investor-ready business plan.', 'workshop', '2026-03-25', '2:00 PM WAT', 120, 'Kwame Mensah', 'https://meet.ecobank.com/sme-bizplan'),
    (gen_random_uuid(), v_org_id, v_academy_id, v_cohort_1_id, 'One-on-One Mentoring: Amara Okonkwo', 'Personal mentoring session with assigned business advisor.', 'mentoring', '2026-03-22', '11:00 AM WAT', 45, 'Dr. Ngozi Adeyemi', 'https://meet.ecobank.com/mentoring-amara')
  ;

  SELECT id INTO v_session_1_id FROM academy_sessions WHERE academy_id = v_academy_id AND title LIKE 'Cash Flow%' LIMIT 1;
  SELECT id INTO v_session_2_id FROM academy_sessions WHERE academy_id = v_academy_id AND title LIKE 'Business Plan%' LIMIT 1;
  SELECT id INTO v_session_3_id FROM academy_sessions WHERE academy_id = v_academy_id AND title LIKE 'One-on-One%' LIMIT 1;

  -- RSVPs
  INSERT INTO academy_session_rsvps (org_id, session_id, participant_id, attended)
  VALUES
    (v_org_id, v_session_1_id, v_part_1_id, false),
    (v_org_id, v_session_1_id, v_part_2_id, false),
    (v_org_id, v_session_1_id, v_part_3_id, false),
    (v_org_id, v_session_2_id, v_part_1_id, false),
    (v_org_id, v_session_2_id, v_part_3_id, false),
    (v_org_id, v_session_3_id, v_part_1_id, false);

  -- ==========================================================
  -- ASSIGNMENTS
  -- ==========================================================

  INSERT INTO academy_assignments (id, org_id, academy_id, academy_course_id, title, description, due_date, max_score)
  VALUES
    (gen_random_uuid(), v_org_id, v_academy_id, v_ac_1_id, 'Cash Flow Analysis Worksheet', 'Analyse your business cash flow for the past 3 months using the provided template.', '2026-03-28', 100),
    (gen_random_uuid(), v_org_id, v_academy_id, v_ac_2_id, 'Business Model Canvas Submission', 'Complete your Business Model Canvas and submit a 500-word justification.', '2026-04-05', 100)
  ;

  SELECT id INTO v_assignment_1_id FROM academy_assignments WHERE academy_id = v_academy_id AND title LIKE 'Cash Flow%' LIMIT 1;
  SELECT id INTO v_assignment_2_id FROM academy_assignments WHERE academy_id = v_academy_id AND title LIKE 'Business Model%' LIMIT 1;

  -- Submissions
  INSERT INTO academy_assignment_submissions (org_id, assignment_id, participant_id, status, score, feedback, submitted_at, graded_at, graded_by)
  VALUES
    (v_org_id, v_assignment_1_id, v_part_1_id, 'graded', 88, 'Excellent analysis! Consider adding a quarterly projection.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', v_creator_id),
    (v_org_id, v_assignment_1_id, v_part_3_id, 'graded', 92, 'Outstanding work. Very thorough breakdown of seasonal variations.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', v_creator_id),
    (v_org_id, v_assignment_1_id, v_part_2_id, 'submitted', NULL, NULL, NOW() - INTERVAL '1 day', NULL, NULL);

  -- ==========================================================
  -- DISCUSSIONS
  -- ==========================================================

  INSERT INTO academy_discussions (org_id, academy_id, participant_id, content, module_tag, is_pinned, is_facilitator, facilitator_name, reply_count)
  VALUES
    (v_org_id, v_academy_id, NULL, 'Welcome everyone to the SME Academy community! Use this space to share insights, ask questions, and connect with fellow entrepreneurs. Remember: there are no silly questions!', NULL, true, true, 'Dr. Ngozi Adeyemi', 2),
    (v_org_id, v_academy_id, v_part_1_id, 'Just completed Module 3 on Digital Marketing — the mobile-first strategies section was incredibly relevant for the Nigerian market. Has anyone tried the WhatsApp Business API integration they mentioned?', 'Digital Marketing', false, false, NULL, 3),
    (v_org_id, v_academy_id, v_part_3_id, 'Looking for study partners for the Access to Finance module. Anyone in Accra available for a weekly meetup?', 'Access to Finance', false, false, NULL, 1),
    (v_org_id, v_academy_id, v_part_2_id, 'The cash flow template from Module 1 saved my business last week — I finally understood why we kept running short at month-end. Merci to the facilitators!', 'Financial Foundations', false, false, NULL, 4);

  -- ==========================================================
  -- RESOURCES
  -- ==========================================================

  INSERT INTO academy_resources (org_id, academy_id, academy_course_id, title, description, type, url)
  VALUES
    (v_org_id, v_academy_id, v_ac_1_id, 'Cash Flow Analysis Template', 'Excel template for tracking monthly cash flow with automated projections.', 'pdf', 'https://assets.ecobank.com/sme-academy/cashflow-template.xlsx'),
    (v_org_id, v_academy_id, v_ac_2_id, 'Business Model Canvas Template', 'Printable Business Model Canvas with instructions and examples.', 'pdf', 'https://assets.ecobank.com/sme-academy/bmc-template.pdf'),
    (v_org_id, v_academy_id, v_ac_3_id, 'Digital Marketing Toolkit', 'Comprehensive guide to social media marketing for West African businesses.', 'pdf', 'https://assets.ecobank.com/sme-academy/digital-marketing-toolkit.pdf'),
    (v_org_id, v_academy_id, NULL, 'Ecobank SME Financing Guide', 'Overview of all Ecobank SME loan products, requirements, and application process.', 'pdf', 'https://assets.ecobank.com/sme-academy/financing-guide.pdf'),
    (v_org_id, v_academy_id, NULL, 'West African Market Research Report 2026', 'Industry analysis and market size data across 15 West African countries.', 'link', 'https://research.ecobank.com/wa-sme-2026');

  -- ==========================================================
  -- CERTIFICATES
  -- ==========================================================

  INSERT INTO academy_certificates (org_id, academy_id, participant_id, name, certificate_number, status, requirements)
  VALUES
    (v_org_id, v_academy_id, v_part_1_id, 'SME Academy Certificate of Completion', 'ACAD-SME-2026-001', 'in_progress',
     '[{"label":"Complete 5 of 6 modules","met":false},{"label":"Pass all module assessments (≥70%)","met":true},{"label":"Submit final business plan","met":false},{"label":"Attend ≥80% of live sessions","met":true}]'),
    (v_org_id, v_academy_id, v_part_3_id, 'SME Academy Certificate of Completion', 'ACAD-SME-2026-002', 'in_progress',
     '[{"label":"Complete 5 of 6 modules","met":true},{"label":"Pass all module assessments (≥70%)","met":true},{"label":"Submit final business plan","met":false},{"label":"Attend ≥80% of live sessions","met":true}]'),
    (v_org_id, v_academy_id, v_part_1_id, 'Financial Foundations Specialist', 'ACAD-FF-2026-001', 'earned',
     '[{"label":"Complete Financial Foundations module","met":true},{"label":"Score ≥85% on assessment","met":true}]');

  -- Mark the earned certificate
  UPDATE academy_certificates SET issued_at = NOW() - INTERVAL '2 weeks'
  WHERE certificate_number = 'ACAD-FF-2026-001';

  -- ==========================================================
  -- COMMUNICATIONS
  -- ==========================================================

  INSERT INTO academy_communications (org_id, academy_id, type, trigger_name, subject, body, recipient_count, status, sent_at)
  VALUES
    (v_org_id, v_academy_id, 'automated', 'Enrollment Confirmation', 'Welcome to the Ecobank SME Academy!', 'Dear {{name}}, congratulations on being selected for the Ecobank SME Academy 2026...', 5, 'sent', NOW() - INTERVAL '4 weeks'),
    (v_org_id, v_academy_id, 'broadcast', NULL, 'Week 6 Update: Midpoint Check-in', 'Congratulations on reaching the halfway point! Here is a summary of your progress...', 4, 'sent', NOW() - INTERVAL '1 week'),
    (v_org_id, v_academy_id, 'automated', 'Session Reminder (24h before)', 'Reminder: Cash Flow Masterclass Tomorrow', 'This is a reminder that the Cash Flow Masterclass will take place tomorrow at 10:00 AM WAT...', 3, 'sent', NOW() - INTERVAL '1 day');

  -- Communication triggers
  INSERT INTO academy_comm_triggers (org_id, academy_id, name, trigger_event, subject_template, body_template, is_active)
  VALUES
    (v_org_id, v_academy_id, 'Enrollment Confirmation', 'enrollment', 'Welcome to {{academy_name}}!', 'Dear {{participant_name}}, congratulations on joining {{academy_name}}. Your learning journey begins on {{cohort_start_date}}.', true),
    (v_org_id, v_academy_id, 'Session Reminder (24h before)', 'session_reminder_24h', 'Reminder: {{session_title}} Tomorrow', 'This is a reminder that {{session_title}} will take place tomorrow at {{session_time}}. Meeting link: {{meeting_url}}', true),
    (v_org_id, v_academy_id, 'Session Reminder (1h before)', 'session_reminder_1h', '{{session_title}} starts in 1 hour', 'Your session {{session_title}} begins in 1 hour. Join here: {{meeting_url}}', true),
    (v_org_id, v_academy_id, 'Assignment Due (48h before)', 'assignment_due_48h', 'Assignment Due Soon: {{assignment_title}}', 'Reminder: {{assignment_title}} is due on {{due_date}}. Please submit your work before the deadline.', true),
    (v_org_id, v_academy_id, 'Certificate Issued', 'certificate_issued', 'Congratulations! You earned: {{certificate_name}}', 'Dear {{participant_name}}, congratulations on earning your {{certificate_name}}! Download your certificate here: {{certificate_url}}', true),
    (v_org_id, v_academy_id, 'Cohort Start (24h before)', 'cohort_start_24h', 'Your Academy Journey Begins Tomorrow!', 'Dear {{participant_name}}, your cohort {{cohort_name}} starts tomorrow. We are excited to have you!', true);

  RAISE NOTICE 'Academy seed data created successfully for org %', v_org_id;
END $$;
