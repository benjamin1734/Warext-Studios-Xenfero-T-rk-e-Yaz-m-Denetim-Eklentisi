import argparse
import json
import re
from collections import Counter
from pathlib import Path

TOKEN = re.compile(r"[a-zA-ZçÇğĞıİöÖşŞüÜâÂîÎûÛ]+", re.UNICODE)


def norm(value):
    return str(value or '').replace('I', 'ı').replace('İ', 'i').lower()


def strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for value in node.values():
            yield from strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from strings(value)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--jsonl', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--stats-output')
    parser.add_argument('--max-bigrams', type=int, default=45000)
    parser.add_argument('--max-trigrams', type=int, default=25000)
    args = parser.parse_args()

    unigram = Counter()
    bigram = Counter()
    trigram = Counter()
    sentences = 0

    with Path(args.jsonl).open(encoding='utf-8', errors='replace') as handle:
        for line in handle:
            try:
                obj = json.loads(line)
            except Exception:
                continue
            for text in strings(obj):
                toks = [norm(value) for value in TOKEN.findall(text) if len(value) > 1]
                if len(toks) < 2:
                    continue
                sentences += 1
                unigram.update(toks)
                bigram.update(zip(toks, toks[1:]))
                trigram.update(zip(toks, toks[1:], toks[2:]))

    bigrams = []
    for pair, count in bigram.most_common(args.max_bigrams):
        if count < 2:
            break
        denominator = max(1, unigram[pair[0]])
        bigrams.append((' '.join(pair), round(min(1.0, count / denominator), 6)))

    trigrams = []
    for triple, count in trigram.most_common(args.max_trigrams):
        if count < 2:
            break
        denominator = max(1, bigram[(triple[0], triple[1])])
        trigrams.append((' '.join(triple), round(min(1.0, count / denominator), 6)))

    if len(bigrams) < 5000:
        raise SystemExit(f'Büyükram modeli yetersiz: {len(bigrams)}')

    bigram_raw = '\n'.join(f'{key}\t{value}' for key, value in bigrams)
    trigram_raw = '\n'.join(f'{key}\t{value}' for key, value in trigrams)
    bigram_payload = json.dumps(bigram_raw, ensure_ascii=False, separators=(',', ':'))
    trigram_payload = json.dumps(trigram_raw, ensure_ascii=False, separators=(',', ':'))

    js = f"""(() => {{
  'use strict';
  if (window.WarextLmV200) return;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR');
  const parse = raw => {{
    const map = new Map();
    for (const row of raw.split(String.fromCharCode(10))) {{
      const at = row.lastIndexOf(String.fromCharCode(9));
      if (at > 0) map.set(row.slice(0, at), Number(row.slice(at + 1)));
    }}
    return map;
  }};
  const bi = parse({bigram_payload});
  const tri = parse({trigram_payload});
  function score(text) {{
    const words = (normalize(text).match(/[a-zçğıöşüâîû]+/gu) || []).filter(value => value.length > 1);
    if (words.length < 2) return {{score:1,rare:[],bigrams:0,trigrams:0}};
    let total = 0;
    let weight = 0;
    const rare = [];
    for (let index = 0; index + 1 < words.length; index++) {{
      const key = `${{words[index]}} ${{words[index + 1]}}`;
      const probability = bi.get(key);
      const value = probability == null ? 0.045 : Math.max(0.02, probability);
      total += value;
      weight++;
      if (probability == null) rare.push(key);
    }}
    for (let index = 0; index + 2 < words.length; index++) {{
      const key = `${{words[index]}} ${{words[index + 1]}} ${{words[index + 2]}}`;
      const probability = tri.get(key);
      const value = probability == null ? 0.035 : Math.max(0.02, probability);
      total += value * 1.35;
      weight += 1.35;
    }}
    return {{score:weight ? total / weight : 1,rare:rare.slice(0,8),bigrams:bi.size,trigrams:tri.size}};
  }}
  window.WarextLmV200 = {{version:'2.0.0',bigrams:bi.size,trigrams:tri.size,score}};
}})();
"""

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(js, encoding='utf-8')
    stats = {
        'version': '2.0.0',
        'sentences': sentences,
        'bigrams': len(bigrams),
        'trigrams': len(trigrams),
        'runtimeExternalDependencies': 0
    }
    if args.stats_output:
        Path(args.stats_output).write_text(json.dumps(stats, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(stats, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
