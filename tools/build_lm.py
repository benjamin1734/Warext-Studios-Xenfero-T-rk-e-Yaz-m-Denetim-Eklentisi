import argparse
import json
import re
from collections import Counter
from pathlib import Path
TOKEN=re.compile(r"[a-zA-ZçÇğĞıİöÖşŞüÜâÂîÎûÛ]+",re.UNICODE)
def norm(v): return str(v or '').replace('I','ı').replace('İ','i').lower()
def strings(node):
    if isinstance(node,str): yield node
    elif isinstance(node,dict):
        for v in node.values(): yield from strings(v)
    elif isinstance(node,list):
        for v in node: yield from strings(v)
def main():
    p=argparse.ArgumentParser(); p.add_argument('--jsonl',required=True); p.add_argument('--output',required=True); p.add_argument('--stats-output'); p.add_argument('--max-bigrams',type=int,default=45000); p.add_argument('--max-trigrams',type=int,default=25000); a=p.parse_args()
    uni=Counter(); bi=Counter(); tri=Counter(); sentences=0
    with Path(a.jsonl).open(encoding='utf-8',errors='replace') as f:
        for line in f:
            try: obj=json.loads(line)
            except Exception: continue
            for text in strings(obj):
                toks=[norm(x) for x in TOKEN.findall(text) if len(x)>1]
                if len(toks)<2: continue
                sentences+=1; uni.update(toks); bi.update(zip(toks,toks[1:])); tri.update(zip(toks,toks[1:],toks[2:]))
    bigrams=[]
    for pair,c in bi.most_common(a.max_bigrams):
        if c<2: break
        denom=max(1,uni[pair[0]])
        bigrams.append((' '.join(pair),round(min(1.0,c/denom),6)))
    trigrams=[]
    for triple,c in tri.most_common(a.max_trigrams):
        if c<2: break
        denom=max(1,bi[(triple[0],triple[1])])
        trigrams.append((' '.join(triple),round(min(1.0,c/denom),6)))
    if len(bigrams)<5000: raise SystemExit(f'Büyükram modeli yetersiz: {len(bigrams)}')
    braw='\n'.join(f'{k}\t{v}' for k,v in bigrams)
    traw='\n'.join(f'{k}\t{v}' for k,v in trigrams)
    bp=json.dumps(braw,ensure_ascii=False,separators=(',',':')); tp=json.dumps(traw,ensure_ascii=False,separators=(',',':'))
    js=f"""(() => {{
  'use strict';
  if (window.WarextLmV200) return;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR');
  const parse = raw => {{ const m=new Map(); for (const row of raw.split('\n')) {{ const i=row.lastIndexOf('\t'); if (i>0) m.set(row.slice(0,i),Number(row.slice(i+1))); }} return m; }};
  const bi = parse({bp});
  const tri = parse({tp});
  function score(text) {{
    const words=(normalize(text).match(/[a-zçğıöşüâîû]+/gu) || []).filter(x=>x.length>1);
    if (words.length<2) return {{score:1,rare:[],bigrams:0,trigrams:0}};
    let total=0,weight=0; const rare=[];
    for (let i=0;i+1<words.length;i++) {{ const key=`${{words[i]}} ${{words[i+1]}}`; const p=bi.get(key); const value=p == null ? 0.045 : Math.max(0.02,p); total += value; weight++; if (p == null) rare.push(key); }}
    for (let i=0;i+2<words.length;i++) {{ const key=`${{words[i]}} ${{words[i+1]}} ${{words[i+2]}}`; const p=tri.get(key); const value=p == null ? 0.035 : Math.max(0.02,p); total += value * 1.35; weight += 1.35; }}
    return {{score:weight ? total/weight : 1,rare:rare.slice(0,8),bigrams:bi.size,trigrams:tri.size}};
  }}
  window.WarextLmV200 = {{version:'2.0.0',bigrams:bi.size,trigrams:tri.size,score}};
}})();
"""
    out=Path(a.output); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(js,encoding='utf-8')
    stats={'version':'2.0.0','sentences':sentences,'bigrams':len(bigrams),'trigrams':len(trigrams),'runtimeExternalDependencies':0}
    if a.stats_output: Path(a.stats_output).write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__': main()
