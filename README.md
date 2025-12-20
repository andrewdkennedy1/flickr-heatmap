# 📸 Flickr Heatmap

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-orange?logo=cloudflare)

**Visualize your Flickr photography journey with a beautiful GitHub-style contribution heatmap.**

[🌐 **Live Demo**](https://flickrheatmap.thunderdoges.com) • [📖 How It Works](#how-it-works) • [🚀 Getting Started](#getting-started)

</div>

---

## ✨ Features

- 🗓️ **GitHub-Style Heatmap** — See your photo uploads visualized as a year-long contribution calendar
- 🔍 **Username Search** — Enter any Flickr username to view their upload activity
- 🔐 **OAuth Login** — Sign in with Flickr to see both public and private photo stats
- 📊 **Activity Stats** — Track total uploads, active days, and peak upload days
- 🌙 **Sleek Dark Mode** — Modern glassmorphism UI with smooth Framer Motion animations
- ⚡ **Edge-Powered** — Deployed on Cloudflare Workers for lightning-fast global performance
- 🎮 **Demo Mode** — Try it instantly without a Flickr account

## 🎯 Live App

**👉 [flickrheatmap.thunderdoges.com](https://flickrheatmap.thunderdoges.com)**

Enter any Flickr username and watch your photography activity come to life!

## 📸 How It Works

1. **Enter a Flickr username** — The app accepts usernames or profile URLs
2. **Fetch photo data** — We call the Flickr API to retrieve upload timestamps from the last year
3. **Aggregate & visualize** — Photo uploads are aggregated by day and rendered as an interactive heatmap
4. **Explore your insights** — See your total uploads, most active days, and peak photography sessions

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **React 18** | UI library |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **react-activity-calendar** | Heatmap visualization |
| **Flickr API** | Photo data source |
| **Cloudflare Workers** | Edge deployment via OpenNext |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- A [Flickr API Key](https://www.flickr.com/services/apps/create/)

### Installation

```bash
# Clone the repository
git clone https://github.com/andrewdkennedy1/flickr-heatmap.git
cd flickr-heatmap

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Add your Flickr credentials to `.env.local`:

```env
NEXT_PUBLIC_FLICKR_API_KEY=your_flickr_api_key
FLICKR_API_SECRET=your_flickr_api_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Build

```bash
npm run build
npm start
```

## ☁️ Cloudflare Deployment

This project is deployed on **Cloudflare Workers** using [OpenNext](https://opennextjs.org/).

### Initial Setup

1. **Create a Cloudflare account** and set up your domain

2. **Add secrets to Cloudflare Workers:**
   ```bash
   npx wrangler secret put FLICKR_API_SECRET
   npx wrangler secret put NEXT_PUBLIC_FLICKR_API_KEY
   ```

3. **Add secrets to GitHub repository:**
   - `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers permissions
   - `NEXT_PUBLIC_FLICKR_API_KEY` — Your Flickr API key

### Deploy

Push to `master` branch triggers automatic deployment via GitHub Actions.

Or deploy manually:
```bash
npm run worker:build
npm run worker:deploy
```

## 📂 Project Structure

```
flickr-heatmap/
├── src/
│   ├── app/
│   │   ├── api/           # API routes (Flickr search, OAuth)
│   │   ├── page.tsx       # Main page component
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   └── Heatmap.tsx    # Heatmap visualization component
│   └── lib/
│       ├── FlickrService.ts  # Flickr API service
│       └── oauth.ts          # OAuth 1.0a with WebCrypto API
├── public/                # Static assets
├── wrangler.toml          # Cloudflare Workers config
└── package.json
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FLICKR_API_KEY` | Flickr API key | Yes |
| `FLICKR_API_SECRET` | Flickr API secret | Yes |
| `NEXT_PUBLIC_BASE_URL` | Base URL for OAuth callbacks | Yes |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License — feel free to use this project for your own photography tracking!

---

<div align="center">

**Made with ❤️ and 📷 by [ThunderDoges](https://thunderdoges.com)**

*Track your photography. Visualize your creativity.*

</div>
