#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone -q https://github.com/ekartal/turkce-kelime-database.git "$TMP/tdk"
git -C "$TMP/tdk" checkout -q 444dbcc53556618b0977a3d608cbf1402f7e9363
git clone -q https://github.com/tdd-ai/hunspell-tr.git "$TMP/hunspell"
git -C "$TMP/hunspell" checkout -q 7302eca5f3652fe7ae3d3ec06c44697c97342b4e

mkdir -p "$ROOT/upload/js/warext/turkish-spellcheck" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources"
python3 "$ROOT/tools/build_editor.py" --source-dir "$ROOT/source/editor" --output "$ROOT/upload/js/warext/turkish-spellcheck/editor-v110.js"

python3 "$ROOT/tools/build_dictionary.py" \
  --tdk-dir "$TMP/tdk" \
  --hunspell-dic "$TMP/hunspell/tr_TR.dic" \
  --hunspell-aff "$TMP/hunspell/tr_TR.aff" \
  --template-dir "$ROOT/source/dictionary" \
  --output "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v110.js" \
  --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/dictionary-stats.json" \
  --max-generated 420000 \
  --per-root-limit 72 \
  --max-depth 2

python3 "$ROOT/tools/build_corrections.py" \
  --csv "$TMP/hunspell/trspell10.csv" \
  --output "$ROOT/upload/js/warext/turkish-spellcheck/corrections-v110.js"

find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f -name '*-v100.js' -delete
find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f \( -name '*-v300.js' -o -name '*-v310.js' -o -name '*-v160.js' \) -delete
cp "$TMP/hunspell/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-MPL-2.0.txt"

for file in \
  bootstrap-v110.js \
  text-core-v110.js \
  dictionary-v110.js \
  corrections-v110.js \
  language-v110.js \
  editor-v110.js \
  longtext-v110.js; do
  node --check "$ROOT/upload/js/warext/turkish-spellcheck/$file"
done

WAREXT_FULL_BUILD=1 node "$ROOT/tests/dictionary-smoke.js"
node "$ROOT/tests/rules-regression.js"
WAREXT_FULL_BUILD=1 node "$ROOT/tests/v1-language-regression.js"
node "$ROOT/tests/v1-textcore-regression.js"
node "$ROOT/tests/v110-advanced-regression.js"
php -l "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"

python3 - "$ROOT" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
root = Path(sys.argv[1])
addon = json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/addon.json').open(encoding='utf-8'))
if addon.get('version_string') != '1.1.0' or int(addon.get('version_id', 0)) != 4100070:
    raise SystemExit('Sürüm bilgisi geçersiz')
stats = json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/Resources/dictionary-stats.json').open(encoding='utf-8'))
if int(stats.get('estimatedValidWords', 0)) < 250000 or int(stats.get('hunspellDerivedWords', 0)) < 150000:
    raise SystemExit(f'Genişletilmiş sözlük hedefi karşılanamadı: {stats}')
for path in sorted((root / 'upload/src/addons/Warext/TurkishSpellCheck/_data').glob('*.xml')):
    ET.parse(path)
PY

if grep -RInE '^[[:space:]]*(//|/\*|\*)' \
  "$ROOT/source/dictionary" \
  "$ROOT/source/editor" \
  "$ROOT/upload/js/warext/turkish-spellcheck" \
  "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php" \
  "$ROOT/tools" \
  "$ROOT/tests"; then
  printf '%s\n' "Kod yorum satırı kontrolü başarısız."
  exit 1
fi

if grep -RInE 'fetch[[:space:]]*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|axios|\.ajax[[:space:]]*\(' "$ROOT/upload/js/warext/turkish-spellcheck"; then
  printf '%s\n' "Harici çalışma zamanı ağ çağrısı bulundu."
  exit 1
fi

if find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f ! -name '*-v110.js' | grep -q .; then
  printf '%s\n' "Sürüm dışı çalışma zamanı dosyası bulundu."
  exit 1
fi

rm -rf "$ROOT/release"
mkdir -p "$ROOT/release"
cd "$ROOT"
zip -qr "release/Warext-SpellCheck-1.1.0.zip" upload README.txt
sha256sum "release/Warext-SpellCheck-1.1.0.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-1.1.0.zip hazırlandı."
