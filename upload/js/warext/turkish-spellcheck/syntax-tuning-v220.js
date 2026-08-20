(() => {
  'use strict';

  if (window.__warextSyntaxTuningV220) return;
  const engine=window.WarextTurkishSpellEngineV110;
  if (!engine?.parseSyntaxV220 || !engine?.analyzeMeaning) return;
  window.__warextSyntaxTuningV220=true;

  const baseParse=engine.parseSyntaxV220.bind(engine);
  const baseMeaning=engine.analyzeMeaning.bind(engine);
  const morphology=typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : () => null;
  const normalize=value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const PRONOUNS=new Set(['ben','sen','o','biz','siz','onlar','bunlar','şunlar','sunlar','kim','biri','birisi','hepsi','çoğu','cogu']);
  const BLOCKED=new Set(['bir','bu','şu','su','bazı','bazi','her','tüm','tum','bütün','butun','hiçbir','hicbir','hangi','kaç','kac','çok','cok','daha','en','ve','ile','için','icin','gibi','olarak','sonra','önce','once','bugün','bugun','dün','dun','yarın','yarin','hemen','sadece','yalnızca','yalnizca','işte','iste','ancak','fakat','ama','çünkü','cunku','adet','tane','ya','yada','ya da']);

  function raw(token) { return String(token?.raw || token?.word || ''); }
  function root(token) { return normalize(token?.root || morphology(raw(token))?.root || raw(token)); }
  function caseLike(token) {
    const value=normalize(raw(token).replace(/['’]/gu,''));
    const base=root(token);
    const explicit=normalize(token?.case || token?.morphology?.case || token?.morphology?.nounCase || '');
    if (/acc|dat|abl|loc|ins|gen|belirtme|yonelme|ayrilma|bulunma|tamlayan|accusative|dative|ablative|locative|instrumental|genitive/u.test(explicit)) return true;
    if (!value || !base || value === base || !value.startsWith(base)) return false;
    const suffix=value.slice(base.length);
    return /^(?:y?[ae]|[dt][ae](?:n)?|y?l[ae]|l[ae]r(?:[ae]|d[ae](?:n)?|l[ae])|[ıiuü]n(?:d[ae](?:n)?)?|[nsy]?[ıiuü](?:n)?[ae]|l[ae]r[ıiuü]n|l[ae]rl[ae])$/u.test(suffix);
  }
  function finite(token) {
    const analysis=token?.morphology || morphology(raw(token));
    return !!(analysis?.valid && analysis?.mode === 'verb');
  }
  function same(a,b) {
    if (!a || !b) return false;
    const valuesA=new Set([normalize(raw(a)),root(a)]);
    return valuesA.has(normalize(raw(b))) || valuesA.has(root(b));
  }
  function eligible(token) {
    const word=normalize(raw(token));
    if (!word || BLOCKED.has(word) || BLOCKED.has(root(token)) || finite(token) || caseLike(token)) return false;
    if (/^(?:mi|mı|mu|mü|de|da|ki)$/u.test(word)) return false;
    if (/^(?:\d+|[.,;:!?]+)$/u.test(word)) return false;
    return true;
  }
  function indexOfToken(tokens,target) {
    if (!target) return -1;
    let index=tokens.indexOf(target);
    if (index >= 0) return index;
    index=tokens.findIndex(token => same(token,target));
    return index;
  }
  function cloneSubject(token,source,score) {
    if (!token) return null;
    return {...token,raw:raw(token),word:raw(token),root:root(token),role:'subject',source,score};
  }
  function subjectOverride(sentence,text) {
    const tokens=Array.isArray(sentence?.tokens) ? sentence.tokens : [];
    if (!tokens.length) return null;
    const predicateIndex=indexOfToken(tokens,sentence.predicate);
    const objectIndex=indexOfToken(tokens,sentence.object);
    for (let i=0;i<tokens.length;i++) {
      const word=normalize(raw(tokens[i]));
      if (!PRONOUNS.has(word) || i === objectIndex) continue;
      if (caseLike(tokens[i])) continue;
      return cloneSubject(tokens[i],'v220-pronoun-subject',0.96);
    }
    if (predicateIndex >= 0) {
      const current=sentence.subject;
      const currentOblique=current && caseLike(current);
      const after=tokens.slice(predicateIndex + 1).find(token => eligible(token));
      if (after && currentOblique) return cloneSubject(after,'v220-inverted-subject',0.92);
      for (let i=predicateIndex - 1;i>=0;i--) {
        const token=tokens[i];
        const word=normalize(raw(token));
        if (word === 'de' || word === 'da') continue;
        if (!eligible(token) || i === objectIndex) continue;
        const between=tokens.slice(i + 1,predicateIndex).map(item => normalize(raw(item)));
        if (between.length <= 2 && between.every(value => value === 'de' || value === 'da' || value === 'da' || value === 'bile')) {
          if (!current || currentOblique || indexOfToken(tokens,current) < i - 3) return cloneSubject(token,'v220-near-predicate-subject',0.91);
        }
        break;
      }
    }
    const agent=tokens.findIndex(token => normalize(raw(token)) === 'tarafından' || normalize(raw(token)) === 'tarafindan');
    if (agent >= 0 && predicateIndex > agent) {
      for (let i=predicateIndex - 1;i>agent;i--) {
        if (i === objectIndex || !eligible(tokens[i])) continue;
        return cloneSubject(tokens[i],'v220-passive-subject',0.93);
      }
    }
    return null;
  }
  function tune(text) {
    const parsed=baseParse(text) || {};
    const sentences=(parsed.sentences || []).map(sentence => {
      const replacement=subjectOverride(sentence,text);
      if (!replacement) return sentence;
      return {...sentence,subject:replacement,roleConfidence:{...(sentence.roleConfidence || {}),subject:replacement.score}};
    });
    return {...parsed,sentences,subjectTuning:1};
  }

  engine.parseSyntaxV220=tune;
  engine.analyzeMeaning=(text,context = {}) => {
    const report=baseMeaning(text,context) || {};
    const syntax=tune(text);
    return {...report,syntaxV220:syntax,qualityV220:{...(report.qualityV220 || {}),subjectTuning:1,externalDependencies:0}};
  };
  engine.stats={...(engine.stats || {}),subjectTuning:1,externalDependencies:0};
})();
