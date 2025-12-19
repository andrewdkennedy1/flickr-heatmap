Cloudflare Workers deploy with wrangler

1) npm install
2) npx wrangler login
3) npm run worker:build
4) npm run worker:deploy

Notes
- Change the worker name in `wrangler.toml` if needed.
- The build output lives at `.open-next`.
- The route is set to `flickerheatmap.thunderdoges.com/*` in `wrangler.toml`.
