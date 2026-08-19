(() => {
  'use strict';
  const s = window.WarextV100Lang;
  if (!s || s.extendedMorphology) return;
  const gerunds = ['maksızın','meksizin','madan','meden','dıkça','dikçe','dukça','dükçe','tıkça','tikçe','tukça','tükçe','arak','erek','yerek','ınca','ince','unca','ünce','yınca','yince','yunca','yünce','ıp','ip','up','üp','yıp','yip','yup','yüp','alı','eli','yalı','yeli','ken'];
  const derivations = ['sallık','sellik','sal','sel','daş','deş','taş','teş','msı','msi','msu','msü','cık','cik','cuk','cük','çık','çik','çuk','çük','gil','vari'];
  const stemValid = stem => {
    if (!stem || s.chars(stem).length < 2) return false;
    if (s.baseValid(stem)) return true;
    const a = s.h2(stem);
    if (a && s.baseValid(`${stem}m${a}k`)) return true;
    return s.baseValid(`${stem}mak`) || s.baseValid(`${stem}mek`);
  };
  const gerund = word => {
    for (const ending of gerunds) {
      if (!word.endsWith(ending) || word.length <= ending.length + 1) continue;
      let stem = word.slice(0,-ending.length);
      if (/^y/u.test(ending) && s.vowels.includes(s.last(stem))) continue;
      if (stemValid(stem)) return {valid:true,mode:'verb',root:stem,parts:[{label:'converb',suffix:ending}],features:{pos:'verb',verbForm:'converb'}};
      if (/^[dt]/u.test(ending)) {
        const softened = stem.replace(/([bcğd])$/u,ch => ({b:'p',c:'ç',ğ:'k',d:'t'})[ch] || ch);
        if (stemValid(softened)) return {valid:true,mode:'verb',root:softened,parts:[{label:'converb',suffix:ending}],features:{pos:'verb',verbForm:'converb'}};
      }
    }
    return null;
  };
  const voice = word => {
    const tails = ['abil','ebil','ıl','il','ul','ül','ın','in','un','ün','ış','iş','uş','üş','dır','dir','dur','dür','tır','tir','tur','tür','la','le'];
    let form = word;
    const parts = [];
    for (let depth = 0; depth < 4; depth++) {
      let found = false;
      for (const tail of tails) {
        if (!form.endsWith(tail) || form.length <= tail.length + 1) continue;
        const stem = form.slice(0,-tail.length);
        if (!stemValid(stem) && depth === 0) continue;
        parts.unshift({label:'voice',suffix:tail});
        form = stem;
        found = true;
        break;
      }
      if (!found) break;
    }
    return parts.length && stemValid(form) ? {valid:true,mode:'verb',root:form,parts,features:{pos:'verb',derivations:parts.map(x => x.suffix)}} : null;
  };
  const noun = word => {
    for (const ending of derivations) {
      if (!word.endsWith(ending) || word.length <= ending.length + 1) continue;
      const stem = word.slice(0,-ending.length);
      if (s.baseValid(stem)) return {valid:true,mode:'noun',root:stem,parts:[{label:'derivation',suffix:ending}],features:{pos:'noun',derivations:[ending]}};
    }
    return null;
  };
  s.extendedMorphology = raw => {
    const word = s.normalize(raw);
    if (!word || word.length < 4 || word.length > 64) return null;
    return gerund(word) || voice(word) || noun(word);
  };
  s.extendedMorphologyCount = gerunds.length + derivations.length;
})();
