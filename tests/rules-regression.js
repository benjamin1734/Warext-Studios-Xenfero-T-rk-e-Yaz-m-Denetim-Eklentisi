global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v300.js');
const e = global.WarextTurkishSpellEngineV300;
const expectRule = (text, expected) => {
  const issues = e.analyzeSentence(text, { properNames:true, punctuation:true });
  if (!issues.some(issue => (issue.suggestions || []).includes(expected))) throw new Error(`${text} => ${JSON.stringify(issues)}`);
};
expectRule('Ben yinede gelirim.', 'yine de');
expectRule('hoşgeldiniz', 'hoş geldiniz');
expectRule('2026da', "2026'da");
expectRule('bir çok kişi', 'birçok');
expectRule('hiç bir şey', 'hiçbir');
const issues = e.analyzeSentence('Ben yinede hoşgeldiniz dedim.', { properNames:true, punctuation:true });
if (issues.some(issue => issue.rule === 'subject-person-agreement' && issue.start >= 10 && issue.start < 24)) throw new Error('overlap false positive');
