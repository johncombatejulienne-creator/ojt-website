# 🚀 DEPLOY NOW - Quick Commands

## Step 1: Login to Vercel
```powershell
vercel login
```
Enter your email and click the verification link.

## Step 2: Deploy
```powershell
vercel
```

When prompted:
- Project name: **ojt-website-combate**
- Accept defaults for everything else

## Step 3: Get Your Free Database

Go to: https://supabase.com
1. Sign up
2. Create project: "ojt-website-combate"
3. Set password (SAVE IT!)
4. Wait 2 minutes
5. Go to Settings → Database → Connection String (URI)
6. Copy the connection string

## Step 4: Add Environment Variables

```powershell
# Add database
vercel env add DATABASE_URL
# Paste your Supabase connection string

# Add auth secret
vercel env add NEXTAUTH_SECRET
# Generate at: https://generate-secret.vercel.app/32
# Paste the result

# Add NextAuth URL
vercel env add NEXTAUTH_URL
# Type: https://ojt-website-combate.vercel.app
```

## Step 5: Get Google OAuth

Go to: https://console.cloud.google.com
1. Create project: "OJT Website"
2. Enable Google+ API
3. OAuth consent screen → External → Fill details
4. Create Credentials → OAuth Client ID → Web App
5. Add redirect: `https://ojt-website-combate.vercel.app/api/auth/callback/google`
6. Copy Client ID and Secret

```powershell
# Add Google credentials
vercel env add GOOGLE_CLIENT_ID
# Paste Client ID

vercel env add GOOGLE_CLIENT_SECRET
# Paste Client Secret
```

## Step 6: Production Deploy
```powershell
vercel --prod
```

## Step 7: Setup Database Tables

Create a `.env` file locally with your credentials, then:

```powershell
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

## Step 8: Your Website is LIVE! 🎉

### URL: https://ojt-website-combate.vercel.app

Test it:
- Login as teacher with seeded account
- Login as student with Google

---

## Need Help?

See DEPLOYMENT_STEPS.md for detailed instructions.
