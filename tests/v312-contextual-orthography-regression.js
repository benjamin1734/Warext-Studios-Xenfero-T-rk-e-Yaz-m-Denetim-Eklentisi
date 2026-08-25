'use strict';
global.window = global;
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/lm-v200.js');
require('../upload/js/warext/turkish-spellcheck/contextual-orthography-v312.js');
require('../upload/js/warext/turkish-spellcheck/contextual-orthography-rerank-v312.js');
require('../upload/js/warext/turkish-spellcheck/contextual-orthography-guard-v312.js');

const engine = global.WarextTurkishSpellEngineV110;
if (!engine?.contextualOrthographyV312) throw new Error('V3.1.2 bağlamsal yazım motoru yüklenemedi');
if (engine.stats?.externalDependencies !== 0) throw new Error('Harici çalışma zamanı bağımlılığı bulundu');
if (engine.stats?.contextualDoubleVowelRepair !== true) throw new Error('Çift ünlü onarım katmanı etkin değil');
if (engine.stats?.genitivePossessiveRepair !== true) throw new Error('Tamlayan-tamlanan onarım katmanı etkin değil');
if (engine.stats?.contextualSuggestionReranking !== true) throw new Error('Bağlamsal öneri yeniden sıralaması etkin değil');
if (engine.stats?.contextualFalsePositiveGuard !== true) throw new Error('Bağlamsal yanlış pozitif koruması etkin değil');

const broken = engine.check('gonu',{
  previousWord:'iyi',
  before:'Selamlar, bugün nasılsın? Ben iyiyim. Dünyanın en iyi gonu',
  properNames:true,
  informal:true
});
if (broken.correct !== false || broken.suggestions?.[0] !== 'günü') {
  throw new Error(`Gerçek ortam regresyonu yakalanamadı: ${JSON.stringify(broken)}`);
}
if (broken.provider !== 'local-contextual-orthography-v312') throw new Error(`Beklenmeyen sağlayıcı: ${JSON.stringify(broken)}`);

const correct = engine.check('günü',{
  previousWord:'iyi',
  before:'Selamlar, bugün nasılsın? Ben iyiyim. Dünyanın en iyi günü',
  properNames:true,
  informal:true
});
if (correct.correct !== true) throw new Error(`Doğru “günü” yanlış işaretlendi: ${JSON.stringify(correct)}`);

const validCases = [
  ['gol','Güzel bir gol'],
  ['göl','Büyük bir göl'],
  ['kul','İnsan bir kul'],
  ['kül','Ocakta biraz kül'],
  ['son','Hikâyenin son bölümü'],
  ['sön','Işık yavaşça sön']
];
for (const [word,before] of validCases) {
  const parts = before.trim().split(/\s+/u);
  const result = engine.check(word,{previousWord:parts.length > 1 ? parts[parts.length - 2] : '',before,properNames:true,informal:true});
  if (result.correct === false && result.provider === 'local-contextual-orthography-v312') {
    throw new Error(`Bağlamsal yanlış pozitif: ${word} => ${JSON.stringify(result)}`);
  }
}

const noForcedRepair = engine.check('konu',{
  previousWord:'iyi',
  before:'Dünyanın en iyi konu',
  properNames:true,
  informal:true
});
if (noForcedRepair.provider === 'local-contextual-orthography-v312') throw new Error(`Dilbilgisi eksikliği yazım hatasına dönüştürüldü: ${JSON.stringify(noForcedRepair)}`);

const direct = engine.contextualOrthographyV312('gonu',{
  previousWord:'iyi',
  before:'Dünyanın en iyi gonu',
  properNames:true,
  informal:true
});
if (!direct || direct.suggestion !== 'günü' || direct.genitiveFrame !== true) throw new Error(`Bağlam çözümlemesi başarısız: ${JSON.stringify(direct)}`);

console.log('V3.1.2 bağlamsal çoklu-harf yazım, öneri sıralama ve yanlış pozitif koruma regresyonu başarılı.');