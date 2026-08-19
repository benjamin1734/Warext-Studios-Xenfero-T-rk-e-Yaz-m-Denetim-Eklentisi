(() => {
  'use strict';

  const VERSION = '3.1.0';
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const TOKEN_RE = new RegExp(`[${LETTERS}]{2,}`, 'gu');
  const CLOSERS = new Set(['"','”','’',"'",')',']','}']);

  function mergeRanges(ranges) {
    const sorted = (ranges || []).filter(range => range && range.end > range.start).sort((a,b) => a.start - b.start || a.end - b.end);
    const out = [];
    for (const range of sorted) {
      const last = out[out.length - 1];
      if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
      else out.push({start:range.start,end:range.end});
    }
    return out;
  }

  function protectedRanges(text) {
    const source = String(text || '');
    const ranges = [];
    const addMatches = re => {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(source))) {
        ranges.push({start:match.index,end:match.index + match[0].length});
        if (!match[0].length) re.lastIndex++;
      }
    };
    addMatches(/\[(?:CODE|PHP|HTML|ICODE|PLAIN)\b[^\]]*\][\s\S]*?\[\/(?:CODE|PHP|HTML|ICODE|PLAIN)\]/giu);
    addMatches(/\[\/?[A-Z][^\]\n]{0,200}\]/giu);
    addMatches(/```[\s\S]*?```/gu);
    addMatches(/`[^`\n]+`/gu);
    addMatches(/(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()\[\]{}]+/giu);
    addMatches(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu);
    addMatches(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s<>()\[\]{}]*)?/giu);
    addMatches(/(?<![A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû0-9])[@#][A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{2,}/gu);
    addMatches(/\b(?:\d{1,3}\.){3}\d{1,3}\b/gu);
    addMatches(/\b[A-Za-z]:\\(?:[^\\\s]+\\)*[^\\\s]*/gu);
    addMatches(/(?:\/[A-Za-z0-9_.-]+){2,}(?:\/[A-Za-z0-9_.-]+)?/gu);
    return mergeRanges(ranges);
  }

  function rangeAt(ranges, position) {
    for (const range of ranges || []) {
      if (position < range.start) return null;
      if (position >= range.start && position < range.end) return range;
    }
    return null;
  }

  function isProtected(ranges, start, end = start + 1) {
    const targetEnd = Math.max(start + 1, end);
    return (ranges || []).some(range => range.start < targetEnd && range.end > start);
  }

  function maskText(text, ranges) {
    if (!ranges?.length) return String(text || '');
    const chars = String(text || '').split('');
    for (const range of ranges) {
      for (let i = Math.max(0, range.start); i < Math.min(chars.length, range.end); i++) {
        if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = '\uE000';
      }
    }
    return chars.join('');
  }

  function trimSegment(text, start, end) {
    let a = Math.max(0, start);
    let b = Math.min(text.length, end);
    while (a < b && /\s/u.test(text[a])) a++;
    while (b > a && /\s/u.test(text[b - 1])) b--;
    return b > a ? {start:a,end:b,text:text.slice(a,b)} : null;
  }

  function splitLongSegment(segment, maxLength = 1800) {
    if (!segment || segment.end - segment.start <= maxLength) return segment ? [segment] : [];
    const out = [];
    const text = segment.text;
    let localStart = 0;
    while (localStart < text.length) {
      let localEnd = Math.min(text.length, localStart + maxLength);
      if (localEnd < text.length) {
        const floor = Math.max(localStart + Math.floor(maxLength * 0.58), localStart + 1);
        let cut = -1;
        for (let i = localEnd; i >= floor; i--) {
          if (/[;,:\s]/u.test(text[i - 1] || '')) {
            cut = i;
            break;
          }
        }
        if (cut > localStart) localEnd = cut;
      }
      const piece = trimSegment(text, localStart, localEnd);
      if (piece) out.push({start:segment.start + piece.start,end:segment.start + piece.end,text:piece.text});
      localStart = Math.max(localEnd, localStart + 1);
    }
    return out;
  }

  function sentenceSegments(text, ranges = [], maxLength = 1800) {
    const source = String(text || '');
    if (!source) return [];
    const protectedList = mergeRanges(ranges);
    const base = [];
    let start = 0;
    let i = 0;
    const push = end => {
      const segment = trimSegment(source, start, end);
      if (segment) base.push(segment);
      start = end;
    };
    while (i < source.length) {
      const protectedRange = rangeAt(protectedList, i);
      if (protectedRange) {
        i = protectedRange.end;
        continue;
      }
      const ch = source[i];
      if (ch === '\r') {
        i++;
        continue;
      }
      if (ch === '\n') {
        let j = i + 1;
        while (j < source.length && (source[j] === '\n' || source[j] === '\r' || source[j] === ' ' || source[j] === '\t')) j++;
        push(i);
        start = j;
        i = j;
        continue;
      }
      if (/[.!?…]/u.test(ch)) {
        let j = i + 1;
        while (j < source.length && /[.!?…]/u.test(source[j]) && !isProtected(protectedList, j, j + 1)) j++;
        while (j < source.length && CLOSERS.has(source[j])) j++;
        if (j >= source.length || /\s/u.test(source[j])) {
          push(j);
          while (j < source.length && /\s/u.test(source[j])) j++;
          start = j;
          i = j;
          continue;
        }
      }
      i++;
    }
    push(source.length);
    const out = [];
    for (const segment of base) out.push(...splitLongSegment(segment, maxLength));
    return out;
  }

  function paragraphSegments(text) {
    const source = String(text || '');
    const out = [];
    const re = /(?:\r?\n){2,}/gu;
    let start = 0;
    let match;
    while ((match = re.exec(source))) {
      const segment = trimSegment(source, start, match.index);
      if (segment) out.push(segment);
      start = match.index + match[0].length;
    }
    const last = trimSegment(source, start, source.length);
    if (last) out.push(last);
    return out;
  }

  function tokens(text, ranges = []) {
    const source = String(text || '');
    const out = [];
    TOKEN_RE.lastIndex = 0;
    let match;
    while ((match = TOKEN_RE.exec(source))) {
      const start = match.index;
      const end = start + match[0].length;
      if (!isProtected(ranges, start, end)) out.push({word:match[0],start,end});
      if (!match[0].length) TOKEN_RE.lastIndex++;
    }
    return out;
  }

  function changedRange(before, after) {
    const oldText = String(before || '');
    const newText = String(after || '');
    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) start++;
    let oldTail = oldText.length;
    let newTail = newText.length;
    while (oldTail > start && newTail > start && oldText[oldTail - 1] === newText[newTail - 1]) {
      oldTail--;
      newTail--;
    }
    return {start,oldEnd:oldTail,newEnd:newTail,delta:newText.length - oldText.length};
  }

  function hashString(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function cacheKey(segments, index, flags = '') {
    const current = segments[index]?.text || '';
    const previous = segments[index - 1]?.text || '';
    const next = segments[index + 1]?.text || '';
    return `${hashString(previous)}:${hashString(current)}:${hashString(next)}:${flags}`;
  }

  const api = {VERSION,mergeRanges,protectedRanges,isProtected,maskText,sentenceSegments,paragraphSegments,tokens,changedRange,hashString,cacheKey};
  if (typeof window !== 'undefined') window.WarextLongTextCoreV310 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
