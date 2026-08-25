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

const e = global.WarextTurkishSpellEngineV110;
const kb = global.WarextSemanticKnowledgeV310;
assert.ok(e?.analyzeMeaningGraph);
assert.equal(kb?.VERSION,'3.1.0');
assert.equal(e.stats.semanticReasoningLayer,'v310-local-proposition-graph');
assert.equal(e.stats.localKnowledgeVersion,'3.1.0');
assert.equal(e.stats.propositionGraph,true);
assert.equal(e.stats.entityMemory,true);
assert.equal(e.stats.coreferenceResolution,true);
assert.equal(e.stats.stateLedger,true);
assert.equal(e.stats.selectionalSemantics,true);
assert.equal(e.stats.causalKnowledgeBase,true);
assert.equal(e.stats.quantifierScope,true);
assert.equal(e.stats.externalDependencies,0);

const has = (text,rule) => e.analyzeMeaningGraph(text).warnings.some(item => item.rule === rule);
const lacks = (text,rule) => !has(text,rule);

assert.ok(has('Kapı kapalıydı. Bir süre bekledim. Kapı açıktı.','v310-graph-state-contradiction'));
assert.ok(lacks('Kapı kapalıydı. Sonra görevli kapıyı açtı. Kapı açıktı.','v310-graph-state-contradiction'));
assert.ok(lacks('Dün sunucu kapalıydı. Bugün sunucu açık.','v310-graph-state-contradiction'));
assert.ok(has('Dosya silindi. Dosya hâlâ mevcuttu.','v310-graph-state-contradiction'));
assert.ok(lacks('Dosya silindi. Sonra dosya yeniden oluşturuldu ve mevcut oldu.','v310-graph-state-contradiction'));
assert.ok(has('Hiçbir kitabım yoktu. Masaya üç tane kitabımı koydum.','v310-graph-existence-quantity-conflict'));
assert.ok(has('Depoda beş kutu vardı. Depoda dokuz kutu vardı.','v310-graph-quantity-conflict'));
assert.ok(lacks('Depoda beş kutu vardı. Sonra dört kutu daha eklendi. Depoda dokuz kutu vardı.','v310-graph-quantity-conflict'));
assert.ok(lacks('Eğer kapı kapalıysa bekle. Kapı açıksa içeri gir.','v310-graph-state-contradiction'));
assert.ok(lacks('Belki sunucu kapalıdır. Sunucu açık olabilir.','v310-graph-state-contradiction'));
assert.ok(has('Sunucu kahveyi içti.','v310-semantic-role-subject-mismatch'));
assert.ok(lacks('Kullanıcı kahveyi içti.','v310-semantic-role-subject-mismatch'));
assert.ok(has('Hava güneşliydi. Bu yüzden veritabanı silindi.','v310-causal-unsupported-inference'));
assert.ok(lacks('Elektrik kesildi. Bu yüzden sunucu kapandı.','v310-causal-unsupported-inference'));
assert.ok(lacks('Elektrik kesildi. Bu yüzden sunucu kapandı.','v310-reference-discourse-gap'));
assert.ok(has('Ali Ahmet ile konuştu. O daha sonra dosyayı açtı.','v310-reference-ambiguous-pronoun'));
assert.ok(lacks('Ali dosyayı hazırladı. Ben dosyayı gönderdim.','v310-reference-ambiguous-pronoun'));
assert.ok(lacks('Ahmet dosyayı hazırladı. O dosyayı gönderdi.','v310-reference-unresolved'));

const falseDeath = e.analyzeMeaningGraph('Ali hasta oldu. Daha sonra iyileşti.');
assert.ok(!falseDeath.frames.some(frame => frame.states.some(state => state.family === 'alive' && state.value === 'negative')));

const graph = e.analyzeMeaningGraph('Sunucu aktifti. Kullanıcı dosyayı yükledi. Daha sonra sunucu kapandı.');
assert.equal(graph.version,'3.1.0');
assert.equal(graph.fullyLocal,true);
assert.equal(graph.externalDependencies,0);
assert.ok(graph.graph.entityCount >= 2);
assert.ok(graph.graph.propositionCount >= 2);
assert.equal(graph.graph.sentenceCount,3);

const report = e.analyzeSemanticDocument('Kütüphaneye vardığımızda kapının kapalı olduğunu gördük. Bir süre sonra aynı kapının açık olduğu söylendi. Yanımda hiçbir kitap yoktu. Masaya üç tane kitabımı koydum.',{semantic:true,longText:true});
assert.equal(report.reasoningLayer,'v310-local-proposition-graph');
assert.equal(report.externalDependencies,0);
assert.ok(report.semanticGraph?.graph);
assert.ok(report.warnings.some(item => item.rule === 'v310-graph-existence-quantity-conflict' || /quantity-conflict/u.test(item.rule || '')));
assert.ok(Number.isFinite(report.coherence?.graphScore));

const paragraph = e.analyzeParagraph('Elektrik kesildi. Bu yüzden sunucu kapandı. Teknik ekip elektriği geri getirdi. Sunucu yeniden başlatıldı.',{semantic:true,longText:true,fullParagraph:true});
assert.equal(paragraph.fullParagraphMeaning,true);
assert.equal(paragraph.localPropositionGraph,true);
assert.equal(paragraph.externalDependencies,0);
assert.ok(paragraph.semanticGraph?.graph);

console.log('V3.1 yerel önerme grafiği, varlık belleği, nedensellik ve paragraf anlam regresyon testleri başarılı.');