# How to Get "The Room" Working (Free)

The Room is a drop-in voice/video feature. It needs a small helper server (the "signaling server") to connect people. This guide walks you through running it **locally** and **in production for free** using Render.

---

## Part 1: Local Development (Already Works)

If you just want to try The Room on your own computer:

1. Open a terminal in your project folder (the `klyr` folder).
2. Run:
   ```bash
   npm run dev:all
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Add a "The Room" tile to your grid (Add Tile → The Room).
5. Click **Join The Room**. It should work.

---

## Part 2: Production (Free on Render)

To use The Room when your app is live on the internet (e.g. on Vercel), you need to host the signaling server. Render has a free tier that works for this.

### What You’ll Do

1. Push your latest code to GitHub (if you just updated the project, run `git add .`, `git commit -m "Add Room setup"`, and `git push`).
2. Create a free Render account and deploy the signaling server.
3. Tell your KLYR app (on Vercel) where that server lives.

---

### Step 1: Put Your Code on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. If you don’t have a repo for KLYR yet:
   - Click the **+** (top right) → **New repository**.
   - Name it something like `klyr`.
   - Choose **Public**.
   - Click **Create repository**.
3. In your project folder, run (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

**If your KLYR app lives in a subfolder** (e.g. `klyr` inside a bigger repo), note that. You’ll use it in Step 3.

---

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com).
2. Click **Get Started for Free**.
3. Sign up with GitHub (recommended so Render can see your repos).

---

### Step 3: Deploy the Signaling Server on Render

1. In Render, click **Dashboard** (or **New +** → **Web Service**).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if asked.
4. Select the repository that contains your KLYR project.
5. Fill in the form:

   | Field | What to enter |
   |-------|----------------|
   | **Name** | `klyr-signaling` (or any name you like) |
   | **Region** | Pick one close to you (e.g. Oregon) |
   | **Branch** | `main` |
   | **Root Directory** | If KLYR is in a `klyr` subfolder, type `klyr`. Otherwise leave blank. |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm run signaling` |
   | **Instance Type** | **Free** |

6. Click **Create Web Service**.
7. Wait for the first deploy to finish (a few minutes).
8. When it’s done, you’ll see a URL like:
   ```
   https://klyr-signaling-xxxx.onrender.com
   ```
   Copy this URL. You’ll use it in the next step.

---

### Step 4: Tell Your KLYR App Where the Signaling Server Is

1. Go to [vercel.com](https://vercel.com) and open your KLYR project.
2. Go to **Settings** → **Environment Variables**.
3. Add a new variable:
   - **Name:** `NEXT_PUBLIC_SIGNALING_URL`
   - **Value:** `https://klyr-signaling-xxxx.onrender.com` (paste the URL from Step 3)
   - **Environment:** Production (and Preview if you want)
4. Click **Save**.
5. Trigger a new deploy so the change is used:
   - Go to **Deployments**.
   - Click the **⋮** on the latest deployment → **Redeploy**.

---

### Step 5: Test It

1. Open your live KLYR app (e.g. `https://klyr-alpha.vercel.app`).
2. Add a "The Room" tile.
3. Click **Join The Room**.

   If it’s the first time in a while, Render may spin the server up from sleep. That can take 30–60 seconds. After that, it should work.

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| "Join" fails or nothing happens | Wait 1–2 minutes after opening the app (Render may be waking the server). Try again. |
| Works locally but not in production | Check that `NEXT_PUBLIC_SIGNALING_URL` is set in Vercel and that you redeployed after adding it. |
| Render free tier limits | Free services sleep after ~15 minutes of no use. The first request after sleep may wake them up slowly. |

---

## Summary

- **Local:** Run `npm run dev:all` and use The Room at `http://localhost:3000`.
- **Production:** Deploy the signaling server to Render (free), set `NEXT_PUBLIC_SIGNALING_URL` in Vercel, and redeploy.
