-- ═══════════════════════════════════════════════════════════
-- DELETE SPECIFIC ACCOUNT: julienne.combate@gmail.com
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  v_teacher_id TEXT;
  v_student_id TEXT;
BEGIN

  -- Get teacher ID if exists
  SELECT id INTO v_teacher_id FROM "Teacher" WHERE email = 'julienne.combate@gmail.com';
  
  -- Get student ID if exists
  SELECT id INTO v_student_id FROM "Student" WHERE email = 'julienne.combate@gmail.com';

  -- Clean up teacher records
  IF v_teacher_id IS NOT NULL THEN
    UPDATE "Student" SET "supervisorId" = NULL WHERE "supervisorId" = v_teacher_id;
    UPDATE "Section" SET "teacherId"    = NULL WHERE "teacherId"    = v_teacher_id;
    DELETE FROM "NarrativeReview"  WHERE "teacherId"  = v_teacher_id;
    DELETE FROM "Notification"     WHERE "userId"     = v_teacher_id AND "userType" = 'teacher';
    UPDATE "Announcement" SET "isActive" = false WHERE "teacherId" = v_teacher_id;
    DELETE FROM "Teacher" WHERE id = v_teacher_id;
    RAISE NOTICE 'Deleted teacher record for julienne.combate@gmail.com';
  ELSE
    RAISE NOTICE 'No teacher record found for julienne.combate@gmail.com';
  END IF;

  -- Clean up student records
  IF v_student_id IS NOT NULL THEN
    DELETE FROM "StudentChecklistProgress" WHERE "studentId" = v_student_id;
    DELETE FROM "Notification"             WHERE "userId"    = v_student_id AND "userType" = 'student';
    -- Delete narratives (photos cascade)
    DELETE FROM "PhotoMetadata" pm
      USING "Photo" ph, "Narrative" n
      WHERE pm."photoId" = ph.id AND ph."narrativeId" = n.id AND n."studentId" = v_student_id;
    DELETE FROM "Photo" ph
      USING "Narrative" n
      WHERE ph."narrativeId" = n.id AND n."studentId" = v_student_id;
    DELETE FROM "NarrativeReview" nr
      USING "Narrative" n
      WHERE nr."narrativeId" = n.id AND n."studentId" = v_student_id;
    DELETE FROM "Narrative" WHERE "studentId" = v_student_id;
    DELETE FROM "Student"   WHERE id = v_student_id;
    RAISE NOTICE 'Deleted student record for julienne.combate@gmail.com';
  ELSE
    RAISE NOTICE 'No student record found for julienne.combate@gmail.com';
  END IF;

END $$;

-- ═══════════════════════════════════════════════════════════
-- After running this, julienne.combate@gmail.com can
-- sign in fresh as either Teacher or Student.
-- ═══════════════════════════════════════════════════════════
