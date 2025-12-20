# AGENTS.md

## Project Overview

Flickr Heatmap is a Next.js 15 app that visualizes Flickr photo uploads as a GitHub-style contribution heatmap. Users can search by username or authenticate via OAuth to view their photography activity.

**Live Demo:** https://flickrheatmap.thunderdoges.com

## Build and Test Commands

```bash
# Development
npm install
npm run dev

# Production build
npm run build
npm start

# Cloudflare Workers deployment
npm run worker:build
npm run worker:deploy
```

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use proper typing
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **API**: RESTful endpoints in `/src/app/api/`
- **Imports**: Use absolute imports from `@/` for src directory

## Environment Setup

Required environment variables:
```env
NEXT_PUBLIC_FLICKR_API_KEY=your_flickr_api_key
FLICKR_API_SECRET=your_flickr_api_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Key Architecture

- **Frontend**: React 18 with Next.js App Router
- **API**: Flickr API integration with OAuth 1.0a
- **Deployment**: Cloudflare Workers via OpenNext
- **Styling**: Tailwind CSS 4 with glassmorphism design
- **Animation**: Framer Motion for smooth transitions

## Security Considerations

- API secrets stored in Cloudflare Workers secrets
- OAuth 1.0a implementation using WebCrypto API
- No sensitive data stored client-side
- CORS properly configured for API endpoints

## Testing Instructions

Currently no automated tests. Manual testing:
1. Test username search functionality
2. Verify OAuth flow works end-to-end
3. Check heatmap renders correctly with data
4. Test responsive design on mobile

## Deployment

- **Auto-deploy**: Push to `master` branch triggers GitHub Actions
- **Manual deploy**: Use `npm run worker:deploy`
- **Secrets**: Add to both Cloudflare Workers and GitHub repository

## Common Gotchas

- Flickr API rate limits: 3600 requests/hour
- OAuth callback URL must match `NEXT_PUBLIC_BASE_URL`
- Cloudflare Workers have 10ms CPU time limit per request
- Date handling: All times in UTC, convert for user timezone display
