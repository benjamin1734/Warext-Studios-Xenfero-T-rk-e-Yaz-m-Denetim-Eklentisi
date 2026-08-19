import argparse
import json
import re
from collections import defaultdict, deque
from pathlib import Path

ALPHABET_FILES = [
    'A.txt','B.txt','C.txt','Ç.txt','D.txt','E.txt','F.txt','G.txt','Ğ.txt','H.txt',
    'I.txt','İ.txt','J.txt','K.txt','L.txt','M.txt','N.txt','O.txt','Ö.txt','P.txt',
    'R.txt','S.txt','Ş.txt','T.txt','U.txt','Ü.txt','V.txt','Y.txt','Z.txt'
]
WORD_RE = re.compile(r'^[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+$')


def normalize(value):
    return str(value or '').replace('I', 'ı').replace('İ', 'i').lower().strip()


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


def split_entry(value):
    escaped = False
    for index, char in enumerate(value):
        if char == '\\' and not escaped:
            escaped = True
            continue
        if char == '/' and not escaped:
            return value[:index].replace('\\/', '/'), value[index + 1:]
        escaped = False
    return value.replace('\\/', '/'), ''


def parse_flags(raw, mode):
    raw = str(raw or '')
    if not raw:
        return []
    if mode == 'num':
        return [part for part in raw.split(',') if part]
    if mode == 'long':
        return [raw[index:index + 2] for index in range(0, len(raw) - 1, 2)]
    return list(raw)


def load_hunspell_entries(path, flag_mode):
    lines = path.read_text(encoding='utf-8-sig').splitlines()
    entries = []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        field = line.split(None, 1)[0]
        root_raw, flags_raw = split_entry(field)
        root = normalize(root_raw)
        if root and WORD_RE.fullmatch(root):
            entries.append((root, parse_flags(flags_raw, flag_mode)))
    seen = set()
    out = []
    for root, flags in entries:
        key = (root, tuple(flags))
        if key in seen:
            continue
        seen.add(key)
        out.append((root, flags))
    return out


def flag_mode_from_aff(lines):
    mode = 'utf8'
    for raw in lines:
        parts = raw.strip().split()
        if len(parts) >= 2 and parts[0] == 'FLAG':
            value = parts[1].lower()
            if value in {'num', 'long'}:
                mode = value
            else:
                mode = 'utf8'
            break
    return mode


def compile_condition(kind, condition):
    condition = condition or '.'
    if condition == '.':
        return re.compile(r'.*', re.UNICODE)
    pattern = f'(?:{condition})$' if kind == 'SFX' else f'^(?:{condition})'
    try:
        return re.compile(pattern, re.UNICODE)
    except re.error:
        return None


def load_affix_rules(path):
    lines = path.read_text(encoding='utf-8-sig', errors='replace').splitlines()
    mode = flag_mode_from_aff(lines)
    rules = defaultdict(list)
    cross_flags = {'PFX': set(), 'SFX': set()}
    index = 0
    while index < len(lines):
        raw = lines[index].strip()
        index += 1
        if not raw or raw.startswith('#'):
            continue
        parts = raw.split()
        if len(parts) != 4 or parts[0] not in {'PFX', 'SFX'} or not parts[3].isdigit():
            continue
        kind, flag, cross, count_raw = parts
        count = int(count_raw)
        if cross.upper() == 'Y':
            cross_flags[kind].add(flag)
        consumed = 0
        while index < len(lines) and consumed < count:
            row = lines[index].strip()
            index += 1
            if not row or row.startswith('#'):
                continue
            consumed += 1
            cols = row.split()
            if len(cols) < 5 or cols[0] != kind or cols[1] != flag:
                continue
            strip = '' if cols[2] == '0' else cols[2]
            add_field = '' if cols[3] == '0' else cols[3]
            add_raw, continuation_raw = split_entry(add_field)
            add = add_raw
            continuation = parse_flags(continuation_raw, mode)
            condition = compile_condition(kind, cols[4])
            if condition is None:
                continue
            rules[(kind, flag)].append({
                'kind': kind,
                'flag': flag,
                'strip': strip,
                'add': add,
                'continuation': continuation,
                'condition': condition
            })
    return mode, rules, cross_flags


def apply_rule(word, rule):
    if not rule['condition'].search(word):
        return ''
    strip = normalize(rule['strip'])
    add = normalize(rule['add'])
    if rule['kind'] == 'SFX':
        if strip and not word.endswith(strip):
            return ''
        stem = word[:-len(strip)] if strip else word
        candidate = stem + add
    else:
        if strip and not word.startswith(strip):
            return ''
        stem = word[len(strip):] if strip else word
        candidate = add + stem
    candidate = normalize(candidate)
    if len(candidate) < 2 or len(candidate) > 72 or not WORD_RE.fullmatch(candidate):
        return ''
    return candidate


def expand_hunspell(entries, rules, cross_flags, max_generated, per_root_limit, max_depth):
    generated = []
    generated_set = set()
    for root, flags in entries:
        if len(generated_set) >= max_generated:
            break
        root_forms = set()
        initial_prefix = [flag for flag in flags if ('PFX', flag) in rules]
        initial_suffix = [flag for flag in flags if ('SFX', flag) in rules]
        queue = deque()
        for flag in flags:
            for kind in ('PFX', 'SFX'):
                for rule in rules.get((kind, flag), []):
                    candidate = apply_rule(root, rule)
                    if not candidate or candidate == root or candidate in root_forms:
                        continue
                    root_forms.add(candidate)
                    queue.append((candidate, tuple(rule['continuation']), 1, kind, flag))
                    if len(root_forms) >= per_root_limit:
                        break
                if len(root_forms) >= per_root_limit:
                    break
            if len(root_forms) >= per_root_limit:
                break
        if len(root_forms) < per_root_limit and initial_prefix and initial_suffix:
            for pflag in initial_prefix:
                if pflag not in cross_flags['PFX']:
                    continue
                for prule in rules.get(('PFX', pflag), []):
                    prefixed = apply_rule(root, prule)
                    if not prefixed:
                        continue
                    for sflag in initial_suffix:
                        if sflag not in cross_flags['SFX']:
                            continue
                        for srule in rules.get(('SFX', sflag), []):
                            candidate = apply_rule(prefixed, srule)
                            if candidate and candidate != root:
                                root_forms.add(candidate)
                            if len(root_forms) >= per_root_limit:
                                break
                        if len(root_forms) >= per_root_limit:
                            break
                    if len(root_forms) >= per_root_limit:
                        break
                if len(root_forms) >= per_root_limit:
                    break
        while queue and len(root_forms) < per_root_limit:
            current, continuation, depth, previous_kind, previous_flag = queue.popleft()
            if depth >= max_depth:
                continue
            for flag in continuation:
                for kind in ('PFX', 'SFX'):
                    if kind != previous_kind and previous_flag not in cross_flags.get(previous_kind, set()):
                        continue
                    for rule in rules.get((kind, flag), []):
                        candidate = apply_rule(current, rule)
                        if not candidate or candidate == root or candidate in root_forms:
                            continue
                        root_forms.add(candidate)
                        queue.append((candidate, tuple(rule['continuation']), depth + 1, kind, flag))
                        if len(root_forms) >= per_root_limit:
                            break
                    if len(root_forms) >= per_root_limit:
                        break
                if len(root_forms) >= per_root_limit:
                    break
        for candidate in sorted(root_forms):
            if candidate in generated_set:
                continue
            generated_set.add(candidate)
            generated.append(candidate)
            if len(generated_set) >= max_generated:
                break
    return generated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tdk-dir', required=True)
    parser.add_argument('--hunspell-dic', required=True)
    parser.add_argument('--hunspell-aff', required=True)
    parser.add_argument('--template-dir', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--stats-output')
    parser.add_argument('--max-generated', type=int, default=360000)
    parser.add_argument('--per-root-limit', type=int, default=48)
    parser.add_argument('--max-depth', type=int, default=2)
    args = parser.parse_args()

    aff_lines = Path(args.hunspell_aff).read_text(encoding='utf-8-sig', errors='replace').splitlines()
    flag_mode = flag_mode_from_aff(aff_lines)
    tdk_words = load_tdk_words(Path(args.tdk_dir))
    entries = load_hunspell_entries(Path(args.hunspell_dic), flag_mode)
    roots = unique(root for root, _ in entries)
    parsed_mode, rules, cross_flags = load_affix_rules(Path(args.hunspell_aff))
    if parsed_mode != flag_mode:
        raise SystemExit('Hunspell bayrak biçimi uyuşmuyor')
    generated = expand_hunspell(entries, rules, cross_flags, args.max_generated, args.per_root_limit, args.max_depth)
    tdk_set = set(tdk_words)
    extra = []
    extra_seen = set()
    for word in [*roots, *generated]:
        if word in tdk_set or word in extra_seen:
            continue
        extra_seen.add(word)
        extra.append(word)

    if len(tdk_words) < 60000:
        raise SystemExit(f'TDK kelime sayısı yetersiz: {len(tdk_words)}')
    if len(roots) < 75000:
        raise SystemExit(f'Hunspell kök sayısı yetersiz: {len(roots)}')
    if len(extra) < 100000:
        raise SystemExit(f'Genişletilmiş geçerli kelime sayısı yetersiz: {len(extra)}')
    if not rules:
        raise SystemExit('Hunspell ek kuralları yüklenemedi')

    template_dir = Path(args.template_dir)
    parts = sorted(template_dir.glob('engine-v300.part*'))
    if not parts:
        raise SystemExit('Dil motoru kaynak parçaları bulunamadı')
    template = ''.join(path.read_text(encoding='utf-8') for path in parts)
    template = template.replace('__TDK_JSON__', json.dumps('\n'.join(tdk_words), ensure_ascii=False, separators=(',', ':')))
    template = template.replace('__EXTRA_JSON__', json.dumps('\n'.join(extra), ensure_ascii=False, separators=(',', ':')))
    template = template.replace('WarextTurkishSpellEngineV300', 'WarextTurkishSpellEngineV110')
    template = template.replace("version: '3.0.0'", "version: '1.1.0'")
    template = template.replace("morphology: 'v3-local-context-morphology'", "morphology: 'v110-local-context-morphology'")
    stats_fragment = f"hunspellRoots: {len(roots)}, hunspellDerivedWords: {len(generated)}, affixRules: {sum(len(value) for value in rules.values())}, dictionaryBuildMode: 'bounded-affix-expansion', externalDependencies: 0"
    template = template.replace('externalDependencies: 0 }', stats_fragment + ' }')

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template, encoding='utf-8')

    stats = {
        'version': '1.1.0',
        'tdkWords': len(tdk_words),
        'hunspellRoots': len(roots),
        'hunspellDerivedWords': len(generated),
        'extraValidWords': len(extra),
        'estimatedValidWords': len(tdk_set | set(extra)),
        'affixRules': sum(len(value) for value in rules.values()),
        'flagMode': flag_mode,
        'perRootLimit': args.per_root_limit,
        'maxDepth': args.max_depth,
        'maxGenerated': args.max_generated
    }
    if args.stats_output:
        stats_path = Path(args.stats_output)
        stats_path.parent.mkdir(parents=True, exist_ok=True)
        stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(stats, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
