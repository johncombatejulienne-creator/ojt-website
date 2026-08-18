-- Manual Migration SQL for Work Immersion System
-- Run this in Supabase SQL Editor if you can't use Prisma CLI

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Strand table
CREATE TABLE IF NOT EXISTS "Strand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Strand_pkey" PRIMARY KEY ("id")
);

-- Create Section table
CREATE TABLE IF NOT EXISTS "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "strandId" TEXT NOT NULL,
    "teacherId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- Create Teacher table
CREATE TABLE IF NOT EXISTS "Teacher" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'teacher',
    "accessLevel" TEXT NOT NULL DEFAULT 'teacher',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- Create Student table
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "course" TEXT,
    "gradeLevel" INTEGER,
    "strandId" TEXT,
    "sectionId" TEXT,
    "supervisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- Create Narrative table
CREATE TABLE IF NOT EXISTS "Narrative" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Narrative_pkey" PRIMARY KEY ("id")
);

-- Create Photo table
CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT NOT NULL,
    "narrativeId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "captureDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- Create PhotoMetadata table
CREATE TABLE IF NOT EXISTS "PhotoMetadata" (
    "id" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "captureTimestamp" TIMESTAMP(3) NOT NULL,
    "deviceInfo" TEXT,
    "cameraModel" TEXT,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "imageHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhotoMetadata_pkey" PRIMARY KEY ("id")
);

-- Create Announcement table
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reminder',
    "targetType" TEXT NOT NULL,
    "strandId" TEXT,
    "sectionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Create Checklist table
CREATE TABLE IF NOT EXISTS "Checklist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetType" TEXT NOT NULL,
    "strandId" TEXT,
    "sectionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- Create ChecklistItem table
CREATE TABLE IF NOT EXISTS "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "requirementType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "targetCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- Create StudentChecklistProgress table
CREATE TABLE IF NOT EXISTS "StudentChecklistProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentChecklistProgress_pkey" PRIMARY KEY ("id")
);

-- Create other supporting tables
CREATE TABLE IF NOT EXISTS "NarrativeReview" (
    "id" TEXT NOT NULL,
    "narrativeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NarrativeReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Strand_code_key" ON "Strand"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_teacherId_key" ON "Teacher"("teacherId");
CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_email_key" ON "Teacher"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_studentId_key" ON "Student"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_email_key" ON "Student"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "PhotoMetadata_photoId_key" ON "PhotoMetadata"("photoId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Student_email_idx" ON "Student"("email");
CREATE INDEX IF NOT EXISTS "Student_studentId_idx" ON "Student"("studentId");
CREATE INDEX IF NOT EXISTS "Student_strandId_idx" ON "Student"("strandId");
CREATE INDEX IF NOT EXISTS "Student_sectionId_idx" ON "Student"("sectionId");
CREATE INDEX IF NOT EXISTS "Section_strandId_idx" ON "Section"("strandId");
CREATE INDEX IF NOT EXISTS "Narrative_studentId_idx" ON "Narrative"("studentId");
CREATE INDEX IF NOT EXISTS "Narrative_date_idx" ON "Narrative"("date");

-- Add foreign key constraints
ALTER TABLE "Section" ADD CONSTRAINT "Section_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Narrative" ADD CONSTRAINT "Narrative_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_narrativeId_fkey" FOREIGN KEY ("narrativeId") REFERENCES "Narrative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhotoMetadata" ADD CONSTRAINT "PhotoMetadata_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentChecklistProgress" ADD CONSTRAINT "StudentChecklistProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentChecklistProgress" ADD CONSTRAINT "StudentChecklistProgress_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentChecklistProgress" ADD CONSTRAINT "StudentChecklistProgress_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NarrativeReview" ADD CONSTRAINT "NarrativeReview_narrativeId_fkey" FOREIGN KEY ("narrativeId") REFERENCES "Narrative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NarrativeReview" ADD CONSTRAINT "NarrativeReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert initial strands
INSERT INTO "Strand" ("id", "name", "code", "description", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid()::text, 'Information and Communications Technology', 'ICT', 'Specialization in computer systems, programming, and digital technologies', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'Science, Technology, Engineering and Mathematics', 'STEM', 'Focus on scientific and mathematical principles for engineering and research', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'Accountancy, Business and Management', 'ABM', 'Business operations, accounting, and management principles', true, NOW(), NOW()),
    (gen_random_uuid()::text, 'Humanities and Social Sciences', 'HUMSS', 'Study of human behavior, society, and cultural development', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database migration completed successfully!' as message;
SELECT COUNT(*) as strands_count FROM "Strand";
SELECT COUNT(*) as sections_count FROM "Section";
