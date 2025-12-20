# Flickr Heatmap

A beautiful GitHub-style contribution heatmap for your Flickr photo uploads.

**Live Demo:** [flickrheatmap.thunderdoges.com](https://flickrheatmap.thunderdoges.com)

![Flickr Heatmap Screenshot](https://via.placeholder.com/800x400?text=Flickr+Heatmap+Preview)

## Features

- 📊 **GitHub-style heatmap** visualization of your photo activity
- 🔐 **OAuth login** to see both public and private photo stats
- 🌐 **Cloudflare Workers** deployment for global edge performance
- 🎨 **Beautiful dark UI** with smooth animations

## Local Development

### Prerequisites

- Node.js 20+
- Flickr API credentials ([get them here](https://www.flickr.com/services/apps/create/))

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/andrewdkennedy1/flickr-heatmap.git
   cd flickr-heatmap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local`:
   ```env
   NEXT_PUBLIC_FLICKR_API_KEY=your_api_key
   FLICKR_API_SECRET=your_api_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Cloudflare Workers

### Initial Setup

1. Create a Cloudflare account and set up your domain

2. Add secrets to Cloudflare Workers:
   ```bash
   npx wrangler secret put FLICKR_API_SECRET
   npx wrangler secret put NEXT_PUBLIC_FLICKR_API_KEY
   ```

3. Add secrets to GitHub repository:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers permissions
   - `NEXT_PUBLIC_FLICKR_API_KEY` - Your Flickr API key

### Deploy

Push to `master` branch triggers automatic deployment via GitHub Actions.

Or deploy manually:
```bash
npm run worker:build
npm run worker:deploy
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FLICKR_API_KEY` | Flickr API key | Yes |
| `FLICKR_API_SECRET` | Flickr API secret | Yes |
| `NEXT_PUBLIC_BASE_URL` | Base URL for OAuth callbacks | Yes |

## Tech Stack

- **Framework:** Next.js 15
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Deployment:** Cloudflare Workers via OpenNext
- **OAuth:** OAuth 1.0a with WebCrypto API

## License

MIT
