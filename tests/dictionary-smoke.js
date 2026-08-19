'use strict';

const assert = require('node:assert/strict');

require('../upload/js/warext/turkish-spellcheck/dictionary-v160.js');

const engine = globalThis.WarextTurkishSpellEngineV160;
assert.ok(engine);

const cases = [
  ['yanlız','yalnız'],
  ['saol','sağ ol'],
  ['patate','patates'],
  ['tamammı','tamam mı'],
  ['nasilsin','nasılsın'],
  ['dünyanin','dünyanın'],
  ['gelecekmisin','gelecek misin'],
  ['güzeldimi','güzel miydi'],
  ['yapacakmıydınız','yapacak mıydınız']
];

for (const [input,expected] of cases) {
  const result = engine.check(input,{});
  assert.equal(result.correct,false,input);
  assert.ok(result.suggestions.includes(expected),`${input} → ${result.suggestions.join(' | ')}`);
}

for (const word of ['ekonomi','resmi','nasılsın','dünyanın','evde','kaldım']) {
  assert.equal(engine.check(word,{}).correct,true,word);
}

const harmony = engine.check('mi',{previousWord:'daha'});
assert.equal(harmony.correct,false);
assert.equal(harmony.suggestions[0],'mı');

engine.setRuntimeLexicon({userWords:['warextözel']});
assert.equal(engine.check('warextözel',{}).correct,true);

console.log('Sözlük smoke testleri başarılı.');
