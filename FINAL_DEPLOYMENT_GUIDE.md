# 🎯 FINAL DEPLOYMENT GUIDE
## Make Your Website Live in 15 Minutes!

Your website name: **OJT Website Combate**
Your URL will be: **https://ojt-website-combate.vercel.app**

---

## ✅ What's Already Done

- ✅ Project created and configured
- ✅ All code written
- ✅ Git repository initialized
- ✅ Ready to deploy

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Login to Vercel

Open PowerShell in your project folder and run:

```powershell
cd "C:\Users\JulienneCombate\Desktop\OJT KIOSK\work-immersion-system"
vercel login
```

**What happens:**
1. A code will appear (like: ABCD-EFGH)
2. A URL will appear (like: https://vercel.com/oauth/device?user_code=...)
3. **Copy that URL** and open it in your browser
4. Click "Confirm" to verify
5. Come back to PowerShell

---

### STEP 2: Deploy to Vercel

After logging in, run:

```powershell
vercel
```

**Answer the questions:**
- "Set up and deploy?" → Press **Enter** (Yes)
- "Which scope?" → Press **Enter** (your account)
- "Link to existing project?" → Type **N** then **Enter**
- "What's your project name?" → Type: **ojt-website-combate** then **Enter**
- "In which directory?" → Press **Enter** (current)
- "Override settings?" → Type **N** then **Enter**

Wait for deployment... (1-2 minutes)

You'll see: `✅ Preview: https://ojt-website-combate-xxxxx.vercel.app`

---

### STEP 3: Get Free Database (Supabase)

1. Open browser: **https://supabase.com**
2. Click "Start your project"
3. Sign up with GitHub or Email
4. Click "New Project"
5. Fill in:
   - **Name**: ojt-website-combate
   - **Password**: Create strong password (WRITE IT DOWN!)
   - **Region**: Singapore
6. Click "Create new project"
7. **WAIT 2-3 MINUTES** for database to initialize

**Get Connection String:**
1. Click ⚙️ **Settings** (bottom left)
2. Click **Database**
3. Scroll to "Connection string"
4. Select **URI** mode
5. Copy the full string (starts with `postgresql://`)
6. Replace `[YOUR-PASSWORD]` in the string with your actual password

**SAVE THIS CONNECTION STRING!**

---

### STEP 4: Get Google OAuth Credentials

1. Open: **https://console.cloud.google.com**
2. Sign in with your Google account
3. Click dropdown at top → "**New Project**"
4. Name: **OJT Website Combate**
5. Click "Create"

**Enable API:**
1. Go to **APIs & Services** → **Library**
2. Search "Google+ API"
3. Click and **Enable**

**Configure OAuth:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External**
3. Fill in:
   - App name: **OJT Website Combate**
   - Your email in both fields
4. Click "Save and Continue" three times

**Create Credentials:**
1. Go to **APIs & Services** → **Credentials**
2. Click "**+ Create Credentials**" → "OAuth client ID"
3. Type: **Web application**
4. Name: **OJT Web Client**
5. **Authorized redirect URIs** → Click "Add URI"
6. Add these TWO URLs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://ojt-website-combate.vercel.app/api/auth/callback/google
   ```
7. Click "Create"
8. **COPY** both:
   - Client ID (looks like: 123456-abc.apps.googleusercontent.com)
   - Client Secret (looks like: GOCSPX-abc123...)

**SAVE THESE!**

---

### STEP 5: Add Environment Variables to Vercel

In PowerShell, run these commands ONE BY ONE:

**1. Add Database URL:**
```powershell
vercel env add DATABASE_URL
```
- Select: **Production**, **Preview**, **Development** (use arrows and space)
- Press Enter
- Paste your Supabase connection string
- Press Enter

**2. Generate and Add Auth Secret:**

Visit: **https://generate-secret.vercel.app/32**
Copy the generated secret, then:

```powershell
vercel env add NEXTAUTH_SECRET
```
- Select all environments
- Paste the generated secret
- Press Enter

**3. Add Auth URL:**
```powershell
vercel env add NEXTAUTH_URL
```
- Select **Production** only
- Type: `https://ojt-website-combate.vercel.app`
- Press Enter

**4. Add Google Client ID:**
```powershell
vercel env add GOOGLE_CLIENT_ID
```
- Select all environments
- Paste your Google Client ID
- Press Enter

**5. Add Google Client Secret:**
```powershell
vercel env add GOOGLE_CLIENT_SECRET
```
- Select all environments
- Paste your Google Client Secret
- Press Enter

---

### STEP 6: Production Deployment

```powershell
vercel --prod
```

Wait for deployment... Your website is now LIVE!

You'll see: `✅ Production: https://ojt-website-combate.vercel.app`

---

### STEP 7: Setup Database Tables

Create a `.env` file in your project folder with this content:

```env
DATABASE_URL="your-supabase-connection-string-here"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

Then run:

```powershell
npx prisma generate
npx prisma migrate deploy
```

This creates all the database tables!

**Optional - Add Sample Data:**
```powershell
npm run db:seed
```

This creates test teachers and students.

---

### STEP 8: Create Your Admin Account

**Option 1: Use Prisma Studio (Easiest)**

```powershell
npx prisma studio
```

1. Opens browser at http://localhost:5555
2. Click **Teacher** table
3. Click "Add record"
4. Fill in:
   - **teacherId**: ADMIN001
   - **name**: Your Name
   - **email**: youremail@school.com
   - **password**: Copy this exactly:
     ```
     $2a$10$rX8V5YZvXQH7nqZWVyqHR.yGZwF8mG8XLGJxGKVwq0vMqvJ4xDGNC
     ```
     (This is the hashed version of "admin123")
   - **role**: teacher
5. Click "Save 1 change"

Your login:
- Email: youremail@school.com
- Password: admin123

---

## 🎉 YOUR WEBSITE IS LIVE!

### 🌐 **https://ojt-website-combate.vercel.app**

### Test It Now:

1. **Open the URL** in any browser
2. **Teacher Login:**
   - Click "Teacher" tab
   - Email: youremail@school.com
   - Password: admin123
3. **Student Login:**
   - Click "Student" tab
   - Click "Sign in with Google"
   - Use any Gmail account

---

## 📱 Share Your Website

Send this URL to anyone:
### **https://ojt-website-combate.vercel.app**

Works on:
- ✅ Any computer
- ✅ Any phone
- ✅ Any tablet
- ✅ Any browser

---

## 🔧 Make Changes Later

When you want to update the website:

```powershell
# Make your changes in code
git add .
git commit -m "Description of changes"
vercel --prod
```

Vercel automatically rebuilds and deploys!

---

## 📋 Important URLs to Save

| Service | URL | What It's For |
|---------|-----|---------------|
| **Your Website** | https://ojt-website-combate.vercel.app | Main website |
| **Vercel Dashboard** | https://vercel.com/dashboard | Manage deployments |
| **Supabase Dashboard** | https://app.supabase.com | Manage database |
| **Google Console** | https://console.cloud.google.com | Manage OAuth |
| **Secret Generator** | https://generate-secret.vercel.app/32 | Generate secrets |

---

## ❓ Troubleshooting

### "Can't access website"
- Wait 2-3 minutes after deployment
- Clear browser cache (Ctrl + Shift + Delete)
- Try incognito mode

### "Database connection error"
- Check DATABASE_URL in Vercel dashboard
- Verify database is running in Supabase

### "Google sign-in not working"
- Verify redirect URL in Google Console matches exactly:
  `https://ojt-website-combate.vercel.app/api/auth/callback/google`
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel

### "Can't login as teacher"
- Make sure you created admin account in Prisma Studio
- Password is: admin123
- Check email spelling

---

## 🎯 What's Next?

The website is live but needs the dashboard UI to be built. Check **TODO.md** for remaining features:

- Student dashboard
- Teacher dashboard  
- Rich text editor
- Reports
- Calendar view
- Notifications

For now, you have:
- ✅ Working authentication
- ✅ Database setup
- ✅ Google OAuth
- ✅ Professional login page
- ✅ Secure backend

---

## 💡 Pro Tips

1. **Custom Domain** (optional):
   - Buy domain (like ojt-combate.com)
   - Add in Vercel dashboard
   - Update Google OAuth URLs

2. **Monitor Your Site**:
   - Check Vercel Analytics
   - View logs in Vercel dashboard

3. **Backup Database**:
   - Supabase has automatic backups
   - Download manually from Supabase dashboard

---

## 🆘 Need Help?

1. Check the error message carefully
2. Look in Vercel deployment logs
3. Check browser console (F12)
4. Review environment variables in Vercel

---

**Congratulations! Your OJT Website is now accessible worldwide! 🌍🎉**

**URL: https://ojt-website-combate.vercel.app**
