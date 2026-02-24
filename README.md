# Pleroma – AI Syllabus Generator

Generate structured educational syllabuses and lessons using OpenAI. Built with Next.js (App Router), Drizzle ORM, Postgres, and the Vercel AI SDK.

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env.local` file:

```env
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=sk-...
APP_BASE_URL=http://localhost:3000
```

Use any Postgres instance (Neon, Supabase, local Docker, etc).

### 3. Run database migrations

```bash
# Push schema directly (fastest for development):
pnpm db:push

# Or generate + apply migrations:
pnpm db:generate
pnpm db:migrate
```

### 4. Start dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Fill in a project/syllabus brief, select a learner level, and optionally add constraints.
2. Click **Generate Outline** — an AI-generated syllabus with 10–25 lessons appears.
3. On the syllabus page, click **Generate next lesson** or generate individual lessons.
4. Click **Open** on any ready lesson to read the full Markdown-rendered content.

## Tech Stack

- **Next.js 16** (App Router, Server Components)
- **Drizzle ORM** + Postgres (Neon)
- **Vercel AI SDK** + OpenAI (`gpt-4o-mini`)
- **react-markdown** + **remark-gfm** for Markdown rendering
- **Tailwind CSS** + `@tailwindcss/typography` for prose styling

## Deploy to Vercel

1. Push the repo to GitHub/GitLab.
2. Import in Vercel.
3. Add a Postgres database (Vercel Postgres or Neon integration).
4. Set environment variables: `DATABASE_URL`, `OPENAI_API_KEY`.
5. The database schema is pushed automatically if you run `pnpm db:push` before deploying, or you can add it as a build step.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate SQL migrations from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema directly (dev shortcut) |
| `pnpm db:studio` | Open Drizzle Studio |
