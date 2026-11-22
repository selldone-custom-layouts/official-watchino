#!/usr/bin/env bash
# Every kit check, one after the other (never two browsers on the shop at once: 429), each into its own log, then
# one line per check with its TOTAL. The names and test inputs come from the skin (checks/checks.env, written by
# scripts/skin-apply.mjs from skins/<name>/skin.json "checks": a product id, a second product, a collection path,
# a search word, an article path and a compare list of the shop's own data; test inputs only, never in the Layout).
#
# usage: bash scripts/run-checks.sh <base-url> <log-folder> [checks]
#   base-url: the dev server ($DEV) or the live domain ($LIVE); checks: comma list of names below (default: all)
# Run it through new-shop-kits/pw-lock.sh. Needs MSYS_NO_PATHCONV=1 on Git Bash (set here).
# A shop that sells in English only: on dev, localStorage "<skin>-dev-languages" = "ar" offers Arabic in the test
# browser (StorefrontMixin, dev build only), so the Arabic runs really render in Arabic; on a live shop the Arabic
# runs go through scripts/pw-shop-languages.cjs. Widths: 1440, 1024 and 390 where a check takes WIDTHS; corner-clear
# 390-3840; circles in USD, AED, DKK and SAR (LONG=1 also stress-tests a long code in every circle).
set -u
export MSYS_NO_PATHCONV=1
HERE="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$HERE/checks/checks.env"
BASE="${1:-$DEV}"
OUT="${2:-check-logs}"
ONLY="${3:-}"
# the kit: KIT, else new-shop-kits beside this repo (a Layout lives at <workspace>/<name>-layout)
KIT="${KIT:-$(cd "$(dirname "$0")/../.." && (pwd -W 2>/dev/null || pwd))/new-shop-kits}"
ROOT="$(cd "$(dirname "$0")/.." && (pwd -W 2>/dev/null || pwd))"
mkdir -p "$OUT"
WAIT=".ly .ftr"
W3="${W3:-1440,1024,390}"
# Wide windows (the owner zoomed out to 2880 and 3840 CSS px, 15 Nov 2026): the layout checks also run there.
WIDE="${WIDE:-1920,2560,2880,3840}"
AREXT=()
case "$BASE" in *localhost*) ;; *) AREXT=(PW="$ROOT/scripts/pw-shop-languages.cjs" PLAYWRIGHT="$ROOT/scripts/pw-shop-languages.cjs") ;; esac
# theme_of <palette> <light|dark> [custom #hex]: the storage value for that theme
theme_of() {
  if [ -n "${3:-}" ]; then echo "{\"$SK\":\"{\\\"palette\\\":\\\"custom\\\",\\\"custom\\\":\\\"$3\\\",\\\"mode\\\":\\\"$2\\\"}\"}"
  else echo "{\"$SK\":\"{\\\"palette\\\":\\\"$1\\\",\\\"mode\\\":\\\"$2\\\"}\"}"; fi
}
DARK="$(theme_of "$BRAND_PALETTE" dark)"
LIGHT="$(theme_of "$BRAND_PALETTE" light)"
AR="{\"local-shop-$SHOP\":\"ar\",\"$DEV_LANG_KEY\":\"ar\"}"
ARDARK="{\"local-shop-$SHOP\":\"ar\",\"$DEV_LANG_KEY\":\"ar\",\"$SK\":\"{\\\"palette\\\":\\\"$BRAND_PALETTE\\\",\\\"mode\\\":\\\"dark\\\"}\"}"
CUR="${CIRCLE_CURRENCIES:-USD,AED,DKK,SAR}"
P1="/product/$T_PRODUCT"; P2="/product/$T_PRODUCT2"; CAT="$T_CATEGORY"; CMP="/comparison?list=$T_COMPARE"; ART="$T_ARTICLE"
PAGES_ALL="home=/,category=$CAT,deals=/?filter={\"only_has_discount\":true},search=/?search=$T_SEARCH,product=$P1,product2=$P2,compare=$CMP,blog=/blog,article=$ART,about=/about-us,terms=/terms,privacy=/privacy,contact=/contact-us,faq=/faq,404=/no-such-page,cart=/basket/PHYSICAL,checkout=/basket/PHYSICAL?step=checkout,account=/user"
PAGES_MAIN="home=/,category=$CAT,deals=/?filter={\"only_has_discount\":true},search=/?search=$T_SEARCH,product=$P1,compare=$CMP,blog=/blog,about=/about-us,404=/no-such-page"
BOX_PAGES="home=/,category=$CAT,deals=/?filter=%7B%22only_has_discount%22%3Atrue%7D,search=/?search=$T_SEARCH,product=$P1,product2=$P2,compare=$CMP,blog=/blog,article=$ART,404=/no-such-page,faq=/faq,contact=/contact-us,about=/about-us,terms=/terms,privacy=/privacy,account=/user"
UL_PAGES="home=/,category=$CAT,deals=/?filter={\"only_has_discount\":true},product=$P1,compare=$CMP,blog=/blog,article=$ART,about=/about-us,contact=/contact-us,faq=/faq,terms=/terms,privacy=/privacy,404=/no-such-page,account=/user"
SHAPE_PAGES="home=/,category=$CAT,deals=/?filter={\"only_has_discount\":true},search=/?search=$T_SEARCH,product=$P1,compare=$CMP,blog=/blog,article=$ART,about=/about-us,contact=/contact-us,terms=/terms,privacy=/privacy,faq=/faq,404=/no-such-page,cart=/basket/PHYSICAL,account=/user"
BAG='.bag-btn >> visible=true'
OPEN_STATES='(async () => { const b = [...document.querySelectorAll(innerWidth < 980 ? ".menu-btn" : ".bag-btn")].find((x) => x.offsetParent); if (!b) return "FAIL no button"; b.click(); return true; })()'
OPEN_SIGNIN='(async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); window.$global_router.push("/user"); await sleep(3500); const s = [...document.querySelectorAll(".acc-nav button, .ly button")].find((x) => /Sign in/i.test(x.textContent)); if (!s) return "FAIL no sign-in button"; s.click(); await sleep(1500); return true; })()'
CIRCLE_PAGES="home=/,deals=/?filter={\"only_has_discount\":true},category=$CAT"

want() { [ -z "$ONLY" ] || [[ ",$ONLY," == *",$1,"* ]]; }
run() { # name, command...
  local name="$1"; shift
  want "$name" || return 0
  echo "▶ $name"
  ( "$@" ) > "$OUT/$name.log" 2>&1
  printf '%-28s %s\n' "$name" "$(grep -E '^(TOTAL|PROBLEMS)' "$OUT/$name.log" | tail -1 || true)" | tee -a "$OUT/summary.txt"
}

run ring-dark   env PAGES="$PAGES_ALL" STORAGE="$DARK"  node "$KIT/single-vendor-shop/ring-sweep.cjs" "$BASE" "$WAIT"
run ring-light  env PAGES="$PAGES_ALL" STORAGE="$LIGHT" node "$KIT/single-vendor-shop/ring-sweep.cjs" "$BASE" "$WAIT"
run ring-ar     env "${AREXT[@]}" PAGES="$PAGES_MAIN" STORAGE="$AR" node "$KIT/single-vendor-shop/ring-sweep.cjs" "$BASE" "$WAIT"
run card-edge   env WIDTHS="$W3,$WIDE" node "$KIT/single-vendor-shop/card-edge-check.cjs" "$BASE/" "$BASE/#cat" "$BASE/?search=$T_SEARCH" "$BASE/?filter=%7B%22only_has_discount%22%3Atrue%7D"
run card-edge-ly-dark  env WIDTHS="$W3,$WIDE" STORAGE="$DARK"  node "$ROOT/scripts/card-edge-ly.cjs" "$BASE/" "$BASE/#cat" "$BASE/?search=$T_SEARCH" "$BASE/?filter=%7B%22only_has_discount%22%3Atrue%7D" "$BASE/blog" "$BASE/about-us" "$BASE/faq" "$BASE/contact-us" "$BASE/terms" "$BASE/privacy" "$BASE/user" "$BASE$CMP"
run card-edge-ly-light env WIDTHS="$W3,$WIDE" STORAGE="$LIGHT" node "$ROOT/scripts/card-edge-ly.cjs" "$BASE/" "$BASE/#cat" "$BASE/?search=$T_SEARCH" "$BASE/blog" "$BASE/about-us" "$BASE/contact-us"
run card-edge-ly-ar    env "${AREXT[@]}" WIDTHS="1440,390" STORAGE="$AR" node "$ROOT/scripts/card-edge-ly.cjs" "$BASE/" "$BASE/#cat" "$BASE/blog" "$BASE/about-us"
run corner      env PAGES="$PAGES_MAIN" STORAGE="$DARK" WIDTHS="3840,2880,2560,1920,1440,1366,1280,1024,900,768,390" node "$KIT/single-vendor-shop/corner-clear-check.cjs" "$BASE" "$WAIT"
run corner-ar   env "${AREXT[@]}" PAGES="$PAGES_MAIN" STORAGE="$AR" WIDTHS="1920,1366,1024,390" node "$KIT/single-vendor-shop/corner-clear-check.cjs" "$BASE" "$WAIT"
run circle      env PAGES="$CIRCLE_PAGES" LONG=1 CURRENCIES="$CUR" node "$KIT/single-vendor-shop/circle-fit-check.cjs" "$BASE" "$WAIT"
run circle-ar   env "${AREXT[@]}" PAGES="$CIRCLE_PAGES" LONG=1 CURRENCIES="$CUR" STORAGE="$AR" node "$KIT/single-vendor-shop/circle-fit-check.cjs" "$BASE" "$WAIT"
run circle-dark env PAGES="$CIRCLE_PAGES" LONG=1 STORAGE="$DARK" node "$KIT/single-vendor-shop/circle-fit-check.cjs" "$BASE" "$WAIT"
run circle-pd   env PAGES="product=$P1,product2=$P2" CURRENCIES="$CUR" node "$KIT/single-vendor-shop/circle-fit-check.cjs" "$BASE" "$WAIT"
run circle-pd-ar env "${AREXT[@]}" PAGES="product=$P1" CURRENCIES="$CUR" STORAGE="$AR" node "$KIT/single-vendor-shop/circle-fit-check.cjs" "$BASE" "$WAIT"
run contrast-dark   env WIDTHS="$W3" PAGES="$PAGES_ALL" STORAGE="$DARK"   node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-light  env WIDTHS="$W3" PAGES="$PAGES_ALL" STORAGE="$LIGHT"  node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
# One colour family: a palette re-tints every ground, so each palette is audited light and dark,
# and the custom colours the owner names (#ffff00, #00ffff, #111111) in both modes too.
for p in $OTHER_PALETTES; do for m in light dark; do
  run "contrast-$p-$m" env WIDTHS="$W3" PAGES="$PAGES_MAIN" STORAGE="$(theme_of "$p" "$m")" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
done; done
for c in ffff00 00ffff 111111; do for m in light dark; do
  run "contrast-$c-$m" env PAGES="$PAGES_MAIN" STORAGE="$(theme_of custom "$m" "#$c")" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
done; done
run contrast-states-dark  env WIDTHS="$W3" PAGES='home=/' STORAGE="$DARK"  OPEN="$OPEN_STATES" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-states-light env WIDTHS="$W3" PAGES='home=/' STORAGE="$LIGHT" OPEN="$OPEN_STATES" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-signin-dark  env PAGES='home=/' STORAGE="$DARK"  OPEN="$OPEN_SIGNIN" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-signin-light env PAGES='home=/' STORAGE="$LIGHT" OPEN="$OPEN_SIGNIN" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-ar      env "${AREXT[@]}" PAGES="$PAGES_MAIN" STORAGE="$AR" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run contrast-ar-dark env "${AREXT[@]}" PAGES="$PAGES_MAIN" STORAGE="$ARDARK" node "$ROOT/components/theme-switcher/tools/contrast-audit.cjs" "$BASE" "$WAIT"
run cart-dark   env SHOP="$SHOP" WAIT="$WAIT" CART=".bag-btn" STORAGE_KEY="$SK" node "$ROOT/components/theme-switcher/tools/cart-audit.cjs" "$BASE" "$BRAND_PALETTE" dark
run cart-light  env SHOP="$SHOP" WAIT="$WAIT" CART=".bag-btn" STORAGE_KEY="$SK" node "$ROOT/components/theme-switcher/tools/cart-audit.cjs" "$BASE" "$BRAND_PALETTE" light
run currency    env WIDTHS="$W3" SHOP="$SHOP" MENU=".menu-btn" MEGA="[aria-controls=dd-shop]" CART="$BAG" CATEGORY="$CAT" DEALS='/?filter={"only_has_discount":true}' node "$ROOT/components/region-switcher/tools/currency-check.cjs" "$BASE" "$WAIT"
run box-dark    env WIDTHS="$W3,$WIDE" PAGES="$BOX_PAGES" STORAGE="$DARK"  node "$ROOT/scripts/box-check.cjs" "$BASE" "$WAIT"
run box-light   env WIDTHS="$W3,$WIDE" PAGES="$BOX_PAGES" STORAGE="$LIGHT" node "$ROOT/scripts/box-check.cjs" "$BASE" "$WAIT"
run box-ar      env "${AREXT[@]}" PAGES="$BOX_PAGES" STORAGE="$AR" STATES=0 node "$ROOT/scripts/box-check.cjs" "$BASE" "$WAIT"
run i18n-ar     env "${AREXT[@]}" IGNORE="$I18N_IGNORE" I18N="$ROOT/components/kalio/i18n" LANGUAGES=ar SHOP="$SHOP" MENU=".menu-btn" CART="$BAG" CATEGORY="@a[href$=\"-category\"]" PAGES="about=/about-us,contact=/contact-us,blog=/blog,terms=/terms,privacy=/privacy,account=/user,cart=/basket/PHYSICAL,compare=$CMP" node "$ROOT/scripts/i18n-check-forced.cjs" "$BASE" "$WAIT"
# Text columns (scripts/text-column-check.cjs): no running text in a sliver, no word broken mid-word, no
# track squeezed to nothing, no words over words; every width from 390 to 3840.
TC_PAGES="$SHAPE_PAGES"
run text-col    env WIDTHS="$W3,$WIDE" PAGES="$TC_PAGES" STORAGE="$LIGHT" node "$ROOT/scripts/text-column-check.cjs" "$BASE" "$WAIT"
run text-col-ar env "${AREXT[@]}" WIDTHS="1440,2880,390" PAGES="$PAGES_MAIN" STORAGE="$AR" node "$ROOT/scripts/text-column-check.cjs" "$BASE" "$WAIT"
# One shape language: every edge a circle, the skin's panel or inner radius, square only at the window's edge;
# focus rings keep the control's shape; nothing past the window; the overlays open
run shape-light env WIDTHS="$W3" PAGES="$SHAPE_PAGES" STORAGE="$LIGHT" node "$ROOT/scripts/shape-check.cjs" "$BASE" "$WAIT"
run shape-dark  env WIDTHS="$W3" PAGES="$SHAPE_PAGES" STORAGE="$DARK"  node "$ROOT/scripts/shape-check.cjs" "$BASE" "$WAIT"
run shape-teal  env WIDTHS="1440,390" PAGES="$PAGES_MAIN" STORAGE="$(theme_of custom light '#0f7b7b')" STATES=0 node "$ROOT/scripts/shape-check.cjs" "$BASE" "$WAIT"
run shape-ar    env "${AREXT[@]}" WIDTHS="1440,390" PAGES="$PAGES_MAIN" STORAGE="$AR" STATES=0 node "$ROOT/scripts/shape-check.cjs" "$BASE" "$WAIT"
run underline-dark  env PAGES="$UL_PAGES" STORAGE="$DARK"  node "$ROOT/scripts/underline-check.cjs" "$BASE" "$WAIT"
run underline-light env PAGES="$UL_PAGES" STORAGE="$LIGHT" WIDTHS=1440 node "$ROOT/scripts/underline-check.cjs" "$BASE" "$WAIT"
echo "done"
