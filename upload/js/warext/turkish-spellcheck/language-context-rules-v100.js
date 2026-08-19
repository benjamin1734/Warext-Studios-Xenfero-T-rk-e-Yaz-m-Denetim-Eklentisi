(() => {
  'use strict';
  const s = window.WarextV100Lang;
  if (!s || s.extraSentenceIssues) return;
  s.extraSentenceIssues = (text,context = {}) => {
    const issues = s.temporalIssues ? s.temporalIssues(text) : [];
    let m;
    const duplicate = /\b([A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{2,})[ \t]+\1\b/giu;
    while ((m = duplicate.exec(text))) issues.push({start:m.index,end:m.index + m[0].length,suggestions:[m[1]],rule:'v1-duplicate-word',confidence:.995,category:'grammar'});
    const question = text.match(/\b(?:mı|mi|mu|mü|mısın|misin|musun|müsün|mıyım|miyim|muyum|müyüm|mıyız|miyiz|muyuz|müyüz|mısınız|misiniz|musunuz|müsünüz)\s*\.\s*$/iu);
    if (question) {
      const pos = text.lastIndexOf('.');
      issues.push({start:pos,end:pos + 1,suggestions:['?'],rule:'v1-question-terminal',confidence:.995,category:'punctuation'});
    }
    const techRe = /[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{2,}(?:['’][A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]{1,12})?/gu;
    while ((m = techRe.exec(text))) {
      const replacement = s.techSuggestion(m[0]);
      if (replacement && replacement !== m[0]) issues.push({start:m.index,end:m.index + m[0].length,suggestions:[replacement],rule:'v1-tech-abbreviation',confidence:.995,category:'spelling'});
    }
    if (context.longText && context.previousSentence) {
      const previous = String(context.previousSentence);
      if (/\b(?:yarın|dün)\b/iu.test(previous) && !/\b(?:yarın|dün|bugün)\b/iu.test(text)) {
        const joined = `${previous} ${text}`;
        for (const item of s.temporalIssues?.(joined) || []) if (item.start > previous.length) issues.push({...item,start:item.start - previous.length - 1,end:item.end - previous.length - 1,rule:'v1-cross-sentence-temporal'});
      }
    }
    const seen = new Set();
    return issues.filter(item => {
      const key = `${item.start}:${item.end}:${item.rule}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
})();
