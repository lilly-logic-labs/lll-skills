#!/usr/bin/env bash
# Refresh vendored upstream copies to the latest upstream commit, then show the diff for review.
#   bash scripts/sync-vendor.sh
# Update the pinned commits in NOTICE after reviewing.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git clone -q --depth 1 https://github.com/cloudflare/security-audit-skill.git "$tmp/sa"
engine="$root/skills/security/engine"
find "$engine" -mindepth 1 -delete
cp -r "$tmp/sa/skills/security-audit/." "$engine/"
cp "$tmp/sa/LICENSE" "$engine/LICENSE"
rm -f "$engine"/*.test.cjs
mv "$engine/SKILL.md" "$engine/ENGINE.md"
sed -i 's/`SKILL\.md`/`ENGINE.md`/g; s/this SKILL\.md/this ENGINE.md/g' "$engine"/*.md
echo "security-audit-skill @ $(git -C "$tmp/sa" rev-parse --short HEAD)"

git clone -q --depth 1 https://github.com/cloudflare/skills.git "$tmp/cf"
vendor="$root/skills/cloudflare/vendor"
find "$vendor" -mindepth 1 -delete
cp -r "$tmp/cf/skills/." "$vendor/"
cp "$tmp/cf/LICENSE" "$vendor/LICENSE"
find "$vendor" -name SKILL.md -exec sh -c 'mv "$1" "$(dirname "$1")/GUIDE.md"' _ {} \;
echo "cloudflare/skills @ $(git -C "$tmp/cf" rev-parse --short HEAD)"

git -C "$root" status --short -- skills/security/engine skills/cloudflare/vendor | head -50
