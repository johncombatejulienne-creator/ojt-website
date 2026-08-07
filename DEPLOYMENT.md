# Deployment Guide

Complete checklist for deploying Work Immersion System to production.

## Pre-Deployment Checklist

### 1. Security ✅

- [ ] Changed all default passwords
- [ ] Generated strong NEXTAUTH_SECRET
- [ ] Reviewed all environment variables
- [ ] Removed any hardcoded credentials
- [ ] Configured CORS appropriately
- [ ] Enabled HTTPS only
- [ ] Set up rate limiting (optional)
- [ ] Configured CSP headers
- [ ] Reviewed database permissions
- [ ] Set up backup strategy

### 2. Configuration ✅

- [ ] Updated NEXTAUTH_URL to production domain
- [ ] Configured production database
- [ ] Set up image storage (Cloudinary/S3/Firebase)
- [ ] Configured email service (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configured monitoring
- [ ] Set up analytics (optional)

### 3. Testing ✅

- [ ] Tested student login flow
- [ ] Tested teacher login flow
- [ ] Tested narrative submission
- [ ] Tested photo upload
- [ ] Tested camera access on mobile
- [ ] Tested on different browsers
- [ ] Tested responsive design
- [ ] Tested on actual mobile devices
- [ ] Verified timestamp verification
- [ ] Tested role-based access

### 4. Database ✅

- [ ] Ran all migrations
- [ ] Created initial admin account
- [ ] Backed up database
- [ ] Configured connection pooling
- [ ] Set up automated backups
- [ ] Tested database performance

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

#### Why Vercel?
- ✅ Built for Next.js
- ✅ Automatic deployments
- ✅ Free SSL certificates
- ✅ CDN included
- ✅ Easy environment variables
- ✅ Great developer experience

#### Steps:

**1. Install Vercel CLI**
\`\`\`bash
npm install -g vercel
\`\`\`

**2. Login**
\`\`\`bash
vercel login
\`\`\`

**3. Deploy**
\`\`\`bash
vercel
\`\`\`

**4. Configure Environment Variables**
- Go to Vercel Dashboard
- Select your project
- Settings → Environment Variables
- Add all from `.env`

**5. Production Deploy**
\`\`\`bash
vercel --prod
\`\`\`

#### Post-Deployment:

**Update Google OAuth**
1. Go to Google Cloud Console
2. Add production redirect URI:
   \`https://your-domain.vercel.app/api/auth/callback/google\`

**Update Environment Variables**
\`\`\`
NEXTAUTH_URL=https://your-domain.vercel.app
\`\`\`

---

### Option 2: Railway

#### Why Railway?
- ✅ Simple deployment
- ✅ Built-in PostgreSQL
- ✅ Environment variables
- ✅ Automatic HTTPS

#### Steps:

**1. Create Account**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

**2. Deploy from GitHub**
- New Project → Deploy from GitHub
- Select your repository
- Railway auto-detects Next.js

**3. Add PostgreSQL**
- Add Service → PostgreSQL
- Automatically sets DATABASE_URL

**4. Configure Variables**
- Go to Variables tab
- Add all environment variables

**5. Deploy**
- Push to GitHub
- Automatic deployment

---

### Option 3: Self-Hosted (VPS)

#### Requirements:
- Ubuntu/Debian VPS
- Node.js 18+
- PostgreSQL
- Nginx
- PM2 (process manager)

#### Steps:

**1. Server Setup**
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
\`\`\`

**2. Deploy Application**
\`\`\`bash
# Clone repository
git clone <your-repo> /var/www/work-immersion
cd /var/www/work-immersion

# Install dependencies
npm install

# Build application
npm run build

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
npx prisma migrate deploy
\`\`\`

**3. Configure PM2**
\`\`\`bash
# Start application
pm2 start npm --name "work-immersion" -- start

# Save PM2 configuration
pm2 save

# Set up startup script
pm2 startup
\`\`\`

**4. Configure Nginx**
\`\`\`nginx
# /etc/nginx/sites-available/work-immersion
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Enable site
sudo ln -s /etc/nginx/sites-available/work-immersion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

**5. Set Up SSL with Let's Encrypt**
\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

---

## Database Hosting

### Option 1: Supabase (Recommended)

**Pros:**
- ✅ Free tier generous
- ✅ Automatic backups
- ✅ Easy to use
- ✅ Built-in dashboard

**Steps:**
1. Go to [supabase.com](https://supabase.com)
2. Create project
3. Get connection string
4. Update DATABASE_URL

### Option 2: Railway

**Pros:**
- ✅ One-click PostgreSQL
- ✅ Integrated with app
- ✅ Simple

**Steps:**
1. Add PostgreSQL service
2. Railway sets DATABASE_URL automatically

### Option 3: Render

**Pros:**
- ✅ Free PostgreSQL
- ✅ Automatic backups
- ✅ Good uptime

**Steps:**
1. Create PostgreSQL instance
2. Copy internal URL
3. Update DATABASE_URL

### Option 4: Neon

**Pros:**
- ✅ Serverless Postgres
- ✅ Auto-scaling
- ✅ Free tier

**Steps:**
1. Go to [neon.tech](https://neon.tech)
2. Create project
3. Get connection string

---

## Image Storage Setup

### Cloudinary (Recommended)

\`\`\`bash
# Already installed
# Just add to .env:
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
\`\`\`

### AWS S3

\`\`\`bash
npm install @aws-sdk/client-s3

# Add to .env:
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
\`\`\`

### Firebase Storage

\`\`\`bash
npm install firebase

# Add Firebase config to .env
\`\`\`

---

## Post-Deployment

### 1. Verify Deployment

- [ ] Visit production URL
- [ ] Test student login
- [ ] Test teacher login
- [ ] Submit test narrative
- [ ] Upload test photo
- [ ] Check mobile responsiveness
- [ ] Test on different browsers

### 2. Set Up Monitoring

**Vercel Analytics (Free)**
\`\`\`bash
npm install @vercel/analytics
\`\`\`

**Error Tracking with Sentry**
\`\`\`bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
\`\`\`

### 3. Configure Backups

**Database Backups:**
- Enable automatic backups on hosting provider
- Or set up cron job:
\`\`\`bash
0 2 * * * pg_dump $DATABASE_URL > backup_$(date +\%Y\%m\%d).sql
\`\`\`

**Code Backups:**
- Use Git (already done)
- Push to GitHub regularly

### 4. Set Up Monitoring

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com/) (Free)
- [Pingdom](https://www.pingdom.com/)

**Performance Monitoring:**
- Vercel Analytics
- Google Analytics
- Sentry Performance

### 5. Create Admin Account

\`\`\`bash
# Connect to production database
psql $DATABASE_URL

# Insert admin teacher
# (Use hashed password from bcrypt)
\`\`\`

---

## Continuous Deployment

### GitHub Actions (Auto Deploy)

Create \`.github/workflows/deploy.yml\`:

\`\`\`yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
\`\`\`

---

## Troubleshooting Production Issues

### Build Failures

**Error: "Module not found"**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Error: "Out of memory"**
- Increase Node.js memory:
\`\`\`json
"build": "NODE_OPTIONS=--max-old-space-size=4096 next build"
\`\`\`

### Database Issues

**Error: "Connection timeout"**
- Check connection string
- Verify IP whitelist
- Check firewall rules

**Error: "Too many connections"**
- Configure connection pooling
- Use PgBouncer

### Performance Issues

**Slow Page Load:**
- Enable Vercel Edge Caching
- Optimize images
- Use lazy loading

---

## Scaling Considerations

### Database Scaling
- Connection pooling (PgBouncer)
- Read replicas
- Database indexes

### Image Storage
- Use CDN (Cloudinary has built-in)
- Compress images before upload
- Lazy load images

### Application Scaling
- Vercel auto-scales
- Use Edge Functions for static content
- Implement caching strategy

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check error logs
- [ ] Review database backups
- [ ] Monitor disk space
- [ ] Check uptime reports

**Monthly:**
- [ ] Update dependencies
- [ ] Review audit logs
- [ ] Check performance metrics
- [ ] Backup database manually

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update documentation
- [ ] User training

---

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org

---

**Your app is now live! 🎉**
