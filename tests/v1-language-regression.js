'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
const e = global.WarextTurkishSpellEngineV110;
const valid = ['okuyarak','gelerek','okuyup','gördükçe','çalışırken'];
for (const word of valid) {
  const result = e.check(word, {properNames:true,informal:true});
  if (!result.correct) throw new Error(`${word} yanlış reddedildi: ${JSON.stringify(result)}`);
}
const invalidTech = [
  ['APIye',"API'ye"],['JSONda',"JSON'da"],['CPUya',"CPU'ya"],['RAMda',"RAM'da"]
];
for (const [word,expected] of invalidTech) {
  const result = e.check(word, {});
  if (result.correct || !(result.suggestions || []).includes(expected)) throw new Error(`${word}: ${JSON.stringify(result)}`);
  if (e.isValid(word)) throw new Error(`${word} geçerli sayıldı`);
}
if (!e.isValid('API') || !e.isValid('JSON') || !e.isValid('CPU')) throw new Error('teknik kısaltma kabulü');
const map = global.WarextCorrectionMapV110;
if (!(map instanceof Map) || map.size < 20) throw new Error('düzeltme haritası');
if (process.env.WAREXT_FULL_BUILD === '1' && map.size < 5000) throw new Error(`tam düzeltme veri kümesi yetersiz: ${map.size}`);
if (e.stats.externalDependencies !== 0) throw new Error('harici bağımlılık');
