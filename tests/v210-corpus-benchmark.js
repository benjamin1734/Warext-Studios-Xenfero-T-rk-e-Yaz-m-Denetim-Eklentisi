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
const e = global.WarextTurkishSpellEngineV110;
const input = process.argv[2];
if (!input || !fs.existsSync(input)) throw new Error('Benchmark veri dosyası bulunamadı');
const lines = fs.readFileSync(input,'utf8').split(/\r?\n/u).filter(Boolean).slice(0,5000);
if (lines.length < 5000) throw new Error(`Benchmark 5000 cümlenin altında: ${lines.length}`);
let total = 0;
let semanticFlagged = 0;
let semanticWarnings = 0;
let crashes = 0;
let wsdResolved = 0;
for (const line of lines) {
  let row;
  try { row = JSON.parse(line); } catch (_) { continue; }
  const text = String(row.text || '').trim();
  if (!text) continue;
  total++;
  try {
    const report = e.analyzeMeaning(text,{semantic:true,longText:false});
    const high = (report.warnings || []).filter(item => /semantic|valency|subject|object|micro-model|selection|frame/iu.test(String(item.rule || '')) && Number(item.confidence || 0) >= 0.92);
    if (high.length) semanticFlagged++;
    semanticWarnings += high.length;
    wsdResolved += (report.senses || []).filter(item => Number(item.confidence || 0) >= 0.75).length;
  } catch (_) {
    crashes++;
  }
}
if (total < 5000) throw new Error(`İşlenen doğal cümle sayısı yetersiz: ${total}`);
const sentenceFlagRate = semanticFlagged / total;
if (crashes !== 0) throw new Error(`Doğal corpus analizinde çökme: ${crashes}`);
if (sentenceFlagRate > 0.18) throw new Error(`Doğal corpus yüksek güvenli semantik uyarı oranı fazla: ${semanticFlagged}/${total}=${sentenceFlagRate.toFixed(4)}`);
console.log(JSON.stringify({version:'2.1.0',total,semanticFlagged,semanticWarnings,sentenceFlagRate:Number(sentenceFlagRate.toFixed(6)),wsdResolved,crashes}));
