import argparse
import json
import math
import random
from pathlib import Path

DIM = 256
EPOCHS = 9

def h(value):
    out = 2166136261
    for char in value:
        out = ((out ^ ord(char)) * 16777619) & 0xffffffff
    return out % DIM

def features(row):
    values = [0.0] * DIM
    text = str(row.get('text') or '').lower().split()
    for token in text:
        values[h('u:' + token)] += 1.0
    for a,b in zip(text,text[1:]):
        values[h('b:' + a + ' ' + b)] += 1.35
    values[0] = min(4.0,len(text) / 8.0)
    values[1] = float(row.get('semantic_conflicts') or 0)
    values[2] = float(row.get('dependency_complete') or 0)
    values[3] = float(row.get('idiom') or 0)
    values[4] = float(row.get('lm_score') or 0)
    return values

def sigmoid(value):
    if value > 20: return 1.0
    if value < -20: return 0.0
    return 1.0 / (1.0 + math.exp(-value))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--stats-output')
    args = parser.parse_args()
    rows = [json.loads(line) for line in Path(args.input).read_text(encoding='utf-8').splitlines() if line.strip()]
    if len(rows) < 5000:
        raise SystemExit(f'Mikro model veri seti yetersiz: {len(rows)}')
    random.Random(20260820).shuffle(rows)
    split = max(1,int(len(rows) * 0.85))
    train = rows[:split]
    test = rows[split:]
    weights = [0.0] * DIM
    bias = 0.0
    rate = 0.055
    for epoch in range(EPOCHS):
        random.Random(9000 + epoch).shuffle(train)
        for row in train:
            x = features(row)
            y = 1.0 if row.get('label') else 0.0
            score = bias + sum(w * v for w,v in zip(weights,x))
            error = sigmoid(score) - y
            bias -= rate * error
            for i,value in enumerate(x):
                if value:
                    weights[i] -= rate * (error * value + 0.00015 * weights[i])
        rate *= 0.82
    correct = 0
    for row in test:
        x = features(row)
        p = sigmoid(bias + sum(w * v for w,v in zip(weights,x)))
        if (p >= 0.5) == bool(row.get('label')):
            correct += 1
    accuracy = correct / max(1,len(test))
    compact = [round(value,6) for value in weights]
    js = f"""(() => {{
  'use strict';
  if (window.WarextMicroModelV200) return;
  const weights = {json.dumps(compact,separators=(',',':'))};
  const bias = {round(bias,6)};
  const dim = {DIM};
  function hash(value) {{
    let out = 2166136261 >>> 0;
    for (const char of value) out = Math.imul((out ^ char.codePointAt(0)) >>> 0,16777619) >>> 0;
    return out % dim;
  }}
  function sigmoid(value) {{ return value > 20 ? 1 : value < -20 ? 0 : 1 / (1 + Math.exp(-value)); }}
  function score(text,meta = {{}}) {{
    const x = new Float64Array(dim);
    const words = String(text || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').match(/[a-zçğıöşüâîû]+/gu) || [];
    for (const token of words) x[hash('u:' + token)] += 1;
    for (let i = 0; i + 1 < words.length; i++) x[hash('b:' + words[i] + ' ' + words[i + 1])] += 1.35;
    x[0] = Math.min(4,words.length / 8);
    x[1] = Number(meta.semanticConflicts || 0);
    x[2] = Number(meta.dependencyComplete || 0);
    x[3] = Number(meta.idiom || 0);
    x[4] = Number(meta.lmScore || 0);
    let z = bias;
    for (let i = 0; i < dim; i++) z += weights[i] * x[i];
    return sigmoid(z);
  }}
  window.WarextMicroModelV200 = {{version:'2.0.0',dimensions:dim,accuracy:{round(accuracy,5)},score,externalDependencies:0}};
}})();
"""
    out = Path(args.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(js,encoding='utf-8')
    stats = {'version':'2.0.0','samples':len(rows),'dimensions':DIM,'testSamples':len(test),'accuracy':round(accuracy,5),'runtimeExternalDependencies':0}
    if args.stats_output:
        Path(args.stats_output).write_text(json.dumps(stats,ensure_ascii=False,indent=2) + '\n',encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False,separators=(',',':')))

if __name__ == '__main__':
    main()
