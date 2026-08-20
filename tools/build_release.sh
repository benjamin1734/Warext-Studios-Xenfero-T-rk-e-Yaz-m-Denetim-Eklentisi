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

python3 - "$ROOT" <<'PY'
import json
import sys
from pathlib import Path
root = Path(sys.argv[1])
stats_path = root / 'upload/src/addons/Warext/TurkishSpellCheck/Resources/dictionary-stats.json'
stats = json.loads(stats_path.read_text(encoding='utf-8'))
stats['version'] = '1.2.0'
stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def patch(path, old, new, label):
    text = path.read_text(encoding='utf-8')
    if old in text:
        text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')
        return
    if new not in text:
        raise SystemExit(f'Derleme dönüşümü bulunamadı: {label}')

semantic_path = root / 'upload/js/warext/turkish-spellcheck/semantic-v110.js'
patch(
    semantic_path,
    "  function clauseIdFor(text,index) {\n    let id = 0;\n    for (let cursor = 0; cursor < index; cursor++) if (/[.!?;:\\n]/u.test(text[cursor])) id++;\n    return id;\n  }\n\n  function enrichClauses(text,tokens) {\n    for (const token of tokens) token.clause = clauseIdFor(text,token.start);\n    return tokens;\n  }",
    "  function enrichClauses(text,tokens) {\n    let clause = 0;\n    let cursor = 0;\n    for (const token of tokens) {\n      while (cursor < token.start) {\n        if (/[.!?;:\\n]/u.test(text[cursor])) clause++;\n        cursor++;\n      }\n      token.clause = clause;\n    }\n    return tokens;\n  }",
    'semantic-linear-clause-scan'
)

longtext_path = root / 'upload/js/warext/turkish-spellcheck/longtext-v110.js'
patch(longtext_path, "  const VERSION = '1.1.0';", "  const VERSION = '1.2.0';", 'longtext-version')
patch(
    longtext_path,
    "    deepContext: boolValue(configData.deepContext, true),\n    threshold:",
    "    deepContext: boolValue(configData.deepContext, true),\n    semantic: boolValue(configData.semantic, true),\n    threshold:",
    'longtext-semantic-config'
)
patch(
    longtext_path,
    "          nextSentence:cfg.deepContext ? nextText : '',\n          longText:true",
    "          nextSentence:cfg.deepContext ? nextText : '',\n          semantic:cfg.semantic,\n          longText:true",
    'longtext-semantic-context'
)

setup_path = root / 'upload/src/addons/Warext/TurkishSpellCheck/Setup.php'
setup = setup_path.read_text(encoding='utf-8')
if 'upgrade4200070Step1' not in setup:
    marker = '\n}\n'
    if not setup.endswith(marker):
        raise SystemExit('Setup sınıf sonu bulunamadı')
    method = "\n    public function upgrade4200070Step1(): void\n    {\n        try\n        {\n            $this->query('TRUNCATE TABLE xf_warext_spell_cache');\n        }\n        catch (\\Throwable $e)\n        {\n        }\n    }\n"
    setup = setup[:-len(marker)] + method + marker
    setup_path.write_text(setup, encoding='utf-8')
PY

find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f -name '*-v100.js' -delete
find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f \( -name '*-v300.js' -o -name '*-v310.js' -o -name '*-v160.js' \) -delete
cp "$TMP/hunspell/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-MPL-2.0.txt"

for file in \
  bootstrap-v110.js \
  text-core-v110.js \
  dictionary-v110.js \
  corrections-v110.js \
  language-v110.js \
  semantic-v110.js \
  editor-v110.js \
  longtext-v110.js; do
  node --check "$ROOT/upload/js/warext/turkish-spellcheck/$file"
done

WAREXT_FULL_BUILD=1 node "$ROOT/tests/dictionary-smoke.js"
node "$ROOT/tests/rules-regression.js"
WAREXT_FULL_BUILD=1 node "$ROOT/tests/v1-language-regression.js"
node "$ROOT/tests/v1-textcore-regression.js"
node "$ROOT/tests/v110-advanced-regression.js"
WAREXT_FULL_BUILD=1 node "$ROOT/tests/v120-semantic-regression.js"
php -l "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Setup.php"

python3 - "$ROOT" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
root = Path(sys.argv[1])
addon = json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/addon.json').open(encoding='utf-8'))
if addon.get('version_string') != '1.2.0' or int(addon.get('version_id', 0)) != 4200070:
    raise SystemExit('Sürüm bilgisi geçersiz')
stats = json.load((root / 'upload/src/addons/Warext/TurkishSpellCheck/Resources/dictionary-stats.json').open(encoding='utf-8'))
if stats.get('version') != '1.2.0':
    raise SystemExit('Sözlük sürümü geçersiz')
if int(stats.get('estimatedValidWords', 0)) < 250000 or int(stats.get('hunspellDerivedWords', 0)) < 150000:
    raise SystemExit(f'Genişletilmiş sözlük hedefi karşılanamadı: {stats}')
for path in sorted((root / 'upload/src/addons/Warext/TurkishSpellCheck/_data').glob('*.xml')):
    ET.parse(path)
bootstrap = (root / 'upload/js/warext/turkish-spellcheck/bootstrap-v110.js').read_text(encoding='utf-8')
if "semantic-v110.js" not in bootstrap or "const VERSION = '1.2.0';" not in bootstrap:
    raise SystemExit('Anlam motoru yükleyiciye bağlanmadı')
semantic = (root / 'upload/js/warext/turkish-spellcheck/semantic-v110.js').read_text(encoding='utf-8')
if "semanticExternalModel:0" not in semantic or "externalDependencies:0" not in semantic:
    raise SystemExit('Yerel anlam motoru bağımlılık doğrulaması başarısız')
editor = (root / 'upload/js/warext/turkish-spellcheck/editor-v110.js').read_text(encoding='utf-8')
longtext = (root / 'upload/js/warext/turkish-spellcheck/longtext-v110.js').read_text(encoding='utf-8')
setup = (root / 'upload/src/addons/Warext/TurkishSpellCheck/Setup.php').read_text(encoding='utf-8')
if 'semantic:cfg.semantic' not in editor or 'semantic:cfg.semantic' not in longtext:
    raise SystemExit('Anlam denetimi editör bağlamına uygulanmadı')
if 'upgrade4200070Step1' not in setup:
    raise SystemExit('1.2 yükseltme adımı bulunamadı')
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
zip -qr "release/Warext-SpellCheck-1.2.0.zip" upload README.txt
sha256sum "release/Warext-SpellCheck-1.2.0.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-1.2.0.zip hazırlandı."
