$ErrorActionPreference = "SilentlyContinue"

$statusFile = "apps\web\public\git-status.json"

function Update-Status {
    param (
        [string]$Status,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $json = @{
        lastSync = $timestamp
        status = $Status
        message = $Message
    } | ConvertTo-Json
    
    Set-Content -Path $statusFile -Value $json
}

Write-Host "Starting Git Auto-Sync..." -ForegroundColor Cyan
Write-Host "Monitoring for changes in $(Get-Location)..." -ForegroundColor Gray
Write-Host "Status file: $statusFile" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

# Initial status
Update-Status -Status "active" -Message "Monitoring started"

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
            Update-Status -Status "success" -Message "Synced at $timestamp"
        } else {
            Write-Host "Push failed. Retrying in next cycle..." -ForegroundColor Red
            Update-Status -Status "error" -Message "Push failed at $timestamp"
        }
    }
    
    # Wait before next check
    Start-Sleep -Seconds 5
}
