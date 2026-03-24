# Frontend Setup

## Purpose

The frontend is a Next.js PWA starter for upload, OCR review, and local-first expense storage.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_OCR_API_URL`.
3. Run `npm install` from the repository root.
4. Start the frontend with `npm run dev:fe`.

## Google Sign-In (Supabase)

1. In Supabase Dashboard, go to **Authentication → Providers → Google** and enable Google provider.
2. Add your Google OAuth client ID and secret in Supabase.
3. In Supabase Dashboard, go to **Authentication → URL Configuration** and allow these redirect URLs:
	- `http://localhost:3000/expenses`
	- Your deployed URL, for example `https://your-app.vercel.app/expenses`

## Implementation Notes

- Keep secrets out of the frontend; only use public Supabase keys here.
- Use IndexedDB via Dexie for all business records.
- Treat OCR output as editable draft data before save.

