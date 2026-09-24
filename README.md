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

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres + `@supabase/supabase-js`)
- Deployed on [Vercel](https://vercel.com)

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try pressing No. Go ahead. Try.
