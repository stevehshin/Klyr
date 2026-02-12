# Connect Google Calendar to the Calendar Tile

The Calendar tile in Klyr can show events from your Google Calendar. To enable this, you need to create a Google Cloud project and OAuth credentials, then add them to your app.

## 1. Create a Google Cloud project (if you don’t have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top → **New Project**.
3. Name it (e.g. “Klyr”) and click **Create**.

## 2. Enable the Google Calendar API

1. In the Cloud Console, open **APIs & Services** → **Library**.
2. Search for **Google Calendar API**.
3. Open it and click **Enable**.

## 3. Create OAuth 2.0 credentials

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. If asked to configure the OAuth consent screen:
   - Choose **External** (or Internal for a Google Workspace-only app).
   - Fill in **App name** (e.g. “Klyr”) and **User support email**.
   - Add your email under **Developer contact information**.
   - Save. You can leave **Scopes** and **Test users** for later if you’re in testing mode.
4. Back under **Credentials**, click **Create Credentials** → **OAuth client ID**.
5. Application type: **Web application**.
6. Name: e.g. “Klyr web”.
7. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/api/calendar/oauth/callback`
   - Production: `https://your-domain.com/api/calendar/oauth/callback` (replace with your real URL).
8. Click **Create**.
9. Copy the **Client ID** and **Client secret**; you’ll use them in the next step.

## 4. Configure your app

1. In the Klyr project root, copy `.env.example` to `.env` if you haven’t already.
2. Add or update:

```env
# Base URL of your app (no trailing slash)
APP_URL="http://localhost:3000"

# From the OAuth client you just created
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

- **Local:** Use `APP_URL="http://localhost:3000"` (or the port you use).
- **Production:** Use your real app URL, e.g. `APP_URL="https://klyr.example.com"`.
- The redirect URI in Google (step 3) must match exactly: `{APP_URL}/api/calendar/oauth/callback`.

3. Apply the database change for the new calendar field:

```bash
cd klyr
npx prisma db push
```

4. Restart the dev server (or your production process) so it picks up the new env vars.

## 5. Connect your calendar in the app

1. Open Klyr and go to your grid.
2. Add a **Calendar** tile (or open an existing one).
3. Click **Connect Google Calendar**.
4. Sign in with Google and allow **View your calendar events** (read-only).
5. You’ll be redirected back to the grid; the Calendar tile will show your Google Calendar events for the current month.

You can change month with the arrows. Use **Disconnect** in the tile header to unlink Google Calendar.

## Troubleshooting

- **“Google OAuth is not configured”**  
  Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env` and the server was restarted.

- **Redirect URI mismatch**  
  The redirect URI in Google (Credentials → your OAuth client → Authorized redirect URIs) must be exactly  
  `{APP_URL}/api/calendar/oauth/callback`  
  (e.g. `http://localhost:3000/api/calendar/oauth/callback`). No extra path or trailing slash.

- **“Failed to fetch events”**  
  Ensure the Google Calendar API is enabled for your project (step 2). If you revoked access in your Google account, disconnect the tile and connect again.

- **Database errors**  
  Run `npx prisma db push` (or your usual migration) so the `googleCalendarRefreshToken` column exists on the `User` table.
