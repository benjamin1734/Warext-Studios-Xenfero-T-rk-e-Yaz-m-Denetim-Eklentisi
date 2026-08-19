global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v300.js');
const e = global.WarextTurkishSpellEngineV300;
if (!e || e.version !== '3.0.0') process.exit(1);
if (!e.stats || e.stats.validWords < 117000 || e.stats.externalDependencies !== 0) process.exit(1);
const cases = [
  ['yalnış','yanlış'],['herkez','herkes'],['şöför','şoför'],['traş','tıraş'],['klavuz','kılavuz'],
  ['geliyormusun','geliyor musun'],['baktımki','baktım ki'],['kitapı','kitabı'],['renki','rengi'],['burunu','burnu'],
  ['TBMMye',"TBMM'ye"],['Ankarada',"Ankara'da"],['Türkiyede',"Türkiye'de"]
];
for (const [input, expected] of cases) {
  const result = e.check(input, { properNames:true, informal:true });
  if (!(result.suggestions || []).includes(expected)) throw new Error(`${input} => ${JSON.stringify(result)}`);
}
e.setCustomWords(['Vianore']);
if (!e.check('Vianore', {}).correct) throw new Error('custom dictionary');
e.setCustomProperNames(['Vianore']);
if (!(e.check('Vianoreda', { properNames:true }).suggestions || []).includes("Vianore'de")) throw new Error('custom proper name');
