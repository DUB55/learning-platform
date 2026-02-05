# Deep Clean & Repair Script for Learning Platform
Write-Host "Starting deep clean..."

# 1. Stop Node processes
Write-Host "Stopping Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Cleanup folders
$folders = @(
    "node_modules",
    "apps/web/node_modules",
    "apps/api/node_modules",
    "apps/web/.next",
    ".turbo"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "Deleting $folder..."
        Remove-Item -Recurse -Force $folder
    }
}

# 3. Clear npm cache
Write-Host "Cleaning npm cache..."
npm cache clean --force

# 4. Re-install
Write-Host "Re-installing dependencies (this may take a few minutes)..."
npm install

Write-Host "Repair complete! You can now run 'npm run dev'" -ForegroundColor Green
