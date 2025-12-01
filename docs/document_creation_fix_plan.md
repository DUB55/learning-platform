# 📋 Plan to Eliminate the `null value in column "user_id"` Error

## 🎯 Goal
Reduce the probability of the *Failed to create document: null value in column "user_id"* error to **< 3 %** and make the sidebar buttons (Toggle, Settings, Sign Out) reliably appear **directly below the Git Sync button**.

---

## ✅ What has already been done
1. **Sidebar layout fixed** – removed the `mt-auto` class so the footer (Toggle, Settings, Sign Out) is rendered immediately after the navigation list, guaranteeing the correct order regardless of page height.
2. **Document‑creation code updated** – the `created_by` field was renamed to `user_id` in the primary document‑creation component.
3. **SQL migration drafted** – a migration that adds/renames the column, back‑fills missing values, and adds a trigger to reject null inserts.

---

## 📋 Complete Action Plan
### 1️⃣ Database – Supabase (Web UI) **(Critical)**
| Step | Action | Exact SQL to paste in the Supabase SQL editor | Expected Result |
|------|--------|-----------------------------------------------|-----------------|
| **1.1** | **Add/Rename column** (if `created_by` still exists) | ```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='created_by') THEN
    ALTER TABLE documents RENAME COLUMN created_by TO user_id;
  END IF;
END $$;

ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;
``` | `user_id` column exists, non‑null constraint applied. |
| **1.2** | **Back‑fill any NULL values** (covers older rows) | ```sql
UPDATE documents SET user_id = 'unknown_user' WHERE user_id IS NULL;
``` | No rows have `NULL` in `user_id`. |
| **1.3** | **Add a safety trigger** – aborts inserts without `user_id` | ```sql
CREATE OR REPLACE FUNCTION documents_user_id_check()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'documents.user_id cannot be NULL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_user_id_check ON documents;
CREATE TRIGGER trg_documents_user_id_check
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION documents_user_id_check();
``` | Any future insert missing `user_id` will throw a clear error, preventing silent failures. |
| **1.4** | **Verify** – run a quick SELECT to ensure integrity | ```sql
SELECT COUNT(*) AS null_user_id FROM documents WHERE user_id IS NULL;
``` | Result should be `0`. |

**How to run the steps**
1. Open your Supabase project → **SQL editor**.
2. Paste each block **one at a time**, clicking **Run** after each.
3. After step 1.4, confirm the count is `0` before proceeding.
4. (Optional) Refresh the **Table editor** for `documents` to see the new column.

---

### 2️⃣ Front‑end – Codebase
| Step | File | Change | Reason |
|------|------|--------|--------|
| **2.1** | `src/app/subjects/[id]/units/[unitId]/paragraphs/[paragraphId]/documents/create/page.tsx` | Ensure payload includes `user_id: user.id` (already done). | Guarantees the correct column is populated. |
| **2.2** | **Search globally** for any `created_by` usage in Supabase inserts and replace with `user_id`. | `grep -R "created_by" apps/web/src` → edit each occurrence. | Removes hidden sources of the error. |
| **2.3** | **Update TypeScript types** (`Document` interface) to reflect `user_id: string`. | Keeps the type system aligned. |
| **2.4** | **Add defensive check** before insert (already present). Example: `if (!user?.id) throw new Error('User not logged in');` | Prevents attempts to insert without a user. |
| **2.5** | **Wrap Supabase calls in try/catch** and surface a user‑friendly toast on error. | Improves UX and logs the exact error for debugging. |

**Run lint & type‑check** after changes:
```bash
npm run lint
npm run type-check   # or tsc --noEmit
```
All warnings about `created_by` should disappear.

---

### 3️⃣ Testing (Automation)
1. **Unit test** – mock Supabase insert and assert the payload contains `user_id`.
2. **Integration test** – spin up a temporary Supabase instance (or use the dev project) and run a real insert; verify the row appears with a non‑null `user_id`.
3. **E2E test** – using Playwright, log in, create a document via the UI, and assert no error toast appears.
4. Add these tests to CI; the pipeline must **fail** if any test breaks.

---

### 4️⃣ CI / Guardrails
- **SQL schema diff** step in CI (`supabase db diff`) – fail if `user_id` column is missing or nullable.
- **Lint rule** – create a custom ESLint rule (or a simple grep) that flags `created_by` in any Supabase insert.
- **Post‑deploy smoke test** – run the integration test after every deployment.

---

### 5️⃣ Monitoring & Alerts
| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Supabase error `documents.user_id cannot be NULL` | Supabase logs → Slack/Webhook | > 0 occurrences in 1 hour |
| Front‑end toast “Failed to create document” | Sentry (or custom logger) | > 1 per hour |
| DB rows with `NULL` `user_id` | Daily cron query (see step 1.4) | Any rows found |

---

## 📂 Where to place this plan
The file has been created at:
```
C:/Users/Mohammed3/Downloads/Projects/learning-platform/docs/document_creation_fix_plan.md
```
Feel free to move it to any documentation folder you prefer.

---

### 🎉 Summary
- **Sidebar**: Fixed layout by removing `mt-auto`; toggle, settings, and sign‑out now sit directly under Git Sync.
- **Database**: Run the four SQL blocks in Supabase UI to enforce a non‑null `user_id` and add a protective trigger.
- **Code**: Ensure all inserts use `user_id`, update types, add defensive checks, and run lint.
- **Testing & CI**: Add unit, integration, and E2E tests plus schema‑diff guard.
- **Monitoring**: Set up alerts for any null‑user inserts.

Following these steps will bring the error‑rate well below **3 %** and give you confidence that the issue is caught early.

---

*Let me know if you need any of the test files generated or further clarification on any step.*
