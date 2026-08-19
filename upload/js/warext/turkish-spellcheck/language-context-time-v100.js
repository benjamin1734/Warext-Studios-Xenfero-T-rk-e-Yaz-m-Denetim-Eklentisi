(() => {
  'use strict';
  const s = window.WarextV100Lang;
  if (!s || s.temporalIssues) return;
  const subjectIndex = {ben:0,sen:1,biz:2,siz:3};
  const families = [
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
  s.temporalIssues = text => {
    const n = s.normalize(text);
    const future = /\b(?:yarın|gelecek hafta|gelecek ay)\b/u.test(n);
    const past = /\b(?:dün|geçen hafta|geçen ay)\b/u.test(n);
    if (!future && !past) return [];
    const subject = n.match(/\b(ben|sen|biz|siz)\b/u)?.[1] || '';
    const index = subjectIndex[subject];
    if (index === undefined) return [];
    const map = new Map();
    for (const [p,f] of families) map.set(future ? p[index] : f[index],future ? f[index] : p[index]);
    const issues = [];
    const re = /[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{2,}/gu;
    let m;
    while ((m = re.exec(text))) {
      const replacement = map.get(s.normalize(m[0]));
      if (replacement) issues.push({start:m.index,end:m.index + m[0].length,suggestions:[s.preserve(m[0],replacement)],rule:'v1-temporal-person-context',confidence:.96,category:'grammar'});
    }
    return issues;
  };
  s.temporalFamilies = families.length;
})();
