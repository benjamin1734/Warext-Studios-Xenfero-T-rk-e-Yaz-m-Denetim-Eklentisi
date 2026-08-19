import argparse
import csv
import json
import re
from pathlib import Path

WORD_RE = re.compile(r"^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû'’]+$")


def normalize(value):
    return str(value or '').replace('I', 'ı').replace('İ', 'i').lower().strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    mapping = {}
    with Path(args.csv).open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or 'gold' not in reader.fieldnames or 'input' not in reader.fieldnames:
            raise SystemExit('Düzeltme veri kümesi biçimi geçersiz')
        for row in reader:
            source = normalize(row.get('input'))
            target = normalize(row.get('gold'))
            if not source or not target or source == target:
                continue
            if len(source) < 2 or len(source) > 64 or len(target) < 2 or len(target) > 64:
                continue
            if not WORD_RE.fullmatch(source) or not WORD_RE.fullmatch(target):
                continue
            mapping.setdefault(source, target)

    if len(mapping) < 5000:
        raise SystemExit(f'Düzeltme veri kümesi yetersiz: {len(mapping)}')

    payload = json.dumps(mapping, ensure_ascii=False, separators=(',', ':'))
    content = "(() => {\n  'use strict';\n  if (window.WarextCorrectionMapV110) return;\n  const data = " + payload + ";\n  window.WarextCorrectionMapV110 = new Map(Object.entries(data));\n})();\n"
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding='utf-8')
    print(len(mapping))


if __name__ == '__main__':
    main()
