#!/bin/bash
# Blocks edits to consultingRetrieval.js's paraphrase/faithfulness prompts unless
# PARAPHRASE_PROMPT_VERSION is bumped in the same change. The cache key includes this
# version (see paraphraseAndVerify), so an unbumped prompt change silently serves stale
# cached paraphrases for up to 7 days instead of the new prompt's output.
set -euo pipefail

TARGET="backend/src/lib/consultingRetrieval.js"
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:\s*"([^"]*)"/\1/')

[[ "$FILE_PATH" == *"$TARGET" ]] || exit 0
[ -f "$TARGET" ] || exit 0

PROMPT_START=$(grep -n '^const PARAPHRASE_SYSTEM_PROMPT' "$TARGET" | head -1 | cut -d: -f1)
VERSION_LINE=$(grep -n '^const PARAPHRASE_PROMPT_VERSION' "$TARGET" | head -1 | cut -d: -f1)

[ -n "${PROMPT_START:-}" ] && [ -n "${VERSION_LINE:-}" ] || exit 0
PROMPT_END=$((VERSION_LINE - 1))

DIFF=$(git diff -U0 -- "$TARGET" 2>/dev/null || true)
[ -z "$DIFF" ] && exit 0

PROMPT_TOUCHED=false
VERSION_TOUCHED=false

while read -r line; do
  [[ "$line" =~ ^@@\ -[0-9]+(,[0-9]+)?\ \+([0-9]+)(,([0-9]+))?\ @@ ]] || continue
  NEW_START="${BASH_REMATCH[2]}"
  NEW_LEN="${BASH_REMATCH[4]:-1}"
  NEW_END=$((NEW_START + NEW_LEN - 1))
  [ "$NEW_LEN" -eq 0 ] && NEW_END=$NEW_START

  if [ "$NEW_END" -ge "$PROMPT_START" ] && [ "$NEW_START" -le "$PROMPT_END" ]; then
    PROMPT_TOUCHED=true
  fi
  if [ "$NEW_END" -ge "$VERSION_LINE" ] && [ "$NEW_START" -le "$VERSION_LINE" ]; then
    VERSION_TOUCHED=true
  fi
done <<< "$DIFF"

if $PROMPT_TOUCHED && ! $VERSION_TOUCHED; then
  echo "BLOCKED: $TARGET changed PARAPHRASE_SYSTEM_PROMPT or FAITHFULNESS_SYSTEM_PROMPT (lines $PROMPT_START-$PROMPT_END) without bumping PARAPHRASE_PROMPT_VERSION (line $VERSION_LINE). Old cached paraphrases will keep serving for up to 7 days under the stale prompt's cache key. Bump the version string, then retry." >&2
  exit 2
fi

exit 0
