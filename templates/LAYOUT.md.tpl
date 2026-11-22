# {{title}} — release notes

**{{title}}** (package `{{package}}`) is a Layout of the Selldone shop **{{shop}}** (xapi `{{xapi}}`), built for **{{domain}}**. It is a skin of the Layout base (see [`BASE.md`](BASE.md)): everything that makes it this Layout is `skins/{{name}}/skin.json` and `skins/{{name}}/photos/`; the code, the flows and the checks are the base's.

## Setup

| Area | What is set |
| --- | --- |
| Repo | `{{name}}-layout`, branch `main`; remote `upstream` (selldone/storefront, fetch only, push disabled); `origin` = `{{org}}/{{repo}}` once published (`scripts/publish-github.sh`) |
| Names | `manifest.json` and `selldone-layout.json` from the skin (`package` is permanent after the first upload; the `description` must be right on the FIRST upload, Selldone keeps it) |
| Dev server | port **{{port}}**, shop `{{xapi}}` (`.env`); `npm run serve` (launch entry `{{name}}-layout`) |
| Skin | {{palettes}} (brand `{{brand}}`), {{display_font}} over {{text_font}}, radius {{panel}} / {{inner}} px, basket word "{{basket}}" |
| Layout id | (after the first upload) |

## Home

{{sections_list}}

## Photos

{{photos_table}}

## Checks

<!-- CHECKS:START -->
(none yet)
<!-- CHECKS:END -->

## Releases

| Version | Date | Layout | Deploy | What |
| --- | --- | --- | --- | --- |
