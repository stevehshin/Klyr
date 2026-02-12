# KLYR

A privacy-first, tile-based workspace with end-to-end encryption.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Grid Layout**: react-grid-layout
- **Database**: SQLite (dev), PostgreSQL (production)
- **ORM**: Prisma
- **Encryption**: Web Crypto API (client-side)
- **Authentication**: JWT with httpOnly cookies

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-random-secret-here"
```

### 3. Initialize Database

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /register       - User registration page
  /login          - User login page
  /grid           - Main workspace
  /api            - API routes
    /auth         - Authentication endpoints
    /grid         - Grid management
    /tiles        - Tile management
    /messages     - Encrypted message endpoints

/components
  Grid.tsx        - Main grid component
  Tile.tsx        - Base tile component
  NotesTile.tsx   - Notes tile (local storage)
  DMTile.tsx      - DM tile (opens overlay)
  DMOverlay.tsx   - Modal for viewing/sending messages
  Toast.tsx       - Notification component

/lib
  prisma.ts       - Prisma client singleton
  auth.ts         - JWT authentication utilities
  crypto.ts       - Client-side encryption utilities

/prisma
  schema.prisma   - Database schema
```

## Privacy Model

- **Notes Tiles**: Stored ONLY in browser localStorage, never sent to server
- **DM Messages**: Encrypted client-side before sending to server
- **Encryption Keys**: Generated once per browser, stored in localStorage + URL hash
- **Server**: Never sees plaintext data or encryption keys

## Features

- ✅ User registration & login
- ✅ Draggable, resizable tiles
- ✅ Notes tiles (local storage)
- ✅ DM tiles (end-to-end encrypted)
- ✅ 12-column responsive grid
- ✅ No tile overlap
- ✅ Toast notifications
- ✅ Keyboard navigation
- ✅ ARIA labels

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## Deployment

This project is configured for deployment on Vercel.

For production, update your `.env` to use PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-production-secret"
```

Then run:

```bash
npm run db:push
npm run build
```
