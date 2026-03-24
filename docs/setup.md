# Frontend Setup

## Purpose

The frontend is a Next.js PWA starter for upload, OCR review, and local-first expense storage.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_OCR_API_URL`.
3. Run `npm install` from the repository root.
4. Start the frontend with `npm run dev:fe`.

## Google Sign-In (Supabase)

### Step 1 — Google Cloud Console

1. Go to APIs & Services → Credentials → your OAuth 2.0 Client ID.
2. Under **Authorized redirect URIs**, add the Supabase callback URL:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   This is what Google redirects to after the user consents. If this entry is missing you get **400: redirect_uri_mismatch**.

### Step 2 — Supabase Dashboard

1. Go to **Authentication → Providers → Google**, enable it, and paste your Google OAuth client ID and secret.
2. Go to **Authentication → URL Configuration → Redirect URLs**, add:
   - `http://localhost:3000/expenses` (local dev)
   - `https://your-app.vercel.app/expenses` (production)

   These are the app URLs Supabase is allowed to forward the user to after handling the callback.

## Implementation Notes

- Keep secrets out of the frontend; only use public Supabase keys here.
- Use IndexedDB via Dexie for all business records.
- Treat OCR output as editable draft data before save.

