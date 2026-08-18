# Deployment Verification Script
# Checks if everything is set up correctly

param(
    [string]$WebsiteUrl = "https://ojt-portal-one.vercel.app"
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  WORK IMMERSION SYSTEM - DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Test 1: Website is accessible
Write-Host "🌐 Testing website accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $WebsiteUrl -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Website is accessible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Website returned status code: $($response.StatusCode)" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   ❌ Cannot reach website: $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Test 2: Check API endpoints
Write-Host "🔌 Testing API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "/api/strands",
    "/api/sections",
    "/api/announcements"
)

foreach ($endpoint in $endpoints) {
    try {
        $apiUrl = "$WebsiteUrl$endpoint"
        $response = Invoke-WebRequest -Uri $apiUrl -Method GET -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
            Write-Host "   ✅ $endpoint" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $endpoint returned: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
            Write-Host "   ✅ $endpoint (requires auth)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
            $allGood = $false
        }
    }
}
Write-Host ""

# Test 3: Check environment variables (local check)
Write-Host "🔧 Checking local environment..." -ForegroundColor Yellow
if ($env:DATABASE_URL) {
    Write-Host "   ✅ DATABASE_URL is set locally" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  DATABASE_URL not set locally (this is okay if set in Vercel)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Check if database migrations exist
Write-Host "📦 Checking database setup..." -ForegroundColor Yellow
if (Test-Path ".\prisma\schema.prisma") {
    Write-Host "   ✅ Prisma schema exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Prisma schema not found" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path ".\manual-migration.sql") {
    Write-Host "   ✅ Manual migration SQL exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Manual migration SQL not found" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Check Git status
Write-Host "📚 Checking Git repository..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ([string]::IsNullOrWhiteSpace($gitStatus)) {
            Write-Host "   ✅ Git repository is clean (all changes committed)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Uncommitted changes detected" -ForegroundColor Yellow
            Write-Host "      Run: git add -A && git commit -m 'message' && git push" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ⚠️  Not a Git repository or Git not available" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✅ DEPLOYMENT STATUS: HEALTHY" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Your website is running at:" -ForegroundColor White
    Write-Host "  $WebsiteUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "  1. Set up Supabase database if not done" -ForegroundColor Gray
    Write-Host "  2. Add environment variables in Vercel" -ForegroundColor Gray
    Write-Host "  3. Run database migrations" -ForegroundColor Gray
    Write-Host "  4. Test student/teacher login" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  DEPLOYMENT STATUS: NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Some checks failed. Please review the errors above." -ForegroundColor White
    Write-Host "  Refer to PRODUCTION_SETUP_GUIDE.md for detailed instructions." -ForegroundColor Gray
}
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Helpful commands
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "   Deploy:        vercel --prod" -ForegroundColor Gray
Write-Host "   View logs:     vercel logs" -ForegroundColor Gray
Write-Host "   Open Vercel:   start https://vercel.com/john-kiosk/ojt-portal" -ForegroundColor Gray
$openCmd = "   Open Website:  start " + $WebsiteUrl
Write-Host $openCmd -ForegroundColor Gray
Write-Host ""
