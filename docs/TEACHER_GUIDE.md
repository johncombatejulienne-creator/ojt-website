# 📚 Teacher Guide - Work Immersion Management System

Complete guide for teachers and administrators to manage students, announcements, and checklists.

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Strands & Sections](#understanding-strands--sections)
3. [Managing Announcements](#managing-announcements)
4. [Creating Checklists](#creating-checklists)
5. [Reviewing Student Narratives](#reviewing-student-narratives)
6. [Verifying Photos](#verifying-photos)
7. [Tracking Student Progress](#tracking-student-progress)
8. [Reports & Analytics](#reports--analytics)

---

## 🚀 Getting Started

### Logging In

1. Go to **https://immersion-tracker.vercel.app/login**
2. Click the **"Teacher"** tab
3. Enter your school email and password
4. Click **"Sign In"**

**Or use Google Sign-In** if your school uses Google Workspace.

### First Time Setup

After logging in for the first time:
1. You'll be assigned to specific sections by the administrator
2. You can only view and manage students in your assigned sections
3. Your dashboard will show your students grouped by strand and section

---

## 🎓 Understanding Strands & Sections

### What are Strands?

Strands are academic tracks in Senior High School:
- **ICT** - Information and Communications Technology
- **STEM** - Science, Technology, Engineering, and Mathematics
- **ABM** - Accountancy, Business, and Management
- **HUMSS** - Humanities and Social Sciences

### What are Sections?

Sections are classes within each strand:
- **12-A** - First section of Grade 12
- **12-B** - Second section of Grade 12

**Example:**
- **ICT 12-A** = Grade 12 ICT students in Section A
- **STEM 12-B** = Grade 12 STEM students in Section B

### Your Assigned Sections

You are assigned to specific sections by the administrator. You can only:
- ✅ View students in your sections
- ✅ Create announcements for your sections
- ✅ Review narratives from your students
- ✅ Track progress of your students

---

## 📢 Managing Announcements

Announcements allow you to communicate important information to your students.

### Creating an Announcement

**Via API (until UI is built):**

```javascript
POST /api/announcements

{
  "title": "Work Immersion Orientation",
  "content": "All ICT 12-A students must attend the orientation on Monday, September 15 at 9:00 AM in the Computer Laboratory.",
  "type": "orientation",
  "targetType": "section",
  "sectionId": "your-section-id",
  "expiresAt": "2026-09-15T23:59:59Z"
}
```

### Announcement Types

Choose the appropriate type:
- **reminder** - General reminders
- **deadline** - Submission deadlines
- **schedule_change** - Schedule updates
- **instruction** - Important instructions
- **meeting** - Meeting schedules
- **document** - Required documents
- **orientation** - Orientation announcements
- **workplace** - Workplace-related info
- **emergency** - Urgent notices

### Targeting Options

| Target Type | Who Sees It | Example |
|-------------|-------------|---------|
| **all** | All students in the system | System-wide announcement |
| **strand** | All students in a specific strand | All ICT students |
| **section** | All students in a specific section | Only ICT 12-A students |
| **strand_section** | Specific strand AND section | ICT 12-A (explicit) |

**Best Practices:**
- ✅ Use **section** targeting for section-specific announcements
- ✅ Use **strand** targeting for strand-wide events
- ✅ Use **all** sparingly for system-wide announcements
- ✅ Set expiration dates for time-sensitive announcements

### Updating an Announcement

```javascript
PUT /api/announcements/{id}

{
  "title": "Updated: Work Immersion Orientation",
  "content": "Time changed to 10:00 AM",
  "expiresAt": "2026-09-15T23:59:59Z"
}
```

### Deleting an Announcement

```javascript
DELETE /api/announcements/{id}
```

This performs a **soft delete** (sets `isActive = false`). The announcement will no longer be visible to students.

---

## ✅ Creating Checklists

Checklists help track student requirements and progress.

### What is a Checklist?

A checklist is a list of requirements that students must complete during their work immersion. Each strand or section can have its own checklist.

### Creating a Checklist

```javascript
POST /api/checklists

{
  "name": "ICT 12-A Work Immersion Requirements",
  "description": "Complete list of requirements for ICT students",
  "targetType": "section",
  "sectionId": "your-section-id",
  "items": [
    {
      "title": "Work Immersion Orientation",
      "description": "Attend mandatory orientation session",
      "order": 1,
      "requirementType": "document",
      "isRequired": true
    },
    {
      "title": "Parent/Guardian Consent Form",
      "description": "Signed consent form",
      "order": 2,
      "requirementType": "document",
      "isRequired": true
    },
    {
      "title": "Daily Activity Logs",
      "description": "Submit 20 daily narratives",
      "order": 3,
      "requirementType": "narrative",
      "isRequired": true,
      "targetCount": 20
    }
  ]
}
```

### Checklist Item Types

| Type | Description | Example |
|------|-------------|---------|
| **narrative** | Daily work narratives | 20 daily logs |
| **document** | Required documents | Consent form, Resume |
| **photo** | Photo requirements | Workplace photos |
| **form** | Forms to fill out | Medical form |

### Auto-Tracking Features

The system **automatically tracks** certain items:
- ✅ **Narratives**: Counts submitted narratives automatically
- ✅ **Progress**: Updates from "pending" → "in_progress" → "completed"
- ✅ **Percentage**: Calculates completion percentage

**Example:**
- Student submits 15 out of 20 required narratives
- System shows: **"15/20 Submitted"** and **"In Progress"**
- When 20th narrative submitted: **"20/20 Submitted"** and **"Completed"** ✅

### Strand-Specific vs Section-Specific

**Strand-Specific Checklist** (all ICT students):
```javascript
{
  "name": "ICT Requirements",
  "targetType": "strand",
  "strandId": "ict-strand-id"
}
```

**Section-Specific Checklist** (only ICT 12-A):
```javascript
{
  "name": "ICT 12-A Requirements",
  "targetType": "section",
  "sectionId": "ict-12a-section-id"
}
```

---

## 📝 Reviewing Student Narratives

### Viewing Narratives

```javascript
GET /api/narratives?studentId={id}&status=pending
```

Returns all narratives for review, with:
- Student information
- Narrative content
- Photos with timestamps
- Submission time
- Verification status

### Narrative Review Actions

#### 1. **Approve a Narrative**

```javascript
POST /api/narratives/{id}/review

{
  "action": "approved",
  "comment": "Well done! Your narrative is detailed and shows good learning."
}
```

#### 2. **Request Revision**

```javascript
POST /api/narratives/{id}/review

{
  "action": "revision_requested",
  "comment": "Please add more details about the tasks you performed and what you learned."
}
```

### What to Check When Reviewing

✅ **Content Quality:**
- Is the narrative detailed?
- Does it show learning and reflection?
- Are activities clearly described?

✅ **Completeness:**
- Time in/out recorded?
- Hours rendered calculated?
- Photos attached?

✅ **Timestamp Verification:**
- Is the submission on time?
- Are photos from the correct date?
- Any suspicious timestamps?

---

## 📸 Verifying Photos

Photos submitted by students include **metadata verification** to ensure authenticity.

### Viewing Photo Verification

```javascript
GET /api/photos/{id}/verification
```

Returns:
```json
{
  "photo": {
    "filename": "workplace_photo.jpg",
    "captureDate": "2026-08-17T14:30:00Z",
    "isVerified": false
  },
  "metadata": {
    "captureTimestamp": "2026-08-17T14:30:00Z",
    "deviceInfo": "iPhone 13 Pro",
    "cameraModel": "iPhone 13 Pro",
    "gpsLatitude": 14.5995,
    "gpsLongitude": 120.9842,
    "imageHash": "abc123..."
  },
  "verification": {
    "timestamp": {
      "isValid": true,
      "warning": "Photo was taken on different day"
    },
    "gps": {
      "isValid": true,
      "distance": 2.5
    }
  }
}
```

### What the System Checks

✅ **Timestamp Verification:**
- Photo captured before submission (not backdated)
- Photo not from the future (no device manipulation)
- Photo from the correct date (within 7 days)

✅ **GPS Verification** (if available):
- Photo taken within reasonable distance of workplace
- Flags photos taken far from expected location

✅ **Image Integrity:**
- Hash verification to detect tampering
- EXIF data preservation

### Red Flags to Watch For

🚩 **Suspicious Indicators:**
- No metadata available (stripped or edited)
- Timestamp in the future
- Photo taken weeks before narrative date
- GPS location far from workplace
- Multiple photos with identical timestamps

### Verifying a Photo

```javascript
PUT /api/photos/{id}/verification

{
  "isVerified": true,
  "verificationNotes": "Photo verified. Timestamp and location match workplace and narrative date."
}
```

---

## 📊 Tracking Student Progress

### View Student Checklist Progress

```javascript
GET /api/students/{id}/progress
```

Shows:
- Overall completion percentage
- Individual item status
- Narrative count (auto-updated)
- Pending requirements

### Progress Indicators

| Status | Meaning | Icon |
|--------|---------|------|
| **Pending** | Not started | ⏳ |
| **In Progress** | Partially complete | 🔄 |
| **Completed** | Requirement met | ✅ |

### Example Progress View

```
Student: Juan Dela Cruz (STU2024001)
Strand: ICT | Section: 12-A
Overall Progress: 65% (13/20 items completed)

Requirements:
✅ Orientation - Completed
✅ Consent Form - Completed
🔄 Daily Narratives - 15/20 Submitted (75%)
✅ Resume - Completed
⏳ Final Portfolio - Pending
```

---

## 📈 Reports & Analytics

### Dashboard Statistics

Your dashboard shows:
- **Total Students** in your sections
- **Narratives Submitted Today**
- **Late Submissions**
- **Pending Reviews**
- **Completion Rates** by section

### Generating Reports

```javascript
GET /api/reports?sectionId={id}&dateFrom=2026-08-01&dateTo=2026-08-31
```

Report includes:
- Student-by-student progress
- Narrative submission rates
- On-time vs late submissions
- Checklist completion statistics
- Photo verification status

### Export Options

- **PDF** - Formatted report for printing
- **Excel** - Detailed data for analysis
- **CSV** - Raw data for custom processing

---

## 🔐 Security & Privacy

### Access Control

- ✅ You can only see students in your assigned sections
- ✅ You cannot edit other teachers' announcements
- ✅ All actions are logged in audit trail
- ✅ Photo metadata is immutable (cannot be edited)

### Data Protection

- ✅ Student information is confidential
- ✅ Photos are securely stored
- ✅ Timestamps are server-side verified
- ✅ GPS data (if available) is privacy-protected

---

## 💡 Best Practices

### For Announcements

✅ **Do:**
- Use clear, concise titles
- Include date, time, and location
- Set appropriate expiration dates
- Target the correct audience

❌ **Don't:**
- Use "all" targeting unnecessarily
- Forget to update outdated announcements
- Post personal information publicly

### For Checklist Management

✅ **Do:**
- Create clear, specific requirements
- Use logical ordering (1, 2, 3...)
- Set realistic target counts
- Review and update regularly

❌ **Don't:**
- Create duplicate checklists
- Make all items "required" unnecessarily
- Forget to explain requirements clearly

### For Narrative Reviews

✅ **Do:**
- Provide constructive feedback
- Review within 24-48 hours
- Check photo timestamps
- Acknowledge good work

❌ **Don't:**
- Approve without reading carefully
- Request revision without explanation
- Ignore timestamp warnings

---

## 🆘 Troubleshooting

### Common Issues

**Q: I can't see all students**
- A: You can only see students in your assigned sections. Contact administrator if needed.

**Q: My announcement isn't showing for students**
- A: Check targeting settings and expiration date. Verify `isActive = true`.

**Q: Student checklist not updating automatically**
- A: Auto-updates work for "narrative" type items. Other types need manual review.

**Q: Photo verification shows "No metadata available"**
- A: Student may have edited the photo or used a screenshot. Flag for manual review.

---

## 📞 Support

Need help?
- Contact IT Support: support@school.edu
- System Administrator: admin@school.edu
- Documentation: See README.md

---

## 🔄 Updates & New Features

**Version 2.0 - Current**
- ✅ Strand & Section Management
- ✅ Targeted Announcements
- ✅ Auto-tracking Checklists
- ✅ Photo Timestamp Verification

**Coming Soon:**
- 📱 Mobile teacher app
- 📊 Advanced analytics dashboard
- 📧 Email notifications
- 🔔 Real-time push notifications

---

**Last Updated:** August 17, 2026
**Version:** 2.0
