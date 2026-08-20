(() => {
  'use strict';

  if (window.__warextSyntaxV220) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine?.parseSyntaxV220 || !engine?.rankDependencyRoles || !engine?.analyzeMeaning) return;
  window.__warextSyntaxV220 = true;

  const baseSyntax = engine.parseSyntaxV220.bind(engine);
  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const morphology = typeof engine.analyzeMorphology === 'function' ? engine.analyzeMorphology.bind(engine) : () => null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const BLOCKED = new Set(['bir','bu','şu','su','bazı','bazi','her','tüm','tum','bütün','butun','hiçbir','hicbir','hangi','kaç','kac','birçok','bircok','birkaç','birkac','çok','cok','daha','en','ve','ile','için','icin','gibi','olarak','sonra','önce','once','bugün','bugun','dün','dun','yarın','yarin','hemen','sadece','yalnızca','yalnizca','işte','iste','oysa','ancak','fakat','ama','çünkü','cunku']);
  const ADVERBIAL = new Set(['tam','yalnız','yalniz','hızla','hizla','yavaşça','yavasca','dikkatlice','birden','artık','artik','yine','tekrar','belki','kesinlikle','muhtemelen','genellikle','çoğunlukla','cogunlukla','özellikle','ozellikle']);
  const TIME_ROOTS = new Set(['yıl','yil','gün','gun','hafta','ay','saat','dakika','sabah','akşam','aksam','gece','zaman']);
  const PRONOUN_SUBJECTS = new Set(['ben','sen','o','biz','siz','onlar','kim','biri','birisi','hepsi','çoğu','cogu']);
  const CASE_BLOCK = /acc|dat|abl|loc|ins|gen|belirtme|yonelme|ayrilma|bulunma|tamlayan|accusative|dative|ablative|locative|instrumental|genitive/iu;

  function synthetic(candidate,role,source = 'v220-ranked-fallback') {
    if (!candidate) return null;
    return {raw:candidate.raw || candidate.word || '',word:candidate.word || candidate.raw || '',root:candidate.root || normalize(candidate.word || candidate.raw || ''),case:candidate.case || '',start:candidate.start,end:candidate.end,role,score:Number(candidate.score || candidate.subjectScore || 0),source};
  }

  function chooseObject(roles) {
    const direct=(roles || []).filter(item => item.role === 'object-candidate').sort((a,b) => Number(b.score || 0) - Number(a.score || 0));
    if (direct.length) return direct[0];
    const bare=(roles || []).filter(item => item.role === 'bare-object-or-subject' && !BLOCKED.has(normalize(item.word))).sort((a,b) => Number(b.score || 0) - Number(a.score || 0));
    return bare[0] || null;
  }

  function derivedCase(token) {
    const explicit=String(token?.case || token?.morphology?.case || token?.morphology?.nounCase || '');
    if (CASE_BLOCK.test(explicit)) return true;
    const word=normalize(token?.raw || token?.word || '');
    const root=normalize(token?.root || token?.morphology?.root || '');
    if (!word || !root || word === root || !word.startsWith(root)) return false;
    const suffix=word.slice(root.length).replace(/['’]/gu,'');
    if (/^(?:y?[ae]|[dt][ae]n|[dt][ae]|y?l[ae]|[ıiuü]n(?:d[ae]|d[ae]n)?|[nsy]?[ıiuü](?:n)?[ae]|l[ae]r(?:d[ae]|d[ae]n))$/u.test(suffix)) return true;
    return false;
  }

  function finiteLike(token) {
    const analysis=token?.morphology || morphology(token?.raw || token?.word || '');
    return !!(analysis?.valid && analysis?.mode === 'verb');
  }

  function knowledgeClasses(token) {
    if (token?.classes instanceof Set) return [...token.classes];
    if (Array.isArray(token?.classes)) return token.classes;
    return engine.knowledge?.classes?.(token?.root || token?.raw || token?.word || '') || [];
  }

  function compatibleSubject(token,predicateRoot) {
    const frame=engine.knowledge?.frame?.(predicateRoot || '');
    const expected=Array.isArray(frame?.subject) ? frame.subject : [];
    const classes=knowledgeClasses(token);
    if (!expected.length || !classes.length) return 0;
    return expected.some(value => classes.includes(value)) ? 1 : -1;
  }

  function punctuationAfter(text,token,char) {
    const end=Number(token?.end);
    if (!Number.isFinite(end)) return false;
    return String(text || '').slice(end,end + 3).includes(char);
  }

  function subjectCandidateScore(token,index,tokens,predicateIndex,objectIndex,predicateRoot,text) {
    const word=normalize(token?.raw || token?.word || '');
    const root=normalize(token?.root || token?.morphology?.root || word);
    if (!word || finiteLike(token) || derivedCase(token)) return -100;
    if (objectIndex === index) return -100;
    let score=0;
    if (PRONOUN_SUBJECTS.has(word) || PRONOUN_SUBJECTS.has(root)) score+=2.4;
    if (BLOCKED.has(word) || BLOCKED.has(root)) score-=4.5;
    if (ADVERBIAL.has(word) || ADVERBIAL.has(root)) score-=3.5;
    if (TIME_ROOTS.has(root) && word !== root) score-=2.3;
    if (/(?:arak|erek|ınca|ince|unca|ünce|ip|ıp|up|üp|madan|meden|ken|casına|cesine)$/u.test(word)) score-=4;
    if (/(?:ca|ce|ça|çe)$/u.test(word) && word.length > 5) score-=1.3;
    const semantic=compatibleSubject(token,predicateRoot);
    if (semantic > 0) score+=4.5;
    else if (semantic < 0) score-=2.5;
    const classes=knowledgeClasses(token);
    if (classes.length) score+=0.8;
    const raw=String(token?.raw || token?.word || '');
    if (/^[A-ZÇĞİÖŞÜ]/u.test(raw) && Number(token?.start || 0) > 0) score+=1.25;
    if (/(?:lar|ler)(?:ı|i|u|ü|ın|in|un|ün)?$/u.test(word)) score+=0.75;
    if (punctuationAfter(text,token,',')) score+=1.25;
    if (objectIndex >= 0) {
      if (index < objectIndex) score+=2.2 + Math.max(0,1.4 - (objectIndex - index - 1) * 0.22);
      else if (index < predicateIndex) score+=0.15;
      else score-=0.4;
    } else if (predicateIndex >= 0) {
      if (index < predicateIndex) score+=1.25 + Math.max(0,1.05 - (predicateIndex - index - 1) * 0.16);
      else if (index === predicateIndex + 1) score+=2.35;
      else if (index > predicateIndex) score+=Math.max(0.35,1.5 - (index - predicateIndex - 1) * 0.35);
    }
    const analysis=token?.morphology || morphology(raw);
    if (analysis?.valid && analysis?.mode && analysis.mode !== 'verb') score+=0.25;
    return score;
  }

  function chooseSurfaceSubject(current,object,predicate,text) {
    const tokens=Array.isArray(current?.tokens) ? current.tokens : [];
    if (!tokens.length) return null;
    let predicateIndex=tokens.indexOf(current?.predicate);
    if (predicateIndex < 0 && predicate) {
      const targetRoot=normalize(predicate.root || predicate.word || predicate.raw || '');
      for (let i=tokens.length - 1;i>=0;i--) {
        if (normalize(tokens[i]?.root || tokens[i]?.raw || '') === targetRoot || normalize(tokens[i]?.raw || '') === normalize(predicate.raw || predicate.word || '')) { predicateIndex=i; break; }
      }
    }
    if (predicateIndex < 0) predicateIndex=tokens.length - 1;
    let objectIndex=tokens.indexOf(object);
    if (objectIndex < 0 && object) {
      const target=normalize(object.raw || object.word || object.root || '');
      objectIndex=tokens.findIndex(token => normalize(token?.raw || token?.word || token?.root || '') === target);
    }
    const predicateRoot=normalize(predicate?.root || current?.predicate?.root || '');
    const candidates=tokens.map((token,index) => ({token,index,subjectScore:subjectCandidateScore(token,index,tokens,predicateIndex,objectIndex,predicateRoot,text)})).filter(item => item.subjectScore > -20).sort((a,b) => b.subjectScore - a.subjectScore || a.index - b.index);
    if (!candidates.length || candidates[0].subjectScore < 0.65) return null;
    return {...candidates[0].token,subjectScore:candidates[0].subjectScore};
  }

  function chooseRankedSubject(roles,object) {
    const objectWord=normalize(object?.word || object?.raw || '');
    const candidates=(roles || []).filter(item => {
      const word=normalize(item.word || '');
      if (!word || word === objectWord || BLOCKED.has(word)) return false;
      if (CASE_BLOCK.test(String(item.case || ''))) return false;
      return item.role === 'subject-candidate' || item.role === 'bare-object-or-subject';
    }).sort((a,b) => Number(a.index ?? 999) - Number(b.index ?? 999) || Number(b.score || 0) - Number(a.score || 0));
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
      if (!object) object=synthetic(chooseObject(roles),'object');
      const predicate=current.predicate || (ranked.predicate ? {raw:ranked.predicate,word:ranked.predicate,root:ranked.predicateRoot || normalize(ranked.predicate),source:'v220-ranked-fallback'} : null);
      const surfaceSubject=chooseSurfaceSubject(current,object,predicate,text);
      let subject=surfaceSubject ? synthetic(surfaceSubject,'subject','v220-surface-subject') : current.subject || null;
      if (!subject) subject=synthetic(chooseRankedSubject(roles,object),'subject');
      const roleConfidence={...(current.roleConfidence || {})};
      if (subject?.source === 'v220-surface-subject') roleConfidence.subject=Math.max(0.58,Math.min(0.94,0.58 + Number(subject.score || 0) * 0.045));
      else if (subject && !roleConfidence.subject) roleConfidence.subject=subject.source === 'v220-ranked-fallback' ? Math.max(0.56,Math.min(0.84,Number(subject.score || 0.64))) : 0.9;
      if (object && !roleConfidence.object) roleConfidence.object=object.source === 'v220-ranked-fallback' ? Math.max(0.62,Math.min(0.95,Number(object.score || 0.7))) : 0.9;
      sentences.push({...current,predicate,subject,object,roleConfidence,crossClause:Array.isArray(current.crossClause) ? current.crossClause : [],rankedRoles:roles});
    }
    return {...report,sentences,dependencyFallback:1,surfaceSubjectRanking:1};
  }

  engine.parseSyntaxV220=enhance;
  engine.analyzeMeaning=(text,context = {}) => {
    const report=baseMeaning(text,context) || {};
    const syntax=enhance(text);
    return {...report,syntaxV220:syntax,qualityV220:{...(report.qualityV220 || {}),clauses:syntax.clauses?.length || 0,dependencyFallback:1,surfaceSubjectRanking:1,externalDependencies:0}};
  };
  engine.stats={...(engine.stats || {}),dependencyFallback:1,surfaceSubjectRanking:1,externalDependencies:0};
})();
