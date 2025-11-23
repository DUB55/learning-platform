@echo off
echo Syncing with GitHub...

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed or not in PATH. Please install Git.
    pause
    exit /b
)

:: Initialize if not already
if not exist .git (
    echo Initializing Git repository...
    git init
    git remote add origin https://github.com/DUB55/learning-platform.git
)

:: Add all changes
git add .

:: Commit
set /p commit_msg="Enter commit message: "
git commit -m "%commit_msg%"

:: Push
echo Pushing to GitHub...
git push -u origin main

echo Done!
pause
