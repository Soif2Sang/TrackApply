# Full-Stack TypeScript Boilerplate

A modern, production-ready full-stack boilerplate with authentication, database, and API built in.

## 🚀 Features

- **Authentication** - Better Auth with email/password
- **Database** - PostgreSQL with Drizzle ORM and migrations
- **API** - Type-safe API with tRPC
- **Frontend** - React with TanStack Router and TanStack Query
- **Styling** - Tailwind CSS with shadcn/ui components
- **Type Safety** - Full-stack TypeScript
- **Monorepo** - Turborepo for efficient builds

## 📦 Tech Stack

### Frontend
- React 18
- TanStack Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Vite

### Backend
- Hono
- tRPC
- Better Auth
- Drizzle ORM
- PostgreSQL

## 🏗️ Project Structure

```
.
├── apps/
│   ├── web/           # Frontend application
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── routes/      # Route pages
│   │   │   ├── lib/         # Utilities
│   │   │   └── utils/       # tRPC client
│   │   └── package.json
│   │
│   └── server/        # Backend application
│       ├── src/
│       │   ├── db/          # Database schemas & migrations
│       │   ├── lib/         # Auth & utilities
│       │   ├── routers/     # tRPC routers
│       │   └── index.ts     # Server entry
│       └── package.json
│
├── turbo.json         # Turborepo config
└── package.json       # Root package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- pnpm (recommended) or npm

### Environment Variables

Create `.env` files in both `apps/web` and `apps/server`:

#### `apps/server/.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000/api/auth
CORS_ORIGIN=http://localhost:5173
```

#### `apps/web/.env`
```env
VITE_API_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
cd apps/server
npm run db:push

# Start development servers (from root)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start all apps in development mode
npm run dev:web          # Start frontend only
npm run dev:server       # Start backend only

# Build
npm run build            # Build all apps
npm run build:web        # Build frontend only
npm run build:server     # Build backend only

# Database
cd apps/server
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio
```

## 🔐 Authentication

The boilerplate includes:
- Sign up with email/password
- Sign in with email/password
- Protected routes
- Session management

> **Note:** Password reset is disabled by default. To enable it, implement the `sendResetPassword` function in `apps/server/src/lib/auth.ts` with your email service provider.

## 🗄️ Database

PostgreSQL with Drizzle ORM:
- Type-safe queries
- Schema in code
- Automatic migrations
- Relations support

## 🛣️ Routing

TanStack Router features:
- Type-safe navigation
- Nested routes
- Route guards
- Loading states

## 🎨 UI Components

shadcn/ui components included:
- Beautiful, accessible components
- Fully customizable
- Dark mode support
- Responsive design

## 📚 Adding Features

### Add a new route

1. Create a file in `apps/web/src/routes/`
2. Use `createFileRoute` from TanStack Router
3. Add your component

### Add a new API endpoint

1. Create or update a router in `apps/server/src/routers/`
2. Add procedures (queries or mutations)
3. Export the router and add it to `appRouter` in `index.ts`
4. Use it in frontend with `trpc`

### Add a database table

1. Create a schema in `apps/server/src/db/schema/`
2. Export it in `apps/server/src/db/index.ts`
3. Run `npm run db:push` or generate migrations

## 🚀 Deployment

Build for production:

```bash
npm run build
```

Deploy the apps:
- Frontend: Deploy `apps/web/dist` to Vercel, Netlify, etc.
- Backend: Deploy `apps/server` to any Node.js host

## 📄 License

MIT

## 🤝 Contributing

This is a boilerplate template. Feel free to customize it for your needs!
