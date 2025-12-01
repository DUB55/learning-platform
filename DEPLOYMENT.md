# Deployment Checklist

## Pre-Deployment Steps

### 1. Install Required Packages ✅
```bash
cd c:\Users\Mohammed3\Downloads\Projects\learning-platform
npm install
npm install --workspace apps/web pptxgenjs
```

### 2. Database Setup ✅
Execute these SQL files in Supabase SQL Editor (in order):

**Core System:**
- [ ] `phase1_schema.sql` - Users, profiles, settings
- [ ] `phase3_schema.sql` - Subjects, units, chapters
- [ ] `phase5_admin_permissions_schema.sql` - Admin system
- [ ] `phase6_resource_management_schema.sql` - Resources
- [ ] `phase7_announcements_schema.sql` - Announcements
- [ ] `phase8_document_system_schema.sql` - Documents

**Phase 9 - AI & Gamification:**
- [ ] `phase9_ai_chat_schema.sql` - AI chat
- [ ] `phase9_practice_test_schema.sql` - Practice tests
- [ ] `phase9_study_plan_schema.sql` - Study plans
- [ ] `phase9_gamification_schema.sql` - XP & achievements

### 3. Environment Configuration ✅
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Create Admin User ✅
After first signup, run in Supabase SQL Editor:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE user_id = 'your-user-uuid';
```

---

## Testing Phase

### Functional Testing
- [ ] User registration works
- [ ] Login/logout works
- [ ] Create subject → unit → chapter
- [ ] Create learning set with flashcards
- [ ] Upload and view documents
- [ ] Create and manage tasks
- [ ] View calendar

### AI Features Testing
- [ ] AI Chat: Create chat, send messages, view history
- [ ] Practice Tests: Generate test, take test, see score
- [ ] Study Plans: Create plan, mark sessions complete
- [ ] AI PPT: Generate presentation, edit slides, download

### Gamification Testing
- [ ] Complete test → verify XP awarded
- [ ] Check XP display in sidebar
- [ ] View profile → see achievements
- [ ] Complete activity → verify streak updates
- [ ] Unlock achievement → verify display

### UI/UX Testing
- [ ] Sidebar navigation works
- [ ] XP progress card displays correctly
- [ ] Toast notifications appear
- [ ] Loading states show properly
- [ ] Responsive design works on mobile

---

## Production Deployment

### Vercel Deployment (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
cd c:\Users\Mohammed3\Downloads\Projects\learning-platform
vercel --prod
```

**Step 4: Configure Environment Variables**
In Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Alternative: Manual Build

```bash
# Build production bundle
npm run build --workspace apps/web

# Test production build locally
npm start --workspace apps/web
```

---

## Post-Deployment

### Verification Checklist
- [ ] Homepage loads correctly
- [ ] Login system works
- [ ] All routes are accessible
- [ ] AI features respond (check API limits)
- [ ] Database queries work
- [ ] RLS policies enforce correctly
- [ ] Images and assets load

### Performance Check
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors

### Security Audit
- [ ] All environment variables set correctly
- [ ] RLS policies tested
- [ ] No sensitive data exposed
- [ ] CORS configured properly
- [ ] Authentication flows secure

---

## Monitoring Setup (Optional)

### Supabase Dashboard
- Monitor database usage
- Check API request counts
- Review error logs
- Set up alerts for usage thresholds

### Vercel Analytics
- Enable Web Analytics
- Track page views
- Monitor performance metrics
- Review Edge Function logs

---

## Rollback Plan

If issues arise:

**1. Vercel Rollback**
```bash
vercel rollback
```

**2. Database Rollback**
- Keep backup of previous schema
- Have restore script ready

**3. Environment Rollback**
- Keep copy of working .env values
- Document any changes

---

## Success Criteria

✅ All features working in production
✅ No critical errors in logs
✅ Performance meets targets
✅ Users can sign up and use platform
✅ AI features respond correctly
✅ Gamification tracks properly
✅ Admin functions accessible

---

## Next Steps After Deployment

1. **User Acceptance Testing**
   - Invite beta users
   - Collect feedback
   - Document issues

2. **Performance Optimization**
   - Monitor slow queries
   - Optimize bundle size
   - Add caching where needed

3. **Feature Enhancements**
   - Review ui_improvements.md
   - Plan Phase 10 features
   - Prioritize based on feedback

4. **Documentation Updates**
   - Update README with production URL
   - Add user guide
   - Create admin documentation

---

## Support Resources

- **Documentation**: See README.md and DEVELOPMENT.md
- **Quick Reference**: See QUICK_REFERENCE.md
- **Troubleshooting**: See diagnostic_report.md
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Ready to Deploy?** ✅ Yes, when all Pre-Deployment steps are complete!
**Estimated Time**: 30-45 minutes for full deployment
**Difficulty**: Intermediate

Good luck with your deployment! 🚀
