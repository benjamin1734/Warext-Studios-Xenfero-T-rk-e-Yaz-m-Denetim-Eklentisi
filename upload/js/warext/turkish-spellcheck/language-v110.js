(() => {
  'use strict';

  if (window.__warextLanguageV110) return;
  window.__warextLanguageV110 = true;

  const engine = window.WarextTurkishSpellEngineV110 || window.WarextTurkishSpellEngineV300;
  if (!engine?.check || !engine?.analyzeSentence || !engine?.isValid) return;

  const VERSION = '2.0.0';
  const baseCheck = engine.check.bind(engine);
  const baseAnalyzeSentence = engine.analyzeSentence.bind(engine);
  const baseIsValid = engine.isValid.bind(engine);
  const baseSuggest = typeof engine.suggest === 'function' ? engine.suggest.bind(engine) : null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const normalizeTech = value => String(value || '').replace(/İ/g,'i').replace(/I/g,'i').toLocaleLowerCase('tr-TR').trim();
  const chars = value => Array.from(String(value || ''));
  const VOWELS = 'aeıioöuü';
  const VOICELESS = 'çfhkpsşt';
  const LETTER_CLASS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';

  function lastVowel(word) {
    const value = normalize(word);
    for (let i = value.length - 1; i >= 0; i--) if (VOWELS.includes(value[i])) return value[i];
    return '';
  }

  function harmony4(word) {
    const vowel = lastVowel(word);
    if ('aı'.includes(vowel)) return 'ı';
    if ('ei'.includes(vowel)) return 'i';
    if ('ou'.includes(vowel)) return 'u';
    if ('öü'.includes(vowel)) return 'ü';
    return '';
  }

  function harmony2(word) {
    const vowel = lastVowel(word);
    if ('aıou'.includes(vowel)) return 'a';
    if ('eiöü'.includes(vowel)) return 'e';
    return '';
  }

  function lastChar(word) {
    const list = chars(word);
    return list[list.length - 1] || '';
  }

  function capitalize(value) {
    const list = chars(value);
    if (!list.length) return value;
    const first = list[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR');
    return first + list.slice(1).join('');
  }

  function preserveCase(source, replacement) {
    if (!source || !replacement) return replacement;
    return source[0] !== normalize(source[0]) ? capitalize(replacement) : replacement;
  }

  const TECH_ABBREVIATIONS = new Map([
    ['api',{canonical:'API',spoken:'api'}],['json',{canonical:'JSON',spoken:'ceyson'}],['xml',{canonical:'XML',spoken:'iksemel'}],
    ['html',{canonical:'HTML',spoken:'haştemel'}],['css',{canonical:'CSS',spoken:'sesese'}],['js',{canonical:'JS',spoken:'ceyes'}],
    ['ts',{canonical:'TS',spoken:'tiyes'}],['sql',{canonical:'SQL',spoken:'sekuel'}],['php',{canonical:'PHP',spoken:'pehepe'}],
    ['cpu',{canonical:'CPU',spoken:'sipiyu'}],['gpu',{canonical:'GPU',spoken:'cipiyu'}],['ram',{canonical:'RAM',spoken:'ram'}],
    ['ssd',{canonical:'SSD',spoken:'esesdi'}],['hdd',{canonical:'HDD',spoken:'haşdidi'}],['dns',{canonical:'DNS',spoken:'dienes'}],
    ['http',{canonical:'HTTP',spoken:'haşti ti pi'}],['https',{canonical:'HTTPS',spoken:'haşti ti pies'}],['ssh',{canonical:'SSH',spoken:'eseşeyç'}],
    ['ftp',{canonical:'FTP',spoken:'eftepe'}],['url',{canonical:'URL',spoken:'yurel'}],['uri',{canonical:'URI',spoken:'yuri'}],
    ['uuid',{canonical:'UUID',spoken:'yuuid'}],['ip',{canonical:'IP',spoken:'aypi'}],['tcp',{canonical:'TCP',spoken:'tisipi'}],
    ['udp',{canonical:'UDP',spoken:'yudipi'}],['tls',{canonical:'TLS',spoken:'tieles'}],['ssl',{canonical:'SSL',spoken:'esesel'}],
    ['cdn',{canonical:'CDN',spoken:'sidien'}],['cli',{canonical:'CLI',spoken:'sielay'}],['gui',{canonical:'GUI',spoken:'gui'}],
    ['ide',{canonical:'IDE',spoken:'ide'}],['sdk',{canonical:'SDK',spoken:'esdike'}],['jwt',{canonical:'JWT',spoken:'ceydablıuti'}],
    ['oauth',{canonical:'OAuth',spoken:'oaut'}],['rest',{canonical:'REST',spoken:'rest'}],['graphql',{canonical:'GraphQL',spoken:'grafkyuel'}],
    ['mysql',{canonical:'MySQL',spoken:'maysikuel'}],['mariadb',{canonical:'MariaDB',spoken:'mariadibi'}],['redis',{canonical:'Redis',spoken:'redis'}],
    ['nginx',{canonical:'Nginx',spoken:'encineks'}],['apache',{canonical:'Apache',spoken:'apaçi'}],['linux',{canonical:'Linux',spoken:'linuks'}],
    ['android',{canonical:'Android',spoken:'android'}],['ios',{canonical:'iOS',spoken:'ayos'}],['github',{canonical:'GitHub',spoken:'githab'}],
    ['gitlab',{canonical:'GitLab',spoken:'gitlab'}],['xenforo',{canonical:'XenForo',spoken:'zenforo'}],['minecraft',{canonical:'Minecraft',spoken:'maynkraft'}]
  ]);
  const TECH_KEYS = [...TECH_ABBREVIATIONS.keys()].sort((a,b) => b.length - a.length);
  const AMBIGUOUS_TECH = new Set(['ram','ip','rest']);
  const correctionMap = () => window.WarextCorrectionMapV110 instanceof Map ? window.WarextCorrectionMapV110 : null;

  function suffixFor(spoken, observed) {
    const h2 = harmony2(spoken);
    const h4 = harmony4(spoken);
    if (!h2 || !h4) return '';
    const vowelEnd = VOWELS.includes(lastChar(normalize(spoken)));
    const lead = VOICELESS.includes(lastChar(normalize(spoken))) ? 't' : 'd';
    if (/^(?:da|de|ta|te)$/u.test(observed)) return `${lead}${h2}`;
    if (/^(?:dan|den|tan|ten)$/u.test(observed)) return `${lead}${h2}n`;
    if (/^(?:a|e|ya|ye)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}${h2}`;
    if (/^(?:ı|i|u|ü|yı|yi|yu|yü)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}${h4}`;
    if (/^(?:ın|in|un|ün|nın|nin|nun|nün)$/u.test(observed)) return `${vowelEnd ? 'n' : ''}${h4}n`;
    if (/^(?:la|le|yla|yle)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}l${h2}`;
    if (/^(?:dır|dir|dur|dür|tır|tir|tur|tür)$/u.test(observed)) return `${lead}${h4}r`;
    return '';
  }

  function techSuggestion(rawToken) {
    const raw = String(rawToken || '').trim();
    if (!raw) return '';
    const apostropheMatch = raw.match(/^([^'’]+)['’]([^'’]+)$/u);
    if (apostropheMatch) {
      const key = normalizeTech(apostropheMatch[1]);
      const item = TECH_ABBREVIATIONS.get(key);
      if (!item) return '';
      const corrected = suffixFor(item.spoken.replace(/\s+/gu,''), normalize(apostropheMatch[2]));
      if (!corrected) return '';
      const candidate = `${item.canonical}'${corrected}`;
      return candidate !== raw ? candidate : '';
    }
    const word = normalizeTech(raw);
    const exact = TECH_ABBREVIATIONS.get(word);
    if (exact) {
      if (AMBIGUOUS_TECH.has(word) && raw === raw.toLocaleLowerCase('tr-TR')) return '';
      return raw === exact.canonical ? '' : exact.canonical;
    }
    for (const key of TECH_KEYS) {
      if (!word.startsWith(key) || word.length <= key.length) continue;
      const item = TECH_ABBREVIATIONS.get(key);
      const suffix = normalize(raw.slice(key.length));
      const corrected = suffixFor(item.spoken.replace(/\s+/gu,''), suffix);
      if (!corrected) continue;
      if (AMBIGUOUS_TECH.has(key) && raw[0] === normalize(raw[0])) continue;
      return `${item.canonical}'${corrected}`;
    }
    return '';
  }

  const COMMON_FREQUENCY = [
    'bir','bu','ve','için','ile','de','da','çok','daha','gibi','ama','sonra','kadar','olan','olarak','ben','sen','biz','siz','o','şu',
    'ne','neden','nasıl','hangi','her','hiç','şey','var','yok','değil','mi','mı','mu','mü','bugün','yarın','dün','şimdi','zaman','gün',
    'iyi','güzel','büyük','küçük','yeni','eski','doğru','yanlış','aynı','farklı','ilk','son','tüm','bütün','bazı','sadece','bile','yine',
    'gelmek','gitmek','yapmak','olmak','almak','vermek','görmek','bilmek','istemek','demek','söylemek','yazmak','okumak','çalışmak',
    'geliyorum','gidiyorum','yapıyorum','oluyor','istiyorum','biliyorum','merhaba','teşekkürler','tamam','herkes','yalnız','yanlış','çünkü',
    'forum','mesaj','konu','kullanıcı','sistem','eklenti','sunucu','dosya','kod','veri','hata','özellik','ayar','sayfa','site','oyun'
  ];
  const FREQUENCY = new Map(COMMON_FREQUENCY.map((word,index) => [normalize(word), COMMON_FREQUENCY.length - index]));
  const KEYBOARD_NEIGHBORS = new Map([
    ['q','wa'],['w','qase'],['e','wsdr'],['r','edft'],['t','rfgy'],['y','tghu'],['u','yhji'],['ı','ujko'],['o','ıkpl'],['p','olğ'],['ğ','püş'],['ü','ğ'],
    ['a','qwsz'],['s','awedxz'],['d','serfc'],['f','drtgv'],['g','ftyhb'],['h','gyujn'],['j','huıkm'],['k','jıol'],['l','kopş'],['ş','lpği'],['i','şü'],
    ['z','asx'],['x','zsdc'],['c','xdfv'],['v','cfgb'],['b','vghn'],['n','bhjm'],['m','njk'],['ç','m'],
  ]);

  function keyboardDistance(a, b) {
    const A = chars(normalize(a));
    const B = chars(normalize(b));
    const n = A.length;
    const m = B.length;
    let prev = Array.from({length:m + 1},(_,i) => i);
    for (let i = 1; i <= n; i++) {
      const cur = [i];
      for (let j = 1; j <= m; j++) {
        const same = A[i - 1] === B[j - 1];
        const neighbor = KEYBOARD_NEIGHBORS.get(A[i - 1])?.includes(B[j - 1]);
        const cost = same ? 0 : neighbor ? 0.55 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[m];
  }

  function rankSuggestions(word, suggestions) {
    const unique = [...new Set((suggestions || []).filter(Boolean))];
    return unique.map((candidate,index) => {
      const normalized = normalize(candidate.replace(/\s+/gu,''));
      const freq = FREQUENCY.get(normalize(candidate)) || 0;
      const dist = keyboardDistance(word, normalized);
      const prefix = normalize(candidate)[0] === normalize(word)[0] ? 1 : 0;
      const score = dist * 100 - freq * 2.4 - prefix * 8 + index * 2;
      return [score,candidate];
    }).sort((a,b) => a[0] - b[0] || a[1].localeCompare(b[1],'tr-TR')).map(item => item[1]).slice(0,3);
  }

  function rootLooksVerb(root) {
    if (!root || chars(root).length < 2) return false;
    const h2 = harmony2(root);
    if (h2 && baseIsValid(`${root}m${h2}k`)) return true;
    if (baseIsValid(`${root}mak`) || baseIsValid(`${root}mek`)) return true;
    return baseIsValid(root);
  }

  function validateGerundStem(stem, suffix) {
    if (!stem) return false;
    const h2 = harmony2(stem);
    const h4 = harmony4(stem);
    const vowelEnd = VOWELS.includes(lastChar(stem));
    const d = VOICELESS.includes(lastChar(stem)) ? 't' : 'd';
    if (/^(?:y?arak|y?erek)$/u.test(suffix)) return suffix === `${vowelEnd ? 'y' : ''}${h2}r${h2}k`;
    if (/^(?:y?ınca|y?ince|y?unca|y?ünce)$/u.test(suffix)) return suffix === `${vowelEnd ? 'y' : ''}${h4}nc${h2}`;
    if (/^(?:y?ıp|y?ip|y?up|y?üp)$/u.test(suffix)) return suffix === `${vowelEnd ? 'y' : ''}${h4}p`;
    if (/^(?:madan|meden)$/u.test(suffix)) return suffix === `m${h2}d${h2}n`;
    if (/^(?:dıkça|dikçe|dukça|dükçe|tıkça|tikçe|tukça|tükçe)$/u.test(suffix)) return suffix === `${d}${h4}kç${h2}`;
    if (/^(?:alı|eli)$/u.test(suffix)) return suffix === `${h2}l${h4}`;
    if (/^(?:maksızın|meksizin)$/u.test(suffix)) return suffix === `m${h2}ks${h4}z${h4}n`;
    return suffix === 'ken';
  }

  const GERUND_SUFFIXES = ['maksızın','meksizin','yarak','yerek','arak','erek','yınca','yince','yunca','yünce','ınca','ince','unca','ünce','madan','meden','dıkça','dikçe','dukça','dükçe','tıkça','tikçe','tukça','tükçe','yıp','yip','yup','yüp','ıp','ip','up','üp','alı','eli','ken'].sort((a,b) => b.length - a.length);
  const VOICE_SUFFIXES = ['dır','dir','dur','dür','tır','tir','tur','tür','abil','ebil','ıl','il','ul','ül','ış','iş','uş','üş','ın','in','un','ün','n','ma','me'].sort((a,b) => b.length - a.length);

  function validateVoice(stem, suffix) {
    const h2 = harmony2(stem);
    const h4 = harmony4(stem);
    if (!h2 || !h4) return false;
    if (suffix === 'abil' || suffix === 'ebil') return suffix === `${h2 === 'a' ? 'a' : 'e'}bil`;
    if (/^[ıiuü]l$/u.test(suffix)) return suffix === `${h4}l`;
    if (/^[ıiuü]ş$/u.test(suffix)) return suffix === `${h4}ş`;
    if (/^[ıiuü]n$/u.test(suffix)) return suffix === `${h4}n`;
    if (suffix === 'n') return VOWELS.includes(lastChar(stem));
    if (suffix === 'ma' || suffix === 'me') return suffix === `m${h2}`;
    if (/^[dt][ıiuü]r$/u.test(suffix)) {
      const lead = VOICELESS.includes(lastChar(stem)) ? 't' : 'd';
      return suffix === `${lead}${h4}r`;
    }
    return false;
  }

  function peelVoice(stem, depth = 0) {
    if (rootLooksVerb(stem)) return {valid:true,root:stem,depth};
    if (depth >= 4 || chars(stem).length < 4) return null;
    for (const suffix of VOICE_SUFFIXES) {
      if (!stem.endsWith(suffix) || chars(stem).length <= chars(suffix).length + 1) continue;
      const base = stem.slice(0, -suffix.length);
      if (!validateVoice(base, suffix)) continue;
      const found = peelVoice(base, depth + 1);
      if (found) return {valid:true,root:found.root,depth:found.depth,voice:[suffix,...(found.voice || [])]};
    }
    return null;
  }

  function extendedMorphology(rawWord) {
    const word = normalize(rawWord);
    if (!word || chars(word).length < 4 || chars(word).length > 64) return null;
    for (const suffix of GERUND_SUFFIXES) {
      if (!word.endsWith(suffix) || chars(word).length <= chars(suffix).length + 1) continue;
      let stem = word.slice(0, -suffix.length);
      if (!validateGerundStem(stem, suffix)) continue;
      if (suffix === 'ken' && baseIsValid(stem)) return {valid:true,root:stem,kind:'gerund',suffix};
      const voice = peelVoice(stem);
      if (voice) return {valid:true,root:voice.root,kind:'gerund',suffix,voice:voice.voice || []};
    }
    const NOMINAL = [
      ['sal','sel'],['daş','deş'],['taş','teş'],['msı','msi','msu','msü'],['ımsı','imsi','umsu','ümsü'],
      ['cık','cik','cuk','cük','çık','çik','çuk','çük'],['gil'],['vari']
    ];
    for (const group of NOMINAL) {
      for (const suffix of group) {
        if (!word.endsWith(suffix) || chars(word).length <= chars(suffix).length + 2) continue;
        const stem = word.slice(0, -suffix.length);
        if (!baseIsValid(stem)) continue;
        const h2 = harmony2(stem);
        const h4 = harmony4(stem);
        let valid = false;
        if (suffix === 'sal' || suffix === 'sel') valid = suffix === `s${h2}l`;
        else if (['daş','deş','taş','teş'].includes(suffix)) valid = suffix[1] === h2;
        else if (/^[ıiuü]?ms[ıiuü]$/u.test(suffix)) valid = suffix.endsWith(h4);
        else if (/^[cç][ıiuü]k$/u.test(suffix)) valid = suffix.endsWith(`${h4}k`);
        else valid = true;
        if (valid) return {valid:true,root:stem,kind:'derivation',suffix};
      }
    }
    return null;
  }

  const TEMPORAL = [
    [['gittim','gittin','gittik','gittiniz'],['gideceğim','gideceksin','gideceğiz','gideceksiniz']],
    [['geldim','geldin','geldik','geldiniz'],['geleceğim','geleceksin','geleceğiz','geleceksiniz']],
    [['yaptım','yaptın','yaptık','yaptınız'],['yapacağım','yapacaksın','yapacağız','yapacaksınız']],
    [['aldım','aldın','aldık','aldınız'],['alacağım','alacaksın','alacağız','alacaksınız']],
    [['verdim','verdin','verdik','verdiniz'],['vereceğim','vereceksin','vereceğiz','vereceksiniz']],
    [['yazdım','yazdın','yazdık','yazdınız'],['yazacağım','yazacaksın','yazacağız','yazacaksınız']],
    [['okudum','okudun','okuduk','okudunuz'],['okuyacağım','okuyacaksın','okuyacağız','okuyacaksınız']],
    [['çalıştım','çalıştın','çalıştık','çalıştınız'],['çalışacağım','çalışacaksın','çalışacağız','çalışacaksınız']],
    [['gördüm','gördün','gördük','gördünüz'],['göreceğim','göreceksin','göreceğiz','göreceksiniz']],
    [['baktım','baktın','baktık','baktınız'],['bakacağım','bakacaksın','bakacağız','bakacaksınız']],
    [['konuştum','konuştun','konuştuk','konuştunuz'],['konuşacağım','konuşacaksın','konuşacağız','konuşacaksınız']],
    [['başladım','başladın','başladık','başladınız'],['başlayacağım','başlayacaksın','başlayacağız','başlayacaksınız']],
    [['bitirdim','bitirdin','bitirdik','bitirdiniz'],['bitireceğim','bitireceksin','bitireceğiz','bitireceksiniz']],
    [['gönderdim','gönderdin','gönderdik','gönderdiniz'],['göndereceğim','göndereceksin','göndereceğiz','göndereceksiniz']],
    [['döndüm','döndün','döndük','döndünüz'],['döneceğim','döneceksin','döneceğiz','döneceksiniz']],
    [['çıktım','çıktın','çıktık','çıktınız'],['çıkacağım','çıkacaksın','çıkacağız','çıkacaksınız']],
    [['girdim','girdin','girdik','girdiniz'],['gireceğim','gireceksin','gireceğiz','gireceksiniz']],
    [['kaldım','kaldın','kaldık','kaldınız'],['kalacağım','kalacaksın','kalacağız','kalacaksınız']],
    [['sordum','sordun','sorduk','sordunuz'],['soracağım','soracaksın','soracağız','soracaksınız']],
    [['bekledim','bekledin','bekledik','beklediniz'],['bekleyeceğim','bekleyeceksin','bekleyeceğiz','bekleyeceksiniz']],
    [['denedim','denedin','denedik','denediniz'],['deneyeceğim','deneyeceksin','deneyeceğiz','deneyeceksiniz']],
    [['oynadım','oynadın','oynadık','oynadınız'],['oynayacağım','oynayacaksın','oynayacağız','oynayacaksınız']],
    [['hazırladım','hazırladın','hazırladık','hazırladınız'],['hazırlayacağım','hazırlayacaksın','hazırlayacağız','hazırlayacaksınız']]
  ];
  const SUBJECT_INDEX = {ben:0,sen:1,biz:2,siz:3};

  function temporalIssues(text) {
    const normalized = normalize(text);
    const tomorrow = /\b(?:yarın|gelecek hafta|gelecek ay)\b/u.test(normalized);
    const yesterday = /\b(?:dün|geçen hafta|geçen ay)\b/u.test(normalized);
    if (!tomorrow && !yesterday) return [];
    const subjectMatch = normalized.match(/(?:^|[.!?]\s*)(ben|sen|biz|siz)\b/u) || normalized.match(/\b(ben|sen|biz|siz)\b/u);
    const personIndex = SUBJECT_INDEX[subjectMatch?.[1] || ''];
    if (personIndex === undefined) return [];
    const map = new Map();
    for (const [past,future] of TEMPORAL) map.set(tomorrow ? past[personIndex] : future[personIndex], tomorrow ? future[personIndex] : past[personIndex]);
    const re = new RegExp(`[${LETTER_CLASS}]{2,}`, 'gu');
    const issues = [];
    let match;
    while ((match = re.exec(text))) {
      const replacement = map.get(normalize(match[0]));
      if (replacement) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[preserveCase(match[0],replacement)],rule:'v110-temporal-person-context',confidence:0.96,category:'grammar'});
    }
    return issues;
  }

  function extraSentenceIssues(text, context = {}) {
    const issues = [];
    const push = issue => {
      if (!issue || issue.end < issue.start || !issue.suggestions?.length) return;
      if (!issues.some(existing => existing.start === issue.start && existing.end === issue.end && existing.rule === issue.rule)) issues.push(issue);
    };

    for (const issue of temporalIssues(text)) push(issue);

    const questionEnding = text.match(/\b(?:mı|mi|mu|mü|mısın|misin|musun|müsün|mıyım|miyim|muyum|müyüm|mıyız|miyiz|muyuz|müyüz|mısınız|misiniz|musunuz|müsünüz)\s*([.])\s*$/iu);
    if (questionEnding) {
      const index = text.lastIndexOf(questionEnding[1]);
      push({start:index,end:index + 1,suggestions:['?'],rule:'v110-question-terminal',confidence:0.995,category:'punctuation'});
    }

    let match;
    const openQuote = /([“"])[ \t]+([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû])/gu;
    while ((match = openQuote.exec(text))) push({start:match.index,end:match.index + match[0].length,suggestions:[`${match[1]}${match[2]}`],rule:'v110-quote-open-spacing',confidence:0.99,category:'punctuation'});
    const closeQuote = /([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû.!?])[ \t]+([”"])/gu;
    while ((match = closeQuote.exec(text))) push({start:match.index,end:match.index + match[0].length,suggestions:[`${match[1]}${match[2]}`],rule:'v110-quote-close-spacing',confidence:0.99,category:'punctuation'});

    const duplicate = new RegExp(`\\b([${LETTER_CLASS}]{2,})[ \\t]+\\1\\b`, 'giu');
    while ((match = duplicate.exec(text))) push({start:match.index,end:match.index + match[0].length,suggestions:[match[1]],rule:'v110-duplicate-word',confidence:0.995,category:'grammar'});

    const techToken = new RegExp(`[${LETTER_CLASS}]{2,}(?:['’][${LETTER_CLASS}]{1,12})?`, 'gu');
    while ((match = techToken.exec(text))) {
      const replacement = techSuggestion(match[0]);
      if (replacement && replacement !== match[0]) push({start:match.index,end:match.index + match[0].length,suggestions:[replacement],rule:'v110-tech-abbreviation',confidence:0.995,category:'spelling'});
    }

    if (context.longText) {
      const previous = String(context.previousSentence || '');
      const next = String(context.nextSentence || '');
      const currentNorm = normalize(text);
      const previousNorm = normalize(previous);
      if (/\byarın\b/u.test(previousNorm) && !/\b(?:dün|bugün|yarın)\b/u.test(currentNorm)) {
        const joined = `${previous} ${text}`;
        for (const issue of temporalIssues(joined)) {
          if (issue.start >= previous.length + 1) push({...issue,start:issue.start - previous.length - 1,end:issue.end - previous.length - 1,rule:'v110-cross-sentence-temporal'});
        }
      }
      if (/\bdün\b/u.test(normalize(next)) && !/\b(?:dün|bugün|yarın)\b/u.test(currentNorm)) {
        const joined = `${text} ${next}`;
        for (const issue of temporalIssues(joined)) if (issue.start < text.length) push({...issue,rule:'v110-cross-sentence-temporal'});
      }
    }

    return issues;
  }

  function wrappedCheck(rawWord, context = {}) {
    const raw = String(rawWord || '').trim();
    const exactTech = TECH_ABBREVIATIONS.get(normalizeTech(raw));
    if (exactTech && raw === exactTech.canonical) return {word:raw,correct:true,suggestions:[],provider:'local-v110-tech-exact'};
    const learned = correctionMap()?.get(normalize(rawWord));
    if (learned && normalize(learned) !== normalize(rawWord)) return {word:String(rawWord || ''),correct:false,suggestions:[preserveCase(String(rawWord || ''),learned)],provider:'local-v110-correction-corpus'};
    const tech = techSuggestion(rawWord);
    if (tech && tech !== rawWord) return {word:String(rawWord || ''),correct:false,suggestions:[tech],provider:'local-v110-tech-abbreviation'};
    const result = baseCheck(rawWord, context) || {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v110-fallback'};
    if (result.correct === false) {
      const extended = extendedMorphology(rawWord);
      if (extended?.valid) return {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v110-extended-morphology',morphology:extended};
      if (Array.isArray(result.suggestions) && result.suggestions.length > 1) result.suggestions = rankSuggestions(rawWord, result.suggestions);
    }
    return result;
  }

  function wrappedAnalyzeSentence(rawText, context = {}) {
    const text = String(rawText || '');
    const base = baseAnalyzeSentence(text, context) || [];
    const extras = extraSentenceIssues(text, context);
    const out = [];
    const seen = new Set();
    for (const issue of [...base,...extras]) {
      const key = `${issue.start}:${issue.end}:${issue.rule || issue.category || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedIsValid(rawWord) {
    const raw = String(rawWord || '').trim();
    if (!raw) return false;
    const malformedTech = techSuggestion(raw);
    if (malformedTech) return false;
    const tech = TECH_ABBREVIATIONS.get(normalizeTech(raw));
    if (tech && raw === tech.canonical) return true;
    if (baseIsValid(raw)) return true;
    return !!extendedMorphology(raw)?.valid;
  }

  function wrappedSuggest(rawWord, context = {}, limit = 3) {
    const learned = correctionMap()?.get(normalize(rawWord));
    if (learned) return [preserveCase(String(rawWord || ''),learned)];
    const tech = techSuggestion(rawWord);
    if (tech) return [tech];
    const suggestions = baseSuggest ? baseSuggest(rawWord, context, Math.max(limit,3)) : (baseCheck(rawWord, context)?.suggestions || []);
    return rankSuggestions(rawWord, suggestions).slice(0,limit);
  }

  engine.check = wrappedCheck;
  engine.analyzeSentence = wrappedAnalyzeSentence;
  engine.isValid = wrappedIsValid;
  engine.suggest = wrappedSuggest;
  engine.extendedMorphology = extendedMorphology;
  engine.techSuggestion = techSuggestion;
  engine.version = VERSION;
  engine.stats = {
    ...(engine.stats || {}),
    morphology:'v110-local-multi-stage',
    technicalAbbreviations:TECH_ABBREVIATIONS.size,
    correctionCorpus:correctionMap()?.size || 0,
    extendedGerundPatterns:GERUND_SUFFIXES.length,
    temporalVerbFamilies:TEMPORAL.length,
    contextLayers:3,
    externalDependencies:0
  };
  window.WarextTurkishSpellEngineV110 = engine;
})();
(() => {
  'use strict';

  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.check || !engine?.analyzeSentence || !engine?.analyzeMorphology || window.__warextAdvancedGrammarV110) return;
  window.__warextAdvancedGrammarV110 = true;

  const baseCheck = engine.check.bind(engine);
  const baseAnalyze = engine.analyzeSentence.bind(engine);
  const baseMorphology = engine.analyzeMorphology.bind(engine);
  const baseIsValid = engine.isValid.bind(engine);
  const baseSuggest = engine.suggest.bind(engine);
  const VOWELS = 'aeıioöuü';
  const VOICELESS = 'çfhkpsşt';
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const SUBJECTS = new Map([['ben','1sg'],['sen','2sg'],['biz','1pl'],['siz','2pl']]);

  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const chars = value => Array.from(String(value || ''));
  const finalChar = value => chars(value).at(-1) || '';

  function lastVowel(value) {
    const word = normalize(value);
    for (let index = word.length - 1; index >= 0; index--) if (VOWELS.includes(word[index])) return word[index];
    return '';
  }

  function harmony4(value) {
    const vowel = lastVowel(value);
    if ('aı'.includes(vowel)) return 'ı';
    if ('ei'.includes(vowel)) return 'i';
    if ('ou'.includes(vowel)) return 'u';
    if ('öü'.includes(vowel)) return 'ü';
    return '';
  }

  function harmony2(value) {
    const vowel = lastVowel(value);
    return 'aıou'.includes(vowel) ? 'a' : 'eiöü'.includes(vowel) ? 'e' : '';
  }

  function capitalize(value) {
    const list = chars(value);
    if (!list.length) return value;
    const first = list[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR');
    return first + list.slice(1).join('');
  }

  function preserveCase(raw, replacement) {
    if (!raw || !replacement) return replacement;
    return raw[0] !== normalize(raw[0]) ? capitalize(replacement) : replacement;
  }

  function expectedPastAux(base) {
    const h4 = harmony4(base);
    if (!h4) return '';
    const lead = VOICELESS.includes(finalChar(normalize(base))) ? 't' : 'd';
    return `${lead}${h4}`;
  }

  function compoundPersonTail(vowel, person) {
    return person === '1sg' ? 'm' : person === '2sg' ? 'n' : person === '1pl' ? 'k' : person === '2pl' ? `n${vowel}z` : '';
  }

  function reportedPersonTail(vowel, person) {
    return person === '1sg' ? `${vowel}m` : person === '2sg' ? `s${vowel}n` : person === '1pl' ? `${vowel}z` : person === '2pl' ? `s${vowel}n${vowel}z` : '';
  }

  function parseCompoundFinite(rawToken) {
    const word = normalize(rawToken);
    if (chars(word).length < 6 || chars(word).length > 72) return null;
    let match = word.match(/^(.+?)(y?)([dt][ıiuü])(m|n|k|n[ıiuü]z)$/u);
    if (match) {
      const base = match[1];
      const buffer = match[2];
      const aux = match[3];
      const vowel = aux[1];
      const expectedBuffer = VOWELS.includes(finalChar(base)) ? 'y' : '';
      if (buffer !== expectedBuffer || aux !== expectedPastAux(base)) return null;
      const observed = match[4] === 'm' ? '1sg' : match[4] === 'n' ? '2sg' : match[4] === 'k' ? '1pl' : match[4] === `n${vowel}z` ? '2pl' : '';
      if (!observed) return null;
      const analysis = baseMorphology(base);
      if (!analysis?.valid || analysis.mode !== 'verb' || analysis.features?.person) return null;
      const tense = analysis.features?.tense || analysis.features?.mood || 'finite';
      return {valid:true,root:analysis.root || base,surfaceBase:base,mode:'verb',score:7.4,parts:[...(analysis.parts || []),{label:'compound',suffix:`${buffer}${aux}`},{label:'person',suffix:match[4]}],features:{...(analysis.features || {}),person:observed,compound:'past',baseTense:tense}};
    }
    match = word.match(/^(.+?)(y?)(m[ıiuü]ş)([ıiuü]m|s[ıiuü]n|[ıiuü]z|s[ıiuü]n[ıiuü]z)$/u);
    if (match) {
      const base = match[1];
      const buffer = match[2];
      const aux = match[3];
      const vowel = harmony4(base);
      const expectedBuffer = VOWELS.includes(finalChar(base)) ? 'y' : '';
      if (!vowel || buffer !== expectedBuffer || aux !== `m${vowel}ş`) return null;
      const tail = match[4];
      const observed = tail === `${vowel}m` ? '1sg' : tail === `s${vowel}n` ? '2sg' : tail === `${vowel}z` ? '1pl' : tail === `s${vowel}n${vowel}z` ? '2pl' : '';
      if (!observed) return null;
      const analysis = baseMorphology(base);
      if (!analysis?.valid || analysis.mode !== 'verb' || analysis.features?.person) return null;
      return {valid:true,root:analysis.root || base,surfaceBase:base,mode:'verb',score:7.3,parts:[...(analysis.parts || []),{label:'compound',suffix:`${buffer}${aux}`},{label:'person',suffix:tail}],features:{...(analysis.features || {}),person:observed,compound:'reported'}};
    }
    match = word.match(/^(.+?)(s[ae])(m|n|k|n[ıi]z)$/u);
    if (match) {
      const base = match[1];
      const aux = match[2];
      const h2 = harmony2(base);
      const h4 = harmony4(aux);
      if (!h2 || aux !== `s${h2}` || !h4) return null;
      const tail = match[3];
      const observed = tail === 'm' ? '1sg' : tail === 'n' ? '2sg' : tail === 'k' ? '1pl' : tail === `n${h4}z` ? '2pl' : '';
      if (!observed) return null;
      const analysis = baseMorphology(base);
      if (!analysis?.valid || analysis.mode !== 'verb' || analysis.features?.person) return null;
      return {valid:true,root:analysis.root || base,surfaceBase:base,mode:'verb',score:7.2,parts:[...(analysis.parts || []),{label:'compound',suffix:aux},{label:'person',suffix:tail}],features:{...(analysis.features || {}),person:observed,compound:'conditional'}};
    }
    return null;
  }

  function compoundAgreementSuggestion(rawToken, expectedPerson) {
    const parsed = parseCompoundFinite(rawToken);
    if (!parsed || parsed.features.person === expectedPerson) return '';
    const word = normalize(rawToken);
    const compound = parsed.features.compound;
    if (compound === 'past') {
      const match = word.match(/^(.+?)(y?)([dt]([ıiuü]))(?:m|n|k|n[ıiuü]z)$/u);
      if (!match) return '';
      return preserveCase(rawToken, `${match[1]}${match[2]}${match[3]}${compoundPersonTail(match[4],expectedPerson)}`);
    }
    if (compound === 'reported') {
      const match = word.match(/^(.+?)(y?)(m([ıiuü])ş)(?:[ıiuü]m|s[ıiuü]n|[ıiuü]z|s[ıiuü]n[ıiuü]z)$/u);
      if (!match) return '';
      return preserveCase(rawToken, `${match[1]}${match[2]}${match[3]}${reportedPersonTail(match[4],expectedPerson)}`);
    }
    if (compound === 'conditional') {
      const match = word.match(/^(.+?)(s[ae])(?:m|n|k|n([ıi])z)$/u);
      if (!match) return '';
      const vowel = harmony4(match[2]);
      return preserveCase(rawToken, `${match[1]}${match[2]}${compoundPersonTail(vowel,expectedPerson)}`);
    }
    return '';
  }

  function questionParticleSuggestion(rawToken) {
    const word = normalize(rawToken);
    const forms = [
      ['past-2pl',/m([ıiuü])yd[ıiuü]n[ıiuü]z$/u],['past-1pl',/m([ıiuü])yd[ıiuü]k$/u],['past-2sg',/m([ıiuü])yd[ıiuü]n$/u],['past-1sg',/m([ıiuü])yd[ıiuü]m$/u],
      ['reported-2pl',/m([ıiuü])ym[ıiuü]şs[ıiuü]n[ıiuü]z$/u],['reported-1pl',/m([ıiuü])ym[ıiuü]ş[ıiuü]z$/u],['reported-2sg',/m([ıiuü])ym[ıiuü]şs[ıiuü]n$/u],['reported-1sg',/m([ıiuü])ym[ıiuü]ş[ıiuü]m$/u],
      ['2pl',/m([ıiuü])s[ıiuü]n[ıiuü]z$/u],['1pl',/m([ıiuü])y[ıiuü]z$/u],['2sg',/m([ıiuü])s[ıiuü]n$/u],['1sg',/m([ıiuü])y[ıiuü]m$/u],['bare',/m([ıiuü])$/u]
    ];
    for (const [kind,re] of forms) {
      const match = word.match(re);
      if (!match || match.index == null || match.index < 2) continue;
      const stem = word.slice(0,match.index);
      const analysis = baseMorphology(stem);
      if (!baseIsValid(stem) && !analysis?.valid) continue;
      const vowel = harmony4(stem);
      if (!vowel) continue;
      let particleTail = `m${vowel}`;
      if (kind === '1sg') particleTail += `y${vowel}m`;
      else if (kind === '2sg') particleTail += `s${vowel}n`;
      else if (kind === '1pl') particleTail += `y${vowel}z`;
      else if (kind === '2pl') particleTail += `s${vowel}n${vowel}z`;
      else if (kind.startsWith('past-')) {
        const person = kind.slice(5);
        particleTail += `yd${vowel}${compoundPersonTail(vowel,person)}`;
      } else if (kind.startsWith('reported-')) {
        const person = kind.slice(9);
        particleTail += `ym${vowel}ş${reportedPersonTail(vowel,person)}`;
      }
      return `${stem} ${particleTail}`;
    }
    return '';
  }

  const PROPER_EXT = new Map([
    ['almanya',['Almanya','almanya']],['fransa',['Fransa','fransa']],['italya',['İtalya','italya']],['ispanya',['İspanya','ispanya']],['ingiltere',['İngiltere','ingiltere']],
    ['amerika',['Amerika','amerika']],['abd',['ABD','abede']],['rusya',['Rusya','rusya']],['ukrayna',['Ukrayna','ukrayna']],['azerbaycan',['Azerbaycan','azerbaycan']],
    ['gürcistan',['Gürcistan','gürcistan']],['yunanistan',['Yunanistan','yunanistan']],['bulgaristan',['Bulgaristan','bulgaristan']],['romanya',['Romanya','romanya']],['hollanda',['Hollanda','hollanda']],
    ['belçika',['Belçika','belçika']],['isviçre',['İsviçre','isviçre']],['avusturya',['Avusturya','avusturya']],['polonya',['Polonya','polonya']],['çekya',['Çekya','çekya']],
    ['slovakya',['Slovakya','slovakya']],['macaristan',['Macaristan','macaristan']],['isveç',['İsveç','isveç']],['norveç',['Norveç','norveç']],['finlandiya',['Finlandiya','finlandiya']],
    ['danimarka',['Danimarka','danimarka']],['portekiz',['Portekiz','portekiz']],['irlanda',['İrlanda','irlanda']],['israil',['İsrail','israil']],['filistin',['Filistin','filistin']],
    ['iran',['İran','iran']],['irak',['Irak','ırak']],['suriye',['Suriye','suriye']],['mısır',['Mısır','mısır']],['libya',['Libya','libya']],['tunus',['Tunus','tunus']],
    ['cezayir',['Cezayir','cezayir']],['fas',['Fas','fas']],['katar',['Katar','katar']],['bae',['BAE','baee']],['çin',['Çin','çin']],['japonya',['Japonya','japonya']],
    ['kore',['Kore','kore']],['hindistan',['Hindistan','hindistan']],['pakistan',['Pakistan','pakistan']],['endonezya',['Endonezya','endonezya']],['avustralya',['Avustralya','avustralya']],
    ['kanada',['Kanada','kanada']],['brezilya',['Brezilya','brezilya']],['arjantin',['Arjantin','arjantin']],['meksika',['Meksika','meksika']],['şili',['Şili','şili']],
    ['openai',['OpenAI','openay']],['chatgpt',['ChatGPT','çetcipiti']],['google',['Google','gugıl']],['microsoft',['Microsoft','maykrosoft']],['apple',['Apple','epıl']],
    ['nvidia',['NVIDIA','envidiya']],['tübitak',['TÜBİTAK','tübitak']],['tbmm',['TBMM','tebememe']],['tdk',['TDK','tedeke']],['yök',['YÖK','yök']],['ösym',['ÖSYM','ösym']],['meb',['MEB','meb']],['btk',['BTK','beteke']]
  ]);
  const PROPER_KEYS = [...PROPER_EXT.keys()].sort((a,b) => b.length - a.length);

  function properSuffix(spoken, observed) {
    const h2 = harmony2(spoken);
    const h4 = harmony4(spoken);
    if (!h2 || !h4) return '';
    const vowelEnd = VOWELS.includes(finalChar(normalize(spoken)));
    const lead = VOICELESS.includes(finalChar(normalize(spoken))) ? 't' : 'd';
    if (/^(?:da|de|ta|te)$/u.test(observed)) return `${lead}${h2}`;
    if (/^(?:dan|den|tan|ten)$/u.test(observed)) return `${lead}${h2}n`;
    if (/^(?:a|e|ya|ye)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}${h2}`;
    if (/^(?:ı|i|u|ü|yı|yi|yu|yü)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}${h4}`;
    if (/^(?:ın|in|un|ün|nın|nin|nun|nün)$/u.test(observed)) return `${vowelEnd ? 'n' : ''}${h4}n`;
    if (/^(?:la|le|yla|yle)$/u.test(observed)) return `${vowelEnd ? 'y' : ''}l${h2}`;
    return '';
  }

  function extendedProperSuggestion(rawToken) {
    const raw = String(rawToken || '').trim();
    if (!raw) return '';
    const normalized = normalize(raw.replace(/[’']/gu,''));
    const direct = PROPER_EXT.get(normalized);
    if (direct) return raw === direct[0] ? '' : direct[0];
    const apostrophe = raw.match(/^([^'’]+)['’]([^'’]+)$/u);
    if (apostrophe) {
      const item = PROPER_EXT.get(normalize(apostrophe[1]));
      if (!item) return '';
      const suffix = properSuffix(item[1],normalize(apostrophe[2]));
      if (!suffix) return '';
      const candidate = `${item[0]}'${suffix}`;
      return candidate !== raw ? candidate : '';
    }
    const compact = normalize(raw);
    for (const key of PROPER_KEYS) {
      if (!compact.startsWith(key) || compact.length <= key.length) continue;
      const item = PROPER_EXT.get(key);
      const suffix = properSuffix(item[1],compact.slice(key.length));
      if (!suffix) continue;
      return `${item[0]}'${suffix}`;
    }
    return '';
  }

  function conjugatePast(root, person) {
    const word = normalize(root);
    const h4 = harmony4(word);
    if (!h4) return '';
    const lead = VOICELESS.includes(finalChar(word)) ? 't' : 'd';
    return `${word}${lead}${h4}${compoundPersonTail(h4,person)}`;
  }

  function futureBase(root) {
    const word = normalize(root);
    const h2 = harmony2(word);
    if (!h2) return '';
    if (word === 'de') return 'diyecek';
    if (word === 'ye') return 'yiyecek';
    return `${word}${VOWELS.includes(finalChar(word)) ? 'y' : ''}${h2 === 'a' ? 'acak' : 'ecek'}`;
  }

  function conjugateFuture(root, person) {
    let base = futureBase(root);
    if (!base) return '';
    const h4 = harmony4(base);
    if (person === '1sg' || person === '1pl') base = base.replace(/k$/u,'ğ');
    if (person === '1sg') return `${base}${h4}m`;
    if (person === '2sg') return `${base}s${h4}n`;
    if (person === '1pl') return `${base}${h4}z`;
    if (person === '2pl') return `${base}s${h4}n${h4}z`;
    return '';
  }

  function generalizedTemporalIssues(text, context = {}) {
    const normalized = normalize(text);
    const futureContext = /\b(?:yarın|öbür gün|gelecek hafta|gelecek ay|gelecek yıl)\b/u.test(normalized) || /\b(?:yarın|öbür gün|gelecek hafta|gelecek ay|gelecek yıl)\b/u.test(normalize(context.previousSentence));
    const pastContext = /\b(?:dün|evvelsi gün|geçen hafta|geçen ay|geçen yıl)\b/u.test(normalized) || /\b(?:dün|evvelsi gün|geçen hafta|geçen ay|geçen yıl)\b/u.test(normalize(context.previousSentence));
    if (futureContext === pastContext) return [];
    const tokenRe = new RegExp(`[${LETTERS}]{2,}`,'gu');
    let person = '';
    const issues = [];
    let match;
    while ((match = tokenRe.exec(text))) {
      const token = normalize(match[0]);
      if (SUBJECTS.has(token)) {
        person = SUBJECTS.get(token);
        continue;
      }
      if (!person) continue;
      const analysis = baseMorphology(token);
      if (!analysis?.valid || analysis.mode !== 'verb' || analysis.features?.person !== person || !analysis.root) continue;
      const tense = analysis.features?.tense || '';
      if (futureContext && tense === 'past') {
        const replacement = conjugateFuture(analysis.root,person);
        if (replacement && baseIsValid(replacement)) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[preserveCase(match[0],replacement)],rule:'v110-general-temporal-future',confidence:0.965,category:'grammar'});
      }
      if (pastContext && tense === 'future') {
        const replacement = conjugatePast(analysis.root,person);
        if (replacement && baseIsValid(replacement)) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[preserveCase(match[0],replacement)],rule:'v110-general-temporal-past',confidence:0.965,category:'grammar'});
      }
    }
    return issues;
  }

  function clauseAgreementIssues(text) {
    const tokenRe = new RegExp(`[${LETTERS}]{2,}`,'gu');
    let person = '';
    let lastEnd = 0;
    const issues = [];
    let match;
    while ((match = tokenRe.exec(text))) {
      const between = text.slice(lastEnd,match.index);
      if (/[.!?;:\n]/u.test(between)) person = '';
      lastEnd = match.index + match[0].length;
      const token = normalize(match[0]);
      if (SUBJECTS.has(token)) {
        person = SUBJECTS.get(token);
        continue;
      }
      if (!person) continue;
      const compound = parseCompoundFinite(token);
      if (compound?.features?.person && compound.features.person !== person) {
        const replacement = compoundAgreementSuggestion(match[0],person);
        if (replacement) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[replacement],rule:'v110-compound-person-agreement',confidence:0.985,category:'grammar'});
      }
    }
    return issues;
  }

  function extraPunctuationIssues(text, context = {}) {
    const issues = [];
    let match;
    if (context.punctuation !== false) {
      const beforePunctuation = /([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû0-9])[ \t]+([,.;:!?])/gu;
      while ((match = beforePunctuation.exec(text))) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[`${match[1]}${match[2]}`],rule:'v110-space-before-punctuation',confidence:0.995,category:'punctuation'});
      const afterPunctuation = /([,;:!?])([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû])/gu;
      while ((match = afterPunctuation.exec(text))) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[`${match[1]} ${match[2]}`],rule:'v110-space-after-punctuation',confidence:0.985,category:'punctuation'});
      const mixedPunctuation = /([!?]){3,}/gu;
      while ((match = mixedPunctuation.exec(text))) issues.push({start:match.index,end:match.index + match[0].length,suggestions:[match[0].includes('?') && match[0].includes('!') ? '?!' : match[0][0]],rule:'v110-punctuation-run',confidence:0.96,category:'punctuation'});
    }
    const firstWord = text.match(/^\s*([a-zçğıöşüâîû][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{1,})/u);
    if (firstWord && !/^(?:https?|www)\b/iu.test(firstWord[1])) {
      const start = text.indexOf(firstWord[1]);
      issues.push({start,end:start + firstWord[1].length,suggestions:[capitalize(firstWord[1])],rule:'v110-sentence-capitalization',confidence:0.97,category:'grammar'});
    }
    return issues;
  }

  function wrappedMorphology(rawWord) {
    const base = baseMorphology(rawWord);
    return base?.valid ? base : parseCompoundFinite(rawWord) || base;
  }

  function wrappedIsValid(rawWord) {
    if (extendedProperSuggestion(rawWord)) return false;
    if (questionParticleSuggestion(rawWord)) return false;
    return baseIsValid(rawWord) || !!parseCompoundFinite(rawWord)?.valid;
  }

  function wrappedCheck(rawWord, context = {}) {
    const proper = context.properNames === false ? '' : extendedProperSuggestion(rawWord);
    if (proper) return {word:String(rawWord || ''),correct:false,suggestions:[proper],provider:'local-v110-expanded-proper'};
    const question = questionParticleSuggestion(rawWord);
    if (question) return {word:String(rawWord || ''),correct:false,suggestions:[question],provider:'local-v110-question-particle'};
    const result = baseCheck(rawWord,context);
    if (result?.correct === false) {
      const compound = parseCompoundFinite(rawWord);
      if (compound?.valid) return {word:String(rawWord || ''),correct:true,suggestions:[],provider:'local-v110-compound-morphology',morphology:compound};
    }
    return result;
  }

  function wrappedAnalyze(text, context = {}) {
    const source = String(text || '');
    const base = (baseAnalyze(source,context) || []).filter(issue => issue.rule !== 'subject-person-agreement' || !parseCompoundFinite(source.slice(issue.start,issue.end)));
    const additions = [
      ...clauseAgreementIssues(source),
      ...generalizedTemporalIssues(source,context),
      ...extraPunctuationIssues(source,context)
    ];
    const tokenRe = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,14})?`,'gu');
    let match;
    while ((match = tokenRe.exec(source))) {
      const proper = context.properNames === false ? '' : extendedProperSuggestion(match[0]);
      if (proper) additions.push({start:match.index,end:match.index + match[0].length,suggestions:[proper],rule:'v110-expanded-proper-name',confidence:0.99,category:'spelling'});
      const question = questionParticleSuggestion(match[0]);
      if (question) additions.push({start:match.index,end:match.index + match[0].length,suggestions:[question],rule:'v110-question-particle-general',confidence:0.99,category:'grammar'});
    }
    const out = [];
    const seen = new Set();
    for (const issue of [...base,...additions]) {
      if (!issue?.suggestions?.length || issue.end <= issue.start) continue;
      const key = `${issue.start}:${issue.end}:${issue.suggestions[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out.sort((a,b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));
  }

  function wrappedSuggest(rawWord, context = {}, limit = 3) {
    const proper = context.properNames === false ? '' : extendedProperSuggestion(rawWord);
    if (proper) return [proper];
    const question = questionParticleSuggestion(rawWord);
    if (question) return [question];
    return baseSuggest(rawWord,context,limit);
  }

  engine.check = wrappedCheck;
  engine.suggest = wrappedSuggest;
  engine.isValid = wrappedIsValid;
  engine.analyzeMorphology = wrappedMorphology;
  engine.analyzeSentence = wrappedAnalyze;
  engine.parseCompoundFinite = parseCompoundFinite;
  engine.questionParticleSuggestionV110 = questionParticleSuggestion;
  engine.extendedProperSuggestionV110 = extendedProperSuggestion;
  engine.stats = {
    ...(engine.stats || {}),
    compoundFinitePatterns:3,
    expandedProperNames:PROPER_EXT.size,
    generalizedTemporalConjugation:2,
    questionParticleFamilies:13,
    protectionLayer:'technical-v110',
    externalDependencies:0
  };
})();
