# KeysAndFingers — Setup Guide

Everything you need to get the app running with all features including VS mode, Public GC Lobby, and 7-day chat history.

---

## What's New in This Version

- **GC Button** in the header — opens the public lobby
- **Public Lobby (GC)** — live chat, see who's online, challenge anyone to VS
- **Challenge via toast** — opponent gets an Accept/Decline toast notification, no page switch needed
- **7-day chat history** — messages stored in Supabase DB, loaded when you open GC
- **VS mode from GC** — challenge accepted → both auto-join VS room instantly

---

## 1. Prerequisites

- Node.js installed (or Bun)
- A Supabase account (free) → [supabase.com](https://supabase.com)

---

## 2. Supabase Setup

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Give it a name, set a password, choose a region close to you
4. Wait for it to finish setting up (~1 minute)

---

### Step 2 — Get your API keys

1. In your project, click **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon public** key → the long JWT token

---

### Step 3 — Run the database SQL

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Open the file `supabase-setup.sql` included in this zip
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run**

This creates:
- The `gc_messages` table for GC chat history
- Row level security policies (public read/insert)
- A pg_cron job that auto-deletes messages older than 7 days every hour

---

## 3. Environment Variables

Create a `.env` file in the root of the project (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual keys from Step 2.

> **Important:** Never use the `service_role` key in your frontend. Always use the `anon` key — it's safe to expose.

---

## 4. Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

If you're on **Termux (Android)**, Vite uses `@swc/core` by default which doesn't work on ARM. Fix it by changing one line in `vite.config.ts`:

```ts
// Change this:
import react from '@vitejs/plugin-react-swc'

// To this:
import react from '@vitejs/plugin-react'
```

Then install the non-swc plugin:

```bash
npm install @vitejs/plugin-react --save-dev
```

---

## 5. Features Overview

### Solo Mode
- Type the displayed text as fast and accurately as possible
- Difficulty levels: Easy, Medium, Hard, Custom
- Timed mode: 15s, 30s, 60s, 120s
- Paste your own custom text

### VS Mode
1. Click the **VS** button in the header
2. Enter a nickname
3. **Create Room** → share the 6-letter code with your opponent
4. OR **Join Room** → enter their code
5. Both click Ready → countdown → race!
6. Winner gets a waifu reward 🎉

### Public GC Lobby
1. Click the **GC** button in the header (green)
2. Enter a nickname (same as VS nickname if already set)
3. You'll see:
   - Last 7 days of chat history loaded instantly
   - Who's currently online in the sidebar
   - Live chat with everyone
4. **Challenge someone:** hover over an idle player → click the ⚔️ sword icon
5. They receive a toast notification with **Accept / Decline** buttons
6. If accepted → both players automatically jump into VS mode
7. After the VS race, come back to GC manually via the GC button

### Status indicators in GC
- 🟢 **idle** — available to chat and challenge
- 🟡 **busy** — in lobby/waiting
- 🔴 **racing** — currently in a VS race

---

## 6. Supabase Free Tier — Will It Run Out?

Short answer: **No, you're very safe.**

| Resource | Your Usage | Free Limit |
|---|---|---|
| Realtime messages (VS + GC) | ~860,000/month | 2,000,000/month |
| DB storage (chat history) | ~3.5MB rolling | 500MB |
| DB queries | ~45,000/month | Unlimited |
| Concurrent connections | ~20 peak | 200 |

These numbers are based on 500 active players per day. You have lots of room to grow before hitting any limits.

---

## 7. File Structure (Changed Files)

```
src/
├── hooks/
│   ├── useGCLobby.ts        ← NEW: GC lobby hook (presence, chat, challenges, DB history)
│   └── useVsChallenge.ts    ← UPDATED: added createRoomWithCode()
├── components/
│   ├── GCLobby.tsx          ← NEW: Public lobby UI
│   ├── Header.tsx           ← UPDATED: added GC button
│   └── VsChallenge.tsx      ← UPDATED: auto-join from GC challenge
└── pages/
    └── Index.tsx            ← UPDATED: wired GC lobby and VS transitions
```

---

## 8. Troubleshooting

**GC shows "Failed to connect to lobby"**
- Check your `.env` file has the correct Supabase URL and anon key
- Make sure you ran the SQL setup in Supabase

**Chat history not loading**
- Make sure you ran `supabase-setup.sql` in the Supabase SQL Editor
- Check Supabase dashboard → Table Editor → confirm `gc_messages` table exists

**VS mode not working**
- Supabase Realtime must be enabled — it is by default on all projects
- Check browser console for connection errors

**`Failed to load native binding` error on Termux**
- Follow the Termux fix in Section 4 above

**Challenge not reaching opponent**
- Both players must be in the GC lobby at the same time
- The challenge expires after 30 seconds automatically

---

## 9. Deployment

Build for production:

```bash
npm run build
```

Output goes to the `dist/` folder. Deploy to any static host:
- **GitHub Pages** (already configured in the project)
- **Netlify** — drag and drop the `dist/` folder
- **Vercel** — connect your GitHub repo

Make sure to add your environment variables in your hosting platform's settings.

---

Built with ❤️ — Keys&Fingers by Ovi ren
