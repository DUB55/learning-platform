# Leerplatform - AI-Powered Learning Platform

Complete learning platform with AI integration, spaced repetition, and comprehensive study tools.

## Features

- **Spaced Repetition System (SRS)** - SM-2 algorithm for optimal learning
- **AI Integration** - DUB5 AI for summaries, flashcard generation, tutoring, and planning
- **Subject Management** - Organize content by subjects, chapters, and paragraphs
- **Admin Tools** - Bulk import, content management, real-time updates
- **Study Modes** - Flashcards, writing mode, MCQ, test mode
- **Planner & Calendar** - Study planning with AI assistance
- **Real-time Sync** - Supabase Realtime for instant updates

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: DUB5 AI (https://chatbot-beta-weld.vercel.app/api/chatbot)
- **Hosting**: Vercel (frontend & API)
- **Auth**: Supabase Auth (Email/Password + Google OAuth)

## Setup Instructions

### Prerequisites

- Node.js 18+
- GitHub account
- Supabase account
- Vercel account
- Google Cloud account (for OAuth)

### 1. Repository Setup

```bash
git clone https://github.com/YOUR_USERNAME/leren-platform.git
cd leren-platform
npm install
```

### 2. Supabase Setup

1. Create project at https://supabase.com/dashboard/new
2. Go to Project Settings → API
3. Copy:
   - Project URL
   - Anon/Public key
   - Service role key (keep secret!)
4. Run the migration SQL from `scripts/migrate.sql` in SQL Editor
5. Enable Realtime for tables: leersets, leersetitems, srscards

### 3. Google OAuth Setup

1. Create project at https://console.cloud.google.com
2. Configure OAuth consent screen
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase: Authentication → Providers → Google → Enable and paste credentials

### 4. Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create `apps/api/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 5. Development

```bash
# Start frontend
cd apps/web
npm run dev

# Start API (separate terminal)
cd apps/api
npm run dev
```

### 6. Vercel Deployment

1. Import GitHub repo to Vercel
2. Set root directory: `apps/web`
3. Add environment variables (same as .env.local)
4. **IMPORTANT**: Settings → Environment Variables → Disable "Automatically expose System Environment Variables"
5. Deploy!

## Usage

### Admin Features

- Create subjects, chapters, and paragraphs
- Import leersets via text paste (format: "term definition" per line)
- Generate flashcards using AI from any text
- Manage all content with real-time updates

### Student Features

- Study with SRS flashcards (adaptive scheduling)
- Chat with AI tutor for help
- View due cards and study progress
- Plan study schedule with AI assistance
- Track confidence levels per subject

## Architecture

```
leren-platform/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared types/utils
└── scripts/
    └── migrate.sql   # Database schema
```

## API Endpoints

- `POST /api/leersets/import-text` - Import leerset items
- `GET /api/srs/due` - Get due flashcards
- `POST /api/srs/review` - Submit review result
- `POST /api/ai/summarize` - Generate summary
- `POST /api/ai/generate-flashcards` - Generate flashcards from context
- `POST /api/ai/planner/generate` - Generate study plan

## DUB5 AI Integration

All AI functionality uses DUB5 AI endpoint: `https://chatbot-beta-weld.vercel.app/api/chatbot`

- Streaming chat for tutoring
- One-shot tasks: summarize, generate, translate, extract
- Progressive rendering in UI
- Abort/retry support

## Security

- RLS policies on all Supabase tables
- Service role key never exposed to client
- CORS protection
- Input validation
- Rate limiting (recommended in production)

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
