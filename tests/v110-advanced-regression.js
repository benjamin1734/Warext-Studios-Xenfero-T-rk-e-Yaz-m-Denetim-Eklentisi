'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/context-v230.js');
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
if (!personShiftIssues.some(issue => issue.rule === 'v230-paragraph-person-continuity' && (issue.suggestions || []).includes('verdim'))) {
  throw new Error(`Kişi sürekliliği yakalanamadı: ${JSON.stringify(personShiftIssues)}`);
}
const paragraphReport = e.analyzeParagraph('Kütüphane kapalıydı çünkü o gün açık olduğu için içeri giremedik. Bu durumun nedenini daha sonra araştırdık.',{semantic:true,longText:true});
if (!paragraphReport.warnings.some(issue => issue.rule === 'v230-paragraph-causal-stack')) {
  throw new Error(`Paragraf neden-sonuç uyarısı üretilemedi: ${JSON.stringify(paragraphReport)}`);
}
if (e.stats.externalDependencies !== 0 || e.stats.compoundFinitePatterns < 3 || e.stats.expandedProperNames < 60 || e.stats.paragraphContext !== true || e.stats.nominalInflectionRules < 7) throw new Error('v110/v230 istatistikleri');
