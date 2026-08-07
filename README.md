# Work Immersion Management System

A comprehensive, secure, and modern web application for managing work immersion programs. Students can submit daily narratives with photo evidence, and teachers/supervisors can monitor, review, and approve submissions.

## 🌟 Features

### Student Features
- **Google Authentication**: Secure login with Gmail
- **Student ID Verification**: Link Gmail with Student ID
- **Daily Narratives**: Submit rich-text daily reports
- **Camera Integration**: Capture photos directly from browser (mobile/desktop)
- **Photo Upload**: Upload multiple photos with preview
- **Automatic Timestamps**: Tamper-proof submission tracking
- **Verification Status**: Automatic on-time/late detection
- **Draft Saving**: Save work and submit later
- **Submission History**: View all past submissions
- **Profile Management**: Track progress and statistics
- **Notifications**: Get updates on approvals and revisions

### Teacher/Supervisor Features
- **Admin Dashboard**: Comprehensive overview of student activities
- **Student Management**: View and manage all students
- **Narrative Review**: Review submissions with photos
- **Approval Workflow**: Approve or request revisions
- **Comments System**: Provide feedback on submissions
- **Advanced Filtering**: Filter by student, company, date, status
- **Reports Generation**: Export data to PDF, Excel, CSV
- **Calendar View**: Visual timeline of submissions
- **Notifications**: Alerts for new and late submissions
- **Audit Logs**: Complete activity tracking

### Security Features
- ✅ Google OAuth 2.0 authentication
- ✅ Role-based access control (RBAC)
- ✅ Server-side timestamp verification
- ✅ Input validation and sanitization
- ✅ CSRF protection
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ Encrypted passwords (bcrypt)
- ✅ HTTPS enforcement
- ✅ Comprehensive audit logging

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **File Storage**: Cloudinary / AWS S3 / Firebase Storage
- **Deployment**: Vercel (frontend), Railway/Render/Supabase (database)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Console account (for OAuth)
- Image storage service (Cloudinary, AWS S3, or Firebase)

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd work-immersion-system
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/work_immersion_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary (or choose S3/Firebase)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
\`\`\`

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

### 5. Database Setup

\`\`\`bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Image Upload Configuration

### Option 1: Cloudinary (Recommended)

\`\`\`bash
npm install cloudinary
\`\`\`

Update \`app/api/upload/route.ts\` with Cloudinary implementation.

### Option 2: AWS S3

\`\`\`bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
\`\`\`

Configure AWS credentials and update upload route.

### Option 3: Firebase Storage

\`\`\`bash
npm install firebase
\`\`\`

Initialize Firebase and update upload route.

See detailed instructions in \`app/api/upload/route.ts\`

## 🗄️ Database Schema

The system uses the following main models:

- **Student**: Student profiles and registration
- **Teacher**: Teacher/supervisor accounts
- **Narrative**: Daily work immersion narratives
- **Photo**: Photos attached to narratives
- **NarrativeReview**: Review actions and comments
- **Notification**: System notifications
- **AuditLog**: Complete activity tracking
- **Holiday**: Calendar holidays

## 🎨 Design System

### Color Palette

- **Primary**: #1565C0 (Blue)
- **Secondary**: #1E88E5 (Light Blue)
- **Accent**: #42A5F5 (Sky Blue)
- **Background**: #F4F8FC (Off-white)
- **Success**: Green shades
- **Warning**: Yellow shades
- **Danger**: Red shades

### Design Principles

- Material Design inspired
- 12-16px border radius for cards
- Subtle shadows and hover effects
- Smooth transitions and animations
- Mobile-first responsive design

## 📱 Progressive Web App (PWA)

The app can be installed on mobile devices and works offline.

Create \`public/manifest.json\`:

\`\`\`json
{
  "name": "Work Immersion System",
  "short_name": "Work Immersion",
  "description": "Digital work immersion journal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F4F8FC",
  "theme_color": "#1565C0",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
\`\`\`

## 🔒 Security Best Practices

1. **Never commit** \`.env\` file
2. Use **strong passwords** for admin accounts
3. Enable **HTTPS** in production
4. Regularly update dependencies
5. Monitor audit logs for suspicious activity
6. Set up **rate limiting** for API routes
7. Configure **CORS** appropriately
8. Use **environment-specific** configurations

## 🚢 Deployment

### Vercel (Recommended for Next.js)

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Database Hosting Options

- **Railway**: Easy PostgreSQL hosting
- **Supabase**: PostgreSQL with additional features
- **Render**: Free tier available
- **Neon**: Serverless PostgreSQL

## 📚 API Routes

### Student Routes
- \`POST /api/students/register\` - Register student with ID
- \`GET /api/narratives\` - Get student's narratives
- \`POST /api/narratives\` - Submit new narrative
- \`POST /api/upload\` - Upload photos

### Teacher Routes
- \`GET /api/students\` - Get all students
- \`GET /api/narratives\` - Get all narratives
- \`POST /api/narratives/[id]/review\` - Review narrative
- \`GET /api/reports\` - Generate reports

### Common Routes
- \`GET /api/auth/*\` - Authentication endpoints
- \`GET /api/notifications\` - User notifications
- \`POST /api/audit-log\` - Create audit entry

## 🧪 Testing

\`\`\`bash
# Run tests (after setting up)
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@workimmersion.com

## 🎯 Roadmap

- [ ] Implement PWA offline functionality
- [ ] Add real-time notifications with WebSockets
- [ ] QR code attendance integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Bulk operations for teachers
- [ ] Customizable report templates
- [ ] Integration with school management systems

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Tailwind CSS for styling utilities
- All contributors and testers

---

**Built with ❤️ for educational institutions**
