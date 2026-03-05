# Stocket Backend Documentation

> **Version:** 1.0 — Covers authentication, database layer, server actions, background jobs, email delivery, and all external integrations.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Data Model](#5-data-model)
6. [Authentication](#6-authentication)
7. [Server Actions](#7-server-actions)
8. [Background Jobs](#8-background-jobs)
9. [Email System](#9-email-system)
10. [External Integrations](#10-external-integrations)
11. [Configuration and Environment](#11-configuration-and-environment)

---

## 1) Executive Summary

Stocket is a **Next.js 15** full-stack application providing a personalized stock market intelligence dashboard. All backend logic runs server-side inside the Next.js runtime using **Server Actions** — there is no separate backend process. Persistence is handled by **MongoDB** via Mongoose, authentication by **Better Auth**, background automation by **Inngest**, and transactional email by **Nodemailer**.

At a high level:

- **Next.js App Router** serves both UI and server-side logic from a single process.
- **Server Actions** (`'use server'`) handle all data mutations and protected data fetching.
- **MongoDB + Mongoose** persists user-owned data (watchlists). Better Auth manages its own collections (`user`, `session`, `account`) automatically.
- **Better Auth** handles session management, password hashing, and cookie-based auth with a MongoDB adapter.
- **Inngest** orchestrates two automated workflows: a personalized welcome email on sign-up and a daily AI-summarized market news digest.
- **Gemini AI** (via `step.ai.infer`) generates personalized email copy and news summaries inside Inngest functions.
- **Finnhub API** supplies real-time stock quotes, company profiles, financial metrics, and market news.
- **Nodemailer** delivers HTML emails through Gmail SMTP.

---

## 2) Architecture Overview

### 2.1 System Context

```
External Services
  Finnhub REST API ─────────────────────────────────────────────┐
  (quotes, profiles, metrics, news)                             │
                                                                │
  Gemini AI API ────────────────────────────────────────────────┤
  (welcome email copy, news summarization)                      │
                                                                │
  Inngest Platform ─────────────────────────────────────────────┤
  (event queue, cron scheduler, step orchestration)             │
                                                                ▼
Browser Client                               Next.js Server Process
  │                                                   │
  ├─ Page Requests ─────────────────────────▶ App Router (RSC)
  │   └─ Server Components fetch data                 │
  │       via Server Actions                           │
  │                                                   │
  ├─ Form Submissions / Mutations ──────────▶ Server Actions ('use server')
  │   ├─ Auth: sign-up, sign-in, sign-out             │
  │   ├─ Watchlist: add, remove, get                  │
  │   └─ Stock search / details                       │
  │                                                   │
  └─ TradingView Widgets (client-side only)           │
      └─ Rendered via <iframe> / JS snippets           │
                                                      ▼
                                               MongoDB (Atlas)
                                         ├─ user          (Better Auth)
                                         ├─ session       (Better Auth)
                                         ├─ account       (Better Auth)
                                         └─ watchlists    (Mongoose)

POST /api/inngest ◀── Inngest Platform ──▶ Function execution
  ├─ sendSignUpEmail   (triggered by 'app/user.created' event)
  └─ sendDailyNewsSummary  (cron: 0 12 * * *)
```

### 2.2 Runtime Model

Because this is a Next.js application, there is no long-running background process — the server handles requests on demand. The Inngest endpoint (`/api/inngest`) receives HTTP callbacks from the Inngest platform, which manages scheduling and retries externally.

Key design patterns:

- **Singleton DB connections** — Both Mongoose and Better Auth guard against multiple connection instances during hot reloads using module-level caches.
- **`'use server'` directive** — All functions that touch the DB, session, or external APIs are Server Actions, ensuring they never run on the client.
- **React `cache()`** — Expensive Finnhub lookups (`searchStocks`, `getStocksDetails`) are wrapped with React's cache function to deduplicate calls within a single render pass.
- **Next.js fetch caching** — Individual Finnhub requests use either `force-cache` with `next: { revalidate }` (company profiles: 1 hr, financials: 30 min, news: 5 min) or `no-store` (live quotes) to balance freshness against API rate limits.

---

## 3) Technology Stack

### 3.1 Core Platform

| Package | Version | Role |
|---|---|---|
| Next.js | 15.x | Full-stack framework — App Router, RSC, Server Actions |
| React | 19.x | UI rendering |
| TypeScript | 5.x | Type safety across the codebase |

### 3.2 Data Layer

| Package | Version | Role |
|---|---|---|
| MongoDB (Atlas) | — | Primary database |
| Mongoose | 8.x | ODM for Watchlist model |
| `mongodb` (driver) | 6.x | Direct driver access used by Better Auth adapter |

### 3.3 Authentication

| Package | Version | Role |
|---|---|---|
| better-auth | 1.x | Session management, password hashing, MongoDB adapter |

### 3.4 Background Jobs and AI

| Package | Version | Role |
|---|---|---|
| inngest | 3.x | Event-driven function orchestration and cron scheduling |
| Gemini AI (`step.ai`) | — | Personalized email copy and news summarization |

### 3.5 Email Delivery

| Package | Version | Role |
|---|---|---|
| nodemailer | 7.x | SMTP email transport via Gmail |

### 3.6 External APIs

| Service | Role |
|---|---|
| Finnhub | Real-time stock quotes, company profiles, financial metrics, market news |
| Google Gemini | AI-generated email content via Inngest's `step.ai.infer` |

### 3.7 Utility

| Package | Role |
|---|---|
| dotenv | Environment variable loading |
| react-hook-form | Client-side form state for sign-up and sign-in flows |

---

## 4) Project Structure

```
stock-dashboard/
  app/
    api/
      inngest/
        route.ts              # Inngest HTTP endpoint (GET, POST, PUT)
    (auth)/
      sign-in/page.tsx        # Sign-in page
      sign-up/page.tsx        # Sign-up page (collects investor profile)
    (root)/
      page.tsx                # Dashboard page (TradingView widgets)
      watchlist/page.tsx      # Watchlist page
      stocks/[symbol]/page.tsx # Stock detail page
    layout.tsx                # Root layout
    globals.css
  database/
    mongoose.ts               # Mongoose singleton connection
    models/
      watchlist.model.ts      # Watchlist schema + model
  lib/
    better-auth/
      auth.ts                 # Better Auth initialization + singleton
    inngest/
      client.ts               # Inngest client (Gemini AI configured)
      functions.ts            # sendSignUpEmail, sendDailyNewsSummary
      prompts.ts              # AI prompt templates
    nodemailer/
      index.ts                # Email transport + sendWelcomeEmail, sendNewsSummaryEmail
      templates.ts            # HTML email templates (welcome, news summary)
    actions/
      auth.actions.ts         # signUpWithEmail, signInWithEmail, signOut
      user.actions.ts         # getAllUsersForNewsEmail
      watchlist.actions.ts    # add/remove/get watchlist operations
      finnhub.actions.ts      # getNews, searchStocks, getStocksDetails
    utils.ts                  # Formatting helpers (price, market cap, dates, articles)
    constants.ts              # TradingView widget configs, popular stock symbols
  package.json
  next.config.ts
```

---

## 5) Data Model

### 5.1 Better Auth Collections (auto-managed)

Better Auth writes directly to MongoDB using the native driver. It manages three collections automatically — no schema definition required.

| Collection | Contents |
|---|---|
| `user` | `id`, `email`, `name`, `emailVerified`, `image`, `createdAt`, `updatedAt` |
| `session` | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | `id`, `userId`, `accountId`, `providerId`, `accessToken`, `refreshToken` |

> **Note:** The `user` collection is queried directly by `user.actions.ts` and `watchlist.actions.ts` via the raw MongoDB driver when user data is needed outside of the auth context.

### 5.2 `watchlists` Collection (Mongoose)

Stores each user's personally saved stock symbols.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `userId` | String | Required, indexed | Better Auth user ID |
| `symbol` | String | Required, uppercased, trimmed | Stock ticker symbol (e.g. `AAPL`) |
| `company` | String | Required, trimmed | Display name |
| `addedAt` | Date | Defaults to `Date.now` | Time of addition |

**Indexes:**
- `userId` — single-field index for fast per-user queries
- `{ userId, symbol }` — compound unique index to prevent duplicate symbols per user

### 5.3 Data Not Persisted

Stock quotes, company profiles, financial metrics, and market news are **never stored** in the database. All market data is fetched on demand from the Finnhub API and optionally cached via Next.js's built-in fetch cache. This keeps the database footprint minimal and ensures data freshness.

---

## 6) Authentication

**File:** [lib/better-auth/auth.ts](lib/better-auth/auth.ts)

### 6.1 Configuration

Better Auth is initialized once using a module-level singleton guard to prevent re-instantiation on Next.js hot reloads. On first call, `getAuth()` opens a Mongoose connection, retrieves the native MongoDB `Db` instance, and passes it to `mongodbAdapter`.

```
getAuth()
  └─ connectToDatabase()        # Ensures Mongoose connection is open
  └─ betterAuth({
       database: mongodbAdapter(db),
       emailAndPassword: { enabled: true, minPasswordLength: 8 },
       plugins: [nextCookies()]  # Reads/writes auth cookies in Next.js Server Actions
     })
```

### 6.2 Auth Settings

| Setting | Value | Notes |
|---|---|---|
| Provider | Email + Password | Only built-in provider enabled |
| Sign-up | Enabled | `disableSignUp: false` |
| Email verification | Disabled | `requireEmailVerification: false` |
| Min password length | 8 | |
| Max password length | 128 | |
| Auto sign-in after sign-up | Enabled | `autoSignIn: true` |
| Cookie handling | `nextCookies()` plugin | Required for Server Actions to access cookies |

### 6.3 Server Actions

**File:** [lib/actions/auth.actions.ts](lib/actions/auth.actions.ts)

| Function | Description |
|---|---|
| `signUpWithEmail(data)` | Calls `auth.api.signUpEmail`, then fires the `app/user.created` Inngest event with the user's investor profile data |
| `signInWithEmail(data)` | Calls `auth.api.signInEmail` and returns the session |
| `signOut()` | Calls `auth.api.signOut` passing the current request headers |

### 6.4 Session Access Pattern

Protected server actions call `auth.api.getSession({ headers: await headers() })` at the top of the function body. If no session exists, the action redirects to `/sign-in` immediately.

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session?.user) redirect('/sign-in');
```

---

## 7) Server Actions

All data operations are implemented as Next.js Server Actions (`'use server'`). They run exclusively on the server — client components call them like async functions, but the network boundary is enforced by the framework.

### 7.1 Auth Actions

**File:** [lib/actions/auth.actions.ts](lib/actions/auth.actions.ts)

| Function | Trigger | Side Effects |
|---|---|---|
| `signUpWithEmail` | Sign-up form submission | Creates user in MongoDB, fires `app/user.created` Inngest event |
| `signInWithEmail` | Sign-in form submission | Establishes session cookie |
| `signOut` | Nav sign-out button | Clears session cookie |

### 7.2 Watchlist Actions

**File:** [lib/actions/watchlist.actions.ts](lib/actions/watchlist.actions.ts)

All watchlist actions require a valid session. Auth check runs first; unauthenticated calls redirect to `/sign-in`.

| Function | Description | Cache Behavior |
|---|---|---|
| `addToWatchlist(symbol, company)` | Inserts a new `Watchlist` document; enforces uniqueness at the DB level | Calls `revalidatePath('/watchlist')` |
| `removeFromWatchlist(symbol)` | Deletes the matching document by `userId + symbol` | Calls `revalidatePath('/watchlist')` |
| `getUserWatchlist()` | Returns raw watchlist documents sorted by `addedAt DESC` | — |
| `getWatchlistWithData()` | Returns watchlist items enriched with live Finnhub data (price, change, market cap, P/E) | Delegates to `getStocksDetails` |
| `getWatchlistSymbolsByEmail(email)` | Returns an array of symbol strings for a given email — used by the Inngest daily news job | — |

### 7.3 Finnhub Actions

**File:** [lib/actions/finnhub.actions.ts](lib/actions/finnhub.actions.ts)

All Finnhub calls go through a shared `fetchJSON<T>()` helper that applies per-endpoint Next.js fetch caching strategies.

#### `getNews(symbols?)`

Fetches market news for a user's watchlist symbols or falls back to general market news.

| Step | Description |
|---|---|
| 1 | If symbols are provided, fetches `GET /company-news` for each symbol in parallel (cached 5 min) |
| 2 | Filters articles using `validateArticle` (requires: headline, summary, url, datetime) |
| 3 | Round-robins across symbols to collect up to 6 articles, one per symbol per pass |
| 4 | Falls back to `GET /news?category=general` if no company articles are found |
| 5 | Deduplicates general articles by `id + url + headline` |
| Returns | Up to 6 `MarketNewsArticle` objects sorted by datetime descending |

#### `searchStocks(query?)`

Searches for stocks matching a query string, or returns the top 10 popular stocks when no query is provided.

| Scenario | API Call | Cache |
|---|---|---|
| Empty query | `GET /stock/profile2` for each of the top 10 popular symbols | 1 hour |
| With query | `GET /search?q=<query>` | 30 minutes |

Results are mapped to `StockWithWatchlistStatus` objects, including an `isInWatchlist` flag resolved against the current user's saved symbols. Limited to 15 results.

**Note:** Wrapped with React `cache()` — deduplicated per render.

#### `getStocksDetails(symbol)`

Fetches comprehensive data for a single stock symbol by making three parallel Finnhub requests.

| Request | Endpoint | Cache |
|---|---|---|
| Live quote | `GET /quote` | No cache (`no-store`) |
| Company profile | `GET /stock/profile2` | 1 hour |
| Financial metrics | `GET /stock/metric?metric=all` | 30 minutes |

Returns a normalized object with formatted price, change percent, P/E ratio (from `peNormalizedAnnual`), and market cap.

**Note:** Wrapped with React `cache()` — deduplicated per render.

#### Finnhub Caching Strategy

| Data Type | Revalidation | Rationale |
|---|---|---|
| Live quotes | `no-store` | Must reflect current market price |
| Company news | 5 minutes | News updates frequently but not tick-by-tick |
| Search results | 30 minutes | Symbol catalog is stable |
| Company profiles | 1 hour | Company metadata rarely changes |
| Financial metrics | 30 minutes | Metrics are recalculated periodically, not live |

### 7.4 User Actions

**File:** [lib/actions/user.actions.ts](lib/actions/user.actions.ts)

| Function | Description |
|---|---|
| `getAllUsersForNewsEmail()` | Queries the `user` collection directly (raw MongoDB driver) for all documents with a valid email and name. Returns `{ id, email, name }` objects. Used exclusively by the Inngest daily news job. |

---

## 8) Background Jobs

Background automation is handled entirely by **Inngest**. Functions are registered at the `/api/inngest` endpoint and invoked by the Inngest platform either on events or on a cron schedule.

**Endpoint:** [app/api/inngest/route.ts](app/api/inngest/route.ts)
**Client:** [lib/inngest/client.ts](lib/inngest/client.ts)
**Functions:** [lib/inngest/functions.ts](lib/inngest/functions.ts)

### 8.1 Inngest Client

```typescript
const inngest = new Inngest({
    id: 'stocket',
    ai: { gemini: { apiKey: process.env.GEMINI_API_KEY } }
})
```

The client is configured with Gemini AI credentials, enabling `step.ai.infer()` inside function steps to call the Gemini API with built-in retry and observability provided by Inngest.

### 8.2 `sendSignUpEmail`

**ID:** `sign-up-email`
**Trigger:** Event `app/user.created`
**Fired by:** `signUpWithEmail` server action immediately after a successful sign-up.

| Step | ID | Description |
|---|---|---|
| 1 | `generate-welcome-intro` | Calls `step.ai.infer` with `gemini-2.5-flash-lite`. The prompt (`PERSONALIZED_WELCOME_EMAIL_PROMPT`) injects the user's investor profile (country, investment goals, risk tolerance, preferred industry) and requests a single personalized HTML paragraph. |
| 2 | `send-welcome-email` | Sends the HTML welcome email via `sendWelcomeEmail()`. Falls back to a generic intro string if AI inference returns no content. |

**Event payload (`app/user.created`):**

```typescript
{
  email: string;
  name: string;
  country: string;
  investmentGoals: string;   // 'Growth' | 'Income' | 'Balanced' | 'Conservative'
  riskTolerance: string;     // 'Low' | 'Medium' | 'High'
  preferredIndustry: string; // 'Technology' | 'Healthcare' | 'Finance' | 'Energy' | 'Consumer Goods'
}
```

### 8.3 `sendDailyNewsSummary`

**ID:** `daily-news-summary`
**Trigger:** Cron `0 12 * * *` (12:00 UTC daily) — also manually triggerable via event `app/send.daily.news`.

| Step | ID | Description |
|---|---|---|
| 1 | `get-all-users` | Calls `getAllUsersForNewsEmail()` to retrieve all registered users |
| 2 | `fetch-user-news` | For each user: fetches their watchlist symbols, calls `getNews(symbols)` for up to 6 personalized articles, falls back to general news if none found |
| 3 | Per-user AI inference | Calls `step.ai.infer('summarize-news-<email>', ...)` with `gemini-2.5-flash-lite` and the `NEWS_SUMMARY_EMAIL_PROMPT` to produce a formatted HTML news summary for each user |
| 4 | `send-news-emails` | Sends all emails in parallel via `Promise.all` using `sendNewsSummaryEmail()` |

**AI model used:** `gemini-2.5-flash-lite` for both functions (low-latency, cost-efficient).

---

## 9) Email System

### 9.1 Transport

**File:** [lib/nodemailer/index.ts](lib/nodemailer/index.ts)

A single shared Nodemailer transporter is created using Gmail SMTP with app-password credentials from environment variables.

```typescript
nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.NODEMAILER_EMAIL, pass: process.env.NODEMAILER_PASSWORD }
})
```

### 9.2 Email Types

| Function | Subject | Sender | Trigger |
|---|---|---|---|
| `sendWelcomeEmail({ email, name, intro })` | `Welcome to Stocket - your stock market toolkit is ready!` | `"Stocket" <StocketOfficial@gmail.com>` | Sign-up |
| `sendNewsSummaryEmail({ email, date, newsContent })` | `Market News Summary Today - <date>` | `"Signalist News" <...>` | Daily cron |

### 9.3 Templates

**File:** [lib/nodemailer/templates.ts](lib/nodemailer/templates.ts)

Both emails use inline HTML templates with string interpolation (`{{placeholder}}` syntax replaced at send time).

| Template | Placeholders | Notes |
|---|---|---|
| `WELCOME_EMAIL_TEMPLATE` | `{{name}}`, `{{intro}}` | Dark-mode aware via `prefers-color-scheme` media query; responsive mobile layout |
| `NEWS_SUMMARY_EMAIL_TEMPLATE` | `{{date}}`, `{{newsContent}}` | AI-generated HTML is injected directly; structured with section headings, article cards, bullet points, and "Read Full Story" links |

### 9.4 AI Prompt Strategy

**File:** [lib/inngest/prompts.ts](lib/inngest/prompts.ts)

| Prompt | Output | Key Constraints |
|---|---|---|
| `PERSONALIZED_WELCOME_EMAIL_PROMPT` | One `<p>` HTML element, exactly 2 sentences, 35–50 words | Must not start with "Welcome"; must reference user's specific goals/sector/risk tolerance using `<strong>` tags |
| `NEWS_SUMMARY_EMAIL_PROMPT` | Multi-section HTML with `<h3>`, `<h4>`, `<ul>`, `<div>` cards | Must match exact CSS classes/inline styles of the email template; minimum 3 bullet points per article; plain English; no repeated section headings |
| `TRADINGVIEW_SYMBOL_MAPPING_PROMPT` | JSON `{ tradingViewSymbol, confidence, reasoning }` | Used for mapping Finnhub symbols to TradingView format on the stock detail page |

---

## 10) External Integrations

### 10.1 Finnhub API

**Base URL:** `https://finnhub.io/api/v1`
**Auth:** API key passed as `token=<key>` query parameter.

| Endpoint | Used By | Purpose |
|---|---|---|
| `GET /quote?symbol=<sym>` | `getStocksDetails` | Current price, change, change percent |
| `GET /stock/profile2?symbol=<sym>` | `getStocksDetails`, `searchStocks` | Company name, exchange, market cap, currency |
| `GET /stock/metric?symbol=<sym>&metric=all` | `getStocksDetails` | P/E ratio (`peNormalizedAnnual`) and other fundamentals |
| `GET /search?q=<query>` | `searchStocks` | Symbol search with description and type |
| `GET /company-news?symbol=<sym>&from=<date>&to=<date>` | `getNews` | Company-specific news articles from the last 5 days |
| `GET /news?category=general` | `getNews` (fallback) | General market news feed |

**API key precedence:** `process.env.FINNHUB_API_KEY` → `process.env.NEXT_PUBLIC_FINNHUB_API_KEY` (the public key is used client-accessible contexts; the server key is preferred for server-side calls).

### 10.2 TradingView Widgets

TradingView is integrated **client-side only** via embedded JavaScript widgets. No API key or server-side call is required. Widget configurations are defined in [lib/constants.ts](lib/constants.ts).

| Widget | Config Constant | Used On |
|---|---|---|
| Market Overview (multi-symbol chart tabs) | `MARKET_OVERVIEW_WIDGET_CONFIG` | Dashboard |
| S&P 500 Heatmap | `HEATMAP_WIDGET_CONFIG` | Dashboard |
| Top Stories (market news feed) | `TOP_STORIES_WIDGET_CONFIG` | Dashboard |
| Market Data (quotes table) | `MARKET_DATA_WIDGET_CONFIG` | Dashboard |
| Symbol Info bar | `SYMBOL_INFO_WIDGET_CONFIG(symbol)` | Stock detail |
| Candlestick chart | `CANDLE_CHART_WIDGET_CONFIG(symbol)` | Stock detail |
| Baseline chart | `BASELINE_WIDGET_CONFIG(symbol)` | Stock detail |
| Technical Analysis | `TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)` | Stock detail |
| Company Profile | `COMPANY_PROFILE_WIDGET_CONFIG(symbol)` | Stock detail |
| Company Financials | `COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)` | Stock detail |

All widget configs use `colorTheme: 'dark'` and `isTransparent: true` to match the application's design.

### 10.3 Google Gemini AI

Accessed exclusively through Inngest's `step.ai.infer()` inside background functions. This means:
- Retries, timeouts, and observability are handled by Inngest.
- The Gemini API key is only ever used server-side inside Inngest function execution.
- Model used: `gemini-2.5-flash-lite` for both email generation tasks.

---

## 11) Configuration and Environment

### Required Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `BETTER_AUTH_SECRET` | Secret key for signing sessions (must be a strong random string) |
| `BETTER_AUTH_URL` | Full URL of the deployed application (e.g. `http://localhost:3000`) |
| `FINNHUB_API_KEY` | Finnhub server-side API key (used in Server Actions) |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Finnhub public-facing API key (may be same key; exposed to client) |
| `INNGEST_EVENT_KEY` | Inngest event key for sending events from Server Actions |
| `INNGEST_SIGNING_KEY` | Inngest signing key for verifying requests to `/api/inngest` |
| `GEMINI_API_KEY` | Google Gemini API key, passed to the Inngest client for `step.ai` |
| `NODEMAILER_EMAIL` | Gmail address used as the SMTP sender account |
| `NODEMAILER_PASSWORD` | Gmail app password (not the account password) |

### Development Server Commands

```bash
# Install dependencies
npm install

# Start Next.js dev server with Turbopack
npm run dev

# Start Inngest dev server (required to test background functions locally)
npx inngest-cli@latest dev

# Run the database connection test script
npm run test:db

# Lint
npm run lint
```

### Inngest Local Development

When running locally, the Inngest CLI proxies function calls to `http://localhost:3000/api/inngest`. Both the Next.js dev server and the Inngest CLI must be running simultaneously. Events can be sent manually from the Inngest dev UI dashboard to test functions without waiting for the cron schedule.

---

## 12) Component-by-Component Reference

### `database/mongoose.ts`
Establishes and caches a Mongoose connection using `global.mongooseCache`. On the first call, connects and stores the promise. Subsequent calls return the cached connection. Throws if `MONGODB_URI` is not set.

### `database/models/watchlist.model.ts`
Defines the `Watchlist` Mongoose schema with a compound unique index on `{ userId, symbol }`. Uses the `models?.Watchlist || model(...)` pattern to prevent model re-registration during hot reloads.

### `lib/better-auth/auth.ts`
Singleton Better Auth instance. Calls `connectToDatabase()` to get the native `Db` object and passes it to `mongodbAdapter`. Exported as `auth` (top-level `await`). Uses `nextCookies()` plugin so sessions work inside Next.js Server Actions and route handlers.

### `lib/inngest/client.ts`
Creates the `inngest` client with app ID `'stocket'` and Gemini credentials. This instance is imported by both `functions.ts` (to define functions) and `auth.actions.ts` (to send events).

### `lib/inngest/functions.ts`
Defines and exports `sendSignUpEmail` and `sendDailyNewsSummary`. Each function uses `step.run()` for durable execution and `step.ai.infer()` for AI calls. Both can be individually retried by Inngest on failure.

### `lib/nodemailer/index.ts`
Creates a shared Nodemailer transporter and exports two send functions. HTML is produced by replacing `{{placeholder}}` tokens in the template strings.

### `lib/actions/finnhub.actions.ts`
The primary data-fetching module. All calls use the internal `fetchJSON<T>()` helper which applies per-request caching via Next.js's extended `fetch`. `searchStocks` and `getStocksDetails` are wrapped in React `cache()` for request deduplication.

### `lib/utils.ts`
Pure formatting utilities with no side effects:

| Function | Description |
|---|---|
| `formatPrice(price)` | Formats a number as USD currency string |
| `formatMarketCapValue(cap)` | Formats large numbers with T/B/M suffixes |
| `formatChangePercent(pct)` | Adds + or − sign and 2 decimal places |
| `getDateRange(days)` | Returns `{ from, to }` ISO date strings for a lookback window |
| `validateArticle(article)` | Returns `true` if article has all required fields |
| `formatArticle(article, ...)` | Normalizes a raw Finnhub article into a `MarketNewsArticle` |
| `getFormattedTodayDate()` | Returns today as a human-readable string (evaluated at call time, not module load) |
| `formatTimeAgo(timestamp)` | Returns relative time string (e.g. "3 hours ago") |
