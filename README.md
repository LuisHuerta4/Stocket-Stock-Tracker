# Stocket — Stock Tracker & Market Intelligence Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Background%20Jobs-0D0D0D?logo=inngest&logoColor=white)](https://www.inngest.com/)
[![TradingView](https://img.shields.io/badge/TradingView-Widgets-2962FF?logo=tradingview&logoColor=white)](https://www.tradingview.com/widget/)

A modern, production-ready stock market dashboard that combines real-time market visualization, watchlist management, and automated news insights. Stocket helps investors discover trends quickly and track the companies that matter most to them.

---

## Highlights

- **Market intelligence dashboard** featuring TradingView widgets (overview, heatmap, stories, quotes).
- **Stock detail pages** with advanced charts, technical analysis, and company financials.
- **Personalized watchlist** with live pricing, P/E ratio, and market cap formatting.
- **Auth + session management** using Better Auth with MongoDB persistence.
- **Automated email workflows** (welcome email, daily market news summary) powered by Inngest + AI summarization.

---

## Purpose

Stocket exists to make market discovery and tracking effortless. It blends visual market context with personalized watchlists and automated insights, so users can move from “what’s happening in the market?” to “how does this impact my holdings?” in one place.

---

## Tech Stack

**Frontend**
- Next.js App Router (React 19 + Server Actions)
- TypeScript
- Tailwind CSS + Radix UI
- TradingView embedded widgets

**Backend & Data**
- MongoDB + Mongoose
- Better Auth (email/password)
- Finnhub API for stock data + news

**Async & Email**
- Inngest background jobs & cron triggers
- Nodemailer (Gmail SMTP)
- Gemini (AI summarization for market news)

---

## Screens

---
## Architecture & Design

### High-level flow
```
Client UI
  ↓
Next.js Server Actions
  ├─ Finnhub API (quotes, profiles, news)
  ├─ MongoDB (watchlist + auth data)
  └─ Inngest (background workflows)
        └─ Nodemailer (welcome + news emails)
```

### Key architectural choices
- **Server Actions for data access**: all data reads/writes (Finnhub queries, watchlist updates) are executed server-side to keep API keys secure and improve performance.
- **Caching and revalidation**: selective caching for company profiles and financial metrics balances freshness with API limits.
- **Auth-first middleware**: routes are protected via Better Auth session cookies for consistent access control.
- **Event-driven emails**: sign-ups trigger personalized welcome emails; a daily cron runs summarization and sends market digests.

---

## Features

- **Dashboard widgets**: market overview, heatmap, top stories, and quotes.
- **Search command palette** with debounced Finnhub queries.
- **Watchlist management** with add/remove actions and optimistic UI.
- **Stock detail insights** including candlestick charts, baseline chart, and company financials.
- **Background automation** for personalized emails and daily market news summaries.

---

## Project Structure (Simplified)

```
app/
  (auth)/       → Auth routes
  (root)/       → Main app pages (dashboard, watchlist, stocks)
  api/inngest/  → Inngest handler routes
components/     → Reusable UI + feature components
lib/
  actions/      → Server actions (Finnhub, auth, watchlist)
  better-auth/  → Auth initialization
  inngest/      → Background workflows
  nodemailer/   → Email templates + sending logic
database/       → Mongoose connection + models
```

---

## Emails & Notifications

- **Welcome email** on sign-up with AI-personalized intro.
- **Daily market news digest** powered by Finnhub + Gemini summarization.

