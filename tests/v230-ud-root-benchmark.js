'use strict';
const fs=require('fs');
global.window=global;
if(typeof global.atob!=='function')global.atob=value=>Buffer.from(value,'base64').toString('binary');
require('../upload/js/warext/turkish-spellcheck/lexicon-v200.js');
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-deep-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-context-v110.js');
require('../upload/js/warext/turkish-spellcheck/entities-v200.js');
require('../upload/js/warext/turkish-spellcheck/idioms-v200.js');
require('../upload/js/warext/turkish-spellcheck/lm-v200.js');
require('../upload/js/warext/turkish-spellcheck/micro-model-v200.js');
require('../upload/js/warext/turkish-spellcheck/knowledge-v200.js');
require('../upload/js/warext/turkish-spellcheck/micro-integration-v200.js');
require('../upload/js/warext/turkish-spellcheck/quality-v210.js');
require('../upload/js/warext/turkish-spellcheck/quality-v220.js');
require('../upload/js/warext/turkish-spellcheck/syntax-v220.js');
require('../upload/js/warext/turkish-spellcheck/syntax-tuning-v220.js');
try{require('../upload/js/warext/turkish-spellcheck/syntax-v230.js');}catch(_){}
const e=global.WarextTurkishSpellEngineV110;
const input=process.argv[2];
if(!input||!fs.existsSync(input))throw new Error('UD benchmark dosyası bulunamadı');
const normalize=value=>String(value||'').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşüâîû]/gu,'');
const blocks=text=>text.split(/\r?\n\r?\n/u).map(value=>value.trim()).filter(Boolean);
function parseBlock(block){
  const lines=block.split(/\r?\n/u);
  const textLine=lines.find(line=>line.startsWith('# text = '));
  const text=textLine?textLine.slice(9).trim():'';
  const tokens=[];
  for(const line of lines){
    if(!line||line.startsWith('#'))continue;
    const cols=line.split('\t');
    if(cols.length<8||/[-.]/u.test(cols[0]))continue;
    tokens.push({id:Number(cols[0]),form:cols[1],lemma:cols[2],upos:cols[3],feats:cols[5],head:Number(cols[6]),rel:cols[7]});
  }
  const root=tokens.find(token=>token.head===0);
  if(!root)return{text,tokens,root:null,subject:null,object:null};
  const subject=tokens.find(token=>token.head===root.id&&/^nsubj(?::|$)/u.test(token.rel));
  const object=tokens.find(token=>token.head===root.id&&/^obj(?::|$)/u.test(token.rel));
  return{text,tokens,root,subject,object};
}
function forms(item){
  const out=new Set();
  if(!item)return out;
  for(const value of [item.raw,item.word,item.root,item.text,item.token]){
    const normalized=normalize(value);
    if(normalized)out.add(normalized);
  }
  return out;
}
function predicted(parsed,key){
  const out=new Set();
  for(const sentence of parsed?.sentences||[]){
    for(const value of forms(sentence?.[key]))out.add(value);
  }
  return out;
}
function run(rows){
  let eligible=0,subjectTotal=0,subjectHit=0,subjectCoverage=0,objectTotal=0,objectHit=0,objectCoverage=0,crashes=0;
  const misses=[];
  for(const raw of rows){
    const row=parseBlock(raw);
    if(!row.text||!row.root||!['VERB','AUX'].includes(row.root.upos))continue;
    if(row.tokens.length<3||row.tokens.length>28)continue;
    if(!row.subject&&!row.object)continue;
    eligible++;
    let parsed;
    try{parsed=e.parseSyntaxV220(row.text);}catch(_){crashes++;continue;}
    if(row.subject){
      subjectTotal++;
      const got=predicted(parsed,'subject');
      if(got.size)subjectCoverage++;
      if(got.has(normalize(row.subject.form)))subjectHit++;
      else if(misses.length<30)misses.push({kind:'subject',text:row.text,gold:row.subject.form,predicted:[...got],root:row.root.form});
    }
    if(row.object){
      objectTotal++;
      const got=predicted(parsed,'object');
      if(got.size)objectCoverage++;
      if(got.has(normalize(row.object.form)))objectHit++;
      else if(misses.length<30)misses.push({kind:'object',text:row.text,gold:row.object.form,predicted:[...got],root:row.root.form});
    }
  }
  return{eligible,subjectTotal,subjectHit,subjectAccuracy:subjectTotal?subjectHit/subjectTotal:0,subjectCoverageRate:subjectTotal?subjectCoverage/subjectTotal:0,objectTotal,objectHit,objectAccuracy:objectTotal?objectHit/objectTotal:0,objectCoverageRate:objectTotal?objectCoverage/objectTotal:0,crashes,misses};
}
const result=run(blocks(fs.readFileSync(input,'utf8')));
console.log(JSON.stringify({version:'2.3.0',...result}));
if(result.eligible<350)throw new Error(`Ana yüklem benchmark örnek sayısı düşük: ${result.eligible}`);
if(result.crashes>0)throw new Error(`Parser çalışma hatası: ${result.crashes}`);
if(result.subjectTotal>=100&&result.subjectCoverageRate<0.8)throw new Error(`Özne kapsaması düşük: ${result.subjectCoverageRate}`);
if(result.objectTotal>=100&&result.objectCoverageRate<0.8)throw new Error(`Nesne kapsaması düşük: ${result.objectCoverageRate}`);
if(result.subjectTotal>=100&&result.subjectAccuracy<0.4)throw new Error(`Ana yüklem özne doğruluğu düşük: ${result.subjectAccuracy}`);
if(result.objectTotal>=100&&result.objectAccuracy<0.48)throw new Error(`Ana yüklem nesne doğruluğu düşük: ${result.objectAccuracy}`);
