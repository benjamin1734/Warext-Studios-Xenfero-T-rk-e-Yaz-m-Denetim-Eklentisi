'use strict';
global.window=global;
if(typeof global.atob!=='function')global.atob=value=>Buffer.from(value,'base64').toString('binary');
require('../upload/js/warext/turkish-spellcheck/lexicon-v200.js');
require('../upload/js/warext/turkish-spellcheck/dictionary-v110.js');
require('../upload/js/warext/turkish-spellcheck/corrections-v110.js');
require('../upload/js/warext/turkish-spellcheck/language-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-deep-v110.js');
require('../upload/js/warext/turkish-spellcheck/semantic-context-v110.js');
require('../upload/js/warext/turkish-spellcheck/entities-v200.js');
require('../upload/js/warext/turkish-spellcheck/idioms-v200.js');
require('../upload/js/warext/turkish-spellcheck/lm-v200.js');
require('../upload/js/warext/turkish-spellcheck/micro-model-v200.js');
require('../upload/js/warext/turkish-spellcheck/knowledge-v200.js');
require('../upload/js/warext/turkish-spellcheck/micro-integration-v200.js');
require('../upload/js/warext/turkish-spellcheck/quality-v210.js');
require('../upload/js/warext/turkish-spellcheck/quality-v220.js');
require('../upload/js/warext/turkish-spellcheck/syntax-v220.js');
require('../upload/js/warext/turkish-spellcheck/syntax-tuning-v220.js');
const e=global.WarextTurkishSpellEngineV110;
const samples=['Bu da zaman ister, emek ister.','İki veli dokunulsa ağlayacaktı.','Oluşan kabarcıklar patlatılmaz.','Stadın ışıkları söndü.','Türkiye, istikrar içinde, güven içinde büyüyor, kalkınıyor.','Çağırdım Genelkurmay Başkanı\'nı.','Herkes öyle ya da böyle içinde bir şekilde bir şeylere dair mutlaka bir umut taşır.','- Hayır, demiş çocuk.'];
for(const text of samples){
  const words=text.match(/[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+(?:['’][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]+)?/gu)||[];
  const morphology=words.map(word=>({word,m:e.analyzeMorphology(word)}));
  console.log(JSON.stringify({text,morphology,syntax:e.parseSyntaxV220(text)}));
}
