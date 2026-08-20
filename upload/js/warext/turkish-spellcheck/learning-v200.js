(() => {
  'use strict';

  if (window.__warextLearningV200) return;
  const engine = window.WarextTurkishSpellEngineV110;
  if (!engine) return;
  window.__warextLearningV200 = true;

  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const uid = document?.documentElement?.dataset?.loggedIn || window.XF?.config?.userId || window.XF?.config?.user_id || '0';
  const prefix = `warextNlpV200:${location.host}:${uid}`;
  const keys = {feedback:`${prefix}:feedback`,candidates:`${prefix}:candidates`,accepted:`${prefix}:accepted`};

  function read(key,fallback) {
    try { const value=JSON.parse(localStorage.getItem(key) || ''); return value && typeof value === 'object' ? value : fallback; } catch (_) { return fallback; }
  }

  function write(key,value) {
    try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch (_) { return false; }
  }

  function bump(store,key,extra = {}) {
    const data=read(store,{});
    const current=data[key] && typeof data[key] === 'object' ? data[key] : {count:0,first:Date.now()};
    current.count=(current.count || 0)+1;
    current.last=Date.now();
    Object.assign(current,extra);
    data[key]=current;
    const entries=Object.entries(data).sort((a,b)=>(b[1].last || 0)-(a[1].last || 0)).slice(0,800);
    write(store,Object.fromEntries(entries));
    return current;
  }

  function falsePositive(payload = {}) {
    const rule=normalize(payload.rule || 'unknown');
    const text=String(payload.text || '').slice(0,160);
    const word=normalize(payload.word || text);
    const record=bump(keys.feedback,rule,{text,word,confidence:Number(payload.confidence || 0)});
    if (word && /^[a-zçğıöşüâîû'-]{2,64}$/u.test(word)) bump(keys.candidates,word,{rule});
    send({type:'false_positive',rule,word,text,confidence:Number(payload.confidence || 0),count:record.count});
    return record;
  }

  function acceptedSuggestion(payload = {}) {
    const from=normalize(payload.from || '');
    const to=normalize(payload.to || '');
    if (!from || !to) return null;
    const key=`${from}>${to}`;
    const record=bump(keys.accepted,key,{from,to,rule:normalize(payload.rule || '')});
    send({type:'accepted',from,to,rule:normalize(payload.rule || ''),count:record.count});
    return record;
  }

  function candidateWords(minCount = 2) {
    const data=read(keys.candidates,{});
    return Object.entries(data).filter(([,v])=>(v.count || 0)>=minCount).sort((a,b)=>(b[1].count || 0)-(a[1].count || 0)).map(([word,meta])=>({word,...meta}));
  }

  function ruleStats() {
    const data=read(keys.feedback,{});
    return Object.entries(data).sort((a,b)=>(b[1].count || 0)-(a[1].count || 0)).map(([rule,meta])=>({rule,...meta}));
  }

  async function send(payload) {
    const config=document.getElementById('wtsc-config')?.dataset || {};
    if (!['1','true','on','yes'].includes(String(config.feedback || '0').toLowerCase())) return false;
    const endpoint=String(config.feedbackEndpoint || '').trim();
    if (!endpoint || /^https?:\/\//iu.test(endpoint)) return false;
    try {
      const body=new URLSearchParams();
      body.set('_xfResponseType','json');
      body.set('_xfToken',window.XF?.config?.csrf || '');
      body.set('payload',JSON.stringify(payload));
      const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:body.toString()});
      return response.ok;
    } catch (_) { return false; }
  }

  engine.learning={falsePositive,acceptedSuggestion,candidateWords,ruleStats};
  engine.stats={...(engine.stats || {}),localLearning:1,localFeedback:1,externalDependencies:0};
})();
