-- ═══════════════════════════════════════════════════════════
-- WIPE DATABASE — OJT Work Immersion Portal
-- WARNING: This permanently deletes ALL students, teachers,
-- narratives, photos, announcements, checklists, and sessions.
-- Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════

-- Disable FK checks temporarily (Supabase/PostgreSQL does NOT have SET FOREIGN_KEY_CHECKS)
-- Instead, delete in dependency order:

-- 1. Photo metadata (depends on Photo)
DELETE FROM "PhotoMetadata";

-- 2. Photos (depends on Narrative)
DELETE FROM "Photo";

-- 3. Narrative reviews (depends on Narrative + Teacher)
DELETE FROM "NarrativeReview";

-- 4. Narratives (depends on Student)
DELETE FROM "Narrative";

-- 5. Student checklist progress (depends on Student + Checklist)
DELETE FROM "StudentChecklistProgress";

-- 6. Checklist items (depends on Checklist)
DELETE FROM "ChecklistItem";

-- 7. Checklists
DELETE FROM "Checklist";

-- 8. Announcements (depends on Teacher)
DELETE FROM "Announcement";

-- 9. Notifications (all users)
DELETE FROM "Notification";

-- 10. Audit logs
DELETE FROM "AuditLog";

-- 11. Unlink students from sections/supervisors first
UPDATE "Student" SET "supervisorId" = NULL, "sectionId" = NULL, "strandId" = NULL;

-- 12. Unlink sections from teachers
UPDATE "Section" SET "teacherId" = NULL;

-- 13. Students
DELETE FROM "Student";

-- 14. Teachers
DELETE FROM "Teacher";

-- ═══════════════════════════════════════════════════════════
-- OPTIONAL: Also wipe NextAuth sessions from the DB
-- (Only needed if you are using DB sessions, not JWT)
-- ═══════════════════════════════════════════════════════════
-- DELETE FROM "Session";
-- DELETE FROM "Account";
-- DELETE FROM "VerificationToken";

-- ═══════════════════════════════════════════════════════════
-- DONE. Database is now clean.
-- All students and teachers must re-register.
-- ═══════════════════════════════════════════════════════════
