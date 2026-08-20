'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-v110.js');
const e = global.WarextTurkishSpellEngineV110;

function rules(result) {
  return [...(result.fixes || []),...(result.warnings || [])].map(item => item.rule);
}

function suggestions(sentence,context = {}) {
  return (e.analyzeSentence(sentence,{properNames:true,punctuation:true,longText:true,semantic:true,...context}) || []).flatMap(item => item.suggestions || []);
}

const impossibleObject = e.analyzeMeaning('Çocuk kitabı içti.');
if (!rules(impossibleObject).includes('v120-semantic-object-selection')) throw new Error(`Nesne anlam uyumsuzluğu bulunamadı: ${JSON.stringify(impossibleObject)}`);

const validObject = e.analyzeMeaning('Çocuk suyu içti.');
if (rules(validObject).includes('v120-semantic-object-selection')) throw new Error(`Doğru nesne yanlış işaretlendi: ${JSON.stringify(validObject)}`);

const impossibleSubject = e.analyzeMeaning('Masa koştu.');
if (!rules(impossibleSubject).includes('v120-semantic-subject-selection')) throw new Error(`Özne anlam uyumsuzluğu bulunamadı: ${JSON.stringify(impossibleSubject)}`);

const numberSuggestions = suggestions('3 kitaplar aldım.');
if (!numberSuggestions.includes('kitap')) throw new Error(`Sayı-çoğul düzeltmesi bulunamadı: ${JSON.stringify(numberSuggestions)}`);

const comparative = suggestions('Bu en daha güzel seçenek.');
if (!comparative.includes('en güzel') && !comparative.includes('daha güzel')) throw new Error(`Karşılaştırma yığılması bulunamadı: ${JSON.stringify(comparative)}`);

const collocation = suggestions('Ben karar yaptım.');
if (!collocation.includes('karar verdim')) throw new Error(`Eşdizim düzeltmesi bulunamadı: ${JSON.stringify(collocation)}`);

const semanticOff = e.analyzeSentence('3 kitaplar aldım.',{properNames:true,punctuation:true,semantic:false}) || [];
if (semanticOff.some(item => /^v120-semantic-/u.test(item.rule || ''))) throw new Error(`Kapalı anlam denetimi düzeltme üretti: ${JSON.stringify(semanticOff)}`);

const warning = impossibleObject.warnings.find(item => item.rule === 'v120-semantic-object-selection');
if (!warning || warning.suggestions?.length) throw new Error('Anlam uyumsuzluğu kullanıcı metnini otomatik değiştirecek biçimde üretildi');

if (e.version !== '1.2.0' || e.stats.semanticExternalModel !== 0 || e.stats.externalDependencies !== 0 || e.stats.semanticVerbFrames < 15 || e.stats.semanticLexicon < 100) throw new Error(`Anlam motoru istatistikleri geçersiz: ${JSON.stringify(e.stats)}`);
