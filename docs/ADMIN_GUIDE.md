# 🔐 Administrator Guide - Work Immersion System

Complete system administration guide for managing the entire Work Immersion program.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Initial Setup](#initial-setup)
3. [Managing Strands & Sections](#managing-strands--sections)
4. [Managing Teachers](#managing-teachers)
5. [Managing Students](#managing-students)
6. [System Configuration](#system-configuration)
7. [Database Management](#database-management)
8. [Security & Access Control](#security--access-control)
9. [Monitoring & Reports](#monitoring--reports)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### What This System Does

The Work Immersion Management System provides:
- ✅ Student narrative submission and tracking
- ✅ Teacher assignment and management
- ✅ Strand and section organization
- ✅ Targeted announcements
- ✅ Requirement checklists with auto-tracking
- ✅ Photo timestamp verification
- ✅ Progress monitoring and reporting

### System Architecture

```
┌─────────────────────────────────────────────┐
│           Work Immersion System             │
├─────────────────────────────────────────────┤
│                                             │
│  Students ──┐                               │
│             ├──> Strands ──> Sections ──┐   │
│  Teachers ──┘                           │   │
│                                         ↓   │
│  Narratives ──> Photos ──> Verification    │
│  Checklists ──> Progress Tracking          │
│  Announcements ──> Targeted Delivery       │
│                                             │
└─────────────────────────────────────────────┘
```

### Access Levels

| Role | Access | Capabilities |
|------|--------|--------------|
| **Super Admin** | All strands & sections | Full system access |
| **Admin** | Assigned strands/sections | Manage assigned areas |
| **Teacher** | Assigned sections only | Review & manage students |
| **Student** | Own data only | Submit & view own work |

---

## 🚀 Initial Setup

### Step 1: Database Initialization

```powershell
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed strands and sections
npm run db:seed-strands
```

This creates:
- 4 Strands: ICT, STEM, ABM, HUMSS
- 8 Sections: 2 per strand (12-A, 12-B)

### Step 2: Create First Admin Account

```javascript
// Using Prisma Studio or direct database insert
{
  teacherId: "ADMIN001",
  name: "System Administrator",
  email: "admin@school.edu",
  password: "hashed_password",
  role: "teacher",
  accessLevel: "super_admin"
}
```

### Step 3: Environment Configuration

Ensure `.env` file has:
```env
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
```

---

## 🎓 Managing Strands & Sections

### View All Strands

```javascript
GET /api/strands

Response:
{
  "strands": [
    {
      "id": "abc123",
      "name": "ICT",
      "description": "Information and Communications Technology",
      "isActive": true,
      "_count": {
        "students": 45,
        "sections": 2
      }
    }
  ]
}
```

### Create a New Strand

```javascript
POST /api/strands

{
  "name": "TVL",
  "description": "Technical-Vocational-Livelihood"
}
```

### Create a New Section

```javascript
POST /api/sections

{
  "name": "12-C",
  "gradeLevel": 12,
  "strandId": "ict-strand-id",
  "teacherId": "teacher-id-here"  // Optional
}
```

### Assign Teacher to Section

```javascript
PUT /api/sections/{section-id}

{
  "teacherId": "teacher-id-here"
}
```

### Deactivate a Section

```javascript
PUT /api/sections/{section-id}

{
  "isActive": false
}
```

**Note:** This hides the section from registration but preserves existing student assignments.

---

## 👥 Managing Teachers

### Create Teacher Account

```javascript
POST /api/teachers

{
  "teacherId": "TCH001",
  "name": "Ms. Sarah Johnson",
  "email": "sarah.johnson@school.edu",
  "password": "secure_password",
  "accessLevel": "teacher"  // or "admin" or "super_admin"
}
```

### Access Levels Explained

**super_admin:**
- Access to all strands and sections
- Can create/modify strands and sections
- Can assign teachers
- Full system configuration

**admin:**
- Access to assigned strands/sections
- Can create announcements and checklists
- Can review student work
- Limited configuration access

**teacher:**
- Access to assigned sections only
- Can review and grade students
- Can create announcements for their sections
- No configuration access

### Assign Teacher to Multiple Sections

```javascript
// Assign to first section
PUT /api/sections/ict-12a-id
{ "teacherId": "teacher-id" }

// Assign to second section
PUT /api/sections/ict-12b-id
{ "teacherId": "teacher-id" }
```

### Remove Teacher Assignment

```javascript
PUT /api/sections/{section-id}

{
  "teacherId": null
}
```

**Important:** Students in that section will have no supervisor until a new teacher is assigned.

---

## 👨‍🎓 Managing Students

### Student Registration Flow

1. Student signs in with Gmail
2. Student enters Student ID
3. Student selects Strand & Section
4. System automatically assigns teacher based on section
5. System creates checklist progress records

### View All Students

```javascript
GET /api/students?strandId={id}&sectionId={id}
```

### Manually Register a Student

```javascript
POST /api/students/complete-registration

{
  "studentId": "2026-00123",
  "gradeLevel": 12,
  "strandId": "ict-strand-id",
  "sectionId": "ict-12a-id",
  "company": "Tech Solutions Inc.",
  "course": "Computer Science"
}
```

### Move Student to Different Section

```javascript
PUT /api/students/{student-id}

{
  "sectionId": "new-section-id",
  "supervisorId": "new-teacher-id"
}
```

**Important:** When moving students:
- ✅ Update their checklist assignments
- ✅ Notify both old and new teachers
- ✅ Update announcement targeting
- ✅ Log the change in audit trail

### Deactivate Student Account

```javascript
PUT /api/students/{student-id}

{
  "isActive": false
}
```

---

## ⚙️ System Configuration

### Announcement Settings

**Default Expiration:**
```javascript
// Set in environment or config
ANNOUNCEMENT_DEFAULT_EXPIRY_DAYS=30
```

**Announcement Types Configuration:**
```javascript
const ANNOUNCEMENT_TYPES = [
  'reminder',
  'deadline',
  'schedule_change',
  'instruction',
  'meeting',
  'document',
  'orientation',
  'workplace',
  'emergency'
]
```

### Checklist Settings

**Auto-Tracking Rules:**
```javascript
{
  "narratives": {
    "type": "narrative",
    "autoUpdate": true,
    "trackingMethod": "count_submissions"
  },
  "documents": {
    "type": "document",
    "autoUpdate": false,
    "trackingMethod": "manual_review"
  }
}
```

### Photo Verification Settings

```javascript
const VERIFICATION_SETTINGS = {
  maxPhotoAge: 7,  // days
  requireGPS: false,
  maxDistanceKm: 5,
  allowManualOverride: true,
  flagSuspicious: true
}
```

### Submission Deadlines

```javascript
const DEADLINE_SETTINGS = {
  dailyNarrativeDeadline: "23:59:59",  // 11:59 PM
  lateSubmissionGracePeriod: 0,  // hours
  allowBackdating: false,
  maxFutureDays: 0
}
```

---

## 💾 Database Management

### Backup Strategy

**Automated Backups:**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://backups/
```

**Retention Policy:**
- Daily backups: Keep for 30 days
- Weekly backups: Keep for 3 months
- Monthly backups: Keep for 1 year

### Database Maintenance

**Regular Tasks:**
```sql
-- Analyze database performance
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check for orphaned records
SELECT COUNT(*) FROM "Photo" WHERE "narrativeId" NOT IN (SELECT id FROM "Narrative");

-- Clean up old audit logs (older than 1 year)
DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '1 year';
```

### Data Cleanup

**Expired Announcements:**
```sql
-- Archive expired announcements
UPDATE "Announcement" 
SET "isActive" = false 
WHERE "expiresAt" < NOW() 
AND "isActive" = true;
```

**Orphaned Photos:**
```sql
-- Find photos not linked to narratives
SELECT * FROM "Photo" 
WHERE "narrativeId" NOT IN (
  SELECT id FROM "Narrative"
);
```

---

## 🔐 Security & Access Control

### Role-Based Access Control (RBAC)

**Implementation:**
```typescript
// Check user role
const user = await getSession()
if (user.role !== 'teacher') {
  return { error: 'Unauthorized' }
}

// Check access to specific section
const teacher = await prisma.teacher.findUnique({
  where: { email: user.email },
  include: { sections: true }
})

const hasAccess = teacher.sections.some(s => s.id === requestedSectionId)
if (!hasAccess && teacher.accessLevel !== 'super_admin') {
  return { error: 'Access denied' }
}
```

### Audit Logging

All important actions are logged:
```javascript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    userType: 'teacher',
    action: 'section_created',
    description: 'Created new section ICT 12-C',
    metadata: JSON.stringify({
      sectionId: newSection.id,
      strandId: strandId,
      gradeLevel: 12
    }),
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent')
  }
})
```

### Viewing Audit Logs

```sql
-- Recent admin actions
SELECT * FROM "AuditLog" 
WHERE "userType" = 'teacher' 
AND "action" LIKE 'section_%'
ORDER BY "createdAt" DESC 
LIMIT 100;

-- Suspicious activity
SELECT * FROM "AuditLog" 
WHERE "action" IN ('login_failed', 'unauthorized_access')
AND "createdAt" > NOW() - INTERVAL '24 hours';
```

---

## 📊 Monitoring & Reports

### System Health Dashboard

**Key Metrics to Monitor:**
```javascript
{
  totalStudents: 450,
  activeStudents: 438,
  totalTeachers: 12,
  strands: 4,
  sections: 8,
  narrativesSubmittedToday: 234,
  lateSubmissionsThisWeek: 15,
  pendingReviews: 48,
  photoVerificationRate: 95.2,
  systemUptime: "99.9%"
}
```

### Generate System Report

```javascript
GET /api/admin/reports/system?from=2026-08-01&to=2026-08-31

Response:
{
  "period": "August 2026",
  "overview": {
    "totalSubmissions": 8500,
    "onTimeRate": 94.5,
    "lateRate": 5.5,
    "averageNarrativeLength": 285,
    "photoVerificationRate": 96.2
  },
  "byStrand": [
    {
      "strand": "ICT",
      "students": 120,
      "submissions": 2400,
      "completionRate": 98.5
    }
  ],
  "bySection": [...],
  "topPerformers": [...],
  "flaggedIssues": [...]
}
```

### Student Progress Report

```javascript
GET /api/admin/reports/student-progress?sectionId={id}

Returns:
- Individual student progress
- Checklist completion rates
- Submission patterns
- Quality metrics
```

### Teacher Performance Report

```javascript
GET /api/admin/reports/teacher-performance

Returns:
- Review turnaround time
- Number of students managed
- Announcement engagement
- Feedback quality scores
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Student Can't Register

**Symptoms:**
- Error: "Invalid strand/section combination"

**Solution:**
```sql
-- Check if section exists and is active
SELECT * FROM "Section" 
WHERE "strandId" = 'xxx' 
AND "name" = '12-A' 
AND "isActive" = true;

-- Reactivate if needed
UPDATE "Section" SET "isActive" = true WHERE id = 'xxx';
```

#### Issue 2: Teacher Can't See Students

**Symptoms:**
- Teacher dashboard shows empty

**Solution:**
```sql
-- Check teacher section assignments
SELECT s.* FROM "Section" s
JOIN "Teacher" t ON s."teacherId" = t.id
WHERE t.email = 'teacher@school.edu';

-- Assign teacher to section if missing
UPDATE "Section" 
SET "teacherId" = 'teacher-id' 
WHERE id = 'section-id';
```

#### Issue 3: Checklist Not Auto-Updating

**Symptoms:**
- Student narrative count not increasing

**Solution:**
```javascript
// Check checklist item configuration
{
  requirementType: "narrative",  // Must be exact
  targetCount: 20,
  isRequired: true
}

// Recalculate progress manually
const narrativeCount = await prisma.narrative.count({
  where: { studentId: 'xxx', isDraft: false }
})

await prisma.studentChecklistProgress.update({
  where: { studentId_checklistItemId: { studentId: 'xxx', checklistItemId: 'yyy' }},
  data: { 
    completedCount: narrativeCount,
    status: narrativeCount >= 20 ? 'completed' : 'in_progress'
  }
})
```

#### Issue 4: Photo Verification Always Failing

**Symptoms:**
- All photos show "verification failed"

**Solution:**
1. Check if metadata extraction is working:
```javascript
const metadata = await extractPhotoMetadata(buffer)
console.log(metadata)
```

2. Verify EXIF libraries are installed:
```bash
npm list sharp
```

3. Allow manual override for photos without metadata

---

## 📞 Support Contacts

### Technical Support

**System Issues:**
- IT Support: support@school.edu
- Database Admin: dba@school.edu

**Developer Contact:**
- GitHub: [repository-url]
- Documentation: [docs-url]

### Escalation Process

1. **Level 1**: IT Support (response: 2 hours)
2. **Level 2**: Database Admin (response: 4 hours)
3. **Level 3**: System Developer (response: 24 hours)

---

## 🔄 System Updates

### Update Process

1. **Backup Database**
```bash
pg_dump $DATABASE_URL > pre_update_backup.sql
```

2. **Pull Latest Code**
```bash
git pull origin main
```

3. **Install Dependencies**
```bash
npm install
```

4. **Run Migrations**
```bash
npx prisma migrate deploy
```

5. **Test**
```bash
npm run build
npm test
```

6. **Deploy**
```bash
vercel --prod
```

### Rollback Procedure

If update fails:
```bash
# Restore database
psql $DATABASE_URL < pre_update_backup.sql

# Revert code
git reset --hard HEAD~1

# Redeploy previous version
vercel --prod
```

---

## 📈 Scaling Considerations

### When to Scale

Monitor these metrics:
- Response time > 3 seconds
- Database CPU > 80%
- Concurrent users > 1000
- Storage > 80% capacity

### Scaling Options

**Vertical Scaling:**
- Upgrade database plan
- Increase memory allocation
- Add more CPU cores

**Horizontal Scaling:**
- Add read replicas for database
- Use CDN for static assets
- Implement caching layer

---

**Last Updated:** August 17, 2026
**Version:** 2.0
**System Status:** Production Ready
