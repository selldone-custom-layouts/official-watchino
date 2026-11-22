#!/usr/bin/env bash
# Publish this Layout's repo on GitHub: create it with gh (or reuse it), set its description, homepage and topics,
# push main, and print where the wiki's first page is made. It publishes: run it only with the owner's OK.
#
# usage: bash scripts/publish-github.sh [<org/repo>]     (default: the skin's github.org/github.repo)
#
# Two proofs run first and refuse the push when they fail (marketplace-guide §8 item 31):
#   - no Windows path anywhere in the history (a drive letter followed by Users, Selldone Projects or Kalio);
#   - every author and committer email is the org's (alireza@selldone.com).
# Then, because GitHub's push protection reads Mapbox's public key as a secret: no "sk.eyJ" in the history.
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(node scripts/lib/skin-env.cjs)"
REPO="${1:-$GH_REPO}"
ORG_EMAIL="${ORG_EMAIL:-alireza@selldone.com}"

P=$(git log --all -p | grep -c -E "[A-Z]:[\/](Users|Selldone Projects|Kalio)" || true)
E=$(git log --all --format='%ae%n%ce' | sort -u | grep -v -c -x -F "$ORG_EMAIL" || true)
echo "proof: windows paths in history $P, other emails $E"
[ "$P" = 0 ] && [ "$E" = 0 ] || { echo "REFUSED: clean the history first"; exit 1; }
if git log --all -E -G 'sk\.eyJ[A-Za-z0-9_-]{20}' --oneline | grep -q .; then echo "REFUSED: a Mapbox secret-looking token in the history"; exit 1; fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --description "$DESC" --homepage "https://$DOMAIN"
fi
TOPIC_ARGS=()
for t in $TOPICS; do TOPIC_ARGS+=(--add-topic "$t"); done
gh repo edit "$REPO" --description "$DESC" --homepage "https://$DOMAIN" --enable-wiki "${TOPIC_ARGS[@]}"

if git remote get-url origin >/dev/null 2>&1; then git remote set-url origin "https://github.com/$REPO.git"; else git remote add origin "https://github.com/$REPO.git"; fi
# never fetch upstream into a published repo (its history would come back); push main in one go
git push origin HEAD:refs/heads/main

echo
echo "Repo: https://github.com/$REPO"
echo "Wiki: GitHub makes a wiki only after its first page is saved in the browser (no API for it):"
echo "  1. open https://github.com/$REPO/wiki/_new, title Home, any text, Save page;"
echo "  2. then: bash scripts/publish-wiki.sh $REPO   (pushes docs/wiki/*.md over it)"
