import argparse
import base64
import json
import re
from pathlib import Path

BITS = 1 << 23
HASHES = 7

def norm(value):
    return str(value or '').replace('I','ı').replace('İ','i').lower().strip()

def hashes(value):
    h1 = 2166136261
    h2 = 5381
    for char in value:
        code = ord(char)
        h1 = ((h1 ^ code) * 16777619) & 0xffffffff
        h2 = (((h2 << 5) + h2) ^ code) & 0xffffffff
    for index in range(HASHES):
        yield (h1 + index * h2 + index * index * 0x9e3779b9) & (BITS - 1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--geonames', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--stats-output')
    parser.add_argument('--limit', type=int, default=220000)
    args = parser.parse_args()
    names = []
    seen = set()
    with Path(args.geonames).open(encoding='utf-8', errors='replace') as handle:
        for line in handle:
            columns = line.rstrip('\n').split('\t')
            if len(columns) < 8:
                continue
            population = int(columns[14] or 0) if len(columns) > 14 and str(columns[14] or '').isdigit() else 0
            pool = [columns[1], columns[2]]
            if population >= 5000 and len(columns) > 3:
                pool.extend(columns[3].split(',')[:8])
            for raw in pool:
                value = norm(raw)
                if len(value) < 2 or len(value) > 80 or not re.search(r'[a-zçğıöşü]', value, re.I):
                    continue
                if value in seen:
                    continue
                seen.add(value)
                names.append(value)
                if len(names) >= args.limit:
                    break
            if len(names) >= args.limit:
                break
    if len(names) < 100000:
        raise SystemExit(f'Yer adı hedefi karşılanamadı: {len(names)}')
    bits = bytearray(BITS // 8)
    for name in names:
        for position in hashes(name):
            bits[position >> 3] |= 1 << (position & 7)
    encoded = base64.b64encode(bits).decode('ascii')
    js = f"""(() => {{
  'use strict';
  if (window.WarextEntitiesV200) return;
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
    for (let i = 0; i < 7; i++) out.push((h1 + Math.imul(i,h2) + Math.imul(i * i,0x9e3779b9)) & (8388608 - 1));
    return out;
  }}
  function has(value) {{
    const word = normalize(value);
    if (!word) return false;
    const data = ensure();
    for (const position of positions(word)) if (!(data[position >> 3] & (1 << (position & 7)))) return false;
    return true;
  }}
  window.WarextEntitiesV200 = {{version:'2.0.0',size:{len(names)},has,type:value => has(value) ? 'location' : '',externalDependencies:0}};
}})();
"""
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(js, encoding='utf-8')
    stats = {'version':'2.0.0','locationNames':len(names),'bloomBits':BITS,'hashes':HASHES,'source':'GeoNames cities500','runtimeExternalDependencies':0}
    if args.stats_output:
        Path(args.stats_output).write_text(json.dumps(stats, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(stats, ensure_ascii=False, separators=(',',':')))

if __name__ == '__main__':
    main()
