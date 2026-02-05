# Project Repair Guide

If your application is hanging or stuck in an infinite loading state, follow these steps to perform a "Full Reset". This will clear all temporary caches and re-install dependencies without affecting your source code.

## Important
This process will delete the following folders:
- `node_modules` (in root, `apps/web`, and `apps/api`)
- `.next` (Next.js build cache)
- `.turbo` (Turborepo cache)

## Step-by-Step Instructions

1. **Stop all running processes**: Close your terminal or press `Ctrl + C` in all active terminals.
2. **Run the Repair Script**: Execute the following command in your terminal from the root folder:
   ```powershell
   .\repair-project.ps1
   ```
3. **Wait for completion**: The script will clean up files and run `npm install`.
4. **Restart the app**:
   ```powershell
   npm run dev
   ```

## If problems persist
Check your Supabase environment variables in `apps/web/.env.local` and `apps/api/.env`. If the values are incorrect, the app may hang while trying to connect.
