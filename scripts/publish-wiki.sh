#!/usr/bin/env bash
# Push docs/wiki/*.md to the Layout's GitHub wiki, after its first page was saved in the browser
# (scripts/publish-github.sh prints the address). It publishes: run it only with the owner's OK.
#
# usage: bash scripts/publish-wiki.sh [<org/repo>]
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(node scripts/lib/skin-env.cjs)"
REPO="${1:-$GH_REPO}"
HERE="$(pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone "https://github.com/$REPO.wiki.git" "$TMP/wiki" || { echo "No wiki yet: save its first page at https://github.com/$REPO/wiki/_new"; exit 1; }
cp "$HERE"/docs/wiki/*.md "$TMP/wiki/"
cd "$TMP/wiki"
git add -A
if git diff --cached --quiet; then echo "wiki already up to date"; exit 0; fi
GIT_AUTHOR_NAME=alireza-selldone GIT_AUTHOR_EMAIL=alireza@selldone.com GIT_COMMITTER_NAME=alireza-selldone GIT_COMMITTER_EMAIL=alireza@selldone.com \
  git commit -q -m "Wiki from docs/wiki"
git push origin HEAD
echo "Wiki: https://github.com/$REPO/wiki"
