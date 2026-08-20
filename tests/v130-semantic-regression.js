'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-deep-v110.js');
const e = global.WarextTurkishSpellEngineV110;

function report(text,context = {}) {
  return e.analyzeMeaning(text,{semantic:true,...context});
}

function rules(items) {
  return (items || []).map(item => item.rule || '');
}

const badSubject = report('Masa koştu.');
if (!rules(badSubject.warnings).includes('v130-semantic-subject-frame')) throw new Error(`Cansız özne uyumsuzluğu bulunamadı: ${JSON.stringify(badSubject)}`);

const badObject = report('Çocuk kitabı içti.');
if (!rules(badObject.warnings).includes('v130-semantic-object-frame')) throw new Error(`Fiil-nesne anlam uyumsuzluğu bulunamadı: ${JSON.stringify(badObject)}`);

const goodObject = report('Çocuk suyu içti.');
if (rules(goodObject.warnings).includes('v130-semantic-object-frame')) throw new Error(`Geçerli fiil-nesne ilişkisi yanlış işaretlendi: ${JSON.stringify(goodObject)}`);

const deviceSubject = report('Bilgisayar acıktı.');
if (!rules(deviceSubject.warnings).includes('v130-semantic-subject-frame')) throw new Error(`Cihaz-canlı uyumsuzluğu bulunamadı: ${JSON.stringify(deviceSubject)}`);

const collocation = e.analyzeSentence('Ben karar yapıyorum.',{semantic:true});
const collocationSuggestions = collocation.flatMap(item => item.suggestions || []);
if (!collocationSuggestions.includes('karar veriyorum')) throw new Error(`Geniş eşdizim düzeltmesi bulunamadı: ${JSON.stringify(collocation)}`);

const mouseSense = report('Bilgisayarda fareyi tıkladım.');
if (!mouseSense.senses.some(item => item.root === 'fare' && item.sense === 'mouse')) throw new Error(`Fare sözcük anlamı ayrılamadı: ${JSON.stringify(mouseSense.senses)}`);

const teaSense = report('Çayı bardakta içtim.');
if (!teaSense.senses.some(item => item.root === 'çay' && item.sense === 'drink')) throw new Error(`Çay sözcük anlamı ayrılamadı: ${JSON.stringify(teaSense.senses)}`);

const stateConflict = report('Sunucu kapalı. Sunucu açık.');
if (!rules(stateConflict.warnings).includes('v130-semantic-discourse-state-conflict')) throw new Error(`Cümleler arası durum çelişkisi bulunamadı: ${JSON.stringify(stateConflict)}`);

const explainedTransition = report('Sunucu kapalı. Ancak şimdi sunucu açık.');
if (rules(explainedTransition.warnings).includes('v130-semantic-discourse-state-conflict')) throw new Error(`Açıklanmış durum geçişi yanlış işaretlendi: ${JSON.stringify(explainedTransition)}`);

const clean = report('Çocuk kitabı okudu.');
if (rules(clean.warnings).some(rule => /^v130-semantic-(?:subject|object)-frame$/u.test(rule))) throw new Error(`Doğal cümle yanlış işaretlendi: ${JSON.stringify(clean)}`);

if (e.stats.semanticExternalModel !== 0 || e.stats.externalDependencies !== 0) throw new Error('Harici anlam bağımlılığı bulundu');
if (e.stats.semanticSenseFamilies < 15 || e.stats.semanticDeepFrames < 45 || e.stats.semanticDeepLexicon < 150) throw new Error(`Derin anlam kapsamı yetersiz: ${JSON.stringify(e.stats)}`);
