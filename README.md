# 📸 Flickr Heatmap

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-orange?logo=cloudflare)

**Visualize your Flickr photography journey with a beautiful GitHub-style contribution heatmap.**

[🌐 **Live Demo**](https://flickrheatmap.thunderdoges.com) • [📖 How It Works](#how-it-works) • [🚀 Getting Started](#getting-started)

</div>

---

## ✨ Features

- 🗓️ **GitHub-Style Heatmap** — See your photo uploads visualized as a year-long contribution calendar
- 🔍 **Username Search** — Enter any Flickr username to view their upload activity
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
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **react-activity-calendar** | Heatmap visualization |
| **Flickr API** | Photo data source |
| **Cloudflare Workers** | Edge deployment |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Flickr API Key](https://www.flickr.com/services/api/misc.api_keys.html)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flickr-heatmap.git
cd flickr-heatmap

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Add your Flickr API key to `.env.local`:

```env
NEXT_PUBLIC_FLICKR_API_KEY=your_flickr_api_key_here
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

## ☁️ Deployment

This project is deployed on **Cloudflare Workers** using [OpenNext](https://opennextjs.org/).

```bash
# Login to Cloudflare
npx wrangler login

# Build and deploy
npm run worker:build
npm run worker:deploy
```

See [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md) for detailed deployment instructions.

## 📂 Project Structure

```
flickr-heatmap/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── page.tsx       # Main page component
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   └── Heatmap.tsx    # Heatmap visualization component
│   └── lib/
│       ├── flickr.ts      # Flickr API service
│       └── oauth.ts       # OAuth utilities
├── public/                # Static assets
├── wrangler.toml          # Cloudflare Workers config
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License — feel free to use this project for your own photography tracking!

---

<div align="center">

**Made with ❤️ and 📷 by [ThunderDoges](https://thunderdoges.com)**

*Track your photography. Visualize your creativity.*

</div>
