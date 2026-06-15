#!/usr/bin/env bash
# One command to ship a kit to the gallery.
#
#   scripts/publish-kit.sh <id> <path-to-kit's-react-dir>
#   e.g. scripts/publish-kit.sh lime ~/Developer/personal/lime-uikit/react
#
# It: validates the kit manifest → builds the demo into apps/web/public/demos/<id>
# (with SPA route fallbacks) → validates the gallery entries → deploys.
# (Authoring apps/web/content/kits/<id>.json is the one manual prerequisite.)
set -euo pipefail

id="${1:?usage: publish-kit.sh <id> <kit-react-dir>}"
src="${2:?usage: publish-kit.sh <id> <kit-react-dir>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
demo="$root/apps/web/public/demos/$id"

echo "▸ [1/5] validate kit manifest"
npx -y uikit-studio validate "$src/.."

echo "▸ [2/5] build demo → public/demos/$id"
( cd "$src" && pnpm install --silent && pnpm build --base="/demos/$id/" --outDir "$demo" --emptyOutDir )

echo "▸ [3/5] add SPA route fallbacks (so demo deep links don't 404)"
for r in pricing dashboard components; do
  if [ -d "$src/src/routes" ] || true; then mkdir -p "$demo/$r" && cp "$demo/index.html" "$demo/$r/index.html"; fi
done

echo "▸ [4/5] validate gallery entries + regenerate agent specs"
node "$root/scripts/validate-content.mjs"
node "$root/apps/web/scripts/gen-agent-manifests.mjs"

echo "▸ [5/5] deploy"
pnpm --filter @uikit/web deploy

echo "✓ $id is live → https://uikit.studio/kit/$id"
