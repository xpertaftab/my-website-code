#!/bin/bash
set -e

SRC=/home/sites/21b/b/b1ad457d94/my-website-code
DEPLOYPATH=/home/sites/21b/b/b1ad457d94/public_html

cd "$SRC"
git pull origin main

for required_file in index.html style.css; do
  if [ ! -f "$SRC/$required_file" ]; then
    echo "ERROR: $required_file missing in $SRC. Restore/pull the Git repository first; public_html was NOT changed."
    exit 1
  fi
done

for required_dir in js data assets; do
  if [ ! -d "$SRC/$required_dir" ]; then
    echo "ERROR: $required_dir folder missing in $SRC. Restore/pull the Git repository first; public_html was NOT changed."
    exit 1
  fi
done

mkdir -p "$DEPLOYPATH"

rm -rf "$DEPLOYPATH/legacy" "$DEPLOYPATH/public" "$DEPLOYPATH/src" "$DEPLOYPATH/mem" \
  "$DEPLOYPATH/js" "$DEPLOYPATH/data" "$DEPLOYPATH/assets" \
  "$DEPLOYPATH/wp-admin" "$DEPLOYPATH/wp-content" "$DEPLOYPATH/wp-includes" \
  "$DEPLOYPATH/node_modules" "$DEPLOYPATH/.tanstack" "$DEPLOYPATH/.lovable"
rm -f "$DEPLOYPATH"/package.json "$DEPLOYPATH"/bun.lock "$DEPLOYPATH"/bunfig.toml \
  "$DEPLOYPATH"/vite.config.ts "$DEPLOYPATH"/tsconfig.json "$DEPLOYPATH"/tsconfig.tsbuildinfo \
  "$DEPLOYPATH"/eslint.config.js "$DEPLOYPATH"/components.json "$DEPLOYPATH"/AGENTS.md \
  "$DEPLOYPATH"/deploy-cpanel.sh "$DEPLOYPATH"/.prettierrc "$DEPLOYPATH"/.prettierignore \
  "$DEPLOYPATH"/wp-*.php "$DEPLOYPATH"/license.txt "$DEPLOYPATH"/readme.html

cp -f "$SRC"/index.html "$SRC"/style.css "$DEPLOYPATH/"
[ ! -f "$SRC"/main.mp4 ] || cp -f "$SRC"/main.mp4 "$DEPLOYPATH/"
[ ! -f "$SRC"/robots.txt ] || cp -f "$SRC"/robots.txt "$DEPLOYPATH/"
[ ! -f "$SRC"/sitemap.xml ] || cp -f "$SRC"/sitemap.xml "$DEPLOYPATH/"
[ ! -f "$SRC"/.htaccess ] || cp -f "$SRC"/.htaccess "$DEPLOYPATH/"

mkdir -p "$DEPLOYPATH/js" "$DEPLOYPATH/data" "$DEPLOYPATH/assets"
cp -Rf "$SRC"/js/. "$DEPLOYPATH/js/"
cp -Rf "$SRC"/data/. "$DEPLOYPATH/data/"
cp -Rf "$SRC"/assets/. "$DEPLOYPATH/assets/"
