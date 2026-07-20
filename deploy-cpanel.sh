#!/bin/bash
set -e

SRC=/home/sites/21b/b/b1ad457d94/my-website-code
DEPLOYPATH=/home/sites/21b/b/b1ad457d94/public_html

cd "$SRC"
git pull origin main

rm -rf "$DEPLOYPATH/legacy" "$DEPLOYPATH/public" "$DEPLOYPATH/src" "$DEPLOYPATH/mem" \
  "$DEPLOYPATH/js" "$DEPLOYPATH/data" "$DEPLOYPATH/assets" \
  "$DEPLOYPATH/wp-admin" "$DEPLOYPATH/wp-content" "$DEPLOYPATH/wp-includes" \
  "$DEPLOYPATH/node_modules" "$DEPLOYPATH/.tanstack" "$DEPLOYPATH/.lovable"
rm -f "$DEPLOYPATH"/package.json "$DEPLOYPATH"/bun.lock "$DEPLOYPATH"/bunfig.toml \
  "$DEPLOYPATH"/vite.config.ts "$DEPLOYPATH"/tsconfig.json "$DEPLOYPATH"/tsconfig.tsbuildinfo \
  "$DEPLOYPATH"/eslint.config.js "$DEPLOYPATH"/components.json "$DEPLOYPATH"/AGENTS.md \
  "$DEPLOYPATH"/deploy-cpanel.sh "$DEPLOYPATH"/.prettierrc "$DEPLOYPATH"/.prettierignore \
  "$DEPLOYPATH"/wp-*.php "$DEPLOYPATH"/license.txt "$DEPLOYPATH"/readme.html

cp -f "$SRC"/index.html "$SRC"/main.mp4 "$SRC"/style.css "$SRC"/robots.txt "$SRC"/sitemap.xml "$DEPLOYPATH/"

mkdir -p "$DEPLOYPATH/js" "$DEPLOYPATH/data" "$DEPLOYPATH/assets"
cp -Rf "$SRC"/js/. "$DEPLOYPATH/js/"
cp -Rf "$SRC"/data/. "$DEPLOYPATH/data/"
cp -Rf "$SRC"/assets/. "$DEPLOYPATH/assets/"
