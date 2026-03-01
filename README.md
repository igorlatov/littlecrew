# LittleCrew

AI creative companions for kids - a web app where Emma and Erik can chat with their AI friends Lexi and Kate while working on their game "Dressed to Fish".

## Features

- 🎨 Two AI companions: Lexi (creative/fashion) and Kate (systems/design)
- 💬 Real-time streaming chat with SSE
- 📱 Mobile-first, iPad-optimized PWA
- 🌙 Dark mode by default
- 🎯 Rate limiting (50 messages/day, resets at midnight ET)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local to point to your API URL
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This project is designed to deploy to Vercel:

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

Set the environment variable `NEXT_PUBLIC_API_URL` to your Railway backend URL in Vercel dashboard.

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Server-Sent Events (SSE) for streaming
- PWA support for iPad home screen

## Project Structure

- `/app` - Next.js app router pages
- `/components` - React components
- `/public` - Static assets and PWA manifest
