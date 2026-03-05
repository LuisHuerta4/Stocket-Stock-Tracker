# Stocket Frontend Documentation

> **Version:** 1.0 — Covers routing, layouts, pages, components, hooks, form system, design system, and TypeScript types.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Routing and Layouts](#5-routing-and-layouts)
6. [Pages](#6-pages)
7. [Components](#7-components)
8. [Custom Hooks](#8-custom-hooks)
9. [Form System](#9-form-system)
10. [Design System](#10-design-system)
11. [TypeScript Types](#11-typescript-types)

---

## 1) Executive Summary

Stocket's frontend is a **Next.js 15 App Router** application built with **React 19** and **TypeScript**. All UI is server-rendered by default using React Server Components (RSC). Client interactivity is scoped to individual components that opt in with the `'use client'` directive.

The frontend is organized into two protected route groups:

- **`(auth)`** — Unauthenticated routes: sign-in and sign-up.
- **`(root)`** — Authenticated routes: dashboard, watchlist, and stock detail pages.

Key characteristics:

- **Server-first rendering** — Pages and layouts are async Server Components that fetch data directly (session checks, Finnhub calls) before sending HTML to the browser.
- **No client-side data fetching on mount** — All initial data is passed as props from Server Components into Client Components, eliminating loading spinners on first paint.
- **Optimistic UI** — Watchlist add/remove updates the UI immediately before the Server Action completes.
- **TradingView widgets** — Embedded via script injection managed by a custom hook. No TradingView SDK is imported; widgets are loaded as third-party scripts at runtime.
- **Dark-only** — The application is locked to dark mode at the root `<html>` element. No light mode toggle exists.

---

## 2) Architecture Overview

### 2.1 Rendering Model

```
Browser Request
  │
  ▼
Next.js App Router
  │
  ├─ Server Components (default)
  │   ├─ Layouts: session checks, auth guards, data prefetch
  │   ├─ Pages: parallel data fetching (Finnhub, watchlist)
  │   └─ Header: prefetches search results for client components
  │
  └─ Client Components ('use client')
      ├─ Forms: react-hook-form, validation, Server Action calls
      ├─ SearchCommand: debounced live search, command palette
      ├─ WatchlistButton: optimistic toggle, debounced mutations
      ├─ WatchlistTable: click-to-navigate rows, color-coded change
      ├─ NavItems: active link detection via usePathname
      ├─ UserDropdown: sign-out, mobile nav
      └─ TradingViewWidget: script injection via useTradingViewWidget hook
```

### 2.2 Data Flow Pattern

Server Components fetch data and pass it down as props to Client Components. This prevents Client Components from needing to fetch on mount, giving instant interactivity without loading states.

```
(root)/layout.tsx  [Server]
  └─ validates session → fetches user

Header.tsx  [Server]
  └─ searchStocks() → initialStocks
       ├─ NavItems [Client] receives initialStocks
       └─ UserDropdown [Client] receives initialStocks
             └─ NavItems [Client] receives initialStocks (mobile)

watchlist/page.tsx  [Server]
  ├─ getWatchlistWithData() → watchlist (with live prices)
  └─ searchStocks() → initialStocks
       ├─ WatchlistTable [Client] receives watchlist
       └─ SearchCommand [Client] receives initialStocks

stocks/[symbol]/page.tsx  [Server]
  ├─ getStocksDetails(symbol) → stockData
  └─ getUserWatchlist() → watchlist
       └─ WatchlistButton [Client] receives symbol, company, isInWatchlist
```

### 2.3 Route Protection

Route group layouts enforce authentication at the layout level — not inside individual pages. This means the guard runs exactly once per layout tree regardless of how many child pages are rendered.

| Route Group | Guard | Behavior |
|---|---|---|
| `(root)` | Session required | Redirects to `/sign-in` if no active session |
| `(auth)` | No session required | Redirects to `/` if user is already signed in |

---

## 3) Technology Stack

### 3.1 Core Framework

| Package | Version | Role |
|---|---|---|
| Next.js | 15.x | App Router, RSC, Server Actions, image optimization |
| React | 19.x | UI rendering, `cache()` for request deduplication |
| TypeScript | 5.x | Type safety, global type declarations |

### 3.2 Styling

| Package | Version | Role |
|---|---|---|
| Tailwind CSS | 4.x | Utility-first CSS |
| tw-animate-css | 1.x | Animation utilities |
| next-themes | 0.4.x | Theme provider (used for dark mode base setup) |

### 3.3 UI Components

| Package | Version | Role |
|---|---|---|
| @radix-ui/react-avatar | 1.x | Avatar primitive |
| @radix-ui/react-dialog | 1.x | Modal dialog (used by cmdk) |
| @radix-ui/react-dropdown-menu | 2.x | Dropdown menu |
| @radix-ui/react-label | 2.x | Accessible form label |
| @radix-ui/react-popover | 1.x | Popover (country select) |
| @radix-ui/react-select | 2.x | Select dropdown |
| @radix-ui/react-slot | 1.x | Composition slot primitive |
| cmdk | 1.x | Command palette (search dialog) |
| lucide-react | 0.545.x | Icon set |
| sonner | 2.x | Toast notifications |
| class-variance-authority | 0.7.x | Component variant management |
| clsx + tailwind-merge | — | Conditional class merging (`cn()` utility) |

### 3.4 Forms

| Package | Version | Role |
|---|---|---|
| react-hook-form | 7.x | Form state, validation, submission |
| react-select-country-list | 2.x | ISO 3166-1 country data with names |

---

## 4) Project Structure

```
stock-dashboard/
  app/
    layout.tsx                    # Root layout: fonts, Toaster, dark mode
    globals.css                   # Global styles and custom CSS classes
    (auth)/
      layout.tsx                  # Auth layout: two-column (form + testimonial)
      sign-in/
        page.tsx                  # Sign-in form (Client Component)
      sign-up/
        page.tsx                  # Sign-up + investor profile form (Client Component)
    (root)/
      layout.tsx                  # Protected layout: session guard + Header
      page.tsx                    # Dashboard: 4 TradingView market widgets
      watchlist/
        page.tsx                  # Watchlist: table with live data + search
      stocks/
        [symbol]/
          page.tsx                # Stock detail: 6 TradingView widgets + add/remove
  components/
    Header.tsx                    # Sticky nav header (Server Component)
    NavItems.tsx                  # Navigation links with active state (Client)
    UserDropdown.tsx              # Avatar dropdown: profile + sign-out + mobile nav (Client)
    SearchCommand.tsx             # Cmd+K command palette with debounced search (Client)
    WatchlistButton.tsx           # Add/remove star button with optimistic UI (Client)
    WatchlistTable.tsx            # Sortable table with colored price changes (Client)
    TradingViewWidget.tsx         # Script-injected TradingView widget wrapper (Client)
    forms/
      InputField.tsx              # Labeled text input with error display
      SelectField.tsx             # Radix Select wrapped in RHF Controller
      CountrySelectField.tsx      # Searchable country combobox with flag emojis
      FooterLink.tsx              # "Already have an account? Sign in" link row
    ui/                           # shadcn/ui primitives (Radix wrappers)
      button.tsx
      avatar.tsx
      dropdown-menu.tsx
      command.tsx
      dialog.tsx
      input.tsx
      label.tsx
      popover.tsx
      select.tsx
      sonner.tsx
      table.tsx
  hooks/
    useTradingViewWidget.tsx      # DOM script injection + cleanup for TradingView
    useDebounce.ts                # Timeout-based debounce returning stable callback
  types/
    global.d.ts                   # Global TypeScript type declarations
```

---

## 5) Routing and Layouts

### 5.1 Root Layout

**File:** [app/layout.tsx](app/layout.tsx)
**Type:** Server Component

Sets up the HTML document shell used by every page in the application.

| Responsibility | Implementation |
|---|---|
| Fonts | `Geist` and `Geist_Mono` loaded via `next/font/google`, applied as CSS variables |
| Dark mode | `className="dark"` hardcoded on `<html>` — no toggle |
| Toast notifications | `<Toaster />` from `sonner` rendered at root level |
| Page metadata | `title: "Stocket"` and description set via Next.js `metadata` export |

### 5.2 Auth Layout

**File:** [app/(auth)/layout.tsx](app/(auth)/layout.tsx)
**Type:** Server Component

Wraps sign-in and sign-up pages in a two-column layout. Checks for an active session on every render — authenticated users are immediately redirected to `/`.

**Layout structure:**

```
auth-layout (flex row)
  ├─ auth-left-section   (form area — logo + children)
  └─ auth-right-section  (testimonial + dashboard screenshot)
       ├─ blockquote (user testimonial)
       └─ Image (dashboard.png preview)
```

The right section displays a static testimonial quote and a cropped screenshot of the dashboard to provide social proof on the authentication pages.

### 5.3 Protected Layout

**File:** [app/(root)/layout.tsx](app/(root)/layout.tsx)
**Type:** Server Component

Guards all dashboard routes. Calls `auth.api.getSession()` with the current request headers. If no session is found, redirects to `/sign-in`. On success, extracts `{ id, name, email }` from the session and passes the `user` object as a prop to `Header`.

```typescript
// Session shape passed to Header
{ id: string; name: string; email: string }
```

---

## 6) Pages

### 6.1 Dashboard

**File:** [app/(root)/page.tsx](app/(root)/page.tsx)
**Type:** Server Component

Renders four TradingView widgets in a two-section grid. No data fetching occurs on this page — all content is delivered by the TradingView scripts loaded client-side.

| Widget | Script | Config Constant | Purpose |
|---|---|---|---|
| Market Overview | `embed-widget-market-overview.js` | `MARKET_OVERVIEW_WIDGET_CONFIG` | Multi-tab chart for Financial, Technology, and Services stocks |
| Stock Heatmap | `embed-widget-stock-heatmap.js` | `HEATMAP_WIDGET_CONFIG` | S&P 500 sector heatmap by market cap |
| Top Stories | `embed-widget-timeline.js` | `TOP_STORIES_WIDGET_CONFIG` | Live market news feed |
| Market Quotes | `embed-widget-market-quotes.js` | `MARKET_DATA_WIDGET_CONFIG` | Quote table for curated symbols |

### 6.2 Watchlist Page

**File:** [app/(root)/watchlist/page.tsx](app/(root)/watchlist/page.tsx)
**Type:** Server Component

Runs two parallel data fetches on every render:

- `getWatchlistWithData()` — retrieves the user's saved symbols enriched with live Finnhub price data
- `searchStocks()` — prefetches the top 10 popular stocks to populate the search command on first open

**Render states:**

| State | Rendered Output |
|---|---|
| Empty watchlist | Centered empty state with `Star` icon, heading, description, and `SearchCommand` |
| Populated watchlist | Page heading, `SearchCommand` button (top-right), and `WatchlistTable` |

### 6.3 Stock Detail Page

**File:** [app/(root)/stocks/[symbol]/page.tsx](app/(root)/stocks/[symbol]/page.tsx)
**Type:** Server Component (async, dynamic route)

Receives the stock `symbol` from the route segment via `await params`. Runs two parallel operations before rendering:

- `getStocksDetails(symbol)` — fetches live quote, company profile, and financial metrics from Finnhub
- `getUserWatchlist()` — fetches the user's watchlist to determine if this symbol is already saved

If `getStocksDetails` returns no data, `notFound()` is called, rendering Next.js's 404 page.

**Two-column layout:**

| Left Column | Right Column |
|---|---|
| Symbol Info bar (price, change) | `WatchlistButton` (add/remove) |
| Candlestick chart (advanced-chart) | Technical Analysis widget |
| Baseline chart (advanced-chart, style 10) | Company Profile widget |
| — | Company Financials widget |

### 6.4 Sign-In Page

**File:** [app/(auth)/sign-in/page.tsx](app/(auth)/sign-in/page.tsx)
**Type:** Client Component (`'use client'`)

A `react-hook-form` form with `mode: 'onBlur'` validation. On successful submission, calls the `signInWithEmail` Server Action and redirects to `/`. On error, displays a toast via `sonner`.

**Fields:**

| Field | Validation |
|---|---|
| Email | Required, regex `/^\w+@\w+\.\w+$/` |
| Password | Required, minLength 8 |

### 6.5 Sign-Up Page

**File:** [app/(auth)/sign-up/page.tsx](app/(auth)/sign-up/page.tsx)
**Type:** Client Component (`'use client'`)

Extended `react-hook-form` form that collects both credentials and an investor profile. The profile data (`country`, `investmentGoals`, `riskTolerance`, `preferredIndustry`) is passed to the `signUpWithEmail` Server Action, which forwards it to Inngest for personalized welcome email generation. On success, redirects to `/`.

**Fields:**

| Field | Component | Validation | Default |
|---|---|---|---|
| Full Name | `InputField` | Required, minLength 2 | — |
| Email | `InputField` | Required, email pattern | — |
| Country | `CountrySelectField` | Required | `'US'` |
| Password | `InputField` | Required, minLength 8 | — |
| Investment Goals | `SelectField` | Required | — |
| Risk Tolerance | `SelectField` | Required | `'Medium'` |
| Preferred Industry | `SelectField` | Required | `'Technology'` |

---

## 7) Components

### 7.1 `Header`

**File:** [components/Header.tsx](components/Header.tsx)
**Type:** Server Component

The sticky site header. Calls `searchStocks()` on the server during render, then passes the results as `initialStocks` to both `NavItems` and `UserDropdown`. This ensures the search command is populated instantly when opened, without a client-side fetch.

```
Header (Server)
  ├─ Logo (Link to /)
  ├─ NavItems (Client) — hidden on mobile (sm:block)
  └─ UserDropdown (Client) — always visible
```

### 7.2 `NavItems`

**File:** [components/NavItems.tsx](components/NavItems.tsx)
**Type:** Client Component

Renders the navigation link list from the `NAV_ITEMS` constant (`Dashboard`, `Search`, `Watchlist`). Uses `usePathname()` for active link highlighting.

**Special behavior:** The `/search` nav entry does not render a `<Link>` — it renders a `<SearchCommand renderAs="text" />` instead, so clicking "Search" in the navbar opens the command palette directly.

**Active state logic:**
- `/` — exact match only
- All other paths — `startsWith` match (so `/watchlist/xyz` still highlights the Watchlist link)

### 7.3 `UserDropdown`

**File:** [components/UserDropdown.tsx](components/UserDropdown.tsx)
**Type:** Client Component

A Radix `DropdownMenu` triggered by an avatar button showing the user's name initial as a fallback. The dropdown contains:

- User avatar, name, and email in the header
- "Log Out" item — calls `signOut()` Server Action, then `router.push('/sign-in')`
- Mobile-only `NavItems` (hidden on `sm:` and above, visible below)

This doubles as the mobile navigation — on small screens, the `<nav>` in `Header` is hidden and the full nav is rendered inside the dropdown.

### 7.4 `SearchCommand`

**File:** [components/SearchCommand.tsx](components/SearchCommand.tsx)
**Type:** Client Component

A full-screen command palette dialog built on cmdk's `CommandDialog`. Can be opened via:
- Clicking the trigger (button or text)
- Keyboard shortcut `Cmd/Ctrl + K` (registered via `window.addEventListener`)

**Render modes (controlled by `renderAs` prop):**

| `renderAs` | Rendered Trigger |
|---|---|
| `'button'` (default) | `<Button>` with label text |
| `'text'` | `<span>` styled as a nav link |

**Search behavior:**

1. On open, displays up to 10 stocks from `initialStocks` under the label "Popular stocks".
2. As the user types, `useDebounce` fires `searchStocks(query)` after 300 ms, replacing the list with live Finnhub results labeled "Search results".
3. Clearing the input restores the original `initialStocks` list.
4. Each result row is a `<Link>` to `/stocks/<symbol>` and contains a `WatchlistButton` icon.

**Watchlist state synchronization:** When a `WatchlistButton` inside a result row is toggled, `handleWatchlistChange` updates the `isInWatchlist` flag on the local stocks state, keeping the star icon correct without re-fetching.

**On stock selection:** `handleSelectStock` closes the dialog, clears the search term, and resets the stock list back to `initialStocks`.

### 7.5 `WatchlistButton`

**File:** [components/WatchlistButton.tsx](components/WatchlistButton.tsx)
**Type:** Client Component

A toggle button for adding or removing a stock from the watchlist. Implements **optimistic UI** — the displayed state updates immediately on click, and the Server Action is called asynchronously after a 300 ms debounce.

**Display modes (controlled by `type` prop):**

| `type` | Rendered As | Icon |
|---|---|---|
| `'icon'` | Small icon button | Filled/unfilled `Star` |
| `'button'` | Full-width button with label | Optionally `Trash2` when `showTrashIcon` is true |

**Interaction flow:**

```
User clicks
  └─ handleClick
       ├─ e.stopPropagation() + e.preventDefault()  (prevents row click on table)
       ├─ setAdded(!added)                           (optimistic UI update)
       └─ debouncedToggle()
             └─ toggleWatchlist() after 300ms
                  ├─ addToWatchlist() or removeFromWatchlist() (Server Action)
                  ├─ toast.success(...)
                  └─ onWatchlistChange?.(symbol, !added)  (notify parent)
```

The `onWatchlistChange` callback allows `SearchCommand` to keep its local stock list in sync without a page reload.

### 7.6 `WatchlistTable`

**File:** [components/WatchlistTable.tsx](components/WatchlistTable.tsx)
**Type:** Client Component

Renders the user's watchlist as a scrollable table using the shadcn/ui `Table` primitives. Column headers are driven by the `WATCHLIST_TABLE_HEADER` constant.

**Columns:** Company, Symbol, Price, Change, Market Cap, P/E Ratio, Alert, Action

**Key behaviors:**

- **Clickable rows** — each `TableRow` has an `onClick` that calls `router.push('/stocks/<symbol>')`. The `WatchlistButton` inside the row uses `e.stopPropagation()` to prevent the row click from firing when the star/trash icon is clicked.
- **Color-coded change** — the Change column applies `getChangeColorClass(changePercent)` which returns `text-green-500` for positive, `text-red-500` for negative, and `text-gray-400` for no data.
- **Graceful fallbacks** — all data fields display `'—'` if the value is missing (e.g., when a Finnhub call failed for that symbol).
- **Alert button** — each row shows an "Add Alert" button (currently a UI placeholder).
- **Action column** — `WatchlistButton` rendered with `type='icon'` and `showTrashIcon={true}`, displaying a `Trash2` icon instead of a star for removals.

### 7.7 `TradingViewWidget`

**File:** [components/TradingViewWidget.tsx](components/TradingViewWidget.tsx)
**Type:** Client Component (wrapped in `React.memo`)

A thin wrapper that delegates script injection to the `useTradingViewWidget` hook and renders the required container `<div>` structure that TradingView widgets expect.

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `scriptUrl` | `string` | required | Full URL to the TradingView embed script |
| `config` | `Record<string, unknown>` | required | Widget configuration object |
| `height` | `number` | `600` | Height in pixels |
| `title` | `string` | optional | Displayed as an `<h3>` above the widget |
| `className` | `string` | optional | Additional class on the container div |

Wrapped in `React.memo` to prevent re-renders when parent state changes don't affect the widget's props. This is important because TradingView scripts re-initialize on DOM change.

---

## 8) Custom Hooks

### 8.1 `useTradingViewWidget`

**File:** [hooks/useTradingViewWidget.tsx](hooks/useTradingViewWidget.tsx)

Manages the full lifecycle of a TradingView embedded widget: injection, guard against double-loading, and cleanup.

**Implementation:**

```
useEffect (runs on mount and when scriptUrl/config/height change)
  │
  ├─ Guard: if containerRef.current.dataset.loaded exists → bail out
  │
  ├─ Reset inner HTML to a fresh widget div
  │
  ├─ Create <script> element
  │   ├─ src = scriptUrl
  │   ├─ async = true
  │   └─ innerHTML = JSON.stringify(config)  ← TradingView reads this
  │
  ├─ Append script to container
  │
  ├─ Set dataset.loaded = "true"  ← prevents double-injection
  │
  └─ Cleanup function
       └─ containerRef.current.innerHTML = ""
          delete containerRef.current.dataset.loaded
```

**Returns:** `containerRef` — a `RefObject<HTMLDivElement>` attached to the container element in `TradingViewWidget`.

**Why `dataset.loaded`?** React's `StrictMode` runs effects twice in development. The `dataset.loaded` flag ensures the script is only injected once even if the effect fires multiple times.

### 8.2 `useDebounce`

**File:** [hooks/useDebounce.ts](hooks/useDebounce.ts)

Returns a stable debounced version of a callback function. Built with `useCallback` and a `useRef`-stored timeout, so the returned function reference is stable across renders.

**Usage across the app:**

| Component | Delay | Purpose |
|---|---|---|
| `SearchCommand` | 300 ms | Debounces Finnhub search API calls as the user types |
| `WatchlistButton` | 300 ms | Prevents rapid-fire watchlist add/remove Server Action calls |

**Signature:**
```typescript
function useDebounce(callback: () => void, delay: number): () => void
```

---

## 9) Form System

All forms use `react-hook-form` with `mode: 'onBlur'` — validation runs when a field loses focus, not on every keystroke.

Three reusable form field components in [components/forms/](components/forms/) compose Radix UI primitives with RHF registration.

### 9.1 `InputField`

**File:** [components/forms/InputField.tsx](components/forms/InputField.tsx)

Wraps Radix `Input` + `Label`. Integrates with RHF via the `register` prop spread. Renders error messages below the field when `error` is set.

**Props:** `name`, `label`, `placeholder`, `type` (default `"text"`), `register`, `error`, `validation`, `disabled`, `value`

### 9.2 `SelectField`

**File:** [components/forms/SelectField.tsx](components/forms/SelectField.tsx)

Wraps Radix `Select` inside an RHF `Controller`. Accepts a typed `options` array and renders `SelectItem` for each entry.

**Props:** `name`, `label`, `placeholder`, `options` (`Option[]`), `control`, `error`, `required`

**Used for:** Investment Goals, Risk Tolerance, Preferred Industry on the sign-up form.

### 9.3 `CountrySelectField`

**File:** [components/forms/CountrySelectField.tsx](components/forms/CountrySelectField.tsx)

A searchable combobox for country selection built with Radix `Popover` + cmdk `Command`. Uses `react-select-country-list` for ISO 3166-1 alpha-2 country data.

**Features:**
- Flag emojis generated from country codes using Unicode Regional Indicator code points
- Searchable by country name (type to filter)
- Shows `Check` icon next to the currently selected country
- Wrapped in RHF `Controller`
- Helper text below: *"Helps us show market data and news relevant to you."*

### 9.4 `FooterLink`

**File:** [components/forms/FooterLink.tsx](components/forms/FooterLink.tsx)

A simple stateless component rendering the "Already have an account? Sign in" row at the bottom of forms.

**Props:** `text` (grey label), `linkText` (yellow link), `href`

---

## 10) Design System

### 10.1 Color Palette

| Role | Value | Usage |
|---|---|---|
| Primary accent | `yellow-500` / `#FDD458` | Active nav links, CTA buttons, hover states, star icons |
| Background (page) | `#0F0F0F` / `#141414` | Page backgrounds, widget backgrounds |
| Background (card) | `#212328` | Table rows, email card backgrounds |
| Border | `#30333A` | Card borders, separators |
| Text primary | `#f8f9fa` / `gray-100` | Headings, active states |
| Text secondary | `#CCDADC` / `gray-400` | Body text, nav items |
| Text muted | `gray-500` | Subtitles, disabled states |
| Positive change | `green-500` | Price increases in table |
| Negative change | `red-500` | Price decreases in table |

### 10.2 Typography

| Font | Variable | Usage |
|---|---|---|
| Geist Sans | `--font-geist-sans` | Primary UI font |
| Geist Mono | `--font-geist-mono` | Monospace contexts |

Both fonts are loaded via `next/font/google` with the `latin` subset and applied as CSS variables on `<body>`.

### 10.3 Dark Mode

The application is hardcoded to dark mode:

```tsx
// app/layout.tsx
<html lang="en" className="dark">
```

There is no theme toggle. All Radix primitives and Tailwind utilities receive dark mode styling unconditionally. TradingView widget configs all specify `colorTheme: 'dark'`.

### 10.4 Custom CSS Classes

Defined in [app/globals.css](app/globals.css), the application uses semantic custom class names rather than inlining full Tailwind utility chains in JSX. Examples:

| Class | Applied To |
|---|---|
| `header` | `<header>` in Header |
| `header-wrapper` | Inner flex container in Header |
| `home-section` | Grid sections on Dashboard |
| `watchlist-table` | `<Table>` in WatchlistTable |
| `table-header-row` / `table-row` / `table-cell` | Table row/cell elements |
| `watchlist-btn` / `watchlist-icon-btn` | WatchlistButton variants |
| `watchlist-icon-added` | Added state on icon button |
| `search-btn` / `search-text` | SearchCommand trigger |
| `search-dialog` / `search-field` / `search-list` | SearchCommand dialog internals |
| `form-input` / `form-label` | Form field inputs and labels |
| `select-trigger` | SelectField trigger button |
| `yellow-btn` | Primary CTA buttons |
| `auth-layout` / `auth-left-section` / `auth-right-section` | Auth page layout |
| `auth-blockquote` / `auth-testimonial-author` | Auth page testimonial |

### 10.5 Component Variants

The `Button` component uses `class-variance-authority` (CVA) to define variants. The primary button style is applied via the custom `yellow-btn` class. The `cn()` utility (from `lib/utils.ts`) merges Tailwind classes safely using `clsx` + `tailwind-merge`.

---

## 11) TypeScript Types

All shared types are declared globally in [types/global.d.ts](types/global.d.ts). Because they are in the `declare global` block, they are available throughout the codebase without explicit imports.

### 11.1 Auth Types

| Type | Fields |
|---|---|
| `User` | `id`, `name`, `email` |
| `SignInFormData` | `email`, `password` |
| `SignUpFormData` | `fullName`, `email`, `password`, `country`, `investmentGoals`, `riskTolerance`, `preferredIndustry` |

### 11.2 Stock Types

| Type | Fields | Notes |
|---|---|---|
| `Stock` | `symbol`, `name`, `exchange`, `type` | Base search result |
| `StockWithWatchlistStatus` | `Stock & { isInWatchlist: boolean }` | Used in search command and nav |
| `StockWithData` | Watchlist item fields + `currentPrice`, `changePercent`, `priceFormatted`, `changeFormatted`, `marketCap`, `peRatio` | Enriched watchlist row |
| `SelectedStock` | `symbol`, `company`, `currentPrice?` | Minimal stock reference |

### 11.3 Finnhub API Types

| Type | Fields | Notes |
|---|---|---|
| `QuoteData` | `c?` (current price), `dp?` (day percent change) | Finnhub quote response subset |
| `ProfileData` | `name?`, `marketCapitalization?` | Finnhub profile2 response subset |
| `FinancialsData` | `metric?: { [key: string]: number }` | Finnhub metrics response |
| `FinnhubSearchResult` | `symbol`, `description`, `displaySymbol?`, `type` | Single search result item |
| `FinnhubSearchResponse` | `count`, `result: FinnhubSearchResult[]` | Full search response |
| `RawNewsArticle` | `id`, `headline?`, `summary?`, `source?`, `url?`, `datetime?`, `image?`, `category?`, `related?` | Raw Finnhub news response |
| `MarketNewsArticle` | `id`, `headline`, `summary`, `source`, `url`, `datetime`, `category`, `related`, `image?` | Normalized article (all fields required except `image`) |

### 11.4 Component Prop Types

| Type | Used By |
|---|---|
| `FormInputProps` | `InputField` |
| `SelectFieldProps` | `SelectField` |
| `CountrySelectProps` | `CountrySelectField` |
| `FooterLinkProps` | `FooterLink` |
| `SearchCommandProps` | `SearchCommand` |
| `WatchlistButtonProps` | `WatchlistButton` |
| `WatchlistTableProps` | `WatchlistTable` |
| `StockDetailsPageProps` | `stocks/[symbol]/page.tsx` |

### 11.5 Email Types

| Type | Fields |
|---|---|
| `WelcomeEmailData` | `email`, `name`, `intro` |
| `UserForNewsEmail` | `id`, `email`, `name` |

### 11.6 Alert Types (Partial Implementation)

These types are declared in `global.d.ts` for planned alert functionality that is currently represented as a UI placeholder button in `WatchlistTable`.

| Type | Fields |
|---|---|
| `Alert` | `id`, `symbol`, `company`, `alertName`, `currentPrice`, `alertType` (`'upper' \| 'lower'`), `threshold`, `changePercent?` |
| `AlertData` | `symbol`, `company`, `alertName`, `alertType`, `threshold` |
| `AlertModalProps` | `alertId?`, `alertData?`, `action?`, `open`, `setOpen` |
| `AlertsListProps` | `alertData: Alert[] \| undefined` |
