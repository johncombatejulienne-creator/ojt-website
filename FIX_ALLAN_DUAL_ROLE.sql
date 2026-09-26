-- ═══════════════════════════════════════════════════════
-- Fix Allan's dual-role: allanumaasa@gmail.com
-- This person is a Teacher but also has a Student record.
-- Delete the Student record so they only appear as Teacher.
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════

DO $$
DECLARE
  v_student_id TEXT;
BEGIN
  SELECT id INTO v_student_id FROM "Student" WHERE email = 'allanumaasa@gmail.com';

  IF v_student_id IS NOT NULL THEN
    -- Clean up all student-related data
    DELETE FROM "StudentChecklistProgress" WHERE "studentId" = v_student_id;
    DELETE FROM "Notification" WHERE "userId" = v_student_id AND "userType" = 'student';
    -- Delete photos + metadata from narratives
    DELETE FROM "PhotoMetadata" pm
      USING "Photo" ph JOIN "Narrative" n ON ph."narrativeId" = n.id
      WHERE pm."photoId" = ph.id AND n."studentId" = v_student_id;
    DELETE FROM "Photo" ph
      USING "Narrative" n ON ph."narrativeId" = n.id
      WHERE n."studentId" = v_student_id;
    DELETE FROM "NarrativeReview" nr
      USING "Narrative" n ON nr."narrativeId" = n.id
      WHERE n."studentId" = v_student_id;
    DELETE FROM "Narrative" WHERE "studentId" = v_student_id;
    DELETE FROM "Student" WHERE id = v_student_id;
    RAISE NOTICE 'Deleted student record for allanumaasa@gmail.com — now Teacher only.';
  ELSE
    RAISE NOTICE 'No student record found for allanumaasa@gmail.com.';
  END IF;
END $$;

-- Verify result
SELECT 'Students' as type, email FROM "Student" WHERE email = 'allanumaasa@gmail.com'
UNION ALL
SELECT 'Teachers' as type, email FROM "Teacher" WHERE email = 'allanumaasa@gmail.com';
