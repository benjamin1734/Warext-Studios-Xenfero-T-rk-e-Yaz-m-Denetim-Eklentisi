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
  const PRONOUNS=new Set(['ben','sen','o','biz','siz','onlar','bunlar','şunlar','sunlar']);
  const BLOCKED=new Set(['bir','bu','şu','su','bazı','bazi','her','tüm','tum','bütün','butun','hiçbir','hicbir','hangi','kaç','kac','çok','cok','daha','en','ve','ile','için','icin','gibi','olarak','sonra','önce','once','bugün','bugun','dün','dun','yarın','yarin','hemen','sadece','yalnızca','yalnizca','işte','iste','ancak','fakat','ama','çünkü','cunku','adet','tane','ya','yada']);

  function raw(token) { return String(token?.raw || token?.word || ''); }
  function root(token) { return normalize(token?.root || morphology(raw(token))?.root || raw(token)); }
  function finite(token) {
    const analysis=token?.morphology || morphology(raw(token));
    return !!(analysis?.valid && analysis?.mode === 'verb');
  }
  function same(a,b) {
    if (!a || !b) return false;
    const valuesA=new Set([normalize(raw(a)),root(a)]);
    return valuesA.has(normalize(raw(b))) || valuesA.has(root(b));
  }
  function indexOfToken(tokens,target) {
    if (!target) return -1;
    let index=tokens.indexOf(target);
    if (index >= 0) return index;
    return tokens.findIndex(token => same(token,target));
  }
  function obviousOblique(token) {
    const word=normalize(raw(token).replace(/['’]/gu,''));
    if (!word) return false;
    if (/(?:lere|lara|lerde|larda|lerden|lardan|lerle|larla|dan|den|tan|ten|nda|nde|yla|yle)$/u.test(word)) return true;
    const explicit=normalize(token?.case || token?.morphology?.case || token?.morphology?.nounCase || '');
    return /dat|abl|loc|ins|gen|yonelme|ayrilma|bulunma|tamlayan|dative|ablative|locative|instrumental|genitive/u.test(explicit);
  }
  function eligible(token) {
    const word=normalize(raw(token));
    if (!word || BLOCKED.has(word) || BLOCKED.has(root(token)) || finite(token) || obviousOblique(token)) return false;
    if (/^(?:mi|mı|mu|mü|de|da|ki|\d+)$/u.test(word)) return false;
    return true;
  }
  function cloneSubject(token,source,score) {
    return {...token,raw:raw(token),word:raw(token),root:root(token),role:'subject',source,score};
  }
  function followedByComma(text,token) {
    const end=Number(token?.end);
    if (!Number.isFinite(end)) return false;
    return /^\s*,/u.test(String(text || '').slice(end,end + 4));
  }
  function subjectOverride(sentence,text) {
    const tokens=Array.isArray(sentence?.tokens) ? sentence.tokens : [];
    if (!tokens.length) return null;
    const predicateIndex=indexOfToken(tokens,sentence.predicate);
    const objectIndex=indexOfToken(tokens,sentence.object);

    for (let i=0;i<tokens.length;i++) {
      if (i === objectIndex) continue;
      const word=normalize(raw(tokens[i]));
      if (PRONOUNS.has(word) && followedByComma(text,tokens[i])) return cloneSubject(tokens[i],'v220-pronoun-comma-subject',0.97);
    }

    const agent=tokens.findIndex(token => ['tarafından','tarafindan'].includes(normalize(raw(token))));
    if (agent >= 0 && predicateIndex > agent) {
      for (let i=predicateIndex - 1;i>agent;i--) {
        if (i === objectIndex || !eligible(tokens[i])) continue;
        return cloneSubject(tokens[i],'v220-passive-subject',0.95);
      }
    }

    if (predicateIndex >= 0 && sentence.subject && obviousOblique(sentence.subject)) {
      const before=predicateIndex > 0 ? tokens[predicateIndex - 1] : null;
      if (before && before !== sentence.object && eligible(before)) return cloneSubject(before,'v220-oblique-recovery-subject',0.94);
      const after=predicateIndex + 1 < tokens.length ? tokens[predicateIndex + 1] : null;
      if (after && after !== sentence.object && eligible(after)) return cloneSubject(after,'v220-inverted-subject',0.94);
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
