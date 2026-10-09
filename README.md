# Terminal Academy

Learn the command line on a pretend Mac that lives in your browser, from your first `ls` to your first shell script. Nothing you type can break anything.

- **Guests land straight on the desktop.** Sticky notes explain the site, point to **Terminal Academy**, and to **Sign In** in the menu bar.
- **Terminal Academy** (`/academy`): 7 modules: First Steps, Files & Folders, Finding Things, Pipes & Redirection, Permissions, Environment, Your First Script. Each lesson has an explanation, clickable examples, tasks that are **checked automatically** against a sandboxed file system, and progressive hints.
- **Module 1 is free.** A free account unlocks Modules 2–7. Guests' progress lives in the browser and is merged into their account when they sign in (`course_progress` table, RLS: own rows only).
- **final_grade.pdf** (`/transcript`, signed-in only) is the course transcript: a grade per module, and a certificate (and an A) when everything's done.
- **Terminal** app: a free-play playground over the same shell, saved in your browser.

### The shell

`lib/shell` is a small zsh-like shell written for this site: an in-memory file system with permissions; quotes, `$VARS`, `~`, globs, pipes, `>`/`>>`/`<`/`2>`, `;`/`&&`/`||`, aliases and scripts with `$1…`; and ~45 commands (`ls`, `cd`, `cat`, `mkdir`, `cp`, `mv`, `rm`, `grep`, `find`, `wc`, `sort`, `uniq`, `chmod`, `sudo`, `export`, `alias`, `which`, `tree`, `man`, …) with macOS-accurate messages. Every command is logged so lessons can check what you did. Lessons live in `lib/course/curriculum.ts`.

## AminaOS desktop

Everything opens as a draggable, resizable window on one desktop (with AminaOS's lucide-on-colour icons), ported from my AminaOS project: Safari, Mail, Terminal, Calendar, Photos, Files + Text Viewer, About Me, Education, Contact, Help, Sudoku, Trash, System Settings and final_grade.pdf. Menu bar ( menu, Go, Help), Dock, draggable desktop icons, Spotlight (⌘K) and dark mode included. URLs deep-link into windows: `/mail`, `/terminal`, `/settings/password`, `/transcript`, `/safari/<address>`.

## cooked.ai: AI photo captions (assignment 4)

After logging in, the desktop opens **Safari at cooked.ai**. Upload a photo (resized in the browser to keep it cheap) and **Gemini** roasts it in four voices written for our persona, Sam: *Chronically Online*, *Midwest Mom*, *Real New Yorker* and *Columbia Tour Guide*. Everyone votes on the captions.

- **Generate** (`POST /api/cooked`, signed-in only, 15 photos per user per day). The photo goes to the `photos` Storage bucket (never into Postgres); the `photos` row stores its path, the uploader's optional context, the exact system prompt and the model; the captions go in `captions`.
- **Rate**: signed-in users upvote/downvote other people's captions. Each vote is a row in `caption_votes`; triggers keep caption and photo scores in sync. You can't vote on your own pic.
- **Feed**: Hot (score decays with age), New, Top, My Pics, plus a **Cook of the Day** banner for the best caption of the last 24 hours. The best caption on each pic gets the COOKED badge.
- **Strict RLS** (`supabase/cooked.sql`): anyone can browse; only signed-in users post (into their own Storage folder) and vote; votes are private; nobody can edit captions or scores.

## websitemaker.com (hidden easter egg)

Safari is a plain browser: typing an address only visits it. The unlisted site **websitemaker.com** has its own build bar: describe any website and Gemini builds it as a single-file page at its own address (`sites`, `site_votes`, `supabase/sites.sql`). Generated pages are served from `/s/<address>` with a CSP `sandbox` header (opaque origin, no network). Hint: `ls -a` in Terminal.

Set `GEMINI_API_KEY` (from aistudio.google.com) and optionally `GEMINI_MODEL` (default `gemini-flash-latest`, falling back to `gemini-3.5-flash` and `gemini-flash-lite-latest` when busy) in `.env.local` and in Vercel.

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
