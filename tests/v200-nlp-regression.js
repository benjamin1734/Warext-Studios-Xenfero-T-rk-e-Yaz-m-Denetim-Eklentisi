'use strict';
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
const e = global.WarextTurkishSpellEngineV110;

function report(text,context = {}) { return e.analyzeMeaning(text,{semantic:true,...context}); }
function rules(items) { return (items || []).map(item => item.rule || ''); }
function hasMeaningConflict(value) { return rules(value.warnings).some(rule => /semantic-(?:subject|object|valency)|micro-model/u.test(rule)); }

if (!global.WarextEntitiesV200 || global.WarextEntitiesV200.size < 100000 || !global.WarextEntitiesV200.has('İstanbul')) throw new Error('100K+ yerel varlık tabanı doğrulanamadı');
if (!global.WarextIdiomsV200 || global.WarextIdiomsV200.size < 500) throw new Error('Deyim tabanı yetersiz');
if (!global.WarextLmV200 || global.WarextLmV200.bigrams < 5000) throw new Error('Yerel n-gram modeli yetersiz');
if (!global.WarextMicroModelV200 || global.WarextMicroModelV200.dimensions < 128 || global.WarextMicroModelV200.accuracy < 0.8) throw new Error('Yerel mikro model doğrulanamadı');
if (!global.WarextLexiconV200 || global.WarextLexiconV200.size < 250000 || global.WarextLexiconV200.lazy !== 1) throw new Error('Tembel sözlük mimarisi doğrulanamadı');

const badSubject=report('Masa koştu.');
if (!hasMeaningConflict(badSubject)) throw new Error(`Cansız özne uyumsuzluğu bulunamadı: ${JSON.stringify(badSubject)}`);
const badObject=report('Çocuk kitabı içti.');
if (!hasMeaningConflict(badObject)) throw new Error(`Fiil nesne uyumsuzluğu bulunamadı: ${JSON.stringify(badObject)}`);
const good=report('Çocuk suyu içti.');
if (hasMeaningConflict(good)) throw new Error(`Doğal cümle yanlış işaretlendi: ${JSON.stringify(good)}`);

const parsed=e.parseDependencies('Kadın kitabı okudu.');
if (!parsed?.sentences?.length || !parsed.sentences[0].predicate?.root) throw new Error(`Bağımlılık çözümleyici çalışmadı: ${JSON.stringify(parsed)}`);
if (!parsed.sentences[0].subject || !parsed.sentences[0].object) throw new Error(`Özne nesne rolleri çözümlenemedi: ${JSON.stringify(parsed.sentences[0])}`);

const coreference=e.resolveCoreference('Kadın kitabı aldı. O onu okudu.');
if (!Array.isArray(coreference) || !coreference.some(item => item.pronoun && item.antecedent)) throw new Error(`Gönderim çözümleme çalışmadı: ${JSON.stringify(coreference)}`);

const idiom=report('Bu işe göz attım.');
if (!(idiom.metaphors || []).some(item => item.type === 'idiom')) throw new Error(`Deyim algılanamadı: ${JSON.stringify(idiom.metaphors)}`);
if (hasMeaningConflict(idiom) && rules(idiom.warnings).some(rule => /v200-semantic-object-frame/u.test(rule))) throw new Error(`Deyim literal yanlış pozitif üretti: ${JSON.stringify(idiom.warnings)}`);

const entityReport=report('İstanbul bugün güzel.');
if (!(entityReport.entities || []).some(item => item.type === 'location')) throw new Error(`NER yer adı algılanamadı: ${JSON.stringify(entityReport.entities)}`);

const timeConflict=report('Dün yarın sunucuyu başlatacağım.');
if (!rules(timeConflict.warnings).some(rule => /time-anchor/u.test(rule))) throw new Error(`Zaman çelişkisi bulunamadı: ${JSON.stringify(timeConflict.warnings)}`);

const certainty=report('Kesinlikle belki gelir.');
if (!rules(certainty.warnings).some(rule => /certainty|quantifier/u.test(rule))) throw new Error(`Kesinlik kapsamı bulunamadı: ${JSON.stringify(certainty.warnings)}`);

const modelReport=report('Masa kitabı içti.');
if (typeof modelReport.microModel?.acceptability !== 'number') throw new Error('Mikro model rapora bağlanmadı');
if (modelReport.semanticExternalModel !== 0 || modelReport.externalDependencies !== 0 || e.stats.externalDependencies !== 0) throw new Error('Harici çalışma zamanı bağımlılığı bulundu');

const goodSubjects=['Çocuk','Adam','Kadın','Kullanıcı','Öğrenci'];
const drinks=['suyu','çayı','kahveyi','sütü'];
const readings=['kitabı','raporu','mesajı','rehberi'];
const vehicles=['arabayı','otobüsü','kamyonu'];
let goodTotal=0;
let goodFalse=0;
for (const subject of goodSubjects) {
  for (const object of drinks) { goodTotal++; if (hasMeaningConflict(report(`${subject} ${object} içti.`))) goodFalse++; }
  for (const object of readings) { goodTotal++; if (hasMeaningConflict(report(`${subject} ${object} okudu.`))) goodFalse++; }
  for (const object of vehicles) { goodTotal++; if (hasMeaningConflict(report(`${subject} ${object} sürdü.`))) goodFalse++; }
}
if (goodFalse / goodTotal > 0.12) throw new Error(`Yanlış pozitif oranı yüksek: ${goodFalse}/${goodTotal}`);

const badSubjects=['Masa','Sandalye','Duvar','Dosya','Bilgisayar'];
let badTotal=0;
let badDetected=0;
for (const subject of badSubjects) {
  for (const verb of ['koştu','acıktı','uyudu']) { badTotal++; if (hasMeaningConflict(report(`${subject} ${verb}.`))) badDetected++; }
}
for (const subject of goodSubjects) {
  for (const object of readings) { badTotal++; if (hasMeaningConflict(report(`${subject} ${object} içti.`))) badDetected++; }
}
if (badDetected / badTotal < 0.78) throw new Error(`Anlam hata yakalama oranı düşük: ${badDetected}/${badTotal}`);

console.log(JSON.stringify({version:'2.0.0',goodTotal,goodFalse,badTotal,badDetected,entities:global.WarextEntitiesV200.size,idioms:global.WarextIdiomsV200.size,bigrams:global.WarextLmV200.bigrams,microAccuracy:global.WarextMicroModelV200.accuracy}));
