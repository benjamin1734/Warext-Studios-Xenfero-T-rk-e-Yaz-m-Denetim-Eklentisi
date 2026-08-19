(() => {
  'use strict';
  if (window.WarextV100Lang) return;
  const engine = window.WarextTurkishSpellEngineV300 || window.WarextTurkishSpellEngineV100;
  if (!engine?.check || !engine?.analyzeSentence || !engine?.isValid) return;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const normalizeTech = value => String(value || '').replace(/İ/g,'i').replace(/I/g,'i').toLocaleLowerCase('tr-TR').trim();
  const chars = value => Array.from(String(value || ''));
  const vowels = 'aeıioöuü';
  const voiceless = 'çfhkpsşt';
  const lastVowel = word => {
    const value = normalize(word);
    for (let i = value.length - 1; i >= 0; i--) if (vowels.includes(value[i])) return value[i];
    return '';
  };
  const h4 = word => {
    const v = lastVowel(word);
    if ('aı'.includes(v)) return 'ı';
    if ('ei'.includes(v)) return 'i';
    if ('ou'.includes(v)) return 'u';
    if ('öü'.includes(v)) return 'ü';
    return '';
  };
  const h2 = word => {
    const v = lastVowel(word);
    if ('aıou'.includes(v)) return 'a';
    if ('eiöü'.includes(v)) return 'e';
    return '';
  };
  const last = word => chars(word).at(-1) || '';
  const cap = value => {
    const c = chars(value);
    if (!c.length) return value;
    return c[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR') + c.slice(1).join('');
  };
  const preserve = (source,replacement) => source && source[0] !== normalize(source[0]) ? cap(replacement) : replacement;
  const specs = [
    ['api','API','api'],['json','JSON','ceyson'],['xml','XML','iksemel'],['html','HTML','haştemel'],['css','CSS','sesese'],['js','JS','ceyes'],['ts','TS','tiyes'],['sql','SQL','sekuel'],['php','PHP','pehepe'],['cpu','CPU','sipiyu'],['gpu','GPU','cipiyu'],['ram','RAM','ram'],['ssd','SSD','esesdi'],['hdd','HDD','haşdidi'],['dns','DNS','dienes'],['http','HTTP','haştitipi'],['https','HTTPS','haştitipies'],['ssh','SSH','eseşeyç'],['ftp','FTP','eftepe'],['url','URL','yurel'],['uri','URI','yuri'],['uuid','UUID','yuuid'],['ip','IP','aypi'],['tcp','TCP','tisipi'],['udp','UDP','yudipi'],['tls','TLS','tieles'],['ssl','SSL','esesel'],['cdn','CDN','sidien'],['cli','CLI','sielay'],['gui','GUI','gui'],['ide','IDE','ide'],['sdk','SDK','esdike'],['jwt','JWT','ceydablıuti'],['oauth','OAuth','oaut'],['rest','REST','rest'],['graphql','GraphQL','grafkyuel'],['mysql','MySQL','maysikuel'],['mariadb','MariaDB','mariadibi'],['redis','Redis','redis'],['nginx','Nginx','encineks'],['apache','Apache','apaçi'],['linux','Linux','linuks'],['android','Android','android'],['ios','iOS','ayos'],['github','GitHub','githab'],['gitlab','GitLab','gitlab'],['xenforo','XenForo','zenforo'],['minecraft','Minecraft','maynkraft'],['docker','Docker','dokır'],['ngrok','ngrok','engrok'],['nodejs','Node.js','nodceyes'],['nextjs','Next.js','nekstceyes']
  ];
  const tech = new Map(specs.map(([key,canonical,spoken]) => [key,{canonical,spoken}]));
  const keys = [...tech.keys()].sort((a,b) => b.length - a.length);
  const ambiguous = new Set(['ram','ip','rest']);
  const suffix = (spoken,observed) => {
    const a = h2(spoken), i = h4(spoken);
    if (!a || !i) return '';
    const vowelEnd = vowels.includes(last(normalize(spoken)));
    const lead = voiceless.includes(last(normalize(spoken))) ? 't' : 'd';
    if (/^(?:da|de|ta|te)$/u.test(observed)) return lead + a;
    if (/^(?:dan|den|tan|ten)$/u.test(observed)) return lead + a + 'n';
    if (/^(?:a|e|ya|ye)$/u.test(observed)) return (vowelEnd ? 'y' : '') + a;
    if (/^(?:ı|i|u|ü|yı|yi|yu|yü)$/u.test(observed)) return (vowelEnd ? 'y' : '') + i;
    if (/^(?:ın|in|un|ün|nın|nin|nun|nün)$/u.test(observed)) return (vowelEnd ? 'n' : '') + i + 'n';
    if (/^(?:la|le|yla|yle)$/u.test(observed)) return (vowelEnd ? 'y' : '') + 'l' + a;
    if (/^(?:dır|dir|dur|dür|tır|tir|tur|tür)$/u.test(observed)) return lead + i + 'r';
    return '';
  };
  const techSuggestion = rawToken => {
    const raw = String(rawToken || '').trim();
    if (!raw) return '';
    const ap = raw.match(/^([^'’]+)['’]([^'’]+)$/u);
    if (ap) {
      const item = tech.get(normalizeTech(ap[1]));
      if (!item) return '';
      const corrected = suffix(item.spoken, normalize(ap[2]));
      if (!corrected) return '';
      const candidate = `${item.canonical}'${corrected}`;
      return candidate !== raw ? candidate : '';
    }
    const word = normalizeTech(raw);
    const exact = tech.get(word);
    if (exact) {
      if (ambiguous.has(word) && raw === raw.toLocaleLowerCase('tr-TR')) return '';
      return raw === exact.canonical ? '' : exact.canonical;
    }
    for (const key of keys) {
      if (!word.startsWith(key) || word.length <= key.length) continue;
      if (ambiguous.has(key) && raw === raw.toLocaleLowerCase('tr-TR')) continue;
      const item = tech.get(key);
      const corrected = suffix(item.spoken, normalize(raw.slice(key.length)));
      if (corrected) return `${item.canonical}'${corrected}`;
    }
    return '';
  };
  const neighbors = new Map([['q','wa'],['w','qase'],['e','wsdr'],['r','edft'],['t','rfgy'],['y','tghu'],['u','yhji'],['ı','ujko'],['o','ıkpl'],['p','olğ'],['a','qwsz'],['s','awedxz'],['d','serfc'],['f','drtgv'],['g','ftyhb'],['h','gyujn'],['j','huıkm'],['k','jıol'],['l','kopş'],['ş','lpği'],['z','asx'],['x','zsdc'],['c','xdfv'],['v','cfgb'],['b','vghn'],['n','bhjm'],['m','njk']]);
  const distance = (a,b) => {
    const A = chars(normalize(a)), B = chars(normalize(b));
    let prev = Array.from({length:B.length + 1},(_,i) => i);
    for (let i = 1; i <= A.length; i++) {
      const cur = [i];
      for (let j = 1; j <= B.length; j++) {
        const cost = A[i - 1] === B[j - 1] ? 0 : neighbors.get(A[i - 1])?.includes(B[j - 1]) ? .55 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[B.length];
  };
  const frequent = new Set('bir bu ve için ile çok daha gibi ama sonra kadar olan olarak ben sen biz siz ne neden nasıl hangi her hiç şey var yok değil bugün yarın dün şimdi zaman gün iyi güzel yeni doğru yanlış aynı farklı tüm sadece yine geliyorum gidiyorum yapıyorum oluyor istiyorum biliyorum merhaba teşekkürler tamam herkes yalnız çünkü forum mesaj konu kullanıcı sistem eklenti sunucu dosya kod veri hata özellik ayar sayfa site oyun'.split(' '));
  const rank = (word,list) => [...new Set((list || []).filter(Boolean))].map((candidate,index) => [distance(word,normalize(candidate).replace(/\s+/gu,'')) * 100 - (frequent.has(normalize(candidate)) ? 24 : 0) + index * 2,candidate]).sort((a,b) => a[0] - b[0]).map(x => x[1]).slice(0,3);
  window.WarextV100Lang = {VERSION:'1.0.0',engine,normalize,normalizeTech,chars,vowels,voiceless,lastVowel,h4,h2,last,cap,preserve,tech,techSuggestion,corrections:() => window.WarextCorrectionMapV100 instanceof Map ? window.WarextCorrectionMapV100 : null,rank,baseCheck:engine.check.bind(engine),baseAnalyze:engine.analyzeSentence.bind(engine),baseValid:engine.isValid.bind(engine),baseSuggest:typeof engine.suggest === 'function' ? engine.suggest.bind(engine) : null};
})();
