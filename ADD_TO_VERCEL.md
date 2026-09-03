# Add Database URL to Vercel

## Your Supabase Project Info
- Project: `work-immersion-db`
- Project URL: `https://cyjwcqffiajxfqchbuxh.supabase.co`
- Status: ✅ Healthy

## Step 1: Get Connection String

1. In Supabase, go to **Settings** → **Database**
2. Find **Connection string** section
3. Click **URI** tab
4. Copy the string (looks like this):
   ```
   postgresql://postgres.cyjwcqffiajxfqchbuxh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 2: Add to Vercel (CLICK THIS LINK)

**Direct Link to Environment Variables:**
👉 https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables

### What to Do:

1. **Find the `DATABASE_URL` variable** (it should already exist)
2. Click the **"Edit"** button (three dots → Edit)
3. **Paste your Supabase connection string**
4. Make sure these environments are checked:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
5. Click **"Save"**

### If DATABASE_URL doesn't exist:

1. Click **"Add New"** button
2. **Key:** `DATABASE_URL`
3. **Value:** (paste your Supabase connection string)
4. **Environments:** Check Production, Preview, Development
5. Click **"Save"**

## Step 3: Add Other Variables (if not already set)

Click "Add New" for each:

### NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://ojt-portal-one.vercel.app`
- **Environments:** Production only

### NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** `KKb+L9eYorsf91uhZ8j9WjaoUqFfEeR4PsPhsacbCB0=`
- **Environments:** Production, Preview, Development

### GOOGLE_CLIENT_ID (if you have it)
- **Key:** `GOOGLE_CLIENT_ID`
- **Value:** (your Google OAuth Client ID)
- **Environments:** Production, Preview, Development

### GOOGLE_CLIENT_SECRET (if you have it)
- **Key:** `GOOGLE_CLIENT_SECRET`
- **Value:** (your Google OAuth Client Secret)
- **Environments:** Production, Preview, Development

## Step 4: Redeploy

After saving all environment variables:

1. Go to: https://vercel.com/john-kiosk/ojt-portal
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. OR just wait - Vercel will auto-redeploy on next git push

## Next: Run Database Migration

After environment variables are set, we'll run the migration to create all tables.
