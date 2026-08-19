'use strict';

const assert = require('node:assert/strict');

global.window = {};
require('../upload/js/warext/turkish-spellcheck/dictionary-v142.js');

const engine = global.window.WarextTurkishSpellEngineV142;
assert.ok(engine);

const cases = [
  ['yanlız', 'yalnız'],
  ['saol', 'sağ ol'],
  ['patate', 'patates'],
  ['tamammı', 'tamam mı'],
  ['nasilsin', 'nasılsın'],
  ['dünyanin', 'dünyanın']
];

for (const [input, expected] of cases) {
  const result = engine.check(input, {});
  assert.equal(result.correct, false, input);
  assert.ok(result.suggestions.includes(expected), `${input} → ${result.suggestions.join(' | ')}`);
}

const harmony = engine.check('mi', { previousWord: 'daha' });
assert.equal(harmony.correct, false);
assert.equal(harmony.suggestions[0], 'mı');

console.log('Sözlük smoke testleri başarılı.');
