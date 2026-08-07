# Complete Setup Guide - Work Immersion Management System

This guide will walk you through setting up the Work Immersion Management System from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [Image Upload Setup](#image-upload-setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Initial Data Setup](#initial-data-setup)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn** package manager
- ✅ **Git** for version control
- ✅ **PostgreSQL** database (local or hosted)
- ✅ **Google Cloud Console** account (free)
- ✅ **Code editor** (VS Code recommended)

### Check your Node.js version:
\`\`\`bash
node --version  # Should be v18.0.0 or higher
npm --version
\`\`\`

---

## Installation

### Step 1: Install Dependencies

The project is already initialized. Install all required packages:

\`\`\`bash
npm install
\`\`\`

This will install:
- Next.js 14 (React framework)
- Prisma (Database ORM)
- NextAuth.js (Authentication)
- Tailwind CSS (Styling)
- And all other dependencies

### Step 2: Install TypeScript Execution Tool

\`\`\`bash
npm install -D tsx
\`\`\`

---

## Database Setup

### Option 1: Local PostgreSQL

#### Install PostgreSQL

**Windows:**
1. Download from [postgresql.org](https://www.postgresql.org/download/)
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port is 5432

**Mac (using Homebrew):**
\`\`\`bash
brew install postgresql@15
brew services start postgresql@15
\`\`\`

**Linux:**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

#### Create Database

\`\`\`bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE work_immersion_db;

# Create user (optional but recommended)
CREATE USER work_immersion_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE work_immersion_db TO work_immersion_user;

# Exit
\\q
\`\`\`

Your connection string will be:
\`\`\`
postgresql://postgres:your_password@localhost:5432/work_immersion_db
\`\`\`

### Option 2: Cloud Database (Recommended for Production)

#### Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com/)
2. Create account and new project
3. Wait for project to be ready
4. Go to **Project Settings** → **Database**
5. Copy the **Connection String** (URI mode)
6. Use this in your `.env` file

#### Railway

1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click **New Project** → **Provision PostgreSQL**
4. Go to **Variables** tab
5. Copy `DATABASE_URL`

#### Render

1. Go to [render.com](https://render.com/)
2. Create account
3. Click **New** → **PostgreSQL**
4. Copy **Internal Database URL**

---

## Google OAuth Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: "Work Immersion System"
4. Click **Create**

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for Gmail users) or **Internal** (for Google Workspace)
3. Fill in:
   - **App name**: Work Immersion System
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
4. Click **Save and Continue**
5. Skip scopes → **Save and Continue**
6. Add test users (your Gmail addresses)
7. Click **Save and Continue**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. Set **Name**: Work Immersion Web Client
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://yourdomain.com` (for production)
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
7. Click **Create**
8. **Copy** Client ID and Client Secret

### Step 4: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - Google+ API
   - Google People API

---

## Image Upload Setup

Choose ONE option based on your preference:

### Option A: Cloudinary (Easiest - Recommended)

#### 1. Create Account
- Go to [cloudinary.com](https://cloudinary.com/)
- Sign up for free account

#### 2. Get Credentials
- Go to **Dashboard**
- Copy:
  - Cloud Name
  - API Key
  - API Secret

#### 3. Install Package
\`\`\`bash
npm install cloudinary
\`\`\`

#### 4. Update Upload Route
Open \`app/api/upload/route.ts\` and uncomment the Cloudinary implementation.

### Option B: AWS S3

#### 1. Create AWS Account & S3 Bucket
- Go to [AWS Console](https://aws.amazon.com/)
- Create S3 bucket
- Enable public access for images

#### 2. Create IAM User
- Go to IAM → Users → Create User
- Attach `AmazonS3FullAccess` policy
- Create access key

#### 3. Install Package
\`\`\`bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
\`\`\`

### Option C: Firebase Storage

#### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create new project

#### 2. Enable Storage
- Go to **Build** → **Storage**
- Click **Get Started**

#### 3. Get Config
- Go to **Project Settings**
- Copy Firebase config object

#### 4. Install Package
\`\`\`bash
npm install firebase
\`\`\`

---

## Environment Variables

### Step 1: Create .env File

Copy the example file:
\`\`\`bash
cp .env.example .env
\`\`\`

### Step 2: Fill in Values

Open \`.env\` and update all values:

\`\`\`env
# Database - Use your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/work_immersion_db"

# NextAuth - Generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth - From Google Cloud Console
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"

# Image Upload - Choose one option

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# OR AWS S3
# AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="work-immersion-photos"

# OR Firebase
# FIREBASE_API_KEY="your-api-key"
# FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
# FIREBASE_PROJECT_ID="your-project-id"
# FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
# FIREBASE_MESSAGING_SENDER_ID="123456789"
# FIREBASE_APP_ID="1:123456789:web:abc123"
\`\`\`

### Step 3: Generate NextAuth Secret

**Linux/Mac:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

**Windows PowerShell:**
\`\`\`powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 } | ForEach-Object { [byte]$_ }))
\`\`\`

Copy the output to `NEXTAUTH_SECRET`

---

## Running the Application

### Step 1: Generate Prisma Client

\`\`\`bash
npx prisma generate
\`\`\`

### Step 2: Run Database Migrations

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

This creates all database tables.

### Step 3: Seed Database (Optional)

\`\`\`bash
npm run db:seed
\`\`\`

This creates:
- 2 sample teachers
- 3 sample students
- Sample narratives
- Holiday entries

**Default Teacher Accounts:**
- Email: `teacher1@school.edu`, Password: `password123`
- Email: `teacher2@school.edu`, Password: `password123`

### Step 4: Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit: [http://localhost:3000](http://localhost:3000)

---

## Initial Data Setup

### Create First Teacher Account

#### Option 1: Using Prisma Studio

\`\`\`bash
npm run db:studio
\`\`\`

1. Opens browser at `localhost:5555`
2. Click **Teacher** model
3. Click **Add record**
4. Fill in details (hash password using bcrypt online)
5. Save

#### Option 2: Direct Database Insert

\`\`\`sql
-- Connect to your database
psql -U postgres -d work_immersion_db

-- Insert teacher (password is 'password123' hashed)
INSERT INTO "Teacher" (id, "teacherId", name, email, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'TCH001',
  'Admin Teacher',
  'admin@school.edu',
  '$2a$10$YourHashedPasswordHere',
  'teacher',
  NOW(),
  NOW()
);
\`\`\`

### Register Students

Students register through the app:
1. Click "Sign in with Google"
2. After Google auth, enter Student ID
3. System links Gmail with Student ID

---

## Deployment

### Deploy to Vercel

#### 1. Install Vercel CLI
\`\`\`bash
npm install -g vercel
\`\`\`

#### 2. Deploy
\`\`\`bash
vercel
\`\`\`

#### 3. Add Environment Variables
- Go to Vercel Dashboard
- Select your project
- **Settings** → **Environment Variables**
- Add all variables from `.env`

#### 4. Update Google OAuth
- Add production URL to Google Console:
  - `https://your-app.vercel.app/api/auth/callback/google`

#### 5. Deploy
\`\`\`bash
vercel --prod
\`\`\`

### Database in Production

Use hosted database (Supabase, Railway, or Render) - see [Database Setup](#option-2-cloud-database-recommended-for-production)

---

## Troubleshooting

### Database Connection Issues

**Error: `Can't reach database server`**

✅ Check if PostgreSQL is running:
\`\`\`bash
# Mac
brew services list

# Linux
systemctl status postgresql

# Windows
# Check Services app for PostgreSQL service
\`\`\`

✅ Verify connection string in `.env`

✅ Try connecting with psql:
\`\`\`bash
psql "postgresql://user:password@localhost:5432/work_immersion_db"
\`\`\`

### Google OAuth Errors

**Error: `redirect_uri_mismatch`**

✅ Add exact callback URL to Google Console:
- `http://localhost:3000/api/auth/callback/google`

✅ URLs must match EXACTLY (including http vs https)

**Error: `Access blocked: This app's request is invalid`**

✅ Complete OAuth consent screen configuration
✅ Add your email as test user
✅ Enable Google+ API

### Prisma Errors

**Error: `Prisma Client Not Generated`**

\`\`\`bash
npx prisma generate
\`\`\`

**Error: `Migration failed`**

\`\`\`bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev
\`\`\`

### Image Upload Issues

**Error: `Upload failed`**

✅ Check API credentials in `.env`
✅ Verify upload route implementation
✅ Check file size limits
✅ Inspect browser console for errors

### Port Already in Use

**Error: `Port 3000 is already in use`**

\`\`\`bash
# Use different port
PORT=3001 npm run dev
\`\`\`

---

## Next Steps

1. ✅ Customize the theme colors in `app/globals.css`
2. ✅ Update company name and branding
3. ✅ Configure email notifications
4. ✅ Set up backup strategy for database
5. ✅ Configure monitoring and error tracking
6. ✅ Add custom domain
7. ✅ Enable HTTPS
8. ✅ Test on mobile devices
9. ✅ Create user documentation
10. ✅ Train teachers and students

---

## Support

If you encounter issues:

1. Check this guide again
2. Review error messages carefully
3. Search GitHub issues
4. Check Next.js and Prisma documentation
5. Create an issue with:
   - Error message
   - Steps to reproduce
   - Environment details

---

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS only
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Review all environment variables
- [ ] Test authentication flows
- [ ] Verify role-based access
- [ ] Check audit log functionality

---

**Good luck with your Work Immersion Management System! 🎉**
