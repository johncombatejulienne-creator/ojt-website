# Project Structure

Complete overview of the Work Immersion Management System architecture.

## 📁 Directory Structure

\`\`\`
work-immersion-system/
│
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth.js configuration
│   │   ├── students/
│   │   │   └── register/
│   │   │       └── route.ts      # Student registration API
│   │   ├── narratives/
│   │   │   └── route.ts          # Narrative CRUD operations
│   │   └── upload/
│   │       └── route.ts          # Image upload handler
│   │
│   ├── login/
│   │   └── page.tsx              # Login page (students & teachers)
│   ├── dashboard/                # Student dashboard (to be created)
│   ├── teacher/                  # Teacher dashboard (to be created)
│   ├── globals.css               # Global styles & theme
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page (redirects to login/dashboard)
│
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx            # Customizable button component
│   │   ├── Card.tsx              # Card component with variants
│   │   └── Input.tsx             # Input & TextArea components
│   ├── CameraCapture.tsx         # Camera integration component
│   └── SessionProvider.tsx       # NextAuth session provider wrapper
│
├── lib/                          # Utility functions & configurations
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions (dates, validation, etc.)
│
├── prisma/                       # Database configuration
│   ├── schema.prisma             # Database schema definition
│   └── seed.ts                   # Database seeding script
│
├── types/                        # TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # App icons (to be added)
│
├── .env                          # Environment variables (not in git)
├── .env.example                  # Example environment variables
├── .gitignore                    # Git ignore rules
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration (v4 uses CSS)
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
│
├── README.md                     # Main documentation
├── SETUP_GUIDE.md                # Detailed setup instructions
├── QUICK_START.md                # Quick start guide
├── DEPLOYMENT.md                 # Deployment guide
└── PROJECT_STRUCTURE.md          # This file
\`\`\`

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

**Backend:**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database

**Authentication:**
- **NextAuth.js** - Authentication for Next.js
- **Google OAuth 2.0** - Gmail authentication
- **bcrypt** - Password hashing

**Image Storage:**
- **Cloudinary / AWS S3 / Firebase** - Cloud storage

---

## 📦 Core Components

### 1. Authentication System

**Files:**
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `types/next-auth.d.ts` - Type definitions

**Flow:**
1. User clicks "Sign in with Google"
2. NextAuth redirects to Google
3. Google authenticates and returns to callback
4. System checks if user exists in database
5. Creates session with role information

**Roles:**
- **Student** - Can submit narratives
- **Teacher** - Can review narratives

### 2. Database Layer

**Schema (prisma/schema.prisma):**

\`\`\`
Student → Narratives → Photos
           ↓
        Reviews ← Teacher
           ↓
     Notifications
\`\`\`

**Main Models:**
- `Student` - Student profiles
- `Teacher` - Teacher/supervisor accounts
- `Narrative` - Daily work narratives
- `Photo` - Photos attached to narratives
- `NarrativeReview` - Review actions
- `Notification` - System notifications
- `AuditLog` - Activity tracking
- `Holiday` - Calendar holidays

### 3. API Routes

**Student Routes:**
\`\`\`
POST /api/students/register     - Register student with ID
GET  /api/narratives            - Get student's narratives
POST /api/narratives            - Submit new narrative
POST /api/upload                - Upload photos
\`\`\`

**Teacher Routes:**
\`\`\`
GET  /api/students              - Get all students
GET  /api/narratives            - Get all/filtered narratives
POST /api/narratives/[id]/review - Review narrative
GET  /api/reports               - Generate reports
\`\`\`

### 4. UI Components

**Base Components (components/ui/):**
- `Button.tsx` - Styled button with variants
- `Card.tsx` - Container with shadow
- `Input.tsx` - Form inputs with labels

**Feature Components:**
- `CameraCapture.tsx` - Camera access & photo capture
- Navigation components (to be created)
- Dashboard components (to be created)

---

## 🔐 Security Features

### Authentication
- ✅ Google OAuth 2.0
- ✅ JWT-based sessions
- ✅ Role-based access control
- ✅ Server-side session validation

### Data Protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React escaping)
- ✅ CSRF protection (NextAuth)
- ✅ Password hashing (bcrypt)
- ✅ Environment variable isolation

### Audit & Compliance
- ✅ Comprehensive audit logging
- ✅ Tamper-proof timestamps
- ✅ Activity tracking
- ✅ Access logs

---

## 🎨 Design System

### Color Palette

\`\`\`css
Primary:    #1565C0  (Blue)
Secondary:  #1E88E5  (Light Blue)
Accent:     #42A5F5  (Sky Blue)
Background: #F4F8FC  (Off-white)

Success:    Green tones
Warning:    Yellow tones
Danger:     Red tones
\`\`\`

### Styling Approach

- **Tailwind CSS v4** - Utility-first CSS
- **CSS Custom Properties** - Theme variables
- **Component-based** - Reusable UI components
- **Responsive** - Mobile-first design

### Typography
- **Font:** System fonts (optimized)
- **Sizes:** Responsive scale
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## 🔄 Data Flow

### Student Narrative Submission

\`\`\`
1. Student captures/uploads photos
   ↓
2. Photos uploaded to cloud storage
   ↓
3. Student writes narrative
   ↓
4. Form submitted to API
   ↓
5. Server validates data
   ↓
6. Server records timestamp
   ↓
7. Server calculates verification status
   ↓
8. Data saved to database
   ↓
9. Notification sent to supervisor
   ↓
10. Audit log created
\`\`\`

### Teacher Review Process

\`\`\`
1. Teacher views narrative list
   ↓
2. Clicks to review specific narrative
   ↓
3. Reviews content and photos
   ↓
4. Approves or requests revision
   ↓
5. Adds comment (optional)
   ↓
6. Review saved to database
   ↓
7. Notification sent to student
   ↓
8. Audit log created
\`\`\`

---

## 🛠️ Development Workflow

### Adding New Features

**1. Database Changes:**
\`\`\`bash
# Update schema
nano prisma/schema.prisma

# Create migration
npx prisma migrate dev --name feature_name

# Update types
npx prisma generate
\`\`\`

**2. API Route:**
\`\`\`typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Implementation
}
\`\`\`

**3. Component:**
\`\`\`typescript
// components/Feature.tsx
'use client'

import { useState } from 'react'
import { Button } from './ui/Button'

export function Feature() {
  // Implementation
}
\`\`\`

**4. Page:**
\`\`\`typescript
// app/feature/page.tsx
import { Feature } from '@/components/Feature'

export default function FeaturePage() {
  return <Feature />
}
\`\`\`

### Testing Changes

\`\`\`bash
# Start dev server
npm run dev

# View database
npm run db:studio

# Check types
npx tsc --noEmit
\`\`\`

---

## 📱 Progressive Web App (PWA)

### Manifest
- `public/manifest.json` - PWA configuration
- Installable on mobile devices
- Offline capabilities (to be implemented)

### Service Worker (to be added)
- Cache static assets
- Offline page support
- Background sync for drafts

---

## 🧪 Testing Strategy

### Unit Tests (to be implemented)
\`\`\`bash
# Install testing libraries
npm install -D jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
\`\`\`

### E2E Tests (to be implemented)
\`\`\`bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
\`\`\`

---

## 📊 Performance Optimization

### Current Optimizations
- ✅ Image optimization (Next.js built-in)
- ✅ Code splitting (automatic)
- ✅ Server components (where possible)
- ✅ Lazy loading

### Future Optimizations
- [ ] Edge caching
- [ ] Database query optimization
- [ ] Image CDN
- [ ] Bundle size reduction

---

## 🔧 Useful Scripts

\`\`\`json
{
  "dev": "next dev",                    // Start development server
  "build": "next build",                // Build for production
  "start": "next start",                // Start production server
  "lint": "eslint",                     // Run linter
  "db:generate": "prisma generate",     // Generate Prisma client
  "db:migrate": "prisma migrate dev",   // Run migrations
  "db:seed": "tsx prisma/seed.ts",      // Seed database
  "db:studio": "prisma studio"          // Open database GUI
}
\`\`\`

---

## 🚀 Deployment Architecture

### Production Setup

\`\`\`
┌─────────────┐
│   Vercel    │ ← Next.js App
└──────┬──────┘
       │
       ├─────→ ┌──────────────┐
       │       │  Supabase    │ ← PostgreSQL
       │       └──────────────┘
       │
       └─────→ ┌──────────────┐
               │  Cloudinary  │ ← Image Storage
               └──────────────┘
\`\`\`

---

## 📚 Key Concepts

### Next.js App Router
- Server Components by default
- `'use client'` for client components
- File-based routing
- API routes in `app/api/`

### Prisma ORM
- Type-safe database queries
- Automatic migrations
- Schema-first approach
- Built-in connection pooling

### NextAuth.js
- Session management
- Multiple providers
- JWT tokens
- Callbacks for customization

---

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive commit messages

### Naming Conventions
- **Components:** PascalCase (Button.tsx)
- **Functions:** camelCase (getUser)
- **Constants:** UPPER_CASE (API_URL)
- **Files:** kebab-case for pages

### Git Workflow
1. Create feature branch
2. Make changes
3. Test locally
4. Commit with descriptive message
5. Push and create PR

---

## 📖 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Happy Coding! 🎉**
