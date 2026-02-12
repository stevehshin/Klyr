# How to Put Klyr on the Internet (Simple Steps)

This guide gets your Klyr app online so you can open it from any computer or phone. No coding required—just follow the steps.

---

## What You’ll Need (All Free)

1. **GitHub** – where your code will live (github.com)
2. **Vercel** – the place that will host your app (vercel.com)
3. **Neon** – the place that will host your database (neon.tech)

Create free accounts on these three sites if you don’t have them.

---

## Step 1: Create a Database Online (Neon)

Your app needs a database. Neon gives you one for free.

1. Go to **https://neon.tech** and sign up (or log in).
2. Click **New Project**.
3. Name it something like **klyr** and pick a region close to you. Click **Create**.
4. On the project page, find **Connection details** (or a **Connection string**).
5. You’ll see two URLs. Copy both and keep them somewhere safe (e.g. a text file):
   - **Pooled** or **Connection string** → you’ll use this as `DATABASE_URL`
   - **Direct** (if shown) → you’ll use this as `DIRECT_URL`  
   If you only see one URL, use the same one for both for now.

---

## Step 2: Put Your Code on GitHub

So Vercel can see and deploy your app, the code needs to be on GitHub.

1. Go to **https://github.com** and sign in.
2. Click the **+** (top right) → **New repository**.
3. Name it **klyr** (or whatever you like). Leave other options as default. Click **Create repository**.
4. On your computer, open Terminal (or Command Prompt) and go to your Klyr project folder.
   - **Don’t** type `path/to/your/klyr`—that’s just an example.
   - Use the real folder where Klyr lives. For example, if Klyr is in your Documents:
     ```bash
     cd ~/Documents/klyr
     ```
   - Or drag the **klyr** folder onto the Terminal window and it will paste the full path; then type `cd ` (with a space) in front of it and press Enter.
5. Run these commands one by one (replace `YOUR_USERNAME` with your GitHub username and `klyr` with your repo name if different):

   ```bash
   git init
   git add .
   git commit -m "First commit"
   git branch -M main
   git remote add origin https://github.com/stevehshin/klyr.git
   git push -u origin main
   ```

   If it asks for login, use your GitHub username and a **Personal Access Token** (not your normal password). You can create a token in GitHub: Settings → Developer settings → Personal access tokens.

---

## Step 3: Tell Neon About Your Tables (One-Time Setup)

**What this means:** Your Neon database starts empty. Klyr needs specific “tables” in it (like User, Grid, Tile, etc.) to store your data. This step creates those tables in Neon so the app can run.

**What you do:**

1. **Open the `.env` file** in your Klyr project folder (same place as `package.json`).  
   - If you don’t see `.env`, copy `.env.example` and rename the copy to `.env`.

2. **Put your two Neon URLs in `.env`.**  
   From your Neon project (Step 1), you copied two connection strings. In `.env` you should have two lines like this (use your real URLs—they’re long and start with `postgresql://`):
   ```text
   DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   ```
   - **Pooled** URL from Neon → use for `DATABASE_URL`.
   - **Direct** URL from Neon → use for `DIRECT_URL`.  
   If Neon only gave you one URL, use that same URL for both lines. Save the file.

3. **Open Terminal** and go to your Klyr folder, e.g.:
   ```bash
   cd "/Users/steve.shin/Library/CloudStorage/GoogleDrive-steve.shin@salesforce.com/My Drive/Solution Engineering Stuff/Cursor/Project 1:16:2026/klyr"
   ```

4. **Run the command that creates the tables:**
   ```bash
   npm run db:deploy
   ```
   If that says “command not found”, try:
   ```bash
   ./node_modules/.bin/prisma db push
   ```

5. When it finishes without errors, you’re done. Neon now has the tables (User, Grid, Tile, etc.) and your app can use them. You only need to do this once per database.

---

## Step 4: Deploy on Vercel

Vercel will build your app and give you a link anyone can use.

### Where to get the two Neon URLs (pooled and direct)

In Neon, open your project and click **Connect** (or the connection / SQL icon). A box titled **“Connect to your database”** will open.

**Get the pooled URL (for `DATABASE_URL`):**

1. In that box, find the **“Connection pooling”** toggle. Leave it **ON** (green).
2. The long line of text below it is your **pooled** connection string (it has `-pooler` in the address). Click **“Show password”** so the real password is visible, then click **“Copy snippet”** (or select all and copy). Paste this somewhere safe (e.g. a Notes app)—this is your **pooled URL**. You’ll use it for **DATABASE_URL** in Vercel.

**Get the direct URL (for `DIRECT_URL`):**

3. Turn the **“Connection pooling”** toggle **OFF**. The connection string will change (the `-pooler` part will disappear).
4. Click **“Copy snippet”** again (the password is still shown). This second URL is your **direct URL**. You’ll use it for **DIRECT_URL** in Vercel.

You should now have two different URLs: one with `-pooler` (pooled) and one without (direct). Use them in Vercel as in the table below.

---

**Now deploy on Vercel:**

1. Go to **https://vercel.com** and sign in (with GitHub connected so Vercel can see your repos).
2. Click **Add New** → **Project**.
3. Find your **klyr** repository and click **Import**.
4. Before clicking Deploy, open **Environment Variables** (or **Configure**).
5. Add these three variables (use the exact names):

   | Name           | Value                                      |
   |----------------|--------------------------------------------|
   | `DATABASE_URL` | Paste the **pooled** URL (the one with `-pooler`) |
   | `DIRECT_URL`   | Paste the **direct** URL (the one without `-pooler`) |
   | `JWT_SECRET`   | Any long random string (e.g. 32+ letters) |

   To make a random `JWT_SECRET`, run in Terminal:  
   `openssl rand -base64 32`  
   and paste the result.

6. Click **Deploy**.

---

## Step 5: You’re Done

When the deploy finishes, Vercel will show you a link like:

**https://klyr-xxxxx.vercel.app**

Open that link in any browser, on any device. That’s your app on the internet. You can share this URL (or add a custom domain later in Vercel’s project Settings → Domains).

---

## Deploying future updates

Once the app is live, any new features or fixes will go live automatically when you push to GitHub:

1. Make your changes in the **klyr** project folder.
2. In Terminal, from the klyr folder:
   ```bash
   git add .
   git commit -m "Brief description of what you changed"
   git push origin main
   ```
3. Vercel will detect the push, build, and deploy. Check the **Deployments** tab in your Vercel project to see the new build go live.

No need to click “Deploy” in Vercel unless you want to re-run a build for the same code (e.g. after changing environment variables).

---

## Quick Troubleshooting

- **Build fails**  
  Check that `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` are all set in Vercel (Environment Variables).

- **“Invalid session” or login problems**  
  Make sure `JWT_SECRET` is set in Vercel and is at least 32 characters long.

- **Database errors**  
  Double-check that the Neon URLs in Vercel are correct and that you ran **Step 3** so the database tables exist.

---

For more technical details, see **DEPLOYMENT.md**.
