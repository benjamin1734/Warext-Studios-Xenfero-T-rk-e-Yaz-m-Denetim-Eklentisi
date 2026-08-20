import argparse
import base64
import json
from pathlib import Path
import build_dictionary as base

BITS = 1 << 24
HASHES = 10

def positions(value):
    h1 = 2166136261
    h2 = 5381
    for char in value:
        code = ord(char)
        h1 = ((h1 ^ code) * 16777619) & 0xffffffff
        h2 = (((h2 << 5) + h2) ^ code) & 0xffffffff
    for index in range(HASHES):
        yield (h1 + index * h2 + index * index * 0x9e3779b9) & (BITS - 1)

def build_lexicon(words,output):
    bits = bytearray(BITS // 8)
    for word in words:
        for position in positions(word):
            bits[position >> 3] |= 1 << (position & 7)
    encoded = base64.b64encode(bits).decode('ascii')
    js = f"""(() => {{
  'use strict';
  if (window.WarextLexiconV200) return;
  const encoded = '{encoded}';
  let bytes = null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  function ensure() {{
    if (bytes) return bytes;
    const binary = atob(encoded);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }}
  function positions(value) {{
    let h1 = 2166136261 >>> 0;
    let h2 = 5381 >>> 0;
    for (const char of value) {{
      const code = char.codePointAt(0) >>> 0;
      h1 = Math.imul((h1 ^ code) >>> 0,16777619) >>> 0;
      h2 = ((((h2 << 5) >>> 0) + h2) ^ code) >>> 0;
    }}
    const out = [];
    for (let i = 0; i < {HASHES}; i++) out.push((h1 + Math.imul(i,h2) + Math.imul(i * i,0x9e3779b9)) & ({BITS} - 1));
    return out;
  }}
  function has(value) {{
    const word = normalize(value);
    if (!word) return false;
    const data = ensure();
    for (const position of positions(word)) if (!(data[position >> 3] & (1 << (position & 7)))) return false;
    return true;
  }}
  window.WarextLexiconV200 = {{version:'2.0.0',size:{len(words)},bits:{BITS},hashes:{HASHES},lazy:1,has,externalDependencies:0}};
}})();
"""
    Path(output).write_text(js,encoding='utf-8')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tdk-dir', required=True)
    parser.add_argument('--hunspell-dic', required=True)
    parser.add_argument('--hunspell-aff', required=True)
    parser.add_argument('--template-dir', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--lexicon-output', required=True)
    parser.add_argument('--stats-output')
    parser.add_argument('--max-generated', type=int, default=420000)
    parser.add_argument('--per-root-limit', type=int, default=72)
    parser.add_argument('--max-depth', type=int, default=2)
    args = parser.parse_args()
    aff_lines = Path(args.hunspell_aff).read_text(encoding='utf-8-sig', errors='replace').splitlines()
    flag_mode = base.flag_mode_from_aff(aff_lines)
    tdk_words = base.load_tdk_words(Path(args.tdk_dir))
    entries = base.load_hunspell_entries(Path(args.hunspell_dic), flag_mode)
    roots = base.unique(root for root,_ in entries)
    parsed_mode,rules,cross_flags = base.load_affix_rules(Path(args.hunspell_aff))
    if parsed_mode != flag_mode:
        raise SystemExit('Hunspell bayrak biçimi uyuşmuyor')
    generated = base.expand_hunspell(entries,rules,cross_flags,args.max_generated,args.per_root_limit,args.max_depth)
    tdk_set = set(tdk_words)
    extra = []
    extra_seen = set()
    for word in [*roots,*generated]:
        if word in tdk_set or word in extra_seen:
            continue
        extra_seen.add(word)
        extra.append(word)
    if len(tdk_words) < 60000 or len(roots) < 75000 or len(extra) < 100000 or not rules:
        raise SystemExit('Sözlük derleme hedefi karşılanamadı')
    build_lexicon(extra,args.lexicon_output)
    template_dir = Path(args.template_dir)
    parts = sorted(template_dir.glob('engine-v300.part*'))
    if not parts:
        raise SystemExit('Dil motoru kaynak parçaları bulunamadı')
    template = ''.join(path.read_text(encoding='utf-8') for path in parts)
    template = template.replace('__TDK_JSON__',json.dumps('\n'.join(tdk_words),ensure_ascii=False,separators=(',',':')))
    template = template.replace('__EXTRA_JSON__',json.dumps('',ensure_ascii=False,separators=(',',':')))
    template = template.replace('WarextTurkishSpellEngineV300','WarextTurkishSpellEngineV110')
    template = template.replace("version: '3.0.0'","version: '2.0.0'")
    template = template.replace("morphology: 'v3-local-context-morphology'","morphology: 'v200-local-context-morphology'")
    old = "  const tdkSet = new Set(tdkWords);\n  const valid = new Set(tdkWords);"
    new = "  const tdkSet = new Set(tdkWords);\n  const externalLexicon = window.WarextLexiconV200 || null;\n  class HybridSet extends Set { has(value) { return super.has(value) || !!externalLexicon?.has?.(value); } }\n  const valid = new HybridSet(tdkWords);"
    if old not in template:
        raise SystemExit('Hibrit sözlük bağlantı noktası bulunamadı')
    template = template.replace(old,new,1)
    template = template.replace('validWords: valid.size','validWords: valid.size + (externalLexicon?.size || 0)')
    stats_fragment = f"hunspellRoots: {len(roots)}, hunspellDerivedWords: {len(generated)}, affixRules: {sum(len(value) for value in rules.values())}, dictionaryBuildMode: 'lazy-bloom-affix-expansion', lexiconBloomWords: {len(extra)}, externalDependencies: 0"
    template = template.replace('externalDependencies: 0 }',stats_fragment + ' }')
    Path(args.output).write_text(template,encoding='utf-8')
    stats = {'version':'2.0.0','tdkWords':len(tdk_words),'hunspellRoots':len(roots),'hunspellDerivedWords':len(generated),'extraValidWords':len(extra),'estimatedValidWords':len(tdk_set | set(extra)),'affixRules':sum(len(value) for value in rules.values()),'flagMode':flag_mode,'perRootLimit':args.per_root_limit,'maxDepth':args.max_depth,'maxGenerated':args.max_generated,'lexiconBits':BITS,'lexiconHashes':HASHES,'dictionaryArchitecture':'lazy-bloom'}
    if args.stats_output:
        Path(args.stats_output).write_text(json.dumps(stats,ensure_ascii=False,indent=2) + '\n',encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False,separators=(',',':')))

if __name__=='__main__':
    main()
