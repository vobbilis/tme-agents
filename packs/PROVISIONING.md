# Provisioning what git does not carry

Two things are deliberately absent from a fresh clone of this repository.

## 1. HPE Graphik fonts (required)

The brand typeface is internally licensed, so the `.otf` files are
gitignored. After cloning, copy the four weights (Regular, Medium,
Semibold, Bold) into each pack:

    packs/diagram/assets/fonts/
    packs/footage/assets/fonts/
    packs/explainer/assets/fonts/

The copy of record is `app/public/fonts/` in the itom-portal-prototype
repository at commit 5c90c52, or any existing install of this plugin.
`npm run doctor` in a scaffolded reel verifies the font hashes, so a wrong
or missing font is caught before any film is built. Fonts render locally
only and must never be pushed to a non-internal host — the plugin's own
git guard enforces this.

## 2. Explainer reference material (optional)

`packs/explainer/reference/` holds study copies of the delivered SecOps
film's documents and artwork. It is internal material (and its SVGs embed
the licensed fonts), so it stays off git. The explainer pack works without
it; copy it from an existing install if you want the worked example.
