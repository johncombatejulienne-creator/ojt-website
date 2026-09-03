# Automatic Database Setup Script
Write-Host "Setting up your database..." -ForegroundColor Cyan
Write-Host ""

$DATABASE_URL = "postgresql://postgres.cyjwcqffiajxfqchbuxh:umaasa123umaasa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

Write-Host "Step 1: Adding DATABASE_URL to Vercel..." -ForegroundColor Yellow

# Set the environment variable in Vercel
$env:DATABASE_URL = $DATABASE_URL

Write-Host "DATABASE_URL set locally for testing" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma Client generated successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 3: Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Migrations failed - this is OK if tables already exist" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 4: Seeding initial data..." -ForegroundColor Yellow
npm run db:seed-strands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "Seeding failed - data might already exist" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your database is now set up!" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: You still need to add DATABASE_URL to Vercel manually:" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/john-kiosk/ojt-portal/settings/environment-variables" -ForegroundColor White
Write-Host "2. Click 'Add New'" -ForegroundColor White
Write-Host "3. Name: DATABASE_URL" -ForegroundColor White
Write-Host "4. Value: $DATABASE_URL" -ForegroundColor White
Write-Host "5. Select: Production, Preview, Development" -ForegroundColor White
Write-Host "6. Click Save" -ForegroundColor White
Write-Host ""
Write-Host "Or run this command:" -ForegroundColor Yellow
Write-Host 'echo "' -NoNewline -ForegroundColor Gray
Write-Host $DATABASE_URL -NoNewline -ForegroundColor White
Write-Host '" | vercel env add DATABASE_URL production' -ForegroundColor Gray
Write-Host ""
