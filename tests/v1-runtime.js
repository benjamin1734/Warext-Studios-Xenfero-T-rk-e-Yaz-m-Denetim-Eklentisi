'use strict';
global.window = global;
global.document = {getElementById:() => null};
const base = '../upload/js/warext/turkish-spellcheck/';
require(base + 'dictionary-v300.js');
require(base + 'corrections-v100.js');
require(base + 'language-core-v100.js');
require(base + 'language-morph-v100.js');
require(base + 'language-context-time-v100.js');
require(base + 'language-context-rules-v100.js');
require(base + 'language-v100.js');
const e = global.WarextTurkishSpellEngineV100;
if (!e || e.version !== '1.0.0' || e.stats.externalDependencies !== 0 || e.stats.validWords < 117000) process.exit(1);
const pairs = [['yalnış','yanlış'],['herkez','herkes'],['APIye',"API'ye"],['JSONda',"JSON'da"],['CPUya',"CPU'ya"],['Ankarada',"Ankara'da"],['geliyormusun','geliyor musun']];
for (const [input,expected] of pairs) {
  const result = e.check(input,{properNames:true,informal:true});
  if (!(result.suggestions || []).includes(expected)) throw new Error(`${input}:${JSON.stringify(result)}`);
}
for (const word of ['okuyarak','gelerek','okuyup','gördükçe','çalışırken']) if (!e.check(word,{properNames:true,informal:true}).correct) throw new Error(word);
if (!e.analyzeSentence('Sen yarın geldin.',{longText:true}).some(issue => issue.suggestions?.includes('geleceksin'))) throw new Error('temporal');
const core = require(base + 'text-core-v100.js');
const protectedText = 'v1.2.3 22:45 2026-08-19 127.0.0.1:8080 2001:db8::1 --force .env /var/www/app/config.php ${HOME} @user #etiket https://example.com';
if (core.protectedRanges(protectedText).length < 10) throw new Error('protected');
const paragraph = Array.from({length:120},(_,i) => `Bu ${i} numaralı cümledir.`).join(' ');
if (core.sentenceSegments(paragraph).length !== 120) throw new Error('segments');
console.log('Warext v1 testleri başarılı.');
