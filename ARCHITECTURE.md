# Klyr — Architecture Overview

A high-level view of the system, data model, and how the pieces fit together.

---

## 1. System context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser / PWA)                           │
│  Next.js 15 (React 19) · Tailwind · react-grid-layout · JWT session cookie   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS (REST API, Server Components)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP (Vercel / Node)                          │
│  App Router · API Routes · Server Components · Prisma · lib/auth, crypto      │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                    │                      │
                    ▼                    ▼                      ▼
         ┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
         │   Neon DB     │     │  Google OAuth   │     │  OpenAI API      │
         │  (Postgres)   │     │  (Calendar)     │     │  (optional Flux) │
         └──────────────┘     └─────────────────┘     └──────────────────┘
```

- **Client:** SPA-style grid UI, sidebar, dock, modals; session via HTTP-only cookie.
- **Server:** Next.js app + API routes; Prisma for DB; server-side auth and calendar/OpenAI when used.
- **Data:** PostgreSQL (Neon); optional Google Calendar and OpenAI for Flux summaries.

---

## 2. Tech stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 15 (App Router), React 19 |
| Styling     | Tailwind CSS, CSS variables (theme) |
| Grid UI     | react-grid-layout |
| Database    | PostgreSQL (Neon), Prisma ORM |
| Auth        | Email/password, JWT in HTTP-only cookie (jose) |
| Crypto      | Client-side message encryption (Web Crypto), lib/crypto |
| Real-time   | WebSocket signaling server (optional, for calls) |
| Optional    | Google Calendar OAuth, OpenAI for Flux summary |

---

## 3. Data model (Prisma)

```
                    ┌─────────┐
                    │  User   │
                    └────┬────┘
                         │
     ┌───────────────────┼───────────────────┬─────────────────┬──────────────────┐
     │                   │                   │                 │                  │
     ▼                   ▼                   ▼                 ▼                  ▼
┌─────────┐        ┌──────────┐        ┌──────────┐      ┌─────────────┐    ┌──────────────┐
│  Grid   │        │GridShare │        │ Channel  │      │ChannelGroup │    │ChannelMember │
└────┬────┘        └──────────┘        └────┬─────┘      └─────────────┘    └──────────────┘
     │                                      │
     │ 1:N                                  │ 1:N
     ▼                                      ▼
┌─────────┐                           ┌─────────────────┐
│  Tile   │                           │ ChannelMessage  │
└────┬────┘                           └─────────────────┘
     │ 1:N
     ▼
┌─────────┐
│ Message │  (encrypted content, per tile)
└─────────┘
```

**Core entities:**

- **User** — email, passwordHash, optional Google Calendar token; owns grids, channels, channel groups.
- **Grid** — name, optional icon; belongs to one User; has many Tiles and optional GridShares.
- **GridShare** — links a Grid to a User with "view" or "edit".
- **Tile** — position (x, y, w, h), type (notes, dm, channel, tasks, links, calendar, call), optional channelId/conversationId; belongs to one Grid; can have many Messages.
- **Message** — encryptedContent, tileId, optional userId; used for tile-level notes/DM content.
- **Channel** — name, emoji, isPrivate; belongs to User and optional ChannelGroup; has ChannelMembers and ChannelMessages.
- **ChannelGroup** — name, order; groups Channels for one User.
- **ChannelMember** — user in a channel (role: owner, admin, member).
- **ChannelMessage** — encryptedContent in a channel.

---

## 4. App structure (Next.js App Router)

```
app/
├── layout.tsx              # Root layout, viewport, ThemeProvider
├── page.tsx                # Home → redirect to /login or /grid
├── globals.css             # Design tokens, theme, utilities
│
├── login/page.tsx          # Login form → JWT cookie
├── register/page.tsx       # Registration
│
├── grid/
│   ├── page.tsx            # Server: auth, load user + grids + current grid + tiles
│   └── GridWorkspace.tsx   # Client: main workspace (sidebar + grid or channel view)
│
├── call/page.tsx           # Call lobby (optional WebRTC flow)
│
└── api/
    ├── auth/
    │   ├── login/route.ts
    │   ├── logout/route.ts
    │   └── register/route.ts
    ├── grid/
    │   ├── route.ts        # POST create grid
    │   ├── [id]/route.ts   # GET/PATCH/DELETE grid (name, icon)
    │   ├── share/route.ts  # Share grid (GridShare)
    │   └── summary/route.ts # Flux: summarize content (OpenAI)
    ├── tiles/
    │   ├── create/route.ts
    │   ├── update-layout/route.ts
    │   ├── hide/route.ts
    │   ├── restore/route.ts
    │   ├── hidden/route.ts
    │   └── delete/route.ts
    ├── channels/
    │   ├── route.ts        # List/create channels
    │   ├── [id]/members/route.ts
    │   └── [id]/messages/route.ts
    ├── channel-groups/
    │   ├── route.ts
    │   └── [id]/route.ts
    ├── messages/route.ts   # Tile messages (encrypted)
    └── calendar/
        ├── oauth/url/route.ts
        ├── oauth/callback/route.ts
        ├── events/route.ts
        ├── status/route.ts
        └── disconnect/route.ts
```

---

## 5. Client UI architecture

```
GridWorkspace (client)
├── Sidebar (grids, channels, DMs, theme, settings)
│   ├── Desktop: inline or collapsed
│   └── Mobile: overlay drawer (☰)
├── View: either Grid or ChannelView
│   ├── Grid
│   │   ├── Header (grid switcher, share, focus, add tile, more)
│   │   ├── react-grid-layout (tiles)
│   │   └── TileContent per tile → NotesTile | DMTile | ChannelTile | TasksTile | etc.
│   └── ChannelView (full-channel chat when a channel is selected)
├── Dock (fixed bottom: Flux, Lens, notifications, quick jot, active tile)
├── FluxPanel (floating: AI quick actions, summary, overdue, suggest)
└── Modals: ShareGrid, CreateGrid, ThemeCustomizer, Settings, CreateChannel, etc.
```

**Context (React):**

- **ActiveGridProvider / useActiveGrid()** — current grid id/name (scope for Flux, etc.).
- **ActiveTileProvider / useActiveTile()** — active tile per grid (keyboard, dock).
- **ThemeProvider** — theme (light/dark, custom).

**Client-only state:**

- **Veil** — per-tile visibility (private/shared/veiled) and request access; stored in localStorage.
- **Active tile id** per grid — localStorage.

---

## 6. Auth and session flow

```
1. Login/Register  →  API validates  →  JWT signed (jose)  →  HTTP-only cookie set
2. Every API route  →  getSessionFromRequest() or getSession()  →  read cookie, verify JWT  →  userId
3. Server components (e.g. grid/page.tsx)  →  getSession()  →  redirect if no session  →  load user/grids
```

- **lib/auth.ts** — sign/verify JWT, getSession (server), getSessionFromRequest (API).
- **Middleware:** not used for auth in this setup; auth is done in routes and server components.

---

## 7. Key data flows

| Flow              | Client / Server | API / DB |
|-------------------|-----------------|----------|
| Load grids/tiles  | grid/page.tsx (server) | Prisma: User → grids, grid → tiles (with channel) |
| Create/update grid| GridWorkspace   | POST /api/grid, PATCH /api/grid/[id] |
| Tile layout       | Grid (react-grid-layout) | POST /api/tiles/update-layout |
| Add/hide/restore tile | Grid, TileMenu | /api/tiles/create, hide, restore, hidden |
| Tile messages     | NotesTile, DMTile, etc. | /api/messages (encrypted body) |
| Channels          | Sidebar, ChannelView   | /api/channels, /api/channels/[id]/messages |
| Grid share        | ShareGridModal  | /api/grid/share (GridShare) |
| Flux summary      | FluxPanel       | /api/grid/summary (OpenAI) + lib/gridContent.ts |
| Calendar          | CalendarTile    | /api/calendar/* (OAuth + events) |

---

## 8. Deployment

```
GitHub (main)  →  Vercel (build: prisma generate && next build)  →  Serverless functions + static
                     │
                     └── Env: DATABASE_URL, DIRECT_URL, JWT_SECRET (optional: OPENAI, Google OAuth)
Database: Neon PostgreSQL (separate from Vercel)
```

---

## 9. Directory map (source)

```
klyr/
├── app/              # Routes, pages, API, layout, globals.css
├── components/       # UI: Grid, Sidebar, Dock, tiles, modals, call, FluxPanel, etc.
├── context/          # KlyrContext (ActiveGrid, ActiveTile)
├── lib/              # auth, prisma, crypto, veil, settings, gridContent, call/, hooks/
├── prisma/           # schema.prisma
├── public/           # logo, static assets
└── server/           # Optional WebSocket signaling (calls)
```

This document reflects the architecture as of the current codebase (~11.5k lines of application code).
