'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/context-v230.js');
require('../upload/js/warext/turkish-spellcheck/context-tuning-v231.js');
require('../upload/js/warext/turkish-spellcheck/runtime-v240.js');
const e = global.WarextTurkishSpellEngineV110;
const validCompound = ['geliyordum','geliyormuşsun','geliyorsanız','gelmeliydim','gelseydim','gelmiştim'];
for (const word of validCompound) {
  const result = e.check(word,{properNames:true,informal:true});
  if (!result.correct) throw new Error(`${word} yanlış reddedildi: ${JSON.stringify(result)}`);
  const morphology = e.analyzeMorphology(word);
  if (!morphology?.valid || morphology.features?.person == null) throw new Error(`${word} bileşik morfoloji çözümlenemedi`);
}
const corrections = [
  ['Ben geliyordun.','geliyordum'],
  ['Sen geliyormuşum.','geliyormuşsun'],
  ['Biz geliyorsanız.','geliyorsak'],
  ['Siz geliyorduk.','geliyordunuz'],
  ['Ben gelmeliydin.','gelmeliydim'],
  ['Ben yarın görüştüm.','görüşeceğim'],
  ['geliyormusun','geliyor musun'],
  ['gelecekmiydin','gelecek miydin'],
  ['güzelsinmi','güzelsin mi'],
  ['italyada',"İtalya'da"],
  ['Almanyade',"Almanya'da"],
  ['TBMMde',"TBMM'de"]
];
for (const [input,expected] of corrections) {
  const result = input.includes(' ') || /[.!?]$/u.test(input) ? e.analyzeSentence(input,{properNames:true,punctuation:true,longText:true}) : e.check(input,{properNames:true,informal:true});
  const suggestions = Array.isArray(result) ? result.flatMap(item => item.suggestions || []) : result.suggestions || [];
  if (!suggestions.includes(expected)) throw new Error(`${input} => ${JSON.stringify(result)}`);
}
const clean = ['Ben geliyordum.','Sen geliyormuşsun.','Biz geliyorsak.','Siz geliyordunuz.','İtalya bugün güzel.'];
for (const sentence of clean) {
  const issues = e.analyzeSentence(sentence,{properNames:true,punctuation:true,longText:true});
  if (issues.some(issue => /^v110-(?:compound-person|expanded-proper)/u.test(issue.rule || ''))) throw new Error(`${sentence} yanlış pozitif: ${JSON.stringify(issues)}`);
}
const nominalValid = ['etkinliğin','kitabın','ağacın','çocuğun','rengin','evlerin'];
for (const word of nominalValid) {
  const result = e.check(word,{properNames:true,informal:true,longText:true});
  if (!result.correct || !e.isValid(word)) throw new Error(`${word} geçerli çekim olarak tanınmadı: ${JSON.stringify(result)}`);
}
const nominalInvalid = ['etkinligin','etkinlikun','kitabin'];
for (const word of nominalInvalid) {
  if (e.nominalMorphologyV230(word)?.valid) throw new Error(`${word} hatalı çekim yanlışlıkla geçerli sayıldı`);
}
const cleanParagraphSentence = 'Günün sonunda bu etkinliğin oldukça faydalı olduğunu düşündüm.';
const cleanParagraphIssues = e.analyzeSentence(cleanParagraphSentence,{properNames:true,punctuation:true,longText:true,semantic:true});
if (cleanParagraphIssues.some(issue => cleanParagraphSentence.slice(issue.start,issue.end) === 'etkinliğin' && (issue.category || 'spelling') === 'spelling')) {
  throw new Error(`etkinliğin yanlış pozitif: ${JSON.stringify(cleanParagraphIssues)}`);
}
const personShiftSentence = 'Günün sonunda bunun faydalı olduğunu düşündüm ve düzenli olarak gitmeye karar verdiler.';
const personShiftIssues = e.analyzeSentence(personShiftSentence,{properNames:true,punctuation:true,longText:true,semantic:true});
if (!personShiftIssues.some(issue => /v23[01]-paragraph-person-continuity/u.test(issue.rule || '') && (issue.suggestions || []).includes('verdim'))) {
  throw new Error(`Kişi sürekliliği yakalanamadı: ${JSON.stringify(personShiftIssues)}`);
}
const paragraphReport = e.analyzeParagraph('Kütüphane kapalıydı çünkü o gün açık olduğu için içeri giremedik. Bu durumun nedenini daha sonra araştırdık.',{semantic:true,longText:true});
if (!paragraphReport.warnings.some(issue => /v23[01]-paragraph-causal-stack|v240-paragraph-semantic-contrast/u.test(issue.rule || ''))) {
  throw new Error(`Paragraf neden-sonuç uyarısı üretilemedi: ${JSON.stringify(paragraphReport)}`);
}
const correctLongParagraph = 'Geçen hafta arkadaşlarımla kütüphaneye gittim. Kütüphanenin yerini önceden öğrendiğim için doğrudan oraya ulaştım. Günün sonunda bu etkinliğin oldukça faydalı olduğunu düşündüm ve eve döndüm.';
const correctLongReport = e.analyzeParagraph(correctLongParagraph,{semantic:true,punctuation:true,properNames:true,longText:true});
const correctLongItems = [...(correctLongReport.fixes || []),...(correctLongReport.warnings || [])];
if (correctLongItems.some(issue => correctLongParagraph.slice(issue.start,issue.end).trim() === 'etkinliğin' && (issue.category || 'spelling') === 'spelling')) {
  throw new Error(`Uzun paragrafta etkinliğin yanlış pozitif: ${JSON.stringify(correctLongItems)}`);
}
const flawedLongParagraph = 'Kütüphane kapalıydı çünkü o gün açık olduğu için içeri giremedik. Günün sonunda bunun faydalı olduğunu düşündüm. Daha sonra düzenli olarak gitmeye karar verdiler.';
const flawedLongReport = e.analyzeParagraph(flawedLongParagraph,{semantic:true,punctuation:true,properNames:true,longText:true});
const flawedLongItems = [...(flawedLongReport.fixes || []),...(flawedLongReport.warnings || [])];
if (!flawedLongItems.some(issue => /v240-paragraph-cross-sentence-person/u.test(issue.rule || '') && (issue.suggestions || []).includes('verdim'))) {
  throw new Error(`Uzun paragraf kişi sürekliliği yakalanamadı: ${JSON.stringify(flawedLongItems)}`);
}
if (!flawedLongItems.some(issue => /v23[01]-paragraph-causal-stack|v240-paragraph-semantic-contrast/u.test(issue.rule || ''))) {
  throw new Error(`Uzun paragraf anlam bağlantısı yakalanamadı: ${JSON.stringify(flawedLongItems)}`);
}
if (e.stats.externalDependencies !== 0 || e.stats.compoundFinitePatterns < 3 || e.stats.expandedProperNames < 60 || e.stats.paragraphContext !== true || e.stats.nominalInflectionRules < 7 || e.stats.contextTuningLayer !== 'v231-unicode-boundary' || e.stats.runtimeSafetyLayer !== 'v240-validity-reconcile' || e.stats.fullParagraphScan !== true) throw new Error('v110/v230/v231/v240 istatistikleri');
