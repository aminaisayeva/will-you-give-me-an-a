# cooked.ai

**Post a pic. AI roasts it. Everyone votes on who cooked.** Upload a photo and **Google Gemini** writes four captions in four voices made for our persona, Sam (a chronically online Columbia junior from the Midwest): *Chronically Online*, *Midwest Mom*, *Real New Yorker* and *Columbia Tour Guide*. Everyone votes on which caption cooked hardest.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page: what cooked.ai is, a sample post, the four voices. Signed-in users go straight to the feed. |
| `/feed` | The feed. **Anyone can browse.** Posting and voting need an account. Tabs: Hot (score decays with age), New, Top, My pics, plus a **Cook of the Day** banner. |
| `/signup`, `/login` | Create an account or log in with email + password, or **Continue with Google**. |
| `/onboarding` | Shown once after the first sign-in (e.g. with Google): first and last name, a **@username** and an optional profile photo. |
| `/profile` | Settings (signed-in only): public profile (display name, @username, photo), first/last name, password (Google-only accounts can set one), log out. |
| `/u/<username>` | Someone's public profile: photo, name, posts, total caption votes. You can vote here too. |

## How it works

- **Accounts** (Supabase Auth). New users get a `profiles` row from a trigger on `auth.users` (first/last name, nullable for Google sign-ups). Google sends people back to exactly **`/auth/callback`**, which sends anyone without a name or @username to `/onboarding`, everyone else to the feed. `proxy.ts` refreshes the session and guards `/profile` and `/onboarding`; each page checks the user again on the server.
- **Public profiles** live in `cooked_profiles` (@username, display name, avatar path). Profile photos go to the `avatars` Storage bucket; the table only stores the path.
- **Generate** (`POST /api/cooked`, signed-in only, 15 photos per user per day). The photo is resized in the browser, stored in the `photos` bucket (never in Postgres); the `photos` row keeps its path, the uploader's optional context, the exact system prompt and the model ("See the prompt" on every post). Captions go in `captions`.
- **Votes**: upvote/downvote other people's captions. Each vote is a row in `caption_votes`; triggers keep caption and photo scores in sync. You can't vote on your own pic.
- **Strict RLS** (`supabase/cooked.sql`, `supabase/profiles.sql`): anyone can read posts and profiles; only users with a cooked.ai profile can post (into their own Storage folder) and vote; votes are private; nobody can edit captions or scores; users edit only their own profile.

Set `GEMINI_API_KEY` (from aistudio.google.com) and optionally `GEMINI_MODEL` (default `gemini-flash-latest`, falling back to `gemini-3.5-flash` and `gemini-flash-lite-latest` when busy) in `.env.local` and in Vercel.

## Retired: the macOS desktop

Before cooked.ai became the whole site, it ran inside a pretend Mac in the browser (AminaOS desktop, Safari, Mail, Terminal Academy, websitemaker.com). That code is still in the repo (`components/`, `app/academy`, `app/safari`, …) but is switched off: `next.config.ts` redirects its routes (`/safari`, `/academy`, `/mail`, `/settings`, `/terminal`, `/transcript`, `/welcome`, `/s/…`) to `/`, and `proxy.ts` returns 404 for `/api/sites`. Its tables (`emails`, `sites`, `site_votes`, `course_progress`) are left as they were.

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

Open [http://localhost:3000](http://localhost:3000).
