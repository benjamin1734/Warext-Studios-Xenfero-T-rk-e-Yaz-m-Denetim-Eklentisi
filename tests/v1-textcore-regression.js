'use strict';
global.window = global;
const core = require('../upload/js/warext/turkish-spellcheck/text-core-v110.js');
if (!core || core.VERSION !== '1.1.0') throw new Error('text core');
const protectedText = 'v1.2.3 22:45 2026-08-19 127.0.0.1:8080 2001:db8::1 --force .env /var/www/app/config.php ${HOME} @user #etiket https://example.com/test 550e8400-e29b-41d4-a716-446655440000';
const ranges = core.protectedRanges(protectedText);
const kinds = new Set(ranges.flatMap(range => String(range.kind || '').split('|')));
if (ranges.length < 12) throw new Error(`koruma sayısı: ${ranges.length}`);
for (const token of ['v1.2.3','22:45','2026-08-19','127.0.0.1:8080','2001:db8::1','--force','.env','/var/www/app/config.php','${HOME}','@user','#etiket','https://example.com/test','550e8400-e29b-41d4-a716-446655440000']) {
  const start = protectedText.indexOf(token);
  if (start < 0 || !core.isProtected(ranges,start,start + token.length)) throw new Error(`korunmadı: ${token}`);
}
const segmented = core.sentenceSegments('Dr. Ahmet geldi. Sürüm v1.2.3 hazır. Saat 22:45. Son cümle.');
if (segmented.length !== 4) throw new Error(`cümle sayısı: ${segmented.length}`);
const large = Array.from({length:180},(_,i) => `Bu ${i} numaralı cümledir ve uzun metin yerel olarak parça parça incelenir.`).join(' ');
if (large.length < 10000) throw new Error('uzun metin kısa');
const parts = core.sentenceSegments(large);
if (parts.length !== 180) throw new Error(`uzun metin cümle sayısı: ${parts.length}`);
const changed = large.replace('Bu 90 numaralı','Bu doksan numaralı');
const before = parts.map((_,i) => core.cacheKey(parts,i,'11111'));
const afterParts = core.sentenceSegments(changed);
const after = afterParts.map((_,i) => core.cacheKey(afterParts,i,'11111'));
let changedKeys = 0;
for (let i = 0; i < Math.min(before.length,after.length); i++) if (before[i] !== after[i]) changedKeys++;
if (changedKeys < 1 || changedKeys > 3) throw new Error(`önbellek kapsamı: ${changedKeys}`);
