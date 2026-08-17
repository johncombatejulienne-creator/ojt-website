# Technical Design: Strand & Section Management System

## Overview
Enhanced Work Immersion Management System with strand/section organization, automatic administrator assignment, targeted announcements, checklist management, and camera timestamp verification.

---

## 1. Database Schema Design

### New Tables

#### Strand
```prisma
model Strand {
  id          String    @id @default(cuid())
  name        String    @unique  // ICT, STEM, ABM, HUMSS
  description String?
  isActive    Boolean   @default(true)
  sections    Section[]
  checklists  Checklist[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([name])
}
```

#### Section
```prisma
model Section {
  id                String                    @id @default(cuid())
  name              String                    // 12-A, 12-B
  gradeLevel        Int                       // 12
  strandId          String
  strand            Strand                    @relation(fields: [strandId], references: [id])
  teacherId         String?
  teacher           Teacher?                  @relation(fields: [teacherId], references: [id])
  students          Student[]
  announcements     Announcement[]
  checklists        Checklist[]
  isActive          Boolean                   @default(true)
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt
  
  @@unique([strandId, name])
  @@index([strandId])
  @@index([teacherId])
}
```

#### Announcement
```prisma
model Announcement {
  id            String    @id @default(cuid())
  title         String
  content       String    @db.Text
  type          String    // reminder, deadline, schedule_change, instruction, meeting, document, orientation, workplace, emergency
  targetType    String    // all, strand, section, strand_section
  strandId      String?
  strand        Strand?   @relation(fields: [strandId], references: [id])
  sectionId     String?
  section       Section?  @relation(fields: [sectionId], references: [id])
  teacherId     String
  teacher       Teacher   @relation(fields: [teacherId], references: [id])
  isActive      Boolean   @default(true)
  publishedAt   DateTime  @default(now())
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([targetType])
  @@index([strandId])
  @@index([sectionId])
  @@index([teacherId])
  @@index([publishedAt])
}
```

#### Checklist
```prisma
model Checklist {
  id          String          @id @default(cuid())
  name        String
  description String?
  targetType  String          // strand, section, strand_section
  strandId    String?
  strand      Strand?         @relation(fields: [strandId], references: [id])
  sectionId   String?
  section     Section?        @relation(fields: [sectionId], references: [id])
  items       ChecklistItem[]
  progress    StudentChecklistProgress[]
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  @@index([strandId])
  @@index([sectionId])
}
```

#### ChecklistItem
```prisma
model ChecklistItem {
  id            String    @id @default(cuid())
  checklistId   String
  checklist     Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  title         String
  description   String?
  order         Int       @default(0)
  requirementType String? // narrative, document, photo, form
  isRequired    Boolean   @default(true)
  targetCount   Int?      // for items like "20 daily narratives"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([checklistId])
  @@index([order])
}
```

#### StudentChecklistProgress
```prisma
model StudentChecklistProgress {
  id              String        @id @default(cuid())
  studentId       String
  student         Student       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  checklistId     String
  checklist       Checklist     @relation(fields: [checklistId], references: [id])
  checklistItemId String
  status          String        @default("pending") // pending, in_progress, completed
  completedCount  Int           @default(0)
  completedAt     DateTime?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([studentId, checklistItemId])
  @@index([studentId])
  @@index([checklistId])
  @@index([status])
}
```

#### PhotoMetadata
```prisma
model PhotoMetadata {
  id                String    @id @default(cuid())
  photoId           String    @unique
  photo             Photo     @relation(fields: [photoId], references: [id], onDelete: Cascade)
  captureTimestamp  DateTime  // Immutable camera timestamp
  deviceInfo        String?   // Device model, OS
  gpsLatitude       Float?
  gpsLongitude      Float?
  cameraModel       String?
  imageHash         String?   // For integrity verification
  exifData          String?   @db.Text // Full EXIF data as JSON
  isVerified        Boolean   @default(false)
  verificationNotes String?
  createdAt         DateTime  @default(now())
  
  @@index([photoId])
  @@index([captureTimestamp])
  @@index([isVerified])
}
```

### Updated Tables

#### Student (Updates)
```prisma
model Student {
  // ... existing fields ...
  gradeLevel    Int?
  strandId      String?
  strand        Strand?   @relation(fields: [strandId], references: [id])
  sectionId     String?
  section       Section?  @relation(fields: [sectionId], references: [id])
  checklistProgress StudentChecklistProgress[]
  
  @@index([strandId])
  @@index([sectionId])
}
```

#### Teacher (Updates)
```prisma
model Teacher {
  // ... existing fields ...
  sections      Section[]
  announcements Announcement[]
  accessLevel   String    @default("teacher") // teacher, admin, super_admin
}
```

#### Photo (Updates)
```prisma
model Photo {
  // ... existing fields ...
  metadata      PhotoMetadata?
  captureDate   DateTime?  // Original capture date from camera
  isVerified    Boolean    @default(false)
}
```

---

## 2. API Routes Design

### Strand & Section Management

**GET /api/strands**
- List all active strands
- Public access for registration

**GET /api/sections?strandId={id}**
- List sections for a strand
- Public access for registration

**POST /api/admin/strands** (Admin only)
- Create new strand

**POST /api/admin/sections** (Admin only)
- Create new section
- Assign teacher to section

**PUT /api/admin/sections/{id}/assign-teacher**
- Assign or reassign teacher to section

---

### Student Registration Enhancement

**POST /api/students/complete-registration**
```json
{
  "studentId": "2026-00123",
  "gradeLevel": 12,
  "strandId": "cuid-ict",
  "sectionId": "cuid-ict-12a",
  "company": "Tech Solutions Inc."
}
```
- Validates strand/section combination
- Automatically assigns supervisor based on section's teacher
- Creates student checklist progress records

---

### Announcements

**POST /api/announcements**
```json
{
  "title": "Work Immersion Orientation",
  "content": "All ICT 12-A students...",
  "type": "orientation",
  "targetType": "section",
  "sectionId": "cuid-ict-12a",
  "expiresAt": "2026-09-30"
}
```

**GET /api/announcements**
- Students: Get announcements for their strand/section
- Teachers: Get announcements they created
- Filter by date, type, target

**PUT /api/announcements/{id}**
- Update announcement

**DELETE /api/announcements/{id}**
- Soft delete (set isActive = false)

---

### Checklist Management

**POST /api/admin/checklists**
```json
{
  "name": "ICT 12-A Requirements",
  "targetType": "section",
  "sectionId": "cuid-ict-12a",
  "items": [
    {
      "title": "Work Immersion Orientation",
      "order": 1,
      "requirementType": "document",
      "isRequired": true
    },
    {
      "title": "Daily Activity Logs",
      "order": 5,
      "requirementType": "narrative",
      "targetCount": 20
    }
  ]
}
```

**GET /api/checklists/my-checklist** (Student)
- Returns student's checklist with progress
- Auto-calculates completion based on submissions

**GET /api/admin/checklists**
- List all checklists for management

**PUT /api/checklists/{id}/progress**
- Manual progress update by teacher
- Auto-updates on narrative/document submission

---

### Photo Verification

**POST /api/upload/with-verification**
```json
{
  "file": "base64_image_data",
  "metadata": {
    "captureTimestamp": "2026-08-17T14:30:00Z",
    "deviceInfo": "iPhone 13 Pro, iOS 17.2",
    "gpsCoordinates": {
      "latitude": 14.5995,
      "longitude": 120.9842
    },
    "exifData": { ... }
  }
}
```

**GET /api/photos/{id}/verification**
- Returns verification status and metadata
- Teachers can view verification details

---

## 3. Frontend Components

### Student Registration Flow
```
StudentRegistrationPage
├── StrandSelector (dropdown)
├── SectionSelector (filtered by strand)
├── GradeLevelInput
└── CompanyInput
```

### Student Dashboard Enhancement
```
StudentDashboard
├── ProfileCard (shows strand, section, assigned teacher)
├── AnnouncementsPanel (filtered by strand/section)
├── ChecklistWidget (progress tracker)
└── NarrativeSubmissionForm (with camera timestamp)
```

### Teacher Dashboard
```
TeacherDashboard
├── StrandSectionNavigator
├── StudentListView (filtered by selected section)
├── AnnouncementCreator
├── ChecklistManager
└── ProgressOverview
```

### Admin Dashboard
```
AdminDashboard
├── StrandManagement
├── SectionManagement
├── TeacherAssignment
├── ChecklistTemplates
├── GlobalStatistics
└── StudentProgressReports
```

---

## 4. Security Considerations

### Timestamp Verification
- Store original EXIF data immutably
- Hash images to detect tampering
- Cross-reference capture time with submission time
- Flag suspicious time discrepancies
- GPS verification (optional but recommended)

### Access Control
- Students: Only see own data + section announcements
- Teachers: Only access assigned sections
- Admin: Full access with audit logging
- Prevent students from changing strand/section after registration

### Data Integrity
- Immutable audit logs for all admin actions
- Checklist progress cannot be decreased
- Photo metadata cannot be edited after upload
- Teacher assignments logged with timestamp

---

## 5. Implementation Priority

### Phase 1: Core Strand/Section System
1. Database schema migration
2. Strand/Section CRUD APIs
3. Student registration enhancement
4. Teacher assignment system

### Phase 2: Announcements
1. Announcement API
2. Targeting system
3. Student announcement feed
4. Teacher announcement creator

### Phase 3: Checklist System
1. Checklist templates
2. Progress tracking
3. Auto-update logic
4. Student checklist view

### Phase 4: Camera Verification
1. Photo metadata capture
2. EXIF extraction
3. Verification algorithm
4. Admin verification view

---

## 6. Technical Stack Additions

**New Dependencies:**
- `exif-parser` - Extract EXIF metadata
- `sharp` - Image processing and hashing
- `geolib` - GPS coordinate validation
- `date-fns-tz` - Timezone handling

**Database:**
- Add indexes for performance
- Set up cascading deletes properly
- Implement soft deletes for announcements

---

## 7. Testing Requirements

- Strand/section assignment logic
- Automatic teacher assignment
- Announcement targeting filters
- Checklist progress calculation
- Photo metadata extraction
- Timestamp verification algorithm
- Access control enforcement

---

**Next Steps:** Create implementation tasks based on this design.
