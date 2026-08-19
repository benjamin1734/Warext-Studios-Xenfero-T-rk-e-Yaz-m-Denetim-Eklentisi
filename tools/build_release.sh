#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone -q https://github.com/ekartal/turkce-kelime-database.git "$TMP/tdk"
git -C "$TMP/tdk" checkout -q 444dbcc53556618b0977a3d608cbf1402f7e9363
git clone -q https://github.com/tdd-ai/hunspell-tr.git "$TMP/hunspell"
git -C "$TMP/hunspell" checkout -q 7302eca5f3652fe7ae3d3ec06c44697c97342b4e

python3 "$ROOT/tools/build_dictionary.py" \
  --tdk-dir "$TMP/tdk" \
  --hunspell-dic "$TMP/hunspell/tr_TR.dic" \
  --template-dir "$ROOT/source/dictionary" \
  --output "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v142.js"

mkdir -p "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources"
cp "$TMP/hunspell/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-MPL-2.0.txt"

node --check "$ROOT/upload/js/warext/turkish-spellcheck/bootstrap-v142.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v142.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/editor-v142.js"
node "$ROOT/tests/dictionary-smoke.js"
php -l "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"

rm -rf "$ROOT/release"
mkdir -p "$ROOT/release"
cd "$ROOT"
zip -qr "release/Warext-SpellCheck-1.zip" upload
sha256sum "release/Warext-SpellCheck-1.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-1.zip hazırlandı."
