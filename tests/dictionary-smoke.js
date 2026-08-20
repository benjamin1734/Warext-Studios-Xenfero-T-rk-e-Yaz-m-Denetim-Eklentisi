'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/lexicon-v200.js');
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
const e = global.WarextTurkishSpellEngineV110;
if (!e || e.version !== '2.0.0') throw new Error(`motor sürümü: ${JSON.stringify({exists:!!e,version:e?.version})}`);
if (!e.stats || Number(e.stats.validWords || 0) < 117000 || Number(e.stats.externalDependencies) !== 0) throw new Error(`motor istatistikleri: ${JSON.stringify(e?.stats || null)}`);
if (process.env.WAREXT_FULL_BUILD === '1' && (Number(e.stats.validWords || 0) < 250000 || Number(e.stats.hunspellDerivedWords || 0) < 150000 || Number(e.stats.affixRules || 0) < 1000 || e.stats.dictionaryBuildMode !== 'lazy-bloom-affix-expansion')) throw new Error(`genişletilmiş sözlük istatistikleri: ${JSON.stringify(e.stats)}`);
const cases = [
  ['yalnış','yanlış'],['herkez','herkes'],['şöför','şoför'],['traş','tıraş'],['klavuz','kılavuz'],
  ['geliyormusun','geliyor musun'],['baktımki','baktım ki'],['kitapı','kitabı'],['renki','rengi'],['burunu','burnu'],
  ['TBMMye',"TBMM'ye"],['Ankarada',"Ankara'da"],['Türkiyede',"Türkiye'de"],['APIye',"API'ye"],['JSONda',"JSON'da"]
];
for (const [input, expected] of cases) {
  const result = e.check(input, { properNames:true, informal:true });
  if (!(result.suggestions || []).includes(expected)) throw new Error(`${input} => ${JSON.stringify(result)}`);
}
e.setCustomWords(['Vianore']);
if (!e.check('Vianore', {}).correct) throw new Error('custom dictionary');
e.setCustomProperNames(['Vianore']);
if (!(e.check('Vianoreda', { properNames:true }).suggestions || []).includes("Vianore'de")) throw new Error('custom proper name');
