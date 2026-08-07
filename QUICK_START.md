# Quick Start Guide - Work Immersion System

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google Cloud Console account

## 🚀 Rapid Setup

### 1. Install Dependencies
\`\`\`bash
npm install
npm install -D tsx
\`\`\`

### 2. Set Up Environment
\`\`\`bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
# Required fields:
# - DATABASE_URL
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
\`\`\`

### 3. Google OAuth Setup (5 minutes)
1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID & Secret to `.env`

### 4. Database Setup
\`\`\`bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed sample data (optional)
npm run db:seed
\`\`\`

### 5. Run the App
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Test Accounts (if you seeded)

**Teachers:**
- Email: `teacher1@school.edu` / Password: `password123`
- Email: `teacher2@school.edu` / Password: `password123`

**Students:**
- Use Google Sign-In with any Gmail
- Enter Student ID: `STU2024001`, `STU2024002`, or `STU2024003`

## 📦 Image Upload (Optional)

For photo uploads, choose one:

### Cloudinary (Easiest)
\`\`\`bash
npm install cloudinary
# Add credentials to .env
# Uncomment Cloudinary code in app/api/upload/route.ts
\`\`\`

### AWS S3
\`\`\`bash
npm install @aws-sdk/client-s3
# Add AWS credentials to .env
\`\`\`

### Firebase
\`\`\`bash
npm install firebase
# Add Firebase config to .env
\`\`\`

## 🔧 Useful Commands

\`\`\`bash
# View database in browser
npm run db:studio

# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev

# Format code
npm run lint

# Build for production
npm run build
\`\`\`

## 📱 Features Ready to Use

✅ Student Google Authentication  
✅ Teacher Email/Password Login  
✅ Student ID Verification  
✅ Rich Text Narrative Editor  
✅ Camera Capture (Browser)  
✅ Photo Upload  
✅ Automatic Timestamp Verification  
✅ On-time/Late Detection  
✅ Teacher Dashboard  
✅ Narrative Review System  
✅ Audit Logging  
✅ Responsive Design  

## 🚨 Common Issues

### "Can't reach database"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env

### "Redirect URI mismatch"
- Add exact URL to Google Console
- Must include: `http://localhost:3000/api/auth/callback/google`

### "Port 3000 in use"
\`\`\`bash
PORT=3001 npm run dev
\`\`\`

## 📚 Full Documentation

For detailed setup and deployment:
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- See [README.md](./README.md)

## 🎉 Next Steps

1. Customize theme colors in `app/globals.css`
2. Update branding and company info
3. Configure image upload provider
4. Add more teachers via Prisma Studio
5. Test on mobile devices
6. Deploy to Vercel

---

**Need Help?** Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.
