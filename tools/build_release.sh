#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone -q https://github.com/ekartal/turkce-kelime-database.git "$TMP/tdk"
git -C "$TMP/tdk" checkout -q 444dbcc53556618b0977a3d608cbf1402f7e9363
git clone -q https://github.com/tdd-ai/hunspell-tr.git "$TMP/hunspell"
git -C "$TMP/hunspell" checkout -q 7302eca5f3652fe7ae3d3ec06c44697c97342b4e
git clone -q https://github.com/ahakanacar/turkish-dictionary-dataset-and-statistics.git "$TMP/idioms"
git -C "$TMP/idioms" checkout -q 5ef471d903d48010cd15f4d3a0bb18a19ba95137
git clone -q https://github.com/3nesdeniz/turkish-daily-dialogues-5k.git "$TMP/dialogues"
git -C "$TMP/dialogues" checkout -q ccd9f05c2f97684bbd9a55d818528da9dfb6bd5a
curl -fsSL https://download.geonames.org/export/dump/cities500.zip -o "$TMP/cities500.zip"
unzip -q "$TMP/cities500.zip" -d "$TMP/geonames"

mkdir -p "$ROOT/upload/js/warext/turkish-spellcheck" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources"
python3 "$ROOT/tools/build_editor.py" --source-dir "$ROOT/source/editor" --output "$ROOT/upload/js/warext/turkish-spellcheck/editor-v110.js"
python3 "$ROOT/tools/build_dictionary_v2.py" \
  --tdk-dir "$TMP/tdk" \
  --hunspell-dic "$TMP/hunspell/tr_TR.dic" \
  --hunspell-aff "$TMP/hunspell/tr_TR.aff" \
  --template-dir "$ROOT/source/dictionary" \
  --output "$ROOT/upload/js/warext/turkish-spellcheck/dictionary-v110.js" \
  --lexicon-output "$ROOT/upload/js/warext/turkish-spellcheck/lexicon-v200.js" \
  --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/dictionary-stats.json" \
  --max-generated 420000 \
  --per-root-limit 72 \
  --max-depth 2
python3 "$ROOT/tools/build_corrections.py" --csv "$TMP/hunspell/trspell10.csv" --output "$ROOT/upload/js/warext/turkish-spellcheck/corrections-v110.js"
python3 "$ROOT/tools/build_entities.py" --geonames "$TMP/geonames/cities500.txt" --output "$ROOT/upload/js/warext/turkish-spellcheck/entities-v200.js" --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/entity-stats.json" --limit 220000
python3 "$ROOT/tools/build_idioms.py" --input "$TMP/idioms/turkish_phrases_idioms.json" --output "$ROOT/upload/js/warext/turkish-spellcheck/idioms-v200.js" --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/idiom-stats.json" --limit 18000
python3 "$ROOT/tools/build_lm.py" --jsonl "$TMP/dialogues/data/train.jsonl" --output "$ROOT/upload/js/warext/turkish-spellcheck/lm-v200.js" --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/lm-stats.json"
python3 "$ROOT/tools/generate_benchmark.py" --output "$TMP/benchmark.jsonl" --samples 12000
python3 "$ROOT/tools/build_micro_model.py" --input "$TMP/benchmark.jsonl" --output "$ROOT/upload/js/warext/turkish-spellcheck/micro-model-v200.js" --stats-output "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/micro-model-stats.json"

python3 - "$ROOT" <<'PY'
import re
import sys
from pathlib import Path
root=Path(sys.argv[1])
longtext=root/'upload/js/warext/turkish-spellcheck/longtext-v110.js'
text=longtext.read_text(encoding='utf-8')
text=re.sub(r"const VERSION = '[^']+';","const VERSION = '2.0.0';",text,count=1)
if 'semanticSensitivity:' not in text:
    text=text.replace("    semantic: boolValue(configData.semantic, true),\n    threshold:","    semantic: boolValue(configData.semantic, true),\n    semanticSensitivity: numberValue(configData.semanticSensitivity, 88, 70, 99),\n    threshold:",1)
text=text.replace("          semantic:cfg.semantic,\n          longText:true","          semantic:cfg.semantic,\n          semanticSensitivity:cfg.semanticSensitivity,\n          longText:true")
longtext.write_text(text,encoding='utf-8')
language=root/'upload/js/warext/turkish-spellcheck/language-v110.js'
language_text=language.read_text(encoding='utf-8')
language_text=re.sub(r"const VERSION = '[^']+';","const VERSION = '2.0.0';",language_text,count=1)
old="""  function rootLooksVerb(root) {
    if (!root || chars(root).length < 2) return false;
    if (!baseIsValid(root)) return false;
    const h2 = harmony2(root);
    if (h2 && baseIsValid(`${root}m${h2}k`)) return true;
    if (baseIsValid(`${root}mak`) || baseIsValid(`${root}mek`)) return true;
    return false;
  }
"""
new="""  function rootLooksVerb(root) {
    if (!root || chars(root).length < 2) return false;
    const h2 = harmony2(root);
    if (h2 && baseIsValid(`${root}m${h2}k`)) return true;
    if (baseIsValid(`${root}mak`) || baseIsValid(`${root}mek`)) return true;
    return baseIsValid(root);
  }
"""
if old not in language_text:
    raise SystemExit('Fiil kökü doğrulama noktası bulunamadı')
language_text=language_text.replace(old,new,1)
language.write_text(language_text,encoding='utf-8')
PY

cp "$TMP/hunspell/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-MPL-2.0.txt"
cp "$TMP/idioms/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-TURKISH-DICTIONARY-MIT.txt"
cp "$TMP/dialogues/LICENSE" "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/LICENSE-TURKISH-DIALOGUES-CC-BY-4.0.txt"
cat > "$ROOT/upload/src/addons/Warext/TurkishSpellCheck/Resources/THIRD_PARTY_DATA.txt" <<'TXT'
Warext Turkish Spell Check 2.0.0 build-time data sources

ekartal/turkce-kelime-database
Pinned commit: 444dbcc53556618b0977a3d608cbf1402f7e9363
Used only during build to produce the bundled local dictionary.

tdd-ai/hunspell-tr
Pinned commit: 7302eca5f3652fe7ae3d3ec06c44697c97342b4e
MPL-2.0. Used only during build for Turkish Hunspell roots, affixes and spelling corrections.

ahakanacar/turkish-dictionary-dataset-and-statistics
Pinned commit: 5ef471d903d48010cd15f4d3a0bb18a19ba95137
MIT. Used only during build for Turkish phrase and idiom data.

3nesdeniz/turkish-daily-dialogues-5k
Pinned commit: ccd9f05c2f97684bbd9a55d818528da9dfb6bd5a
CC BY 4.0. Used only during build for local n-gram statistics. Author: Enes Deniz.

GeoNames cities500
https://www.geonames.org/
CC BY 4.0. Used only during build to create the bundled local place-name membership index.

Runtime network dependency: none.
TXT

find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f -name '*-v100.js' -delete
find "$ROOT/upload/js/warext/turkish-spellcheck" -maxdepth 1 -type f \( -name '*-v300.js' -o -name '*-v310.js' -o -name '*-v160.js' \) -delete

for file in \
  bootstrap-v110.js \
  text-core-v110.js \
  lexicon-v200.js \
  dictionary-v110.js \
  corrections-v110.js \
  language-v110.js \
  semantic-v110.js \
  semantic-deep-v110.js \
  semantic-context-v110.js \
  entities-v200.js \
  idioms-v200.js \
  lm-v200.js \
  micro-model-v200.js \
  knowledge-v200.js \
  micro-integration-v200.js \
  learning-v200.js \
  semantic-ui-v110.js \
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
WAREXT_FULL_BUILD=1 node "$ROOT/tests/v130-semantic-regression.js"
WAREXT_FULL_BUILD=1 node "$ROOT/tests/v200-nlp-regression.js"

while IFS= read -r -d '' file; do php -l "$file"; done < <(find "$ROOT/upload/src/addons/Warext/TurkishSpellCheck" -type f -name '*.php' -print0)

python3 - "$ROOT" <<'PY'
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
root=Path(sys.argv[1])
addon=json.loads((root/'upload/src/addons/Warext/TurkishSpellCheck/addon.json').read_text(encoding='utf-8'))
if addon.get('version_string')!='2.0.0' or int(addon.get('version_id',0))!=5000070:
    raise SystemExit('Sürüm bilgisi geçersiz')
resources=root/'upload/src/addons/Warext/TurkishSpellCheck/Resources'
stats=json.loads((resources/'dictionary-stats.json').read_text(encoding='utf-8'))
entities=json.loads((resources/'entity-stats.json').read_text(encoding='utf-8'))
idioms=json.loads((resources/'idiom-stats.json').read_text(encoding='utf-8'))
lm=json.loads((resources/'lm-stats.json').read_text(encoding='utf-8'))
micro=json.loads((resources/'micro-model-stats.json').read_text(encoding='utf-8'))
if stats.get('version')!='2.0.0' or stats.get('dictionaryArchitecture')!='lazy-bloom' or int(stats.get('estimatedValidWords',0))<250000:
    raise SystemExit('Sözlük mimarisi doğrulanamadı')
if int(entities.get('locationNames',0))<100000:
    raise SystemExit('100K yer adı hedefi karşılanamadı')
if int(idioms.get('idioms',0))<500:
    raise SystemExit('Deyim hedefi karşılanamadı')
if int(lm.get('bigrams',0))<5000:
    raise SystemExit('Yerel dil modeli hedefi karşılanamadı')
if int(micro.get('samples',0))<5000 or float(micro.get('accuracy',0))<0.8:
    raise SystemExit('Yerel mikro model hedefi karşılanamadı')
for path in sorted((root/'upload/src/addons/Warext/TurkishSpellCheck/_data').rglob('*.xml')):
    ET.parse(path)
bootstrap=(root/'upload/js/warext/turkish-spellcheck/bootstrap-v110.js').read_text(encoding='utf-8')
for asset in ['lexicon-v200.js','entities-v200.js','idioms-v200.js','lm-v200.js','micro-model-v200.js','knowledge-v200.js','micro-integration-v200.js','learning-v200.js']:
    if asset not in bootstrap:
        raise SystemExit(f'Varlık yükleyiciye bağlanmadı: {asset}')
if "const VERSION = '2.0.0';" not in bootstrap:
    raise SystemExit('Bootstrap sürümü geçersiz')
setup=(root/'upload/src/addons/Warext/TurkishSpellCheck/Setup.php').read_text(encoding='utf-8')
if 'upgrade5000070Step1' not in setup or 'xf_warext_spell_feedback' not in setup:
    raise SystemExit('2.0 yükseltme veya öğrenme tablosu eksik')
if (root/'upload/js/warext/turkish-spellcheck/dictionary-v110.js').stat().st_size > 3500000:
    raise SystemExit('Çekirdek sözlük tembel mimariye küçültülemedi')
PY

if grep -RInE '^[[:space:]]*(//|/\*|\*)' \
  "$ROOT/source/dictionary" \
  "$ROOT/source/editor" \
  "$ROOT/upload/js/warext/turkish-spellcheck" \
  "$ROOT/upload/src/addons/Warext/TurkishSpellCheck" \
  "$ROOT/tools" \
  "$ROOT/tests"; then
  printf '%s\n' "Kod yorum satırı kontrolü başarısız."
  exit 1
fi

if grep -RInE 'https?://|WebSocket|EventSource|sendBeacon|axios|\.ajax[[:space:]]*\(' "$ROOT/upload/js/warext/turkish-spellcheck"; then
  printf '%s\n' "Harici çalışma zamanı ağ bağımlılığı bulundu."
  exit 1
fi

network_files="$(grep -RIlE 'fetch[[:space:]]*\(' "$ROOT/upload/js/warext/turkish-spellcheck" || true)"
if [ -n "$network_files" ] && [ "$network_files" != "$ROOT/upload/js/warext/turkish-spellcheck/learning-v200.js" ]; then
  printf '%s\n' "İzin verilmeyen çalışma zamanı fetch çağrısı bulundu: $network_files"
  exit 1
fi

if ! grep -q "credentials:'same-origin'" "$ROOT/upload/js/warext/turkish-spellcheck/learning-v200.js"; then
  printf '%s\n' "Yerel geri bildirim çağrısı same-origin değil."
  exit 1
fi

rm -rf "$ROOT/release"
mkdir -p "$ROOT/release"
cd "$ROOT"
zip -qr "release/Warext-SpellCheck-2.0.0.zip" upload README.txt
sha256sum "release/Warext-SpellCheck-2.0.0.zip" > SHA256SUMS
printf '%s\n' "release/Warext-SpellCheck-2.0.0.zip hazırlandı."
