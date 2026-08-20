'use strict';
global.window = global;
if (typeof global.atob !== 'function') global.atob = value => Buffer.from(value,'base64').toString('binary');
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
const e = global.WarextTurkishSpellEngineV110;

function report(text,context = {}) { return e.analyzeMeaning(text,{semantic:true,...context}); }
function warningRules(value) { return (value?.warnings || []).map(item => String(item.rule || '')); }
function hasRule(value,pattern) { return warningRules(value).some(rule => pattern.test(rule)); }
function highSemantic(value) { return (value?.warnings || []).some(item => /semantic|valency|subject|object|micro-model/iu.test(String(item.rule || '')) && Number(item.confidence || 0) >= 0.88); }

if (!global.__warextQualityV210) throw new Error('2.1 kalite katmanı yüklenmedi');
if (e.stats.qualityLayer !== 'v210-wsd-punctuation-calibration') throw new Error(`Kalite istatistiği eksik: ${JSON.stringify(e.stats)}`);

const opener = report('Evet bunu yapabiliriz.');
if (!hasRule(opener,/v210-punctuation-opening-comma/u)) throw new Error(`Giriş virgülü bulunamadı: ${JSON.stringify(opener.warnings)}`);
const openerOk = report('Evet, bunu yapabiliriz.');
if (hasRule(openerOk,/v210-punctuation-opening-comma/u)) throw new Error(`Doğru giriş virgülü yanlış işaretlendi: ${JSON.stringify(openerOk.warnings)}`);

const vocative = report('Ahmet lütfen buraya bak.');
if (!hasRule(vocative,/v210-punctuation-vocative-comma/u)) throw new Error(`Hitap virgülü bulunamadı: ${JSON.stringify(vocative.warnings)}`);
const vocativeOk = report('Ahmet, lütfen buraya bak.');
if (hasRule(vocativeOk,/v210-punctuation-vocative-comma/u)) throw new Error(`Doğru hitap virgülü yanlış işaretlendi: ${JSON.stringify(vocativeOk.warnings)}`);

const greeting = report('Merhaba Ahmet.');
if (!hasRule(greeting,/v210-punctuation-greeting-comma/u)) throw new Error(`Selamlama virgülü bulunamadı: ${JSON.stringify(greeting.warnings)}`);

const protectedWarning = e.analyzePunctuation('Evet bunu yapabiliriz.',{protectedRanges:[{start:0,end:4}]});
if (protectedWarning.length) throw new Error(`Korunan aralıkta noktalama uyarısı üretildi: ${JSON.stringify(protectedWarning)}`);

const summer = e.disambiguateSenses('Yaz mevsimi çok sıcak geçti.');
if (!summer.some(item => item.root === 'yaz' && item.sense === 'summer' && item.confidence >= 0.75)) throw new Error(`Yaz anlamı çözülemedi: ${JSON.stringify(summer)}`);
const flower = e.disambiguateSenses('Bahçedeki gül çiçeği kırmızıydı.');
if (!flower.some(item => item.root === 'gül' && item.sense === 'flower')) throw new Error(`Gül anlamı çözülemedi: ${JSON.stringify(flower)}`);
const horse = e.disambiguateSenses('At ahırda sakin biçimde duruyor.');
if (!horse.some(item => item.root === 'at' && item.sense === 'horse')) throw new Error(`At anlamı çözülemedi: ${JSON.stringify(horse)}`);

const roles = e.rankDependencyRoles('Kadın kitabı dikkatlice okudu.');
if (!Array.isArray(roles) || !roles.length || !Array.isArray(roles[0].roles) || !roles[0].roles.length) throw new Error(`Rol sıralama çalışmadı: ${JSON.stringify(roles)}`);

const good = report('Çocuk suyu içti.');
if (highSemantic(good)) throw new Error(`Doğal cümle yüksek güvenle yanlış işaretlendi: ${JSON.stringify(good.warnings)}`);
const bad = report('Masa koştu.');
if (!highSemantic(bad)) throw new Error(`Açık anlam uyumsuzluğu yüksek güvenle bulunamadı: ${JSON.stringify(bad.warnings)}`);

const quality = e.analyzeQuality('API_v2.1 dosyasını kontrol ettim ve yaz mevsimi sıcak geçti.');
if (quality.externalDependencies !== 0 || e.stats.externalDependencies !== 0) throw new Error('Harici bağımlılık tespit edildi');
if (!(quality.technicalDensity > 0)) throw new Error(`Teknik yoğunluk ölçülmedi: ${JSON.stringify(quality)}`);
if (!quality.senses.some(item => item.root === 'yaz' && item.sense === 'summer')) throw new Error(`Kalite raporunda WSD eksik: ${JSON.stringify(quality.senses)}`);

console.log(JSON.stringify({version:'2.1.0',punctuation:1,wsd:1,dependencyRanking:1,confidenceCalibration:1,externalDependencies:0}));
