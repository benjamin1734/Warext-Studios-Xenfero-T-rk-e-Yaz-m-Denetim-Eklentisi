import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

def norm(v):
    return re.sub(r'\s+',' ',str(v or '').replace('I','ı').replace('İ','i').lower()).strip()

def collect(node,key=''):
    out=[]
    if isinstance(node,dict):
        for k,v in node.items():
            nk=norm(k)
            if isinstance(v,str) and any(x in nk for x in ['madde','deyim','atasöz','atasoz','phrase','ifade','söz','soz','title','name']):
                out.append(v)
            out.extend(collect(v,nk))
    elif isinstance(node,list):
        for item in node:
            out.extend(collect(item,key))
    elif isinstance(node,str) and key in {'','phrase','deyim','madde'}:
        out.append(node)
    return out

def main():
    p=argparse.ArgumentParser(); p.add_argument('--input',required=True); p.add_argument('--output',required=True); p.add_argument('--stats-output'); p.add_argument('--limit',type=int,default=18000); a=p.parse_args()
    data=json.loads(Path(a.input).read_text(encoding='utf-8-sig'))
    phrases=[]; seen=set()
    for raw in collect(data):
        value=norm(raw)
        words=value.split()
        if len(words)<2 or len(words)>10 or len(value)>96 or any(ch in value for ch in ['http://','https://','{','}']):
            continue
        if value in seen:
            continue
        seen.add(value); phrases.append(value)
        if len(phrases)>=a.limit: break
    seed=['göz atmak','kulak vermek','el atmak','kafayı yemek','kafayı takmak','etekleri zil çalmak','ağzından kaçırmak','gözden düşmek','yola koyulmak','yüz vermek','dil dökmek','baş kaldırmak','elinden gelmek','içine sinmek','yük olmak','can atmak','göz kulak olmak','aklına gelmek','burnundan getirmek','ayağa kalkmak']
    for s in seed:
        v=norm(s)
        if v not in seen: seen.add(v); phrases.append(v)
    index=defaultdict(list)
    for phrase in phrases:
        index[phrase.split()[0]].append(phrase)
    payload=json.dumps(dict(index),ensure_ascii=False,separators=(',',':'))
    js=f"""(() => {{
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
        const key = `${{at}}:${{phrase}}`;
        if (!seen.has(key)) {{ seen.add(key); out.push({{start:at,end:at + phrase.length,phrase}}); }}
        at = source.indexOf(phrase,at + 1);
      }}
    }}
    return out;
  }}
  window.WarextIdiomsV200 = {{version:'2.0.0',size:{len(phrases)},find,hasPhrase:value => {{ const v=normalize(value); const first=v.split(' ')[0]; return (index[first] || []).includes(v); }}}};
}})();
"""
    out=Path(a.output); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(js,encoding='utf-8')
    stats={'version':'2.0.0','idioms':len(phrases),'runtimeExternalDependencies':0}
    if a.stats_output: Path(a.stats_output).write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False,separators=(',',':')))
if __name__=='__main__': main()
