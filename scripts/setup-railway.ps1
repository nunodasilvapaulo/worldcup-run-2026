# Railway deploy helper for World Cup Run 2026 (Windows PowerShell)
# Run from repo root: .\scripts\setup-railway.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "`n=== World Cup Run 2026 — Railway setup ===`n" -ForegroundColor Cyan

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
  npm install -g @railway/cli
}

Write-Host "Step 1: Log in (browser will open)" -ForegroundColor Green
railway login

Write-Host "`nStep 2: Create or link project" -ForegroundColor Green
railway init

Write-Host "`nStep 3: Deploy" -ForegroundColor Green
railway up

Write-Host "`nStep 4: Add persistent volume for SQLite saves" -ForegroundColor Green
railway volume add --mount-path /app/data

Write-Host "`nStep 5: Set environment variables" -ForegroundColor Green
railway variables set DATABASE_PATH=/app/data/worldcup.db NODE_ENV=production

Write-Host "`nStep 6: Create public domain" -ForegroundColor Green
railway domain

Write-Host "`nDone. Test: <your-domain>/api/health should return {`"ok`":true}`n" -ForegroundColor Cyan
