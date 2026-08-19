'use strict';

const assert = require('node:assert/strict');

require('../upload/js/warext/turkish-spellcheck/dictionary-v160.js');
require('../upload/js/warext/turkish-spellcheck/rules-v160.js');

const rules = globalThis.WarextTurkishRulesV160;
assert.ok(rules);

function analyze(text,options = {}) {
  return rules.analyze(text,{caret:text.length,changedStart:0,changedEnd:text.length,options:{grammar:true,punctuation:true,underline:true,properNames:true,informal:true,maxIssues:80,...options}}).issues;
}

function hasSuggestion(text,suggestion,options = {}) {
  const issues = analyze(text,options);
  assert.ok(issues.some(issue => issue.suggestions.includes(suggestion)),`${text} → ${issues.map(issue => issue.suggestions.join('|')).join(' / ')}`);
}

hasSuggestion('bugün dünyan en güzel günü','Bugün');
hasSuggestion('bugün dünyan en güzel günü','dünyanın');
hasSuggestion('bugün dünyan en güzel günü','.');
hasSuggestion('daha mi','mı');
hasSuggestion('bende geliyorum','ben de');
hasSuggestion('biliyorumki geleceksin','biliyorum ki');
hasSuggestion('Ankaraya gidiyorum',"Ankara'ya");
hasSuggestion('Türkiyenin başkenti Ankara',"Türkiye'nin");
hasSuggestion('merhaba,nasılsın','merhaba, nasılsın');
hasSuggestion('merhaba  nasılsın',' ');
hasSuggestion('Merhaba (nasılsın',')');
hasSuggestion('bir çok insan geldi.','birçok');
hasSuggestion('ama fakat gelmedi.','ama');
hasSuggestion('güzeldimi','Güzel miydi');

const afterPunctuationText = 'Bugün dünyan en güzel günü değil mi?';
const afterPunctuation = rules.analyze(afterPunctuationText,{caret:afterPunctuationText.length,changedStart:afterPunctuationText.length,changedEnd:afterPunctuationText.length,options:{grammar:true,punctuation:true,underline:true,properNames:true,informal:true,maxIssues:80}}).issues;
assert.ok(afterPunctuation.some(issue => issue.suggestions.includes('dünyanın')),JSON.stringify(afterPunctuation));

const correct = analyze('Evde kaldım.');
assert.ok(!correct.some(issue => issue.rule === 'conjunction-de-da'),JSON.stringify(correct));

const title = analyze('Yeni konu başlığı',{isTitle:true});
assert.ok(!title.some(issue => issue.rule === 'sentence-terminal-punctuation'));

const custom = analyze('Warextözel kullanıyorum.',{userWords:['warextözel']});
assert.ok(!custom.some(issue => String(issue.word || '').toLocaleLowerCase('tr-TR') === 'warextözel'));

const ignored = analyze('yanlız geldim.',{ignoredWords:['yanlız']});
assert.ok(!ignored.some(issue => String(issue.word || '').toLocaleLowerCase('tr-TR') === 'yanlız'));

console.log('Cümle ve bağlam regresyon testleri başarılı.');
