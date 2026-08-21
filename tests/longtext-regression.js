'use strict';

const assert = require('node:assert/strict');
global.window = global;
const core = require('../upload/js/warext/turkish-spellcheck/text-core-v110.js');

assert.equal(core.VERSION, '1.1.0');

const protectedText = 'Merhaba. [CODE]const x = "yanlıs";[/CODE] Sonra devam ettim. https://example.com/test Yanlıs yazdım.';
const protectedRanges = core.protectedRanges(protectedText);
assert.ok(protectedRanges.length >= 2);
const segments = core.sentenceSegments(protectedText, protectedRanges);
assert.ok(segments.length >= 3);
assert.ok(segments.some(segment => segment.text.includes('[CODE]')));

const masked = core.maskText(protectedText, protectedRanges);
assert.equal(masked.length, protectedText.length);
assert.ok(masked.includes('\uE000'));

const change = core.changedRange('Bugün hava güzel. Yarın giderim.', 'Bugün hava çok güzel. Yarın giderim.');
assert.ok(change.newEnd > change.start);
assert.equal(change.delta, 4);

const longSentence = `${'kelime '.repeat(700)}bitti`;
const longSegments = core.sentenceSegments(longSentence, [], 1800);
assert.ok(longSegments.length >= 3);
assert.ok(longSegments.every(segment => segment.end - segment.start <= 1800));

const paragraphText = Array.from({length:120}, (_, index) => `Bu ${index} numaralı cümledir ve uzun metin taramasını sınamak için hazırlanmıştır.`).join(' ');
const paragraphSegments = core.sentenceSegments(paragraphText);
assert.equal(paragraphSegments.length, 120);
assert.ok(paragraphText.length > 8000);

const keysBefore = paragraphSegments.map((_, index) => core.cacheKey(paragraphSegments, index, '1111'));
const changedParagraph = paragraphText.replace('Bu 60 numaralı', 'Bu altmış numaralı');
const changedSegments = core.sentenceSegments(changedParagraph);
const keysAfter = changedSegments.map((_, index) => core.cacheKey(changedSegments, index, '1111'));
let changedKeys = 0;
for (let i = 0; i < Math.min(keysBefore.length, keysAfter.length); i++) {
  if (keysBefore[i] !== keysAfter[i]) changedKeys++;
}
assert.ok(changedKeys <= 3);
assert.ok(changedKeys >= 1);

const tokenText = 'Bugün Warext ile çok uzun bir metni deniyoruz.';
const tokenList = core.tokens(tokenText);
assert.ok(tokenList.some(token => token.word === 'Warext'));
assert.ok(tokenList.some(token => token.word === 'deniyoruz'));

const paragraphs = core.paragraphSegments('Birinci paragraf.\n\nİkinci paragraf.\n\nÜçüncü paragraf.');
assert.equal(paragraphs.length, 3);

console.log('Uzun metin regresyon testleri başarılı.');
