# DEPLOY — put the site online

You need a **live URL** for the submission. The website deploys to Vercel in a couple
of minutes. The x402 backend is optional to host — the site's live-demo widget falls
back to a simulated animation when no backend is reachable.

## 1. Deploy the website (Vercel, ~2 min)
1. Push is already done → go to [vercel.com/new](https://vercel.com/new) and **import**
   `YashasviThakur/casper-hackathon`.
2. Set **Root Directory** = `imprint` (the Next.js site lives in that subfolder).
3. Framework preset: **Next.js**. Build command / output: defaults.
4. **Deploy.** You get a URL like `https://casper-hackathon.vercel.app`.

No env vars are required — the site is marketing-only (no auth/DB). The live-demo widget
will show the 🟡 **simulated** flow (still fully animated, with plausible receipts).

## 2. (Optional) Make the widget 🟢 LIVE on the deployed site
The widget calls a backend at `NEXT_PUBLIC_IMPRINT_API` (default `http://localhost:4021`).
To have the *deployed* site hit a real x402 backend:

1. Host `imprint-agent/` on a free Node host (Railway / Render / Fly.io):
   - Start command: `npm run http` (or `npm run build && npm run start:http`).
   - It listens on `PORT` (defaults to 4021) — the hosts inject `PORT` automatically.
   - CORS is already open, so the browser can call it.
2. In Vercel → the site project → **Settings → Environment Variables**, add:
   ```
   NEXT_PUBLIC_IMPRINT_API = https://<your-backend-host-url>
   ```
   (must be **https** so the https site can call it without mixed-content blocking).
3. Redeploy. The widget pill turns 🟢 live and shows real receipts.

> For the demo video you don't need any of this — just run both locally (see
> VIDEO-SCRIPT.md). Hosting the backend is a nice-to-have for a permanently-live URL.

## 3. Update the submission
Put the Vercel URL in the DoraHacks submission (SUBMISSION.md) and, if you like, in the
site's nav. The repo link is already correct throughout.
