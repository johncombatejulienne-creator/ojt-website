# ⚡ Quick Start - 5 Steps to Production

Your website is already deployed! Just needs database + OAuth setup.

**Live URL:** https://ojt-portal-one.vercel.app

---

## 🎯 Step 1: Create Supabase Database (2 min)

1. Go to: **https://supabase.com/dashboard**
2. Click **"New Project"**
3. Fill in:
   - Name: `work-immersion-db`
   - Password: (make a strong one, SAVE IT!)
   - Region: Singapore
4. Click **"Create new project"** → Wait 2 minutes

---

## 🎯 Step 2: Get Your Database URL (1 min)

1. In Supabase, go to **Settings** → **Database**
2. Find **Connection String** → **URI** tab
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres.xxxxx:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## 🎯 Step 3: Update Vercel Environment Variables (2 min)

1. Go to: **https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables**

2. Edit **DATABASE_URL**:
   - Paste your Supabase connection string
   - Save

3. Add these if not already set:

| Variable | Value |
|----------|-------|
| NEXTAUTH_URL | `https://ojt-portal-one.vercel.app` |
| NEXTAUTH_SECRET | `KKb+L9eYorsf91uhZ8j9WjaoUqFfEeR4PsPhsacbCB0=` |
| GOOGLE_CLIENT_ID | (your Google OAuth ID) |
| GOOGLE_CLIENT_SECRET | (your Google OAuth Secret) |

---

## 🎯 Step 4: Setup Database Tables (2 min)

### Option A: Run SQL in Supabase (Easiest)

1. In Supabase, click **SQL Editor**
2. Click **"New query"**
3. Open file: `manual-migration.sql` (in your project folder)
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. Done! ✅

### Option B: Use PowerShell Script

```powershell
cd "C:\Users\JulienneCombate\Desktop\OJT KIOSK\work-immersion-system"
.\setup-production-db.ps1 -DatabaseUrl "postgresql://your-connection-string"
```

---

## 🎯 Step 5: Update Google OAuth (1 min)

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. Click your OAuth 2.0 Client
3. Under **Authorized redirect URIs**, add:
   ```
   https://ojt-portal-one.vercel.app/api/auth/callback/google
   ```
4. Click **Save**

---

## ✅ Done! Test Your Website

Visit: **https://ojt-portal-one.vercel.app**

- Students can log in with Google
- Teachers can log in with email/password (after creating account)
- All APIs are ready

---

## 🎨 Optional: Rename to "immersion-tracker"

1. Go to: https://vercel.com/john-kiosk/ojt-portal/settings
2. Change **Project Name** to: `immersion-tracker`
3. Save
4. New URL: **https://immersion-tracker.vercel.app**

---

## 🆘 Need Help?

- **Can't log in?** → Check Google OAuth redirect URIs
- **Database error?** → Verify DATABASE_URL in Vercel
- **Build fails?** → Check logs at https://vercel.com/john-kiosk/ojt-portal

**Detailed Guide:** Read `PRODUCTION_SETUP_GUIDE.md`

---

## 📊 What's Already Done

✅ Website deployed to Vercel
✅ GitHub auto-deploy configured  
✅ All backend APIs working
✅ TypeScript build passing
✅ Prisma 7 configured
✅ NextAuth.js set up

**You only need:** Database + Google OAuth credentials!
