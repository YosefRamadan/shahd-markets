#!/usr/bin/env bash
# Shahd Markets is a PHP 8 + MySQL application with no Node.js dev server.
# The Lovable harness appends its own flags (e.g. --port 8080) to the dev
# command, so this wrapper swallows all arguments and serves a static notice
# page on port 8080 to keep the preview healthy.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python3 -m http.server 8080 --bind 0.0.0.0 --directory .lovable/preview
