'use strict';
const assert = require('node:assert/strict');
global.window = global;
require('../upload/js/warext/turkish-spellcheck/text-core-v110.js');
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/context-v230.js');
require('../upload/js/warext/turkish-spellcheck/context-tuning-v231.js');
require('../upload/js/warext/turkish-spellcheck/semantic-model-v300.js');
require('../upload/js/warext/turkish-spellcheck/runtime-v240.js');
require('../upload/js/warext/turkish-spellcheck/semantic-document-v300.js');
require('../upload/js/warext/turkish-spellcheck/semantic-tuning-v301.js');
require('../upload/js/warext/turkish-spellcheck/semantic-tuning-v302.js');
require('../upload/js/warext/turkish-spellcheck/semantic-knowledge-v310.js');
require('../upload/js/warext/turkish-spellcheck/semantic-reasoning-v310.js');
require('../upload/js/warext/turkish-spellcheck/semantic-reasoning-tuning-v311.js');

const e = global.WarextTurkishSpellEngineV110;
assert.ok(e?.analyzeMeaningGraph);

const conflict = /(?:state-contradiction|quantity-conflict|event-polarity-conflict)/u;
const causal = /(?:causal-unsupported-inference|causal-clause-gap)/u;
const role = /semantic-role-(?:subject|object)-mismatch/u;
const reference = /reference-ambiguous-pronoun/u;
const cases = [
  ['positive','Kapı kapalıydı. Bir süre bekledim. Kapı açıktı.',conflict],
  ['positive','Dosya silindi. Dosya hâlâ mevcuttu.',conflict],
  ['positive','Depoda beş kutu vardı. Depoda dokuz kutu vardı.',conflict],
  ['positive','Hiçbir kitabım yoktu. Masaya üç tane kitabımı koydum.',conflict],
  ['positive','Sunucu kahveyi içti.',role],
  ['positive','Hava güneşliydi. Bu yüzden veritabanı silindi.',causal],
  ['positive','Ali Ahmet ile konuştu. O daha sonra dosyayı açtı.',reference],
  ['positive','Sunucu kapalıydı. Sonra hava değişti. Sunucu açıktı.',conflict],
  ['clean','Kapı kapalıydı. Sonra görevli kapıyı açtı. Kapı açıktı.',conflict],
  ['clean','Dün sunucu kapalıydı. Bugün sunucu açık.',conflict],
  ['clean','Eğer kapı kapalıysa bekle. Kapı açıksa içeri gir.',conflict],
  ['clean','Belki sunucu kapalıdır. Sunucu açık olabilir.',conflict],
  ['clean','Depoda beş kutu vardı. Sonra dört kutu daha eklendi. Depoda dokuz kutu vardı.',conflict],
  ['clean','Kullanıcı kahveyi içti.',role],
  ['clean','Elektrik kesildi. Bu yüzden sunucu kapandı.',causal],
  ['clean','Ahmet dosyayı hazırladı. O dosyayı gönderdi.',reference]
];

let truePositive = 0;
let falseNegative = 0;
let trueNegative = 0;
let falsePositive = 0;
const details = [];
for (const [kind,text,pattern] of cases) {
  const report = e.analyzeMeaningGraph(text);
  const detected = (report.warnings || []).some(item => pattern.test(String(item.rule || '')));
  if (kind === 'positive') {
    if (detected) truePositive++;
    else falseNegative++;
  } else {
    if (detected) falsePositive++;
    else trueNegative++;
  }
  details.push({kind,text,detected,rules:(report.warnings || []).map(item => item.rule)});
}
const positiveTotal = truePositive + falseNegative;
const cleanTotal = trueNegative + falsePositive;
const recall = positiveTotal ? truePositive / positiveTotal : 1;
const specificity = cleanTotal ? trueNegative / cleanTotal : 1;
assert.ok(recall >= 0.875,JSON.stringify({recall,specificity,details}));
assert.ok(specificity >= 0.875,JSON.stringify({recall,specificity,details}));
assert.equal(e.stats.externalDependencies,0);
assert.equal(e.stats.hypotheticalAssertionsExcluded,true);
assert.equal(e.stats.entityScopedTransitions,true);
assert.equal(e.stats.deltaQuantitiesExcluded,true);
console.log(JSON.stringify({version:'3.1.1',cases:cases.length,truePositive,falseNegative,trueNegative,falsePositive,recall,specificity,externalDependencies:0}));