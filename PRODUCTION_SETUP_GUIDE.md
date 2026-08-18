# 🚀 Production Setup Guide - Work Immersion System

## Current Status
✅ Website Deployed: https://ojt-portal-one.vercel.app
✅ GitHub Connected: Auto-deploys on push
⚠️ Database: Using dummy connection (needs real database)
⚠️ Google OAuth: Needs credentials configured

---

## Step 1: Set Up Production Database (5 minutes)

### Option A: Supabase (Recommended - Free)

1. **Create Account & Project**
   - Go to: https://supabase.com/dashboard
   - Click "New Project"
   - Fill in:
     - Name: `work-immersion-db`
     - Database Password: (create strong password - SAVE THIS!)
     - Region: `Southeast Asia (Singapore)` (closest to you)
   - Click "Create new project"
   - Wait 2-3 minutes for setup

2. **Get Connection String**
   - Once project is ready, go to **Settings** (gear icon) > **Database**
   - Scroll to **Connection String** section
   - Select **URI** tab
   - Copy the connection string (looks like):
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the password you created

3. **Add to Vercel**
   - Go to: https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables
   - Find `DATABASE_URL`
   - Click "Edit"
   - Paste your Supabase connection string
   - Save

### Option B: Neon (Alternative - Free)

1. Go to: https://neon.tech
2. Sign up and create new project
3. Copy the connection string
4. Add to Vercel environment variables

---

## Step 2: Configure Google OAuth (3 minutes)

### Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project

2. **Update OAuth 2.0 Client**
   - Click on your OAuth 2.0 Client ID (the one you're using)
   - Under **Authorized redirect URIs**, add:
     ```
     https://ojt-portal-one.vercel.app/api/auth/callback/google
     https://ojt-portal-qvqgmpq43-john-kiosk.vercel.app/api/auth/callback/google
     ```
   - Click **Save**

3. **Add Credentials to Vercel**
   - Go to: https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables
   - Add these (if not already added):
   
   **GOOGLE_CLIENT_ID**
   - Key: `GOOGLE_CLIENT_ID`
   - Value: (your Google OAuth Client ID)
   - Environments: Production, Preview, Development

   **GOOGLE_CLIENT_SECRET**
   - Key: `GOOGLE_CLIENT_SECRET`
   - Value: (your Google OAuth Client Secret)
   - Environments: Production, Preview, Development

---

## Step 3: Update Other Environment Variables (2 minutes)

Go to: https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables

Ensure these are set:

| Variable | Value | Environments |
|----------|-------|--------------|
| DATABASE_URL | (Your Supabase connection string) | Production, Preview, Development |
| NEXTAUTH_URL | `https://ojt-portal-one.vercel.app` | Production |
| NEXTAUTH_SECRET | `KKb+L9eYorsf91uhZ8j9WjaoUqFfEeR4PsPhsacbCB0=` | Production, Preview, Development |
| GOOGLE_CLIENT_ID | (Your Google Client ID) | Production, Preview, Development |
| GOOGLE_CLIENT_SECRET | (Your Google Client Secret) | Production, Preview, Development |

---

## Step 4: Run Database Migrations (2 minutes)

After setting up your production database in Vercel:

### Using Vercel CLI (from your computer):

```bash
# Set your production database URL temporarily
$env:DATABASE_URL="postgresql://your-supabase-connection-string"

# Run migrations
npx prisma migrate deploy

# Seed initial data (strands and sections)
npm run db:seed-strands

# Clear the environment variable
Remove-Item Env:DATABASE_URL
```

### Alternative: Using Supabase SQL Editor

1. Go to your Supabase project
2. Click **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from the migration files in `prisma/migrations/`
5. Run the query

---

## Step 5: Change Project Name to "immersion-tracker" (Optional, 1 minute)

1. Go to: https://vercel.com/john-kiosk/ojt-portal/settings
2. Scroll to **Project Name**
3. Change from `ojt-portal` to `immersion-tracker`
4. Click **Save**
5. Your new URL: **https://immersion-tracker.vercel.app**

---

## Step 6: Redeploy (1 minute)

After updating environment variables:

### Option A: Automatic (Recommended)
Just push to GitHub - it auto-deploys:
```bash
git add -A
git commit -m "Update configuration"
git push origin main
```

### Option B: Manual
```bash
vercel --prod
```

---

## Step 7: Create First Admin Account

Once everything is set up:

1. Visit: https://ojt-portal-one.vercel.app/login
2. Log in with teacher credentials
3. Or use Prisma Studio to create an admin:
   ```bash
   $env:DATABASE_URL="your-production-url"
   npx prisma studio
   ```
4. Create a Teacher record with:
   - email: your-email@example.com
   - password: (hashed with bcrypt)
   - accessLevel: "super_admin"

---

## Verification Checklist

After completing all steps, verify:

- [ ] Can access website: https://ojt-portal-one.vercel.app
- [ ] Students can log in with Google
- [ ] Teachers can log in with email/password
- [ ] Database tables are created (check in Supabase dashboard)
- [ ] Strands and sections are seeded
- [ ] No console errors in browser

---

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# Run migrations on production database
$env:DATABASE_URL="your-production-url"
npx prisma migrate deploy

# Seed production database
npm run db:seed-strands

# View production logs
vercel logs

# Check Prisma Studio (production)
$env:DATABASE_URL="your-production-url"
npx prisma studio
```

---

## Troubleshooting

### "Build failed" on Vercel
- Check build logs: https://vercel.com/john-kiosk/ojt-portal
- Ensure all environment variables are set
- Try redeploying: `vercel --prod`

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Ensure connection string includes password

### "Google OAuth not working"
- Verify redirect URIs are correct in Google Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Vercel
- Make sure you're using the production URL

### "Prisma Client not generated"
- This is handled automatically with `postinstall` script
- If issues persist, check build logs in Vercel

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase database logs (if using Supabase)
3. Review browser console for errors
4. Check GitHub Actions (if enabled)

---

## Next Steps After Setup

Once your production environment is running:
1. Create frontend UI pages for students and teachers
2. Test all features end-to-end
3. Create user documentation
4. Set up monitoring and alerts
5. Configure custom domain (optional)

---

**Current Deployment:** https://ojt-portal-one.vercel.app
**Vercel Dashboard:** https://vercel.com/john-kiosk/ojt-portal
**GitHub Repo:** https://github.com/johncombatejulienne-creator/ojt-website
