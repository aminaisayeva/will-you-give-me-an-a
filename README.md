# Will you give me an A?

A Next.js app styled as a macOS desktop, with a system popup that asks the only question that matters:

> my name is Amina, i am not an ai (i think)
>
> **Will you give me an A?**

- **Yes** — always works. 🎉
- **No** — never works. Every attempt makes **Yes** bigger. After 20 attempts, YES takes over the entire screen.

## AminaOS desktop

Everything opens as a draggable, resizable window on one desktop, ported from my AminaOS project: Safari, Mail, Terminal, Calendar, Photos, Files + Text Viewer, About Me, Education, Contact, Help, Sudoku, Trash, System Settings and final_grade.pdf. Menu bar ( menu, Go, Help), Dock, draggable desktop icons, Spotlight (⌘K) and dark mode included. URLs deep-link into windows: `/mail`, `/terminal`, `/settings/password`, `/transcript`, `/safari/<address>`.

## Safari: AI-built websites (assignment 4)

Type a web address that doesn't exist (`bodega-cats.nyc`) or describe a site, and **Gemini** builds it as a single-file web page. The generated "internet" is shared: an address someone already built just opens.

- **Generate** (`POST /api/sites`, signed-in only, 20 per user per day). The page, the user's prompt, the exact system prompt and the model name are saved in `sites`.
- **Rate**: signed-in users upvote/downvote other people's sites. Each vote is a row in `site_votes`; a trigger keeps `sites.upvotes/downvotes/score` in sync. Start page tabs: Trending (this week), New, All-Time, My Sites. Shareable links: `/safari/<address>`.
- **Sandboxed**: generated HTML is served from `/s/<address>` with a CSP `sandbox allow-scripts` header (opaque origin: no cookies, no storage, no network) and shown in a sandboxed iframe.
- **Strict RLS on every table** (`supabase/sites.sql`): anyone can read sites; only signed-in users create sites (as themselves, with trigger-maintained counts and author name they can't write); votes are private to the voter and you can't vote on your own site; mail is signed-in only (shared inbox + your own sent mail); profiles allow editing only your name and photo.
- Terminal: `safari <idea>` builds a site, `ls -l ~/Sites` lists them, `open <address>` visits one.

Set `GEMINI_API_KEY` (from aistudio.google.com) and optionally `GEMINI_MODEL` (default `gemini-2.5-flash`) in `.env.local` and in Vercel.

## Mail app (Supabase)

Click the **Mail** icon in the dock to open `/mail`, a macOS-style Mail window.

- **Inbox** and **Sent** list rows from the `emails` table in Supabase, fetched on every request.
- **New Message** sends an email through a Server Action, which inserts a row into `emails`. It then appears in **Sent**.
- Signed-in users see the shared inbox and only the mail they sent; they can only send as themselves (RLS). The schema lives in `supabase/emails.sql` and `supabase/sites.sql`.

## Accounts (Supabase Auth: email/password + Google)

- **Lock screen first.** Every new browser session starts at **`/login`**, which looks like the macOS lock screen. Signed out, it says *Hello, stranger* and offers email + password, **Sign in with Google**, **Create Account…** and **Guest User**. Signed in, it says *Hello, {first name}* with **Continue** and **Log Out**. A session cookie (`mac-unlocked`) remembers that you got past it. ** menu → Lock Screen** brings you back.
- Google sends people back to exactly **`/auth/callback`**. If the Google provider isn't switched on in Supabase, the button explains that instead of failing.
- New users get a row in **`profiles`** from a trigger on `auth.users`. Email sign-ups pass their name. Google sign-ups start with null names, so they land on **`/welcome`** (a Setup Assistant) to fill them in.
- **System Settings** (the ⚙️ icon on the desktop or in the dock, the  menu, or the account menu) lives at **`/settings`**:
  - **Profile**: upload, change or remove a photo. Photos go to the public `avatars` Storage bucket, and the table only stores the path.
  - **Users & Groups**: first name and last name.
  - **Login Password**: a macOS-style Change Password sheet (old, new, verify). Google-only accounts can set a password here.
- **`/transcript`** (`final_grade.pdf` on the desktop) is the gated route. Signed-out visitors and guests are sent to `/login`.
- `proxy.ts` refreshes the session, enforces the lock screen and guards gated routes. Each gated page checks the user again on the server.
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
