import argparse
import json
import re
from pathlib import Path

ALPHABET_FILES = [
    'A.txt','B.txt','C.txt','Ç.txt','D.txt','E.txt','F.txt','G.txt','Ğ.txt','H.txt',
    'I.txt','İ.txt','J.txt','K.txt','L.txt','M.txt','N.txt','O.txt','Ö.txt','P.txt',
    'R.txt','S.txt','Ş.txt','T.txt','U.txt','Ü.txt','V.txt','Y.txt','Z.txt'
]
WORD_RE = re.compile(r'^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+$')


def normalize(value):
    return value.replace('I', 'ı').replace('İ', 'i').lower().strip()


def unique(items):
    out = []
    seen = set()
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def load_tdk_words(directory):
    words = []
    for name in ALPHABET_FILES:
        path = directory / name
        if not path.exists():
            continue
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            word = normalize(line)
            if not word or any(ch.isspace() for ch in word) or not WORD_RE.fullmatch(word):
                continue
            words.append(word)
    return unique(words)


def load_hunspell_roots(path):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    roots = []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        root = normalize(line.split('/', 1)[0])
        if root:
            roots.append(root)
    return unique(roots)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tdk-dir', required=True)
    parser.add_argument('--hunspell-dic', required=True)
    parser.add_argument('--template-dir', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    tdk_words = load_tdk_words(Path(args.tdk_dir))
    roots = load_hunspell_roots(Path(args.hunspell_dic))
    tdk_set = set(tdk_words)
    extra = [word for word in roots if word not in tdk_set]

    print(f'TDK={len(tdk_words)} ROOT={len(roots)} EXTRA={len(extra)}')

    if len(tdk_words) != 60711:
        raise SystemExit(f'TDK kelime sayısı beklenenden farklı: {len(tdk_words)}')
    if len(roots) != 75909:
        raise SystemExit(f'Hunspell kök sayısı beklenenden farklı: {len(roots)}')
    if len(extra) < 56000:
        raise SystemExit(f'Ek geçerli kelime sayısı beklenenden farklı: {len(extra)}')

    template_dir = Path(args.template_dir)
    template = (template_dir / 'engine.part0').read_text(encoding='utf-8') + (template_dir / 'engine.part1').read_text(encoding='utf-8')
    template = template.replace('__TDK_JSON__', json.dumps('\n'.join(tdk_words), ensure_ascii=False, separators=(',', ':')))
    template = template.replace('__EXTRA_JSON__', json.dumps('\n'.join(extra), ensure_ascii=False, separators=(',', ':')))

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template, encoding='utf-8')


if __name__ == '__main__':
    main()
