#!/usr/bin/env bash
set -euo pipefail

default_repo="/mnt/c/dev/flickr-heatmap"
read -r -p "Repo path [$default_repo]: " repo_path
repo_path="${repo_path:-$default_repo}"

if [ ! -d "$repo_path" ]; then
  echo "Repo path not found: $repo_path"
  exit 1
fi

wrangler_config="$repo_path/wrangler.toml"
if [ ! -f "$wrangler_config" ]; then
  echo "Missing wrangler.toml at $wrangler_config"
  exit 1
fi

get_name_from_toml() {
  if command -v rg >/dev/null 2>&1; then
    rg -n '^name\\s*=\\s*"' "$wrangler_config" | sed -E 's/.*"([^"]+)".*/\\1/' | head -n 1
  else
    awk -F'"' '/^name[[:space:]]*=/{print $2; exit}' "$wrangler_config"
  fi
}

default_worker_name="$(get_name_from_toml)"
read -r -p "Worker name [$default_worker_name]: " worker_name
worker_name="${worker_name:-$default_worker_name}"

read -r -p "Install deps with npm install --legacy-peer-deps? [Y/n]: " do_install
do_install="${do_install:-Y}"

read -r -p "Flickr API Key (NEXT_PUBLIC_FLICKR_API_KEY): " flickr_key
read -r -s -p "Flickr API Secret (FLICKR_API_SECRET): " flickr_secret
echo ""
read -r -p "Base URL [https://flickrheatmap.thunderdoges.com]: " base_url
base_url="${base_url:-https://flickrheatmap.thunderdoges.com}"

read -r -s -p "Cloudflare API Token (CLOUDFLARE_API_TOKEN): " cf_token
echo ""

if [ -z "$worker_name" ]; then
  echo "Worker name is required."
  exit 1
fi

if [ -z "$flickr_key" ] || [ -z "$flickr_secret" ]; then
  echo "Flickr API key/secret are required."
  exit 1
fi

if [ -z "$cf_token" ]; then
  echo "Cloudflare API token is required to set secrets."
  exit 1
fi

cd "$repo_path"

if [ "$do_install" = "Y" ] || [ "$do_install" = "y" ]; then
  npm install --legacy-peer-deps
fi

export CLOUDFLARE_API_TOKEN="$cf_token"

printf "%s" "$flickr_secret" | npx wrangler secret put FLICKR_API_SECRET --name "$worker_name" --config "$wrangler_config"
printf "%s" "$flickr_key" | npx wrangler secret put NEXT_PUBLIC_FLICKR_API_KEY --name "$worker_name" --config "$wrangler_config"
printf "%s" "$base_url" | npx wrangler secret put NEXT_PUBLIC_BASE_URL --name "$worker_name" --config "$wrangler_config"

echo "Secrets updated for worker: $worker_name"
