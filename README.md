# LearnHub - AI-Powered Learning Platform

A comprehensive learning management platform with AI-powered features, gamification, and real-time collaboration tools.

## 🚀 Features

### Core Learning Features
- **Subject Management** - Organize courses into subjects, units, and chapters
- **Learning Sets** - Create and study with flashcard-based learning sets
- **Document System** - Upload and manage study materials
- **Calendar Integration** - Schedule and track learning activities
- **Task Management** - Organize assignments and study tasks

### AI-Powered Tools
- **AI Chat Assistant** - Real-time streaming chat with Dub5 AI
- **Practice Test Generator** - AI-generated quizzes from study materials
- **Study Plan Generator** - Personalized study schedules
- **AI PowerPoint Generator** - Create presentations from topics
- **AI Learning Set Generation** - Extract flashcards from text

### Gamification System
- **XP & Leveling** - Earn experience points for activities
- **Achievements** - 10+ unlockable achievements
- **Daily Streaks** - Track consecutive study days
- **Leaderboard Ready** - Foundation for competitive features
- **Profile Stats** - Comprehensive statistics dashboard

### Admin Features
- **User Management** - Admin permissions and overrides
- **Git Sync** - Connect to GitHub for content management
- **Announcements** - System-wide notifications
- **Resource Sharing** - Centralized file and link management

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **AI Integration**: Dub5 AI API
- **Icons**: Lucide React
- **Presentations**: pptxgenjs

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd learning-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Install workspace-specific packages**
```bash
npm install --workspace apps/web pptxgenjs
```

4. **Configure environment variables**

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Set up database**

Execute the SQL schemas in Supabase SQL Editor in this order:
- `phase1_schema.sql` - Core tables
- `phase3_schema.sql` - Learning content
- `phase5_admin_permissions_schema.sql` - Admin system
- `phase6_resource_management_schema.sql` - Resources
- `phase7_announcements_schema.sql` - Announcements
- `phase8_document_system_schema.sql` - Documents
- `phase9_ai_chat_schema.sql` - AI Chat
- `phase9_practice_test_schema.sql` - Practice Tests
- `phase9_study_plan_schema.sql` - Study Plans
- `phase9_gamification_schema.sql` - XP & Achievements

6. **Run development server**
```bash
npm run dev --workspace apps/web
```

7. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
learning-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/     # React components
│       │   ├── contexts/       # React contexts
│       │   ├── hooks/          # Custom hooks
│       │   └── lib/            # Utilities & services
│       └── public/             # Static assets
├── supabase/
│   └── schema.sql              # Database schema
└── packages/                   # Shared packages (if any)
```

## 🎮 Gamification System

### XP Awards
- **Test Completion**: 20 base XP + up to 30 bonus (based on score)
- **Daily Activity**: Streak tracking
- **Achievement Unlocks**: Varies by achievement

### Level Calculation
```
Level = floor(√(Total_XP / 100)) + 1
```

### Achievements
- 🎯 First Test (50 XP)
- 🏆 Test Master - 10 tests (200 XP)
- 💯 Perfect Score (100 XP)
- 🔥 3-Day Streak (75 XP)
- ⚡ 7-Day Streak (150 XP)
- 🌟 30-Day Streak (500 XP)
- And more...

## 🔐 Security

### Row Level Security (RLS)
All tables use Supabase RLS policies to ensure:
- Users only access their own data
- Admins have appropriate elevated permissions
- Public resources are properly scoped

### Authentication
- Email/password authentication via Supabase
- Secure session management
- Protected routes with middleware

## 🎨 UI/UX Features

### Design System
- **Glass morphism** effects
- **Gradient accents** for visual hierarchy
- **Smooth animations** and transitions
- **Dark theme** optimized
- **Responsive design** (mobile-ready)

### Components
- Toast notifications for feedback
- Loading states on all async operations
- Error boundaries for graceful failures
- Skeleton loaders for better perceived performance

## 📊 Database Schema

### Key Tables
- `users` & `profiles` - User data
- `subjects`, `units`, `chapters` - Content hierarchy
- `learning_sets`, `flashcard_items` - Flashcards
- `ai_chats`, `ai_messages` - AI conversations
- `practice_tests`, `practice_test_questions` - Tests
- `study_plans`, `study_plan_events` - Study schedules
- `user_xp`, `achievements`, `user_achievements` - Gamification
- `daily_streaks`, `xp_transactions` - Activity tracking

## 🧪 Testing

### Manual Testing Checklist
See `complete_testing_guide.md` for comprehensive testing instructions.

### Key Flows to Test
1. User registration and login
2. Create subject → unit → chapter → learning set
3. Generate and take a practice test
4. Create a study plan
5. Chat with AI assistant
6. Check profile for XP and achievements

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components focused and reusable

### File Organization
- Group related files together
- Use index files for clean imports
- Keep utilities in `lib/`
- Store types in `database.types.ts`

## 🚧 Known Issues & Limitations

### Pending Actions
- [ ] Install pptxgenjs library
- [ ] Execute all database schemas in production
- [ ] Configure production environment variables

### Future Enhancements
See `ui_improvements.md` for detailed recommendations:
- Notification system
- Mobile app version
- Offline support
- Advanced analytics
- Social features

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

### Commit Messages
Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## 📖 Documentation

### Key Resources
- `walkthrough.md` - Phase 9 implementation details
- `diagnostic_report.md` - Code health and status
- `ui_improvements.md` - UI/UX enhancement guide
- `task.md` - Development checklist
- `deferred_commands.md` - Pending installations

## 🔗 Links

- **Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)
- **Dub5 AI API**: [https://chatbot-beta-weld.vercel.app/api/chatbot](https://chatbot-beta-weld.vercel.app/api/chatbot)

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

---

**Version**: 1.0.0 (Phase 9 Complete)
**Last Updated**: 2025-11-25
