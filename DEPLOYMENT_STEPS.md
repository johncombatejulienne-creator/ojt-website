# 🚀 Deployment Steps for OJT Website Combate

Follow these steps to deploy your Work Immersion website and make it accessible at:
**https://ojt-website-combate.vercel.app**

---

## Step 1: Set Up Free PostgreSQL Database (Supabase)

### 1.1 Create Supabase Account
1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub or email

### 1.2 Create New Project
1. Click "New Project"
2. Enter details:
   - **Name**: ojt-website-combate
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Singapore (closest to Philippines)
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 1.3 Get Database URL
1. Go to **Project Settings** (gear icon)
2. Click **Database** in sidebar
3. Scroll to **Connection string**
4. Select **URI** mode
5. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@...`)
6. Replace `[YOUR-PASSWORD]` with your actual password
7. **SAVE THIS** - you'll need it later!

---

## Step 2: Set Up Google OAuth

### 2.1 Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click dropdown at top → "New Project"
3. Project name: **OJT Website Combate**
4. Click "Create"

### 2.2 Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click and enable it

### 2.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for any Gmail users)
3. Fill in:
   - App name: **OJT Website Combate**
   - User support email: Your email
   - Developer email: Your email
4. Click "Save and Continue" (3 times to skip optional parts)

### 2.4 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click "**+ Create Credentials**" → "OAuth client ID"
3. Application type: **Web application**
4. Name: **OJT Web Client**
5. **Authorized redirect URIs** - Add these two:
   ```
   http://localhost:3000/api/auth/callback/google
   https://ojt-website-combate.vercel.app/api/auth/callback/google
   ```
6. Click "Create"
7. **COPY** the Client ID and Client Secret that appear
8. **SAVE THESE** - you'll need them!

---

## Step 3: Deploy to Vercel

### 3.1 Initialize Git Repository
Open PowerShell in your project folder and run:

```powershell
cd work-immersion-system
git init
git add .
git commit -m "Initial commit - OJT Website"
```

### 3.2 Login to Vercel
```powershell
vercel login
```
- Enter your email
- Click the verification link in your email

### 3.3 Deploy
```powershell
vercel
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → Type: `ojt-website-combate`
- **Directory?** → Press Enter (current directory)
- **Override settings?** → No

Wait for deployment to complete!

### 3.4 Add Environment Variables

After deployment, you need to add your environment variables:

```powershell
vercel env add DATABASE_URL
```
Paste your Supabase connection string when prompted.

```powershell
vercel env add NEXTAUTH_SECRET
```
Generate and paste a secret:
- Run: `openssl rand -base64 32` (if you have OpenSSL)
- Or use: https://generate-secret.vercel.app/32
- Paste the generated secret

```powershell
vercel env add GOOGLE_CLIENT_ID
```
Paste your Google Client ID

```powershell
vercel env add GOOGLE_CLIENT_SECRET
```
Paste your Google Client Secret

```powershell
vercel env add NEXTAUTH_URL
```
Type: `https://ojt-website-combate.vercel.app`

### 3.5 Run Production Deployment
```powershell
vercel --prod
```

This creates the final production deployment!

---

## Step 4: Set Up Database Tables

### 4.1 Update Environment Locally
Create a `.env` file in your project:

```env
DATABASE_URL="your-supabase-connection-string-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4.2 Run Migrations
```powershell
npx prisma generate
npx prisma migrate deploy
```

### 4.3 Seed Initial Data (Optional)
```powershell
npm run db:seed
```

This creates sample teachers and students.

---

## Step 5: Create Your First Admin Account

### Option 1: Use Prisma Studio
```powershell
npx prisma studio
```

1. Opens in browser at http://localhost:5555
2. Click **Teacher** table
3. Click **Add record**
4. Fill in:
   - teacherId: `ADMIN001`
   - name: Your name
   - email: Your school email
   - password: Use this hashed password for "admin123":
     ```
     $2a$10$rX8V5YZvXQH7nqZWVyqHR.yGZwF8mG8XLGJxGKVwq0vMqvJ4xDGNC
     ```
   - role: `teacher`
5. Click **Save**

### Option 2: Use SQL Directly
Connect to your Supabase database and run:

```sql
INSERT INTO "Teacher" (id, "teacherId", name, email, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'ADMIN001',
  'Your Name Here',
  'your-email@school.edu',
  '$2a$10$rX8V5YZvXQH7nqZWVyqHR.yGZwF8mG8XLGJxGKVwq0vMqvJ4xDGNC',
  'teacher',
  NOW(),
  NOW()
);
```

Password will be: `admin123` (change after first login!)

---

## Step 6: Access Your Website!

Your website is now live at:
### 🌐 https://ojt-website-combate.vercel.app

### Test It:
1. Open the URL in any browser
2. Try logging in as teacher:
   - Email: The one you created
   - Password: `admin123`
3. Try student Google Sign-In with any Gmail

---

## Step 7: Share Your Website

You can share this link with:
- ✅ Students - They sign in with Gmail
- ✅ Teachers - They use email/password
- ✅ Anyone with internet access

### Custom Domain (Optional)
If you want **ojt-combate.com** instead:
1. Buy domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard → Settings → Domains
3. Add your domain
4. Update DNS records as instructed

---

## 🔧 Updating Your Website

When you make changes:

```powershell
git add .
git commit -m "Description of changes"
vercel --prod
```

Vercel automatically rebuilds and deploys!

---

## ⚙️ Configuration URLs

Save these for future reference:

- **Your Website**: https://ojt-website-combate.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## 🆘 Troubleshooting

### "Module not found" error
```powershell
npm install
vercel --prod
```

### "Database connection failed"
- Check DATABASE_URL in Vercel dashboard
- Verify database is running in Supabase

### "Redirect URI mismatch" 
- Make sure you added the exact URL to Google Console:
  `https://ojt-website-combate.vercel.app/api/auth/callback/google`

### Can't login
- Check environment variables in Vercel dashboard
- Verify NEXTAUTH_URL is set correctly

---

## 📞 Need Help?

1. Check Vercel deployment logs
2. Check browser console for errors
3. Review the error messages carefully

---

## ✅ Deployment Checklist

- [ ] Supabase database created
- [ ] Database URL copied
- [ ] Google OAuth configured
- [ ] Google Client ID & Secret copied
- [ ] Vercel account created
- [ ] Project deployed to Vercel
- [ ] Environment variables added
- [ ] Database migrations run
- [ ] Admin account created
- [ ] Website tested and working
- [ ] URL shared with users

---

**Congratulations! Your OJT Website is now LIVE! 🎉**

Website: **https://ojt-website-combate.vercel.app**
