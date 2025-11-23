$ErrorActionPreference = "SilentlyContinue"

Write-Host "Starting Git Auto-Sync..." -ForegroundColor Cyan
Write-Host "Monitoring for changes in $(Get-Location)..." -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

while ($true) {
    # Check for changes
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "`nChanges detected!" -ForegroundColor Green
        
        # Add all changes
        git add .
        
        # Commit with timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $message = "Automated Commit [$timestamp]"
        git commit -m "$message"
        
        # Push to origin
        Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main
        
        if ($?) {
            Write-Host "Successfully synced at $timestamp" -ForegroundColor Green
        } else {
            Write-Host "Push failed. Retrying in next cycle..." -ForegroundColor Red
        }
    }
    
    # Wait before next check
    Start-Sleep -Seconds 5
}
