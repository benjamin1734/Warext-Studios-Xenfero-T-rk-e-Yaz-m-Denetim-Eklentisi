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
require('../upload/js/warext/turkish-spellcheck/quality-v220.js');
const e = global.WarextTurkishSpellEngineV110;

function report(text,context = {}) { return e.analyzeMeaning(text,{semantic:true,...context}); }
function rules(value) { return (value?.warnings || []).map(item => String(item.rule || '')); }
function has(value,pattern) { return rules(value).some(rule => pattern.test(rule)); }

if (!global.__warextQualityV220) throw new Error('2.2 kalite katmanı yüklenmedi');
if (e.stats.qualityLayer !== 'v220-syntax-wsd-calibration') throw new Error(`2.2 kalite istatistiği eksik: ${JSON.stringify(e.stats)}`);

const language=e.disambiguateSenses('Uygulamanın dilini Türkçe yaptım.');
if (!language.some(item => item.root === 'dil' && item.sense === 'language' && item.confidence >= 0.75)) throw new Error(`Dil anlamı çözülemedi: ${JSON.stringify(language)}`);
const branch=e.disambiguateSenses('Ağaç dalı rüzgârda kırıldı.');
if (!branch.some(item => item.root === 'dal' && item.sense === 'branch')) throw new Error(`Dal anlamı çözülemedi: ${JSON.stringify(branch)}`);
const month=e.disambiguateSenses('Ocak ayında kış çok soğuktu.');
if (!month.some(item => item.root === 'ocak' && item.sense === 'month')) throw new Error(`Ocak ay anlamı çözülemedi: ${JSON.stringify(month)}`);
const stove=e.disambiguateSenses('Mutfak ocağında yemek pişiyor.');
if (!stove.some(item => item.root === 'ocak' && item.sense === 'stove')) throw new Error(`Ocak mutfak anlamı çözülemedi: ${JSON.stringify(stove)}`);

const opener=report('Sonuç olarak bunu yeniden yapmalıyız.');
if (!has(opener,/v220-punctuation-discourse-comma/u)) throw new Error(`2.2 giriş virgülü bulunamadı: ${JSON.stringify(opener.warnings)}`);
const openerOk=report('Sonuç olarak, bunu yeniden yapmalıyız.');
if (has(openerOk,/v220-punctuation-discourse-comma/u)) throw new Error(`Doğru giriş virgülü yanlış işaretlendi: ${JSON.stringify(openerOk.warnings)}`);
const formal=report('Sayın Ahmet lütfen buraya bakın.');
if (!has(formal,/v220-punctuation-formal-address-comma/u)) throw new Error(`Resmî hitap virgülü bulunamadı: ${JSON.stringify(formal.warnings)}`);
const formalOk=report('Sayın Ahmet, lütfen buraya bakın.');
if (has(formalOk,/v220-punctuation-formal-address-comma/u)) throw new Error(`Doğru resmî hitap yanlış işaretlendi: ${JSON.stringify(formalOk.warnings)}`);

const syntax=e.parseSyntaxV220('Kadın kitabı aldı ancak adam dosyayı sildi.');
if (!Array.isArray(syntax.clauses) || syntax.clauses.length < 2) throw new Error(`Yan cümlecik ayrımı çalışmadı: ${JSON.stringify(syntax)}`);
if (!Array.isArray(syntax.sentences) || !syntax.sentences.length) throw new Error(`Sözdizim raporu boş: ${JSON.stringify(syntax)}`);
if (!syntax.sentences.every(item => item.roleConfidence && Array.isArray(item.crossClause))) throw new Error(`Rol güvenleri eklenmedi: ${JSON.stringify(syntax.sentences)}`);

const good=report('Çocuk suyu içti.');
if ((good.warnings || []).some(item => /semantic|valency|subject|object|micro-model/iu.test(String(item.rule || '')) && Number(item.confidence || 0) >= 0.9)) throw new Error(`Doğal cümle yüksek güvenli yanlış pozitif üretti: ${JSON.stringify(good.warnings)}`);
const bad=report('Masa koştu.');
if (!(bad.warnings || []).some(item => /semantic|subject|selection/iu.test(String(item.rule || '')) && Number(item.confidence || 0) >= 0.85)) throw new Error(`Açık semantik hata korunamadı: ${JSON.stringify(bad.warnings)}`);

const technical=report('API_v2.2 config.json dosyasını açtım.');
if (technical.qualityV220?.externalDependencies !== 0 || e.stats.externalDependencies !== 0) throw new Error('Harici çalışma zamanı bağımlılığı bulundu');
if (!(technical.qualityV220?.technicalDensity > 0)) throw new Error(`Teknik yoğunluk ölçülmedi: ${JSON.stringify(technical.qualityV220)}`);

console.log(JSON.stringify({version:'2.2.0',wsd:1,punctuation:1,clauseAwareSyntax:1,calibration:1,externalDependencies:0}));
