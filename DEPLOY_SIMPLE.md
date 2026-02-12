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
   git remote add origin https://github.com/YOUR_USERNAME/klyr.git
   git push -u origin main
   ```

   If it asks for login, use your GitHub username and a **Personal Access Token** (not your normal password). You can create a token in GitHub: Settings → Developer settings → Personal access tokens.

---

## Step 3: Tell Neon About Your Tables (One-Time Setup)

Your app expects certain tables in the database. Create them once:

1. In your Klyr folder, make sure your `.env` file has the two Neon URLs:
   ```text
   DATABASE_URL="postgresql://..."   (your pooled URL from Step 1)
   DIRECT_URL="postgresql://..."     (your direct URL from Step 1)
   ```
2. In Terminal, from the Klyr folder, run:
   ```bash
   npm run db:deploy
   ```
   (Or: `./node_modules/.bin/prisma db push` if that’s what you’ve been using.)

---

## Step 4: Deploy on Vercel

Vercel will build your app and give you a link anyone can use.

1. Go to **https://vercel.com** and sign in. Choose **Continue with GitHub** so Vercel can see your repos.
2. Click **Add New** → **Project**.
3. Find your **klyr** repository and click **Import**.
4. Before clicking Deploy, open **Environment Variables** (or **Configure**).
5. Add these three variables (use the exact names):

   | Name           | Value                                      |
   |----------------|--------------------------------------------|
   | `DATABASE_URL` | Paste your Neon **pooled** connection URL |
   | `DIRECT_URL`   | Paste your Neon **direct** connection URL |
   | `JWT_SECRET`   | Any long random string (e.g. 32+ letters) |

   To make a random `JWT_SECRET`, you can run in Terminal:  
   `openssl rand -base64 32`  
   and paste the result.

6. Click **Deploy**.

---

## Step 5: You’re Done

When the deploy finishes, Vercel will show you a link like:

**https://klyr-xxxxx.vercel.app**

Open that link in any browser, on any device. That’s your app on the internet. You can share this URL (or add a custom domain later in Vercel’s project Settings → Domains).

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
