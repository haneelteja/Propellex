# Propellex Platform - Environment Setup Script
# This script creates .env files from examples

Write-Host "🚀 Setting up Propellex environment files..." -ForegroundColor Cyan

# Create backend .env
if (Test-Path "backend\env.example") {
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\env.example" "backend\.env"
        Write-Host "✅ Created backend/.env" -ForegroundColor Green
        
        # Update JWT_SECRET with a generated value
        $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        (Get-Content "backend\.env") -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret" | Set-Content "backend\.env"
        Write-Host "✅ Generated JWT_SECRET" -ForegroundColor Green
    } else {
        Write-Host "⚠️  backend/.env already exists, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ backend/env.example not found!" -ForegroundColor Red
}

# Create frontend .env
if (Test-Path "frontend\.env.example") {
    if (-not (Test-Path "frontend\.env")) {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✅ Created frontend/.env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  frontend/.env already exists, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ frontend/.env.example not found!" -ForegroundColor Red
}

Write-Host "`n✅ Environment setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review backend/.env and update MONGODB_URI if needed" -ForegroundColor White
Write-Host "   2. Run: npm run install:all" -ForegroundColor White
Write-Host "   3. Start MongoDB" -ForegroundColor White
Write-Host "   4. Run: npm run dev" -ForegroundColor White




