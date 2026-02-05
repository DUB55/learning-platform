# User Action Items

Follow these steps to finalize the setup and maintain the platform:

## 1. Secrets & Authentication
- [ ] **Supabase Service Role Key**: Update `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env` with your actual service role key from the Supabase dashboard (Settings > API).
- [ ] **Supabase URL Verification**: Ensure `SUPABASE_URL` in `apps/api/.env` matches your project URL.
- [ ] **Web App Env**: Ensure `apps/web/.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Importer Verification
- [ ] **Golden Sample Run**: After adding the key, run the importer with a real sample:
  ```bash
  cd apps/api
  npm run import-studygo -- --path path/to/your/export --commit
  ```
- [ ] **Asset Storage**: Verify that images are correctly appearing in `apps/web/public/assets/studygo` after a commit.

## 3. Deployment
- [ ] **Database Migrations**: If you add new tables or columns, ensure they are applied to your production Supabase instance.
- [ ] **Build Check**: Run `npm run build` in the root to ensure all workspace projects compile without errors before deploying.

## 4. Maintenance
- [ ] **Backup**: Regularly back up your Supabase database.
- [ ] **Audit logs**: Check `import_log.jsonl` in `apps/api` if an import fails.
