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

const e = global.WarextTurkishSpellEngineV110;
const model = global.WarextSemanticModelV300;
assert.ok(e?.analyzeSemanticDocument);
assert.equal(model.VERSION,'3.0.0');
assert.equal(e.stats.semanticTuningLayer,'v301-inflection-aware-logic');
assert.equal(e.stats.externalDependencies,0);

const related = model.similarity('Sunucu yazılımını güncelledik ve eklenti paketini test ettik.','Yeni sürümdeki kod hatalarını düzelterek sistemi yeniden çalıştırdık.');
const unrelated = model.similarity('Sunucu yazılımını güncelledik ve eklenti paketini test ettik.','Denizde balık tutarken rüzgâr kuvvetli esiyordu.');
assert.ok(related > unrelated,`anlamsal benzerlik sıralaması hatalı: ${related} <= ${unrelated}`);

const contradictory = 'Kütüphaneye vardığımızda kapının kapalı olduğunu gördük çünkü kütüphane o gün açık olduğu için içeri giremedik. Yanımda hiç kitap getirmediğimden dolayı üç tane kitabımı masaya çıkardım. Günün sonunda bunun faydalı olduğunu düşündüm ve bundan sonra her hafta gitmeye karar verdiler.';
const report = e.analyzeSemanticDocument(contradictory,{semantic:true,longText:true});
assert.ok(report.coherence && Number.isFinite(report.coherence.score));
assert.ok(report.coherence.score < 100);
assert.ok(report.warnings.some(item => item.rule === 'v301-semantic-clause-state-conflict'),JSON.stringify(report.warnings));
assert.ok(report.warnings.some(item => item.rule === 'v301-semantic-existence-quantity-conflict'),JSON.stringify(report.warnings));

const paragraph = e.analyzeParagraph(contradictory,{semantic:true,longText:true,fullParagraph:true});
assert.ok(paragraph.semanticDocument?.coherence);
assert.ok(paragraph.warnings.some(item => item.category === 'logic'));
assert.equal(paragraph.externalDependencies,0);

const clean = 'Kütüphaneye vardık ve kapının açık olduğunu gördük. İçeri girip sessiz bir masaya oturduk. Yanımızda getirdiğimiz kitapları okuyarak bir süre çalıştık.';
const cleanReport = e.analyzeSemanticDocument(clean,{semantic:true,longText:true});
assert.ok(!cleanReport.warnings.some(item => /^v301-semantic-(?:clause-state-conflict|existence-quantity-conflict)$/u.test(item.rule || '')),JSON.stringify(cleanReport.warnings));
assert.ok(cleanReport.coherence.score >= 55,JSON.stringify(cleanReport.coherence));

const valid = e.check('etkinliğin',{properNames:true,informal:true,longText:true});
assert.equal(valid.correct,true,JSON.stringify(valid));

console.log('V3 yerel paragraf anlam ve bütünlük regresyon testleri başarılı.');