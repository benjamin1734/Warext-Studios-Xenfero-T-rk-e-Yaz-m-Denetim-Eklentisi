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
  --output "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v160.js"

mkdir -p "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources"
cp "$TMP/hunspell/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-MPL-2.0.txt"

node --check "$ROOT/upload/js/warext/turkish-spellcheck/bootstrap-v160.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v160.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/rules-v160.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/worker-v160.js"
node --check "$ROOT/upload/js/warext/turkish-spellcheck/editor-v160.js"
node "$ROOT/tests/dictionary-smoke.js"
node "$ROOT/tests/rules-regression.js"
php -l "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"

python3 - "$ROOT" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(sys.argv[1])
json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/addon.json').open(encoding='utf-8'))
for path in sorted((root / 'upload/src/addons/Warext/TurkishSpellCheck/_data').glob('*.xml')):
    ET.parse(path)
PY

if grep -RInE '^[[:space:]]*(//|/\*|\*)' \
  "$ROOT/source/dictionary" \
  "$ROOT/upload/js/warext/turkish-spellcheck" \
  "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"; then
  printf '%s\n' "Kod açıklama satırı kontrolü başarısız."
  exit 1
fi

rm -rf "$ROOT/release"
mkdir -p "$ROOT/release"
cd "$ROOT"
zip -qr "release/Warext-SpellCheck-1.zip" upload
sha256sum "release/Warext-SpellCheck-1.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-1.zip hazırlandı."
