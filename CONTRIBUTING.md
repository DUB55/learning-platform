# Contributing to LearnHub

Thank you for your interest in contributing to the LearnHub Learning Platform! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account
- Code editor (VS Code recommended)

### Development Setup

1. **Fork and clone the repository**
```bash
git clone <your-fork-url>
cd learning-platform
```

2. **Install dependencies**
```bash
npm run setup
```

3. **Configure environment**
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase credentials
```

4. **Start development server**
```bash
npm run web:dev
```

## 📋 Development Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/doc-update` - Documentation updates
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```bash
feat(gamification): add XP progress indicator to sidebar
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
refactor(ui): extract reusable Button component
```

### Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/my-new-feature
```

2. **Make your changes**
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

3. **Test your changes**
```bash
npm run web:lint
npm run web:type-check
# Manual testing
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add my new feature"
```

5. **Push to your fork**
```bash
git push origin feature/my-new-feature
```

6. **Create a Pull Request**
- Use a descriptive title
- Explain what changes were made and why
- Reference any related issues
- Add screenshots for UI changes

## 🎨 Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types when needed

### React Components
- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use proper prop types

### File Organization
```
app/
  feature-name/
    page.tsx              # Main page
    components/           # Feature-specific components
    hooks/                # Feature-specific hooks
    
components/
  shared/                 # Reusable components
  
lib/
  services/               # API services
  utils/                  # Utility functions
```

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case for non-components (`auth-utils.ts`)

### CSS/Tailwind
- Use Tailwind utility classes
- Follow existing design system
- Use glass morphism pattern for cards
- Maintain consistent spacing

## 🗄️ Database Changes

### Adding New Tables

1. **Create SQL schema file**
```sql
-- new_feature_schema.sql
create table my_table (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  -- columns
  created_at timestamptz default now()
);

-- Enable RLS
alter table my_table enable row level security;

-- Create policies
create policy "Users can view own data"
  on my_table for select
  using (auth.uid() = user_id);
```

2. **Update database.types.ts**
```typescript
my_table: {
  Row: {
    id: string
    user_id: string
    // ...
  }
  Insert: { /* ... */ }
  Update: { /* ... */ }
}
```

3. **Document in schema file**
- Add comments explaining purpose
- Document any special RLS rules

## 🧪 Testing Guidelines

### Manual Testing
- Test all user flows
- Verify RLS policies work
- Check responsive design
- Test error states

### What to Test
- [ ] Feature works as expected
- [ ] Error handling is proper
- [ ] Loading states display
- [ ] Toast notifications work
- [ ] Mobile responsive
- [ ] No console errors

## 📖 Documentation

### When to Update Docs
- Adding new features
- Changing existing behavior
- Adding new dependencies
- Updating environment variables

### Where to Update
- `README.md` - Project overview
- `DEVELOPMENT.md` - Developer guide
- `QUICK_REFERENCE.md` - Common tasks
- `CHANGELOG.md` - Version history

## 🐛 Reporting Bugs

### Bug Reports Should Include
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: OS, browser, Node version

### Example Bug Report
```markdown
**Description**
XP progress bar doesn't update after completing a test.

**Steps to Reproduce**
1. Complete a practice test
2. Navigate to profile page
3. Check XP progress bar

**Expected**
Progress bar should show new XP total

**Actual**
Progress bar shows old value until page refresh

**Environment**
- OS: Windows 11
- Browser: Chrome 120
- Node: 18.17.0
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should we solve it?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Screenshots, mockups, examples
```

## 🔍 Code Review Guidelines

### As a Reviewer
- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve when ready, request changes if needed
- Test the changes if possible

### As a Contributor
- Respond to feedback promptly
- Ask questions if unclear
- Make requested changes
- Mark conversations as resolved

## 🎯 Priority Levels

### High Priority
- Security vulnerabilities
- Data loss bugs
- Critical functionality broken
- Performance issues affecting users

### Medium Priority
- Feature requests
- UI improvements
- Documentation updates
- Code refactoring

### Low Priority
- Nice-to-have features
- Minor UI tweaks
- Code style improvements

## 📞 Communication

### Where to Ask Questions
- GitHub Issues - Bug reports, feature requests
- GitHub Discussions - General questions
- Pull Request comments - Code-specific questions

### Response Time
- We aim to respond within 48 hours
- Complex issues may take longer

## ✅ Checklist Before Submitting

- [ ] Code follows style guidelines
- [ ] TypeScript types are proper
- [ ] No console.log statements left
- [ ] Tested manually
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Screenshots included for UI changes

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Appreciated in the community!

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to LearnHub!** 🎉

Questions? Check [DEVELOPMENT.md](./DEVELOPMENT.md) or open a discussion.
