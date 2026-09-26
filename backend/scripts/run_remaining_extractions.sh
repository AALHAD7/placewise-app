#!/bin/bash
# Waits for the in-progress Finance Files re-extraction to finish, then runs
# the same Gemini-vision re-extraction (backend/scripts/reextract_text.py)
# over every other domain, one at a time. Sequential (not parallel) so all
# of these share one steady draw on the single GEMINI_API_KEY's quota
# instead of competing with each other AND with the live app's own
# Gemini-backed requests all at once. Ordered smallest-page-count-first so
# a domain finishes and can be reviewed sooner rather than everything
# landing at once at the very end.
set -e
cd "$(dirname "$0")"

while pgrep -f "reextract_text.py ../../Data/Finance Files" > /dev/null; do
  sleep 30
done
echo "=== Finance Files done, starting the rest ==="

for domain in "General Management Files" "Marketing:Sales Files" "HR Files" "Prodman Files" "Consulting Files"; do
  echo "=== Starting: $domain ==="
  python3 reextract_text.py "../../Data/$domain" --batch-size 10
  echo "=== Finished: $domain ==="
done

echo "=== ALL DOMAINS DONE ==="
