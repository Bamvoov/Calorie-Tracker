# AuraDiet: AI Calorie Tracker

A modern web application built with Next.js App Router, Tailwind CSS, Prisma, Supabase, Zustand, and Recharts. Uses Google's Gemini API (Free Tier) to parse natural language food descriptions into estimated calories.

## Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **State Management**: Zustand
- **Charts**: Recharts
- **AI Integration**: Google Gemini API (`gemini-2.5-pro`)

## Environment Setup
1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Populate the `.env.local` variables:
   - `DATABASE_URL` & `DIRECT_URL`: Get these from your Supabase Dashboard > Project Settings > Database. We use connection pooling (pgbouncer) so provide the direct URL as well.
   - `GEMINI_API_KEY`: Get this from Google AI Studio.

## Local Development
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   Ensure your `.env.local` is set up with your Supabase credentials. Run:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Deployment on Vercel (Free Tier)
1. **Push your code to GitHub**.
2. **Log into Vercel** and select "Add New Project" importing your GitHub repo.
3. **Environment Variables**: Provide `DATABASE_URL`, `DIRECT_URL`, and `GEMINI_API_KEY` in the Vercel project settings during the setup phase.
4. **Build Command**: Vercel will auto-detect Next.js. You may want to customize the install command to ensure Prisma generates the client:
   - Install Command: `npm install`
   - Build Command: `npx prisma generate && next build`
5. Click **Deploy**. The app will be safely built and deployed on Vercel's Edge Network for free.

## Free API Optimizations
- **Rate Limiting**: An in-memory rate limiter is included to stop extreme bursts of requests to `/api/log-food`.
- **Client Cache**: The frontend Zustand store acts as a local cache (`foodCache` logic can be expanded) to prevent duping Gemini calls if the user queries the exact same prompt multiple times in a session.
