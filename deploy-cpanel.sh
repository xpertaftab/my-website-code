#!/bin/bash
set -e

cd /home/sites/21b/b/b1ad457d94/my-website-code
git pull origin main
DEPLOYPATH=/home/sites/21b/b/b1ad457d94/public_html

rm -rf "$DEPLOYPATH/legacy" "$DEPLOYPATH/public" "$DEPLOYPATH/src" "$DEPLOYPATH/mem" \
  "$DEPLOYPATH/wp-admin" "$DEPLOYPATH/wp-content" "$DEPLOYPATH/wp-includes"
rm -f "$DEPLOYPATH"/package.json "$DEPLOYPATH"/bun.lock "$DEPLOYPATH"/bunfig.toml \
  "$DEPLOYPATH"/vite.config.ts "$DEPLOYPATH"/tsconfig.json "$DEPLOYPATH"/eslint.config.js \
  "$DEPLOYPATH"/components.json "$DEPLOYPATH"/AGENTS.md "$DEPLOYPATH"/wp-*.php \
  "$DEPLOYPATH"/license.txt "$DEPLOYPATH"/readme.html

cp -rf public/. "$DEPLOYPATH/"
