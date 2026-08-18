# Vercel Deployment Setup Guide

## Your Project
- **Project Name**: ojt-portal
- **Team**: john-kiosk
- **Current URL**: https://ojt-portal-60ihpbnfi-john-kiosk.vercel.app

## Step 1: Set Up Database

You need a PostgreSQL database. I recommend **Supabase** (free tier):

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `work-immersion-db`
4. Database Password: (create a strong password)
5. Region: Singapore (closest to you)
6. Wait for project to finish setting up
7. Go to **Settings** > **Database**
8. Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`

## Step 2: Configure Environment Variables in Vercel

1. Go to: https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables

2. Add these environment variables (click "Add New"):

### DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Your Supabase connection string from Step 1
- **Environment**: Production, Preview, Development (check all)

### NEXTAUTH_URL
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://ojt-portal-60ihpbnfi-john-kiosk.vercel.app`
- **Environment**: Production

### NEXTAUTH_SECRET
- **Key**: `NEXTAUTH_SECRET`
- **Value**: Run this command in your terminal to generate:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Environment**: Production, Preview, Development (check all)

### GOOGLE_CLIENT_ID
- **Key**: `GOOGLE_CLIENT_ID`
- **Value**: Your Google OAuth Client ID
- **Environment**: Production, Preview, Development (check all)

### GOOGLE_CLIENT_SECRET
- **Key**: `GOOGLE_CLIENT_SECRET`
- **Value**: Your Google OAuth Client Secret
- **Environment**: Production, Preview, Development (check all)

## Step 3: Update Google OAuth Settings

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   - `https://ojt-portal-60ihpbnfi-john-kiosk.vercel.app/api/auth/callback/google`
4. Click **Save**

## Step 4: Run Database Migrations

After setting up environment variables in Vercel:

1. In your terminal, run:
   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```
   This will apply migrations to your production database.

2. Seed the database:
   ```bash
   npm run db:seed-strands
   ```

## Step 5: Redeploy

After setting up all environment variables:

1. Go to: https://vercel.com/john-kiosk/ojt-portal
2. Click **Redeploy** on the latest deployment
3. Or run: `vercel --prod` from your terminal

## Step 6: Change Project Name (Optional)

To change from "ojt-portal" to "immersion-tracker":

1. Go to: https://vercel.com/john-kiosk/ojt-portal/settings
2. Under **Project Name**, change to: `immersion-tracker`
3. Click **Save**
4. Your new URL will be: `https://immersion-tracker.vercel.app`

## Quick Command Reference

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Deploy to Vercel
vercel --prod

# Check deployment logs
vercel logs
```

## Troubleshooting

If build fails:
1. Check environment variables are set correctly
2. Make sure DATABASE_URL is accessible from Vercel
3. Check deployment logs: https://vercel.com/john-kiosk/ojt-portal

If database connection fails:
1. Verify Supabase database is running
2. Check DATABASE_URL format is correct
3. Make sure Supabase allows connections from anywhere (0.0.0.0/0)
