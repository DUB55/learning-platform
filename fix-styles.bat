@echo off
echo Cleaning up Next.js cache...
rmdir /s /q apps\web\.next
rmdir /s /q .turbo

echo Reinstalling dependencies...
call npm install

echo Starting development server...
call npm run dev
