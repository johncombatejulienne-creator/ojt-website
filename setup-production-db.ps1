# Production Database Setup Script
# Run this after you have your Supabase/Neon database URL

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🚀 Setting up Production Database..." -ForegroundColor Cyan
Write-Host ""

# Set environment variable
$env:DATABASE_URL = $DatabaseUrl

Write-Host "✓ Database URL configured" -ForegroundColor Green
Write-Host ""

# Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migrations completed" -ForegroundColor Green
Write-Host ""

# Seed strands and sections
Write-Host "🌱 Seeding initial data (Strands & Sections)..." -ForegroundColor Yellow
npm run db:seed-strands
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seeding failed or already seeded" -ForegroundColor Yellow
} else {
    Write-Host "✓ Data seeded successfully" -ForegroundColor Green
}
Write-Host ""

# Clean up
Remove-Item Env:DATABASE_URL

Write-Host "✅ Production database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify tables in your database dashboard"
Write-Host "2. Create your first admin/teacher account"
Write-Host "3. Update environment variables in Vercel"
Write-Host "4. Redeploy: vercel --prod"
Write-Host ""
Write-Host "Your website: https://ojt-portal-one.vercel.app" -ForegroundColor Green
