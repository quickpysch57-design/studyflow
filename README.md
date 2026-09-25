# StudyFlow

An intelligent student workspace that combines study planning, subject management, tasks, exams, notes, focus mode, analytics, and AI-powered study assistance.

## Features

- **Smart Dashboard** - Greeting, today's progress, study plan, upcoming deadlines, subject health
- **Intelligent Planner** - Drag & drop study blocks, automatic scheduling, rescheduling
- **AI Study Planner** - Generate personalized study schedules based on exams, chapters, available hours
- **Subject Management** - Track chapters, progress, study hours, exam dates per subject
- **Chapter Tracking** - Not Started → Learning → Practicing → Completed with progress %
- **Task Management** - Homework, assignments, projects, revision with priorities and filters
- **Exam Center** - Countdown timers, preparation %, syllabus tracking
- **Rich Notes** - TipTap editor with markdown, code blocks, checklists, highlighting
- **AI Study Assistant** - Explain, Quiz, Flashcards, Summary, Study Plan, Practice modes
- **Focus Mode** - Pomodoro timer (25/5, 50/10, 90/15, custom) with session logging
- **Study Streaks** - Contribution calendar, current/longest streak tracking
- **Analytics** - Weekly hours, subject distribution, completion trends, consistency heatmap
- **Calendar** - Month/Week/Day views with exams, tasks, study blocks
- **Notifications** - Exam reminders, task deadlines, study session alerts
- **Global Search** - Search across subjects, chapters, tasks, notes, exams
- **Settings** - Theme, notifications, pomodoro, privacy, account management

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS (custom design system)
- React Router v6
- React Hook Form + Zod
- @dnd-kit (drag & drop)
- @tiptap (rich text editor)
- Recharts (analytics)
- Zustand (state management)
- React Hot Toast (notifications)
- Headless UI (accessible components)
- Heroicons

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication (HttpOnly cookies)
- Zod validation
- OpenAI API (AI Assistant)

### DevOps
- Docker + Docker Compose
- Render/Vercel ready

## Project Structure

```
StudyFlow/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/         # Design system components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts (Auth, Theme)
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities (API, helpers)
│   │   ├── styles/         # Global styles
│   │   └── types/          # TypeScript types
│   └── ...
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Demo data
│   └── ...
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- OpenAI API key (for AI Assistant)

### Option 1: Docker (Recommended)

```bash
# Clone and navigate
cd StudyFlow

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# Start all services
npm run docker:up

# View logs
npm run docker:logs
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

### Option 2: Local Development

```bash
# Install dependencies
npm run install:all

# Set up database (requires PostgreSQL running)
cp backend/.env.example backend/.env
# Edit DATABASE_URL in backend/.env

# Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development servers
npm run dev
```

### Demo Account
After seeding:
- Email: `demo@studyflow.app`
- Password: `password123`

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/studyflow"
JWT_SECRET="your-secret-key-min-32-chars"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
OPENAI_API_KEY="sk-..."
```

## Database Schema

Key models:
- **User** - Profile, preferences, auth
- **Subject** - Name, color, teacher, chapters, exam date
- **Chapter** - Status, progress, study time, revisions
- **Task** - Type, priority, due date, completion
- **Exam** - Date, preparation %, syllabus
- **Note** - Rich content (TipTap JSON), tags, pinning
- **StudySession** - Duration, type, subject/chapter link
- **StudyPlan** - AI-generated schedules with blocks
- **Streak** - Current/longest streak, weekly activity
- **AiConversation/Messages** - Chat history per mode
- **Notification** - Typed notifications with read status

## API Endpoints

```
POST   /api/auth/register           # Register
POST   /api/auth/login              # Login
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Current user

GET    /api/subjects                # List subjects
POST   /api/subjects                # Create subject
PATCH  /api/subjects/:id            # Update subject
DELETE /api/subjects/:id            # Delete subject

GET    /api/chapters                # List chapters
POST   /api/chapters                # Create chapter
PATCH  /api/chapters/:id            # Update chapter

GET    /api/tasks                   # List tasks (with filters)
POST   /api/tasks                   # Create task
PATCH  /api/tasks/:id               # Update task

GET    /api/exams                   # List exams
POST   /api/exams                   # Create exam

GET    /api/notes                   # List notes
POST   /api/notes                   # Create note

GET    /api/study-sessions          # List sessions
POST   /api/study-sessions          # Create session

GET    /api/study-plans             # List plans
POST   /api/study-plans             # Create plan
GET    /api/study-plans/:id/blocks  # Get day blocks

GET    /api/streaks                 # Get streak
POST   /api/streaks/update          # Update streak

GET    /api/ai/conversations        # List conversations
POST   /api/ai/conversations        # Create conversation
POST   /api/ai/conversations/:id/messages  # Send message

GET    /api/analytics               # Get analytics
GET    /api/calendar                # Get calendar events
GET    /api/search                  # Global search
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Global search |
| `⌘N` | Quick add |
| `⌘1-9` | Navigate to page |
| `Esc` | Close modals/panels |

## Design System

### Colors
- Primary: Indigo (`#6366f1`)
- Surface: Slate dark mode palette
- Semantic: Green (success), Yellow (warning), Red (danger)

### Typography
- Display: 4.5rem → 2.25rem
- Heading: 1.875rem → 1.125rem
- Body: 1.125rem → 0.75rem
- Font: Inter + JetBrains Mono

### Spacing
- Base: 4px (0.25rem)
- Scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32

### Border Radius
- sm: 4px, md: 6px, lg: 8px, xl: 12px, 2xl: 16px, 3xl: 24px

### Shadows
- xs → 2xl + glass (backdrop-blur)

## Deployment

### Backend (Render/Railway)
```bash
# Build
npm run build:backend

# Start
npm run start
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build:frontend

# Output: frontend/dist
```

### Database
- Use managed PostgreSQL (Neon, Supabase, Railway, Render)
- Run migrations: `npx prisma migrate deploy`

## Development

### Adding a New Feature
1. Define Prisma schema changes
2. Run `npm run db:migrate`
3. Create API routes in `backend/src/routes/`
4. Create React components in `frontend/src/components/`
5. Add page in `frontend/src/pages/`
6. Register route in `App.tsx`

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Component composition over inheritance
- Server-side validation with Zod
- Optimistic UI updates

## License

MIT License - feel free to use for learning or commercial projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a Pull Request

---

Built with ❤️ for students everywhere.