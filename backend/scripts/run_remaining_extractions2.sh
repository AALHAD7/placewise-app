#!/bin/bash
# Continues the Gemini-vision PDF re-extraction where the last run actually
# left off (verified against the filesystem, not the old log - that run's
# stdout buffering made it look stalled on a file it had, in fact,
# finished). Marketing:Sales failed both its files outright (a transient
# DNS blip: "Failed to resolve generativelanguage.googleapis.com"), so it
# gets a full retry; HR/Prodman/Consulting just resume via the script's own
# per-page JSON cache (already-completed PDFs are skipped since their
# output .txt already exists).
set -e
cd "$(dirname "$0")"
DATA="../../Data"

for domain in "Marketing:Sales Files" "HR Files" "Prodman Files" "Consulting Files"; do
  echo ""
  echo "=== Starting: $domain ==="
  python3 reextract_text.py "$DATA/$domain"
  echo "=== Finished: $domain ==="
done

echo ""
echo "=== All remaining domains done ==="
