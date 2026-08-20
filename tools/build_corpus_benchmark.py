import argparse
import json
import re
from pathlib import Path

TOKEN = re.compile(r"[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+", re.UNICODE)
SPACE = re.compile(r"\s+")


def strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for value in node.values():
            yield from strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from strings(value)


def clean(value):
    return SPACE.sub(' ', str(value or '')).strip()


def usable(text):
    if len(text) < 18 or len(text) > 240:
        return False
    words = TOKEN.findall(text)
    if len(words) < 4 or len(words) > 32:
        return False
    lowered = text.lower()
    if 'http://' in lowered or 'https://' in lowered or 'www.' in lowered:
        return False
    if any(mark in text for mark in ['{', '}', '<', '>', '```', '\\', '=>']):
        return False
    letter_count = sum(1 for char in text if char.isalpha())
    if letter_count / max(1, len(text)) < 0.5:
        return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--jsonl', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--limit', type=int, default=6000)
    args = parser.parse_args()

    seen = set()
    rows = []
    with Path(args.jsonl).open(encoding='utf-8', errors='replace') as handle:
        for line in handle:
            try:
                obj = json.loads(line)
            except Exception:
                continue
            for raw in strings(obj):
                text = clean(raw)
                if not usable(text):
                    continue
                key = text.casefold()
                if key in seen:
                    continue
                seen.add(key)
                rows.append({'text': text, 'label': 'clean-corpus'})
                if len(rows) >= args.limit:
                    break
            if len(rows) >= args.limit:
                break

    if len(rows) < 5000:
        raise SystemExit(f'Doğal cümle benchmarkı yetersiz: {len(rows)}')

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w', encoding='utf-8') as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n')

    print(json.dumps({'version':'2.1.0','cleanSentences':len(rows)}, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
