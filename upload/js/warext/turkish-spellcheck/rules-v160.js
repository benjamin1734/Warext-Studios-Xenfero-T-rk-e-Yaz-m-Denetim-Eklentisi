(() => {
  'use strict';

  const G = typeof globalThis !== 'undefined' ? globalThis : self;
  if (G.WarextTurkishRulesV160) return;

  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const TOKEN_RE = new RegExp(`[${LETTERS}]{2,}`, 'gu');
  const normalize = value => String(value || '').replace(/I/g,'ı').replace(/İ/g,'i').toLocaleLowerCase('tr-TR').trim();
  const capitalize = value => {
    const s = String(value || '');
    if (!s) return s;
    return s[0].replace(/i/g,'İ').replace(/ı/g,'I').toLocaleUpperCase('tr-TR') + s.slice(1);
  };

  const BUILTIN_PROPER_NAMES = new Set([
    'türkiye','ankara','istanbul','izmir','bursa','antalya','adana','konya','gaziantep','şanlıurfa','kocaeli',
    'mersin','diyarbakır','hatay','manisa','kayseri','samsun','balıkesir','kahramanmaraş','van','aydın','denizli',
    'sakarya','tekirdağ','muğla','eskişehir','mardin','trabzon','ordu','afyonkarahisar','malatya','erzurum','sivas',
    'batman','tokat','elazığ','zonguldak','çanakkale','osmaniye','kütahya','çorum','ağrı','giresun','ısparta',
    'aksaray','edirne','düzce','yozgat','muş','kastamonu','kırklareli','niğde','uşak','bitlis','rize','amasya',
    'siirt','bolu','nevşehir','kars','kırıkkale','hakkari','bingöl','burdur','karaman','karabük','kırşehir','erzincan',
    'bilecik','sinop','ığdır','bartın','çankırı','artvin','kilis','gümüşhane','ardahan','bayburt','tunceli','yalova',
    'ataturk','atatürk','xenforo','minecraft','discord','github','warext'
  ]);

  const CATEGORY_LABELS = {
    spelling:'Yazım',
    grammar:'Dilbilgisi',
    punctuation:'Noktalama',
    capitalization:'Büyük harf',
    proper:'Özel isim',
    style:'Cümle yapısı'
  };

  const PHRASE_RULES = [
    {re:/\bbir\s+çok\b/giu,suggestions:['birçok'],category:'spelling',rule:'phrase-bircok',message:'Bu sözcük bitişik yazılır.'},
    {re:/\bbir\s+kaç\b/giu,suggestions:['birkaç'],category:'spelling',rule:'phrase-birkac',message:'Bu sözcük bitişik yazılır.'},
    {re:/\bhiç\s+bir\b/giu,suggestions:['hiçbir'],category:'spelling',rule:'phrase-hicbir',message:'Bu sözcük bitişik yazılır.'},
    {re:/\bher\s+hangi\b/giu,suggestions:['herhangi'],category:'spelling',rule:'phrase-herhangi',message:'Bu sözcük bitişik yazılır.'},
    {re:/\bşu\s+an\s+ki\b/giu,suggestions:['şu anki'],category:'spelling',rule:'phrase-suanki',message:'“-ki” burada önceki sözcüğe bitişir.'},
    {re:/\bama\s+fakat\b/giu,suggestions:['ama','fakat'],category:'style',rule:'double-contrast',message:'Aynı karşıtlık görevindeki iki bağlaçtan biri yeterlidir.'},
    {re:/\bfakat\s+ama\b/giu,suggestions:['fakat','ama'],category:'style',rule:'double-contrast',message:'Aynı karşıtlık görevindeki iki bağlaçtan biri yeterlidir.'}
  ];

  function makeIssue(start, end, suggestions, category, rule, message, word = '', confidence = 1) {
    return {start,end,suggestions:[...new Set((suggestions || []).filter(Boolean))].slice(0,3),category,rule,message,word,confidence,label:CATEGORY_LABELS[category] || category};
  }

  function overlaps(a, b) {
    if (a.start === a.end || b.start === b.end) return false;
    return Math.max(a.start,b.start) < Math.min(a.end,b.end);
  }

  function addIssue(list, issue, limit) {
    if (!issue || !issue.suggestions?.length) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const current = list[i];
      if (current.rule === issue.rule && current.start === issue.start && current.end === issue.end) return;
      if (current.start !== issue.start || current.end !== issue.end) continue;
      if ((current.confidence || 0) >= (issue.confidence || 0)) return;
      list.splice(i,1);
    }
    list.push(issue);
    list.sort((a,b) => b.confidence - a.confidence || a.start - b.start || a.end - b.end);
    if (list.length > limit) list.length = limit;
  }

  function tokenize(text, start = 0, end = text.length) {
    const out = [];
    const slice = text.slice(start,end);
    const re = new RegExp(TOKEN_RE.source,'gu');
    let match;
    while ((match = re.exec(slice))) {
      const absolute = start + match.index;
      out.push({word:match[0],normalized:normalize(match[0]),start:absolute,end:absolute+match[0].length});
    }
    return out;
  }

  function sentenceBounds(text, position) {
    let anchor = Math.max(0,Math.min(text.length,position));
    let left = anchor - 1;
    while (left >= 0 && /[ \t]/u.test(text[left])) left--;
    if (left >= 0 && /[.!?…]/u.test(text[left])) anchor = left;
    let start = 0;
    let end = text.length;
    for (let i = Math.max(0,anchor-1); i >= 0; i--) {
      if (/[.!?…\n]/u.test(text[i])) { start = i + 1; break; }
    }
    for (let i = Math.max(0,anchor); i < text.length; i++) {
      if (/[.!?…\n]/u.test(text[i])) { end = i + 1; break; }
    }
    while (start < end && /\s/u.test(text[start])) start++;
    return {start,end};
  }

  function sentenceWindows(text, changedStart = 0, changedEnd = text.length) {
    if (!text) return [];
    const first = sentenceBounds(text, changedStart);
    const last = sentenceBounds(text, Math.max(changedStart, changedEnd));
    const start = first.start;
    const end = Math.max(first.end,last.end);
    return [{start,end}];
  }

  function genitiveCandidate(word) {
    const n = normalize(word);
    let vowel = '';
    for (let i = n.length - 1; i >= 0; i--) {
      if ('aeıioöuü'.includes(n[i])) { vowel = n[i]; break; }
    }
    let high = '';
    if ('aı'.includes(vowel)) high = 'ı';
    else if ('ei'.includes(vowel)) high = 'i';
    else if ('ou'.includes(vowel)) high = 'u';
    else if ('öü'.includes(vowel)) high = 'ü';
    if (!high) return '';
    const endsVowel = /[aeıioöuü]$/u.test(n);
    return word + (endsVowel ? `n${high}n` : `${high}n`);
  }

  function scanPhrases(text, start, end, issues, limit) {
    const segment = text.slice(start,end);
    for (const item of PHRASE_RULES) {
      const re = new RegExp(item.re.source,item.re.flags);
      let match;
      while ((match = re.exec(segment))) {
        const absolute = start + match.index;
        addIssue(issues,makeIssue(absolute,absolute+match[0].length,item.suggestions,item.category,item.rule,item.message,match[0],0.99),limit);
      }
    }
  }

  function scanPunctuation(text, start, end, issues, limit, options) {
    if (options.punctuation === false) return;
    const segment = text.slice(start,end);
    let match;

    const beforeRe = new RegExp(`([${LETTERS}]{2,})\\s+([,;:.!?])`,'gu');
    while ((match = beforeRe.exec(segment))) {
      const absolute = start + match.index;
      addIssue(issues,makeIssue(absolute,absolute+match[0].length,[`${match[1]}${match[2]}`],'punctuation','punctuation-space-before','Noktalama işaretinden önce boşluk bırakılmaz.',match[0],1),limit);
    }

    const afterRe = new RegExp(`([${LETTERS}]{2,})([,;:.!?])([${LETTERS}]{2,})`,'gu');
    while ((match = afterRe.exec(segment))) {
      const absolute = start + match.index;
      addIssue(issues,makeIssue(absolute,absolute+match[0].length,[`${match[1]}${match[2]} ${match[3]}`],'punctuation','punctuation-space-after','Noktalama işaretinden sonra boşluk bırakılmalıdır.',match[0],0.98),limit);
    }

    const repeatRe = /([!?;,.:])\1+/gu;
    while ((match = repeatRe.exec(segment))) {
      if (match[1] === '.' && match[0] === '...') continue;
      const absolute = start + match.index;
      addIssue(issues,makeIssue(absolute,absolute+match[0].length,[match[1]],'punctuation','punctuation-repeat','Gereksiz yinelenen noktalama işareti.',match[0],0.96),limit);
    }

    const multipleSpace = / {2,}/gu;
    while ((match = multipleSpace.exec(segment))) {
      const absolute = start + match.index;
      addIssue(issues,makeIssue(absolute,absolute+match[0].length,[' '],'punctuation','multiple-spaces','Birden fazla boşluk yerine tek boşluk kullanın.',match[0],0.92),limit);
    }

    const sentenceCase = /([.!?…])([ \t]+)([a-zçğıöşü])/gu;
    while ((match = sentenceCase.exec(segment))) {
      const charStart = start + match.index + match[1].length + match[2].length;
      addIssue(issues,makeIssue(charStart,charStart+match[3].length,[capitalize(match[3])],'capitalization','sentence-after-punctuation','Yeni cümle büyük harfle başlamalı.',match[3],0.98),limit);
    }

    const stack = [];
    const pairs = {'(':')','[':']','{':'}','“':'”'};
    const closes = new Set(Object.values(pairs));
    let quoteOpen = false;
    for (let i = 0; i < segment.length; i++) {
      const ch = segment[i];
      if (pairs[ch]) stack.push({ch,index:i,close:pairs[ch]});
      else if (closes.has(ch)) {
        const last = stack[stack.length-1];
        if (last?.close === ch) stack.pop();
      } else if (ch === '"') {
        quoteOpen = !quoteOpen;
      }
    }
    if (stack.length) {
      const last = stack[stack.length-1];
      addIssue(issues,makeIssue(end,end,[last.close],'punctuation','unclosed-bracket','Açılan parantez veya köşeli ayraç kapatılmalı.','',0.9),limit);
    }
    if (quoteOpen) addIssue(issues,makeIssue(end,end,['"'],'punctuation','unclosed-quote','Açılan çift tırnak kapatılmalı.','',0.88),limit);
  }

  function scanProperNames(text, tokens, engine, issues, limit, options) {
    if (options.properNames === false) return;
    const configured = new Set(BUILTIN_PROPER_NAMES);
    for (const item of options.customProperNames || []) configured.add(normalize(item));
    const suffixes = ['larımızdan','lerimizden','larınızdan','lerinizden','nın','nin','nun','nün','dan','den','tan','ten','ya','ye','yı','yi','yu','yü','da','de','ta','te','ın','in','un','ün','a','e'];
    for (const token of tokens) {
      const raw = token.word;
      if (!/^[A-ZÇĞİÖŞÜ]/u.test(raw)) continue;
      if (text[token.end] === "'" || text[token.end] === '’') continue;
      const lower = normalize(raw);
      for (const suffix of suffixes) {
        if (!lower.endsWith(suffix) || lower.length <= suffix.length + 1) continue;
        const baseLower = lower.slice(0,-suffix.length);
        const baseRaw = raw.slice(0, raw.length - suffix.length);
        const allCaps = /^[A-ZÇĞİÖŞÜ]{2,}$/u.test(baseRaw);
        const inferredName = !engine.isValid(baseLower);
        if (!allCaps && !configured.has(baseLower) && !inferredName) continue;
        const suggestion = `${baseRaw}'${raw.slice(raw.length-suffix.length)}`;
        addIssue(issues,makeIssue(token.start,token.end,[suggestion],'proper','proper-name-apostrophe','Özel adlara gelen çekim eki kesme işaretiyle ayrılır.',raw,0.97),limit);
        break;
      }
    }
  }

  function scanDeDaKi(text, tokens, engine, issues, limit, options) {
    if (options.grammar === false) return;
    const pronounAttached = new Map([['bende','ben de'],['sende','sen de'],['oda','o da'],['bizde','biz de'],['sizde','siz de'],['onlarda','onlar da']]);
    const kiExceptions = new Set(['belki','çünkü','halbuki','mademki','sanki','oysa']);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const next = tokens[i+1];
      const prev = tokens[i-1];
      const atSentenceStart = !prev || /[.!?…\n]\s*$/u.test(text.slice(prev.end,token.start));
      const attached = pronounAttached.get(token.normalized);
      if (attached && atSentenceStart && next && engine.isFiniteVerb?.(next.word) && !['var','yok'].includes(next.normalized)) {
        const cased = /^[A-ZÇĞİÖŞÜ]/u.test(token.word) ? capitalize(attached) : attached;
        addIssue(issues,makeIssue(token.start,token.end,[cased],'grammar','conjunction-de-da','Bağlaç olan “de/da” ayrı yazılır.',token.word,1),limit);
      }

      if (token.normalized.endsWith('ki') && token.normalized.length > 4 && !kiExceptions.has(token.normalized)) {
        const stemRaw = token.word.slice(0,-2);
        const stem = normalize(stemRaw);
        const finiteStem = engine.isFiniteVerb?.(stem);
        const invalidCombined = !engine.isValid(token.word);
        if (finiteStem || (invalidCombined && engine.isValid(stem))) {
          addIssue(issues,makeIssue(token.start,token.end,[`${stemRaw} ki`],'grammar','conjunction-ki','Bağlaç olan “ki” ayrı yazılır.',token.word,0.995),limit);
        }
      }

      if (i >= 2 && token.normalized === 'ki' && tokens[i-1]?.normalized.match(/^(?:de|da)$/u)) {
        const base = tokens[i-2];
        const middle = tokens[i-1];
        const combined = `${base.word}${middle.word}${token.word}`;
        if (engine.isValid(combined)) {
          addIssue(issues,makeIssue(base.start,token.end,[combined],'grammar','suffix-ki-combined','Bulunma eki ve “-ki” burada bitişik yazılır.',text.slice(base.start,token.end),0.93),limit);
        }
      }
    }
  }

  function scanContextGrammar(text, tokens, engine, issues, limit, options) {
    if (options.grammar === false) return;
    for (let i = 0; i + 3 < tokens.length; i++) {
      const first = tokens[i], second = tokens[i+1], third = tokens[i+2], fourth = tokens[i+3];
      if (second.normalized !== 'en') continue;
      if (!engine.isValid(third.word) || !engine.isValid(fourth.word)) continue;
      const candidate = genitiveCandidate(first.word);
      if (candidate && normalize(candidate) !== first.normalized && engine.isValid(candidate)) {
        const suggestion = /^[A-ZÇĞİÖŞÜ]/u.test(first.word) ? capitalize(candidate) : candidate;
        addIssue(issues,makeIssue(first.start,first.end,[suggestion],'grammar','context-genitive','Bu cümle yapısında tamlayan eki gerekebilir.',first.word,0.86),limit);
      }
    }
  }

  function scanWords(text, start, end, tokens, engine, issues, limit, options) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (text[token.start-1] === "'" || text[token.start-1] === '’' || text[token.end] === "'" || text[token.end] === '’') continue;
      if (/https?:|www\.|@/iu.test(text.slice(Math.max(start,token.start-12),Math.min(end,token.end+12)))) continue;
      const prev = tokens[i-1];
      const bounds = sentenceBounds(text,token.start);
      const sentenceStart = text.slice(bounds.start,token.start).trim() === '';
      const result = engine.check(token.word,{previousWord:prev?.word || '',sentenceStart,before:text.slice(bounds.start,token.end),informal:options.informal});
      if (!result || result.correct || !result.suggestions?.length) continue;
      addIssue(issues,makeIssue(token.start,token.end,result.suggestions,result.category || 'spelling',`word-${result.provider || 'spell'}`,result.message || 'Yazım önerisi.',token.word,result.category === 'capitalization' ? 0.99 : 0.9),limit);
    }
  }

  function scanTerminal(text, start, end, tokens, issues, limit, options, caret) {
    if (options.punctuation === false || options.isTitle) return;
    const segment = text.slice(start,end);
    const trimmed = segment.trimEnd();
    if (!trimmed || tokens.length < 2) return;
    const absoluteEnd = start + trimmed.length;
    if (caret < absoluteEnd) return;
    if (/[.!?…]["”')\]]*$/u.test(trimmed)) return;
    const normalized = normalize(trimmed);
    const questionLike = /\b(?:mı|mi|mu|mü|mısın|misin|musun|müsün|mısınız|misiniz|musunuz|müsünüz|neden|niçin|nasıl|kim|ne|nerede|nereye|nereden|kaç|hangi)\b/u.test(normalized);
    addIssue(issues,makeIssue(absoluteEnd,absoluteEnd,[questionLike?'?':'.'],'punctuation','sentence-terminal-punctuation','Cümle uygun bir noktalama işaretiyle bitmeli.','',0.84),limit);
  }

  function analyze(text, payload = {}) {
    const engine = G.WarextTurkishSpellEngineV160;
    if (!engine) return {issues:[],error:'engine-missing'};
    const options = payload.options || {};
    engine.setRuntimeLexicon({
      adminWords:options.adminWords || [],
      userWords:options.userWords || [],
      ignoredWords:options.ignoredWords || []
    });

    const maxIssues = Math.max(3,Math.min(Number(options.maxIssues || 40),100));
    const caret = Math.max(0,Math.min(text.length,Number(payload.caret ?? text.length)));
    const changedStart = Math.max(0,Math.min(text.length,Number(payload.changedStart ?? caret)));
    const changedEnd = Math.max(changedStart,Math.min(text.length,Number(payload.changedEnd ?? caret)));
    const windows = sentenceWindows(text,changedStart,changedEnd);
    const issues = [];

    for (const window of windows) {
      const tokens = tokenize(text,window.start,window.end);
      scanPhrases(text,window.start,window.end,issues,maxIssues);
      scanPunctuation(text,window.start,window.end,issues,maxIssues,options);
      scanProperNames(text,tokens,engine,issues,maxIssues,options);
      scanDeDaKi(text,tokens,engine,issues,maxIssues,options);
      scanContextGrammar(text,tokens,engine,issues,maxIssues,options);
      scanWords(text,window.start,window.end,tokens,engine,issues,maxIssues,options);
      scanTerminal(text,window.start,window.end,tokens,issues,maxIssues,options,caret);
    }

    const ignored = new Set((options.ignoredWords || []).map(normalize));
    const accepted = new Set([...(options.adminWords || []),...(options.userWords || [])].map(normalize));
    const filtered = issues.filter(issue => {
      const key = normalize(issue.word || '');
      if (!key || /\s/u.test(key)) return true;
      if (ignored.has(key)) return false;
      if (accepted.has(key) && ['spelling','grammar','proper'].includes(issue.category)) return false;
      return true;
    });
    filtered.sort((a,b) => a.start - b.start || b.confidence - a.confidence);
    return {issues:filtered.slice(0,maxIssues),version:'1',build:'1.6.0'};
  }

  G.WarextTurkishRulesV160 = {analyze,tokenize,sentenceBounds,labels:CATEGORY_LABELS};
})();
