# Stocket — Stock Market Intelligence Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Background%20Jobs-0D0D0D?logo=inngest&logoColor=white)](https://www.inngest.com/)
[![TradingView](https://img.shields.io/badge/TradingView-Widgets-2962FF?logo=tradingview&logoColor=white)](https://www.tradingview.com/widget/)

A full-stack market intelligence platform built with Next.js 15 App Router. Stocket lets investors track stocks, visualize live market data, and receive AI-personalized daily news summaries — all in one place.

---

## Features

- **Market Intelligence Dashboard** — Four TradingView widgets (market overview, S&P 500 heatmap, top stories feed, live quotes table) rendered as a server-first, zero-fetch-on-mount page.
- **Stock Detail Pages** — Per-symbol view with a candlestick chart, baseline chart, technical analysis gauge, company profile, and financials, all driven by dynamic TradingView embeds.
- **Cmd+K Search Palette** — Debounced command palette powered by Finnhub's search API. Falls back to the top 10 popular stocks when the query is empty. Each result includes an inline watchlist toggle.
- **Personalized Watchlist** — Add and remove stocks with optimistic UI. The watchlist table surfaces live price, daily change (color-coded), market cap, and P/E ratio fetched in parallel from Finnhub.
- **Secure Authentication** — Email/password auth via Better Auth with MongoDB persistence. Route groups enforce session checks at the layout level — no page-level guard duplication.
- **AI-Personalized Welcome Email** — On sign-up, an Inngest function calls Gemini 2.5 Flash Lite to generate a personalized onboarding email tailored to the user's investment goals, risk tolerance, and preferred industry.
- **Daily AI Market Digest** — A daily cron (12:00 UTC) fetches watchlist-specific news from Finnhub, summarizes it with Gemini, and emails each user a formatted HTML digest via Gmail SMTP.

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| Next.js (App Router) | 15.x | SSR, RSC, Server Actions, routing |
| React | 19.x | UI rendering, `cache()` deduplication |
| TypeScript | 5.x | Full type safety, global type declarations |
| Tailwind CSS | 4.x | Utility-first styling |
| Radix UI | various | Accessible component primitives |
| cmdk | 1.x | Command palette |
| react-hook-form | 7.x | Form state and validation |
| sonner | 2.x | Toast notifications |
| TradingView Widgets | — | Embedded charting via script injection |

### Data and Auth

| Technology | Version | Role |
|---|---|---|
| MongoDB (Atlas) | 6.x | Primary database |
| Mongoose | 8.x | ODM for watchlist model |
| Better Auth | 1.x | Session management, password hashing, MongoDB adapter |
| Finnhub API | — | Real-time quotes, profiles, metrics, news |

### Automation and AI

| Technology | Version | Role |
|---|---|---|
| Inngest | 3.x | Event-driven functions, cron scheduling, durable steps |
| Google Gemini 2.5 Flash Lite | — | AI email personalization and news summarization |
| Nodemailer | 7.x | Gmail SMTP email delivery |

---

## Architecture

### High-Level Flow

```
Browser
  │
  ├─ Page Request ──────────────▶ Next.js Server Component
  │                                  ├─ Session guard (layout-level)
  │                                  ├─ Finnhub API (cached per data type)
  │                                  └─ MongoDB (watchlist, session)
  │
  ├─ Form Submit / Mutation ────▶ Server Action ('use server')
  │                                  ├─ Better Auth (sign-in / sign-up / sign-out)
  │                                  ├─ Mongoose (watchlist add/remove)
  │                                  └─ Inngest.send() on sign-up
  │
  └─ TradingView Widgets ───────▶ Client-side script injection (no API key required)

Inngest Platform
  ├─ Event: app/user.created ──▶ sendSignUpEmail
  │                                  ├─ step.ai.infer (Gemini) → personalized intro
  │                                  └─ Nodemailer → welcome email
  │
  └─ Cron: 0 12 * * * ─────────▶ sendDailyNewsSummary
                                     ├─ Fetch all users from MongoDB
                                     ├─ Fetch watchlist symbols per user
                                     ├─ Finnhub company/general news
                                     ├─ step.ai.infer (Gemini) → HTML digest per user
                                     └─ Nodemailer → send emails in parallel
```

### Key Engineering Decisions

- **Server-first data fetching** — Server Components fetch all initial data (session, Finnhub, watchlist) before HTML is sent to the browser. Client Components receive pre-populated props, eliminating loading spinners on first render.
- **Tiered fetch caching** — Each Finnhub endpoint uses a purpose-matched caching strategy: live quotes use `no-store`, news caches for 5 minutes, financial metrics for 30 minutes, and company profiles for 1 hour. This balances data freshness against the 100 req/day free-tier limit.
- **Optimistic UI with debounce** — Watchlist mutations update the UI instantly and fire the Server Action after a 300 ms debounce, preventing duplicate requests on rapid clicks.
- **Durable background steps** — Inngest's `step.run` and `step.ai.infer` make each stage of the email workflows independently retriable. A failed Gemini call does not re-trigger the user-fetch or news-fetch steps.
- **Route-group auth guards** — Authentication is enforced at the layout level in both route groups: `(root)` redirects unauthenticated users to `/sign-in`; `(auth)` redirects authenticated users to `/`.

---

## Screens

### Sign Up
<img src="public\assets\screens\signup-screen.png" width="auto" height="500">

### Dashboard
<img src="public\assets\screens\dashboard-screen.png" width="auto" height="500">

### Info
<img src="public\assets\screens\info-screen.png" width="auto" height="500">

### Watchlist
<img src="public\assets\screens\watchlist-screen.png" width="auto" height="500">

---

## Quick Start

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or any MongoDB instance)
- [Finnhub](https://finnhub.io/) API key (free tier)
- [Inngest](https://www.inngest.com/) account and app keys
- [Google AI Studio](https://aistudio.google.com/) API key for Gemini
- Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) enabled

### 1. Clone and install

```bash
git clone https://github.com/LuisHuerta4/Stocket-Stock-Tracker.git
cd Stocket-Stock-Tracker
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# Better Auth
BETTER_AUTH_SECRET=<random-secret-string>
BETTER_AUTH_URL=http://localhost:3000

# Finnhub
FINNHUB_API_KEY=<your-finnhub-server-key>
NEXT_PUBLIC_FINNHUB_API_KEY=<your-finnhub-public-key>

# Inngest
INNGEST_EVENT_KEY=<your-inngest-event-key>
INNGEST_SIGNING_KEY=<your-inngest-signing-key>

# Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Email (Gmail SMTP)
NODEMAILER_EMAIL=<your-gmail-address>
NODEMAILER_PASSWORD=<your-gmail-app-password>
```

### 3. Start the development servers

You need two terminals running simultaneously:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Inngest dev server (required for background job testing)
npx inngest-cli@latest dev
```

The app will be available at `http://localhost:3000`. The Inngest dev UI runs at `http://localhost:8288` and lets you manually trigger functions (including the daily news summary) without waiting for the cron.

---

## Project Structure

```
app/
  (auth)/           Sign-in and sign-up pages (redirect to / if already authenticated)
  (root)/           Protected dashboard pages (redirect to /sign-in if no session)
    page.tsx        Dashboard — 4 TradingView market widgets
    watchlist/      Watchlist with live pricing and search
    stocks/[symbol] Stock detail — 6 TradingView widgets + add/remove
  api/inngest/      Inngest HTTP handler (GET, POST, PUT)
components/
  Header.tsx        Sticky nav — async server component, prefetches search results
  SearchCommand.tsx Cmd+K command palette — debounced Finnhub search
  WatchlistButton   Optimistic add/remove toggle with debounce
  WatchlistTable    Live price table with color-coded change column
  TradingViewWidget Script-injected widget wrapper (memo + custom hook)
  forms/            InputField, SelectField, CountrySelectField, FooterLink
lib/
  actions/          Server Actions — auth, watchlist, Finnhub data fetching
  better-auth/      Auth singleton + MongoDB adapter configuration
  inngest/          Client, function definitions, AI prompt templates
  nodemailer/       Email transport + HTML templates
database/
  mongoose.ts       Singleton Mongoose connection with hot-reload guard
  models/           Watchlist schema (compound unique index on userId + symbol)
hooks/
  useTradingViewWidget  DOM lifecycle management for TradingView scripts
  useDebounce           Stable debounced callback via useRef + useCallback
types/
  global.d.ts       Global TypeScript declarations (no imports needed)
```
