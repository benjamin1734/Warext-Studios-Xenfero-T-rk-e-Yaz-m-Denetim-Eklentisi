(() => {
  'use strict';

  if (window.__warextSyntaxV220) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.parseSyntaxV220 || !engine?.rankDependencyRoles || !engine?.analyzeMeaning) return;
  window.__warextSyntaxV220 = true;

  const baseSyntax = engine.parseSyntaxV220.bind(engine);
  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const BLOCKED = new Set(['bir','bu','şu','su','çok','cok','daha','en','ve','ile','için','icin','gibi','olarak','sonra','önce','once','bugün','bugun','dün','dun','yarın','yarin','hemen','sadece','yalnızca','yalnizca']);
  const CASE_BLOCK = /acc|dat|abl|loc|ins|gen|belirtme|yonelme|ayrilma|bulunma|tamlayan|accusative|dative|ablative|locative|instrumental|genitive/iu;

  function synthetic(candidate,role) {
    if (!candidate) return null;
    return {raw:candidate.word || '',word:candidate.word || '',root:candidate.root || normalize(candidate.word || ''),case:candidate.case || '',role,score:Number(candidate.score || 0),source:'v220-ranked-fallback'};
  }

  function chooseObject(roles) {
    const direct=(roles || []).filter(item => item.role === 'object-candidate').sort((a,b) => Number(b.score || 0) - Number(a.score || 0));
    if (direct.length) return direct[0];
    const bare=(roles || []).filter(item => item.role === 'bare-object-or-subject' && !BLOCKED.has(normalize(item.word))).sort((a,b) => Number(b.score || 0) - Number(a.score || 0));
    return bare[0] || null;
  }

  function chooseSubject(roles,object) {
    const objectWord=normalize(object?.word || '');
    const candidates=(roles || []).filter(item => {
      const word=normalize(item.word || '');
      if (!word || word === objectWord || BLOCKED.has(word)) return false;
      if (CASE_BLOCK.test(String(item.case || ''))) return false;
      return item.role === 'subject-candidate' || item.role === 'bare-object-or-subject';
    }).sort((a,b) => {
      const roleA=a.role === 'subject-candidate' ? 1 : 0;
      const roleB=b.role === 'subject-candidate' ? 1 : 0;
      if (roleA !== roleB) return roleB - roleA;
      return Number(b.score || 0) - Number(a.score || 0);
    });
    return candidates[0] || null;
  }

  function enhance(text) {
    const report=baseSyntax(text) || {};
    const rankings=engine.rankDependencyRoles(text) || [];
    const sourceSentences=Array.isArray(report.sentences) ? report.sentences : [];
    const count=Math.max(sourceSentences.length,rankings.length);
    const sentences=[];
    for (let index=0; index<count; index++) {
      const current={...(sourceSentences[index] || {})};
      const ranked=rankings[index] || {roles:[]};
      const roles=Array.isArray(ranked.roles) ? ranked.roles : [];
      let object=current.object || null;
      let subject=current.subject || null;
      if (!object) object=synthetic(chooseObject(roles),'object');
      if (!subject) subject=synthetic(chooseSubject(roles,object),'subject');
      const roleConfidence={...(current.roleConfidence || {})};
      if (subject && !roleConfidence.subject) roleConfidence.subject=subject.source === 'v220-ranked-fallback' ? Math.max(0.56,Math.min(0.84,Number(subject.score || 0.64))) : 0.9;
      if (object && !roleConfidence.object) roleConfidence.object=object.source === 'v220-ranked-fallback' ? Math.max(0.62,Math.min(0.95,Number(object.score || 0.7))) : 0.9;
      sentences.push({...current,predicate:current.predicate || (ranked.predicate ? {raw:ranked.predicate,word:ranked.predicate,root:ranked.predicateRoot || normalize(ranked.predicate),source:'v220-ranked-fallback'} : null),subject,object,roleConfidence,crossClause:Array.isArray(current.crossClause) ? current.crossClause : [],rankedRoles:roles});
    }
    return {...report,sentences,dependencyFallback:1};
  }

  engine.parseSyntaxV220=enhance;
  engine.analyzeMeaning=(text,context = {}) => {
    const report=baseMeaning(text,context) || {};
    const syntax=enhance(text);
    return {...report,syntaxV220:syntax,qualityV220:{...(report.qualityV220 || {}),clauses:syntax.clauses?.length || 0,dependencyFallback:1,externalDependencies:0}};
  };
  engine.stats={...(engine.stats || {}),dependencyFallback:1,externalDependencies:0};
})();
