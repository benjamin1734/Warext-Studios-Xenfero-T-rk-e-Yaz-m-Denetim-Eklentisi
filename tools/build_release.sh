#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JS="$ROOT/upload/js/warext/turkish-spellcheck"
for file in \
  "$JS/dictionary-v300.js" \
  "$JS/editor-v300.js" \
  "$JS/longtext-v310.js" \
  "$JS/bootstrap-v100.js" \
  "$JS/corrections-v100.js" \
  "$JS/language-core-v100.js" \
  "$JS/language-morph-v100.js" \
  "$JS/language-context-time-v100.js" \
  "$JS/language-context-rules-v100.js" \
  "$JS/language-v100.js" \
  "$JS/text-core-v100.js"
do
  node --check "$file"
done
node "$ROOT/tests/v1-runtime.js"
php -l "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"
python3 - "$ROOT" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
root = Path(sys.argv[1])
addon = json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/addon.json').open(encoding='utf-8'))
if addon.get('version_string') != '1.0.0' or int(addon.get('version_id', 0)) != 4000070:
    raise SystemExit('Sürüm bilgisi hatalı')
for path in sorted((root / 'upload/src/addons/Warext/TurkishSpellCheck/_data').glob('*.xml')):
    ET.parse(path)
PY
if grep -RInE '^[[:space:]]*(//|/\*|\*)' "$JS" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"; then
  exit 1
fi
if grep -RInE 'fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|axios|\.ajax\(' "$JS"; then
  exit 1
fi
rm -rf "$ROOT/release"
mkdir -p "$ROOT/release"
cd "$ROOT"
zip -qr "release/Warext-SpellCheck-1.0.0.zip" upload README.txt
sha256sum "release/Warext-SpellCheck-1.0.0.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-1.0.0.zip hazırlandı."
