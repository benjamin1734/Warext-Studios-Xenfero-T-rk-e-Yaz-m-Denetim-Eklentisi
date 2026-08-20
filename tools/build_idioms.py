import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

LETTER_PATTERN = re.compile(r"^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû'’ -]+$", re.UNICODE)
WORD_PATTERN = re.compile(r"[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+", re.UNICODE)
META = {
    'madde','anlam','anlamlar','deyim','deyimler','atasözü','atasozu','atasözleri','atasozleri',
    'phrase','phrases','idiom','idioms','proverb','proverbs','text','name','title','type','origin',
    'kelime','kelimeler','açıklama','aciklama','description','örnek','ornek','examples','example',
    'id','index','source','kaynak','kategori','category','tags','etiket','etiketler'
}
LABEL_HINTS = {'madde','deyim','atasözü','atasozu','phrase','idiom','proverb','ifade','söz','soz','title','name'}


def norm(value):
    return re.sub(r'\s+', ' ', str(value or '').replace('I', 'ı').replace('İ', 'i').lower()).strip()


def clean(value):
    value = re.sub(r'\s+', ' ', str(value or '')).strip()
    value = value.strip('"“”«».,;:!?()[]{}<>')
    return re.sub(r'\s+', ' ', value).strip()


def candidates(node, parent=''):
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(key, str):
                yield key, 'key', parent
            nk = norm(key)
            if isinstance(value, str):
                yield value, 'value', nk
            else:
                yield from candidates(value, nk)
    elif isinstance(node, list):
        for value in node:
            if isinstance(value, str):
                yield value, 'list', parent
            else:
                yield from candidates(value, parent)


def valid_phrase(raw, source_kind, parent):
    value = clean(raw)
    lowered = norm(value)
    if not value or lowered in META:
        return ''
    if len(value) < 5 or len(value) > 120:
        return ''
    if any(token in lowered for token in ('http://', 'https://', 'www.', '.com', '.net', '.org')):
        return ''
    if any(ch.isdigit() for ch in value):
        return ''
    if not LETTER_PATTERN.fullmatch(value):
        return ''
    words = WORD_PATTERN.findall(value)
    if len(words) < 2 or len(words) > 10:
        return ''
    if source_kind == 'value' and not any(hint in parent for hint in LABEL_HINTS) and len(words) > 6:
        return ''
    if sum(len(word) for word in words) < 4:
        return ''
    return lowered


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--stats-output')
    parser.add_argument('--limit', type=int, default=18000)
    args = parser.parse_args()

    data = json.loads(Path(args.input).read_text(encoding='utf-8-sig'))
    phrases = []
    seen = set()
    source_counts = defaultdict(int)

    for raw, source_kind, parent in candidates(data):
        value = valid_phrase(raw, source_kind, parent)
        if not value or value in seen:
            continue
        seen.add(value)
        phrases.append(value)
        source_counts[source_kind] += 1
        if len(phrases) >= args.limit:
            break

    seed = [
        'göz atmak','kulak vermek','el atmak','kafayı yemek','kafayı takmak','etekleri zil çalmak',
        'ağzından kaçırmak','gözden düşmek','yola koyulmak','yüz vermek','dil dökmek','baş kaldırmak',
        'elinden gelmek','içine sinmek','yük olmak','can atmak','göz kulak olmak','aklına gelmek',
        'burnundan getirmek','ayağa kalkmak','göze girmek','gözden kaçırmak','el ele vermek',
        'dile düşmek','söz vermek','sözünde durmak','yol açmak','yol vermek','yer vermek','yer almak'
    ]
    for raw in seed:
        value = norm(raw)
        if value not in seen:
            seen.add(value)
            phrases.append(value)
            source_counts['seed'] += 1

    if len(phrases) < 500:
        raise SystemExit(f'Deyim verisi yetersiz: {len(phrases)}')

    index = defaultdict(list)
    for phrase in phrases:
        index[phrase.split()[0]].append(phrase)

    payload = json.dumps(dict(index), ensure_ascii=False, separators=(',', ':'))
    js = f"""(() => {{
  'use strict';
  if (window.WarextIdiomsV200) return;
  const index = {payload};
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').replace(/\s+/gu,' ').trim();
  function find(text) {{
    const source = normalize(text);
    const words = source.match(/[a-zçğıöşüâîû]+/gu) || [];
    const first = new Set(words);
    const out = [];
    const seen = new Set();
    for (const word of first) for (const phrase of index[word] || []) {{
      let at = source.indexOf(phrase);
      while (at >= 0) {{
        const before = at === 0 ? '' : source[at - 1];
        const afterAt = at + phrase.length;
        const after = afterAt >= source.length ? '' : source[afterAt];
        const leftOk = !before || !/[a-zçğıöşüâîû]/u.test(before);
        const rightOk = !after || !/[a-zçğıöşüâîû]/u.test(after);
        const key = `${{at}}:${{phrase}}`;
        if (leftOk && rightOk && !seen.has(key)) {{ seen.add(key); out.push({{start:at,end:at + phrase.length,phrase}}); }}
        at = source.indexOf(phrase, at + 1);
      }}
    }}
    return out;
  }}
  window.WarextIdiomsV200 = {{version:'2.0.0',size:{len(phrases)},find,hasPhrase:value => {{ const v=normalize(value); const first=v.split(' ')[0]; return (index[first] || []).includes(v); }}}};
}})();
"""

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(js, encoding='utf-8')
    stats = {
        'version': '2.0.0',
        'idioms': len(phrases),
        'keyCandidates': source_counts['key'],
        'valueCandidates': source_counts['value'],
        'listCandidates': source_counts['list'],
        'seedCandidates': source_counts['seed'],
        'runtimeExternalDependencies': 0
    }
    if args.stats_output:
        Path(args.stats_output).write_text(json.dumps(stats, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(stats, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
