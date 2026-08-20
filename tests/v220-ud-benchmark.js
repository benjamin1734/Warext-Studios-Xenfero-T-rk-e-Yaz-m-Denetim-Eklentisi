'use strict';
const fs = require('fs');
global.window = global;
if (typeof global.atob !== 'function') global.atob = value => Buffer.from(value,'base64').toString('binary');
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
const e = global.WarextTurkishSpellEngineV110;
const input = process.argv[2];
if (!input || !fs.existsSync(input)) throw new Error('UD benchmark dosyası bulunamadı');
const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşüâîû]/gu,'');

function blocks(text) {
  return text.split(/\r?\n\r?\n/u).map(value => value.trim()).filter(Boolean);
}

function parseBlock(block) {
  const lines = block.split(/\r?\n/u);
  const textLine = lines.find(line => line.startsWith('# text = '));
  const text = textLine ? textLine.slice(9).trim() : '';
  const tokens = [];
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < 8 || /[-.]/u.test(cols[0])) continue;
    tokens.push({id:Number(cols[0]),form:cols[1],upos:cols[3],head:Number(cols[6]),rel:cols[7]});
  }
  const root = tokens.find(token => token.head === 0);
  const subject = tokens.find(token => /^nsubj(?::|$)/u.test(token.rel));
  const object = tokens.find(token => /^obj(?::|$)/u.test(token.rel));
  return {text,tokens,root,subject,object};
}

function predictedForms(parsed,key) {
  const out = new Set();
  for (const sentence of parsed?.sentences || []) {
    const item = sentence?.[key];
    if (!item) continue;
    for (const value of [item.raw,item.word,item.root,item.text,item.token]) {
      const normalized = normalize(value);
      if (normalized) out.add(normalized);
    }
  }
  return out;
}

let eligible=0;
let subjectTotal=0;
let subjectHit=0;
let subjectCoverage=0;
let objectTotal=0;
let objectHit=0;
let objectCoverage=0;
let crashes=0;
for (const raw of blocks(fs.readFileSync(input,'utf8'))) {
  const row = parseBlock(raw);
  if (!row.text || !row.root || !['VERB','AUX'].includes(row.root.upos)) continue;
  if (row.tokens.length < 3 || row.tokens.length > 24) continue;
  if (!row.subject && !row.object) continue;
  eligible++;
  let parsed;
  try { parsed=e.parseSyntaxV220(row.text); } catch (_) { crashes++; continue; }
  if (row.subject) {
    subjectTotal++;
    const predicted=predictedForms(parsed,'subject');
    if (predicted.size) subjectCoverage++;
    if (predicted.has(normalize(row.subject.form))) subjectHit++;
  }
  if (row.object) {
    objectTotal++;
    const predicted=predictedForms(parsed,'object');
    if (predicted.size) objectCoverage++;
    if (predicted.has(normalize(row.object.form))) objectHit++;
  }
  if (eligible >= 2500) break;
}
if (eligible < 500) throw new Error(`UD benchmark örnek sayısı düşük: ${eligible}`);
if (crashes > 0) throw new Error(`Dependency benchmark çalışma hatası: ${crashes}`);
const subjectAccuracy=subjectTotal ? subjectHit / subjectTotal : 0;
const objectAccuracy=objectTotal ? objectHit / objectTotal : 0;
const subjectCoverageRate=subjectTotal ? subjectCoverage / subjectTotal : 0;
const objectCoverageRate=objectTotal ? objectCoverage / objectTotal : 0;
if (subjectTotal >= 100 && subjectCoverageRate < 0.5) throw new Error(`Özne kapsaması düşük: ${subjectCoverage}/${subjectTotal}`);
if (objectTotal >= 100 && objectCoverageRate < 0.5) throw new Error(`Nesne kapsaması düşük: ${objectCoverage}/${objectTotal}`);
if (subjectTotal >= 100 && subjectAccuracy < 0.32) throw new Error(`Özne doğruluğu düşük: ${subjectHit}/${subjectTotal}`);
if (objectTotal >= 100 && objectAccuracy < 0.4) throw new Error(`Nesne doğruluğu düşük: ${objectHit}/${objectTotal}`);
console.log(JSON.stringify({version:'2.2.0',eligible,subjectTotal,subjectHit,subjectAccuracy,subjectCoverageRate,objectTotal,objectHit,objectAccuracy,objectCoverageRate,crashes}));
