(() => {
  'use strict';

  if (window.__warextMicroIntegrationV200) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const model = window.WarextMicroModelV200;
  if (!engine?.analyzeMeaning || !model?.score) return;
  window.__warextMicroIntegrationV200 = true;

  const baseMeaning = engine.analyzeMeaning.bind(engine);
  const baseSentence = engine.analyzeSentence.bind(engine);
  const baseResolveCoreference = typeof engine.resolveCoreference === 'function' ? engine.resolveCoreference.bind(engine) : null;
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const PRONOUNS = new Set(['o','onu','ona','ondan','onda','onun','bu','bunu','buna','bundan','bunda','bunun','şu','şunu','şuna','şundan','şunda','şunun','kendisi','kendini','kendisine','kendinden']);

  function unique(items) {
    const out=[];
    const seen=new Set();
    for (const item of items || []) {
      if (!item) continue;
      const key=`${item.start}:${item.end}:${item.rule || ''}:${item.message || item.suggestions?.[0] || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function uniqueCoreferences(items) {
    const out=[];
    const seen=new Set();
    for (const item of items || []) {
      if (!item?.pronoun || !item?.antecedent) continue;
      const key=`${item.start}:${item.end}:${normalize(item.pronoun)}:${normalize(item.antecedent)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function fallbackCoreference(rawText,context = {}) {
    const text=String(rawText || '');
    const parse=typeof engine.parseDependencies === 'function' ? engine.parseDependencies(text,context) : null;
    if (!parse?.sentences?.length) return [];
    const resolved=[];
    const memory=[];
    for (const sentence of parse.sentences) {
      for (const token of sentence.tokens || []) {
        const surface=normalize(token.raw);
        if (!PRONOUNS.has(surface)) continue;
        let best=null;
        for (let index=memory.length-1; index>=0; index--) {
          const candidate=memory[index];
          let score=1+(memory.length-index)*0.02;
          if (token.case === 'accusative' || ['onu','bunu','şunu','kendini'].includes(surface)) score += candidate.role === 'object' ? 3 : 0;
          else score += candidate.role === 'subject' ? 3 : 0;
          if (candidate.classes?.has?.('human') && surface === 'o') score += 1;
          if (!best || score > best.score) best={candidate,score};
        }
        if (best) resolved.push({pronoun:token.raw,start:token.start,end:token.end,antecedent:best.candidate.raw,root:best.candidate.root,confidence:Math.min(0.96,0.7+best.score*0.05)});
      }
      for (const [role,item] of [['subject',sentence.subject],['object',sentence.object]]) {
        if (!item?.raw) continue;
        const surface=normalize(item.raw);
        if (PRONOUNS.has(surface)) continue;
        memory.push({role,raw:item.raw,root:item.root || surface,classes:item.classes || new Set()});
      }
    }
    return resolved;
  }

  function resolveCoreference(rawText,context = {}) {
    const primary=baseResolveCoreference ? baseResolveCoreference(rawText,context) || [] : [];
    const fallback=fallbackCoreference(rawText,context);
    return uniqueCoreferences([...primary,...fallback]);
  }

  function meaning(rawText,context = {}) {
    const text=String(rawText || '');
    const report=baseMeaning(text,context) || {warnings:[],fixes:[]};
    if (context.semantic === false) return report;
    const semanticConflicts=(report.warnings || []).filter(item => /semantic-(?:subject|object|valency|quantifier|certainty)|local-language-model/u.test(item.rule || '')).length;
    const dependencies=report.dependencies || [];
    const dependencyComplete=dependencies.length ? dependencies.filter(item => item.predicate && (item.subject || item.object)).length / dependencies.length : 0;
    const idiom=(report.metaphors || []).some(item => item.type === 'idiom') ? 1 : 0;
    const lmScore=Number(report.languageModel?.score ?? 0.5);
    const acceptability=model.score(text,{semanticConflicts,dependencyComplete,idiom,lmScore});
    const warnings=[...(report.warnings || [])];
    if (text.length >= 12 && acceptability < 0.18 && !idiom && semanticConflicts > 0) warnings.push({start:0,end:Math.min(text.length,220),rule:'v200-micro-model-acceptability',confidence:Math.min(0.94,0.78 + (0.18 - acceptability)),category:'semantic',severity:'warning',message:'Yerel mikro model ve sembolik analiz bu cümlenin anlam yapısını düşük olasılıklı buldu.'});
    return {...report,warnings:unique(warnings).sort((a,b)=>(b.confidence || 0)-(a.confidence || 0)||a.start-b.start),coreferences:resolveCoreference(text,context),microModel:{acceptability,accuracy:model.accuracy,dimensions:model.dimensions},semanticExternalModel:0,externalDependencies:0};
  }

  function sentence(rawText,context = {}) {
    const base=baseSentence(rawText,context) || [];
    if (context.semantic === false) return base;
    const report=meaning(rawText,context);
    const out=[...base];
    for (const item of report.fixes || []) if (item?.suggestions?.length) out.push(item);
    return unique(out).sort((a,b)=>a.start-b.start||(b.confidence || 0)-(a.confidence || 0));
  }

  engine.resolveCoreference=resolveCoreference;
  engine.analyzeMeaning=meaning;
  engine.analyzeSentence=sentence;
  engine.stats={...(engine.stats || {}),localMicroModel:1,microModelDimensions:model.dimensions,microModelAccuracy:model.accuracy,semanticExternalModel:0,externalDependencies:0};
})();
