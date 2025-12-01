# Development Guide

## Quick Start Commands

```bash
# Install all dependencies
npm install

# Install pptxgenjs for PPT generation
npm install --workspace apps/web pptxgenjs

# Start development server
npm run dev --workspace apps/web

# Build for production
npm run build --workspace apps/web

# Start production server
npm start --workspace apps/web
```

## Environment Setup

### Required Environment Variables

Create `apps/web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics, etc.
# NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## Database Setup Workflow

### 1. Initial Setup
Execute schemas in Supabase SQL Editor in this exact order:

```sql
-- 1. Core authentication and profiles
\i phase1_schema.sql

-- 2. Learning content structure
\i phase3_schema.sql

-- 3. Admin system
\i phase5_admin_permissions_schema.sql

-- 4. Resource management
\i phase6_resource_management_schema.sql

-- 5. Announcements
\i phase7_announcements_schema.sql

-- 6. Document system
\i phase8_document_system_schema.sql

-- 7. AI Chat
\i phase9_ai_chat_schema.sql

-- 8. Practice Tests
\i phase9_practice_test_schema.sql

-- 9. Study Plans
\i phase9_study_plan_schema.sql

-- 10. Gamification
\i phase9_gamification_schema.sql
```

### 2. Create First Admin User

After signup, run in Supabase SQL Editor:

```sql
UPDATE profiles
SET is_admin = true
WHERE user_id = 'your-user-uuid';
```

## Development Workflow

### Adding New Features

1. **Update task.md** - Add new task items
2. **Create schema** (if needed) - Add new tables/policies
3. **Update database.types.ts** - Add TypeScript types
4. **Create components** - Build UI components
5. **Add routes** - Create Next.js pages
6. **Update Sidebar** - Add navigation links
7. **Test thoroughly** - Manual testing
8. **Update documentation** - README, walkthrough

### Code Organization Best Practices

```
app/
  feature-name/
    page.tsx           # Main page component
    components/        # Feature-specific components
    hooks/             # Feature-specific hooks
    
components/
  shared/              # Reusable components
  
lib/
  services/            # API services
  utils/               # Utility functions
  types/               # TypeScript types
```

## Common Tasks

### Add a New Database Table

1. Create SQL schema with RLS policies:
```sql
create table my_new_table (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  -- ... other columns
);

alter table my_new_table enable row level security;

create policy "Users can view own rows"
  on my_new_table for select
  using (auth.uid() = user_id);
```

2. Update `database.types.ts`:
```typescript
my_new_table: {
  Row: {
    id: string
    user_id: string
    // ...
  }
  Insert: {
    id?: string
    user_id: string
    // ...
  }
  Update: {
    // ...
  }
}
```

### Add a New Page

1. Create file: `app/my-page/page.tsx`
2. Add to Sidebar.tsx
3. Test navigation

### Integrate XP Rewards

```typescript
import { xpService } from '@/lib/xpService';

// Award XP
await xpService.awardXP(
  userId, 
  amount, 
  'reason', 
  referenceId
);

// Update streak
await xpService.updateStreak(userId);

// Unlock achievement
await xpService.unlockAchievement(userId, 'achievement_key');
```

## Debugging Tips

### Common Issues

**Issue**: Supabase RLS denies access
- Check user is authenticated
- Verify RLS policies match user_id
- Check policy allows the operation (select/insert/update/delete)

**Issue**: TypeScript errors
- Run `npm run type-check`
- Ensure `database.types.ts` is up to date
- Check for duplicate type definitions

**Issue**: AI features not working
- Verify Dub5 AI API endpoint is accessible
- Check network tab for API errors
- Ensure proper JSON parsing in responses

**Issue**: XP not updating
- Check user_xp table exists
- Verify xpService methods are awaited
- Check console for errors
- Ensure user_id is correct

### Useful Debug Commands

```bash
# Check TypeScript errors
npm run type-check --workspace apps/web

# Check for lint errors
npm run lint --workspace apps/web

# View build output
npm run build --workspace apps/web

# Clear Next.js cache
rm -rf apps/web/.next
```

## Performance Optimization

### Best Practices
- Use `React.memo` for expensive components
- Implement pagination for large lists
- Use Next.js Image component for images
- Enable Supabase connection pooling
- Add proper indexes to database queries

### Monitoring
- Check Supabase dashboard for slow queries
- Monitor bundle size with Next.js build output
- Use React DevTools Profiler in development

## Security Checklist

- [ ] All tables have RLS policies enabled
- [ ] API routes validate user authentication
- [ ] User inputs are sanitized
- [ ] Sensitive data is not exposed in client
- [ ] Environment variables are properly secured
- [ ] CORS is configured correctly

## Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Production)
Set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Migration
- Execute new schemas in production Supabase
- Always test in staging first
- Back up database before migrations

## Troubleshooting

### Database Connection Issues
1. Check Supabase project status
2. Verify environment variables
3. Check API key permissions

### Build Failures
1. Clear `.next` directory
2. Delete `node_modules` and reinstall
3. Check for TypeScript errors
4. Verify all imports are correct

### Runtime Errors
1. Check browser console
2. Verify API responses
3. Check Supabase logs
4. Enable verbose logging

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

---

For questions or issues, refer to:
- `walkthrough.md` - Implementation details
- `diagnostic_report.md` - System health
- `ui_improvements.md` - Enhancement ideas
