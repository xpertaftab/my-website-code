#!/bin/bash
set -e

cd /home/sites/21b/b/b1ad457d94/my-website-code
git pull origin main
cp -rf public/legacy/. /home/sites/21b/b/b1ad457d94/public_html/
