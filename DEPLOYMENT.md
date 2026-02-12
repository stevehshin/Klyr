# Deploy KLYR to the Web (Vercel + Neon)

This guide walks you through deploying KLYR so it's accessible from anywhere.

> **Note:** The app now uses PostgreSQL (required for hosting). For local development, create a free Neon database — see "Local Development After Deployment" below. Your existing SQLite data will not migrate; you'll register fresh on the new database.

---

## Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free)
- A [Neon](https://neon.tech) account (free)

---

## Step 1: Set Up the Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. Create a new project (e.g. "klyr").
3. Copy the **connection string** from the dashboard.
4. Neon provides two URLs:
   - **Pooled connection** → use for `DATABASE_URL`
   - **Direct connection** → use for `DIRECT_URL`
   
   (Both are visible in the Neon dashboard under "Connection details".)

---

## Step 2: Push Your Schema to Neon

Before deploying, initialize your production database:

```bash
# Set your production database URLs (or add to .env)
export DATABASE_URL="postgresql://..."  # Your Neon pooled URL
export DIRECT_URL="postgresql://..."   # Your Neon direct URL

# Push the schema to create all tables
npm run db:deploy
```

---

## Step 3: Push Code to GitHub

1. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub.

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/klyr.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project**.
3. Import your **klyr** repository.
4. Configure Environment Variables (click **Environment Variables**):
   - `DATABASE_URL` → your Neon pooled connection string
   - `DIRECT_URL` → your Neon direct connection string  
   - `JWT_SECRET` → generate a random string (e.g. `openssl rand -base64 32`)
5. Click **Deploy**.

---

## Step 5: You're Live!

Vercel will build and deploy your app. You'll get a URL like:

**https://klyr-xxxxx.vercel.app**

You can access KLYR from any device, anywhere.

---

## Local Development After Deployment

For local development, use a **separate** Neon database (free tier allows multiple projects):

1. Create a second Neon project (e.g. "klyr-dev").
2. Update your local `.env`:
   ```
   DATABASE_URL="postgresql://..."  # Neon dev pooled URL
   DIRECT_URL="postgresql://..."    # Neon dev direct URL
   JWT_SECRET="dev-secret"         # Fine for local only
   ```
3. Run `npm run db:deploy` to sync the schema.
4. Run `npm run dev` and work as usual.

---

## Optional: Custom Domain

1. In Vercel → your project → **Settings** → **Domains**.
2. Add your domain and follow the DNS instructions.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "Prisma" | Ensure `DATABASE_URL` and `DIRECT_URL` are set in Vercel. |
| "Invalid session" on login | Set a strong `JWT_SECRET` in Vercel (min 32 chars). |
| Database connection errors | Verify Neon URLs are correct; use pooled for `DATABASE_URL`. |
