# Will you give me an A?

A Next.js app styled as a macOS desktop, with a system popup that asks the only question that matters:

> my name is Amina, i am not an ai (i think)
>
> **Will you give me an A?**

- **Yes** — always works. 🎉
- **No** — never works. Every attempt makes **Yes** bigger. After 20 attempts, YES takes over the entire screen.

## Mail app (Supabase)

Click the **Mail** icon in the dock to open `/mail`, a macOS-style Mail window.

- **Inbox** and **Sent** list rows from the `emails` table in Supabase, fetched on every request.
- **New Message** sends an email through a Server Action, which inserts a row into `emails`. It then appears in **Sent**.
- Row level security lets the public read and insert into `sent` only. The schema lives in `supabase/emails.sql`.

## Accounts (Supabase Auth + Google)

- **`/login`** looks like the macOS lock screen. **Sign in with Google** goes through Supabase Auth and comes back to **`/auth/callback`**.
- New users get a row in **`profiles`** from a trigger on `auth.users`. `first_name` and `last_name` start out null, so the first sign-in opens **`/welcome`** (a Setup Assistant) to ask for them.
- **`/profile`** (System Settings in the dock) changes your name and uploads a photo. Photos go to the public `avatars` Storage bucket, and the table only stores the file path.
- **`/transcript`** (`final_grade.pdf` on the desktop) is the gated route. Signed-out visitors get redirected to `/login`.
- `proxy.ts` refreshes the session cookie on every request and redirects signed-out users away from gated routes. Each gated page checks the user again on the server.
- Mail sent while signed in records your `sender_id`. The schema lives in `supabase/profiles.sql`.

### Google OAuth setup

1. In Google Cloud Console, create an **OAuth client ID** (Web application) with the authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
2. In Supabase → Authentication → Sign In / Providers → **Google**, paste the client ID and secret.
3. In Supabase → Authentication → URL Configuration, set the Site URL to the Vercel domain and add `http://localhost:3000/auth/callback` and `https://<vercel-domain>/auth/callback` to the Redirect URLs.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres, Auth, Storage via `@supabase/ssr` + `@supabase/supabase-js`)
- Deployed on [Vercel](https://vercel.com)

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try pressing No. Go ahead. Try.
