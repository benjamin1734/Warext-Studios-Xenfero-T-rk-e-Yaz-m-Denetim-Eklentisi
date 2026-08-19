(() => {
  'use strict';

  if (window.WarextTextCoreV110) return;

  const VERSION = '1.1.0';
  const LETTERS = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const TOKEN_RE = new RegExp(`[${LETTERS}]{2,}(?:['’][${LETTERS}]{1,14})?`, 'gu');
  const CLOSERS = new Set(['"','”','’',"'",')',']','}']);
  const ABBREVIATIONS = new Set(['dr','prof','doç','yrd','sn','say','bkz','vb','vs','örn','sf','s','no','md','cad','sok','mah','apt','tel','hz','st','mr','mrs','ms']);

  function mergeRanges(ranges) {
    const sorted = (ranges || []).filter(item => item && Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start).sort((a,b) => a.start - b.start || a.end - b.end);
    const out = [];
    for (const range of sorted) {
      const last = out[out.length - 1];
      if (last && range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
        if (range.kind && last.kind !== range.kind) last.kind = 'mixed';
      } else {
        out.push({start:range.start,end:range.end,kind:range.kind || 'protected'});
      }
    }
    return out;
  }

  function collectMatches(source, regex, kind, out) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(source))) {
      if (match[0].length) out.push({start:match.index,end:match.index + match[0].length,kind});
      else regex.lastIndex++;
    }
  }

  function protectedRanges(text) {
    const source = String(text || '');
    const ranges = [];
    const add = (re, kind) => collectMatches(source, re, kind, ranges);

    add(/\[(?:CODE|PHP|HTML|ICODE|PLAIN|QUOTE)\b[^\]]*\][\s\S]*?\[\/(?:CODE|PHP|HTML|ICODE|PLAIN|QUOTE)\]/giu, 'bbcode-block');
    add(/\[\/?[A-Z][^\]\n]{0,220}\]/giu, 'bbcode-tag');
    add(/```[\s\S]*?```/gu, 'fenced-code');
    add(/`[^`\n]+`/gu, 'inline-code');
    add(/<\/?[A-Za-z][^<>\n]{0,500}>/gu, 'html-tag');
    add(/(?:https?|ftp|ftps|ssh|git|sftp):\/\/[^\s<>()\[\]{}"']+/giu, 'url');
    add(/\bwww\.[A-Z0-9.-]+(?:\/[^\s<>()\[\]{}"']*)?/giu, 'url');
    add(/\bmailto:[^\s<>()\[\]{}"']+/giu, 'url');
    add(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/giu, 'email');
    add(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|dev|app|ai|co|me|info|biz|xyz|online|site|store|cloud|gg|tv|edu|gov|mil|tr|de|it|fr|uk|eu)(?:\/[^\s<>()\[\]{}"']*)?/giu, 'domain');
    add(/(?<![A-Za-z0-9])(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?::\d{1,5})?(?:\/\d{1,2})?(?![A-Za-z0-9])/gu, 'ipv4');
    add(/(?<![A-Fa-f0-9:])(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{0,4}(?:%[A-Za-z0-9_.-]+)?(?:\/\d{1,3})?(?![A-Fa-f0-9:])/gu, 'ipv6');
    add(/(?<![A-Fa-f0-9:])(?:[A-Fa-f0-9]{0,4}:){1,7}:[A-Fa-f0-9]{0,4}(?:%[A-Za-z0-9_.-]+)?(?:\/\d{1,3})?(?![A-Fa-f0-9:])/gu, 'ipv6');
    add(/\b(?:[A-F0-9]{2}[:-]){5}[A-F0-9]{2}\b/giu, 'mac');
    add(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu, 'uuid');
    add(/\b(?:sha(?:1|224|256|384|512):)?[A-F0-9]{32,128}\b/giu, 'hash');
    add(/(?<![A-Za-z0-9])v?\d+(?:\.\d+){1,4}(?:[-+][0-9A-Za-z.-]+)?(?![A-Za-z0-9])/gu, 'version');
    add(/(?<!\d)(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])(?!\d)/gu, 'date');
    add(/(?<!\d)(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)?\d{2}(?!\d)/gu, 'date');
    add(/(?<!\d)(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:[.,]\d{1,6})?)?(?!\d)/gu, 'time');
    add(/(?<![\dA-Za-z])[-+]?\d+(?:[.,]\d+)+(?:[eE][-+]?\d+)?(?![\dA-Za-z])/gu, 'number');
    add(/\b[A-Za-z]:\\(?:[^\\\s<>:"|?*]+\\)*[^\\\s<>:"|?*]*/gu, 'windows-path');
    add(/(?<![A-Za-z0-9])(?:~\/|\.\.?\/|\/)(?:[A-Za-z0-9_.@+-]+\/)+[A-Za-z0-9_.@+-]*(?![A-Za-z0-9])/gu, 'unix-path');
    add(/(?<![A-Za-z0-9])--?[A-Za-z][A-Za-z0-9_-]*(?:=[^\s,;]+)?/gu, 'cli-option');
    add(/(?<![A-Za-z0-9])-[A-Za-z](?:[A-Za-z0-9._:+-]{1,})?(?![A-Za-z0-9])/gu, 'cli-short');
    add(/\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|%[A-Za-z_][A-Za-z0-9_]*%/gu, 'env');
    add(/(?<![A-Za-z0-9])\.[A-Za-z][A-Za-z0-9_.-]{1,63}(?![A-Za-z0-9])/gu, 'dotfile');
    add(/\b[A-Za-z0-9_-]+\.(?:php|phtml|js|mjs|cjs|ts|tsx|jsx|json|xml|ya?ml|ini|conf|cfg|log|txt|md|css|scss|less|html?|sql|jar|zip|rar|7z|tar|gz|bz2|xz|png|jpe?g|gif|webp|svg|exe|dll|so|dylib|class|py|rb|go|rs|java|kt|sh|bash|zsh|bat|cmd|ps1|env)\b/giu, 'filename');
    add(/\b[A-Za-z_$][A-Za-z0-9_$]*(?:::|->|\.)[A-Za-z_$][A-Za-z0-9_$]*(?:\([^\n)]{0,160}\))?/gu, 'code-symbol');
    add(/\b[A-Za-z_$][A-Za-z0-9_$]*\([^\n)]{0,120}\)/gu, 'function-call');
    add(/\b[A-Z][A-Z0-9_]{2,}\b/gu, 'constant');
    add(/(?<![A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû0-9])[@#][A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{2,}/gu, 'mention');
    add(/(?:§|&)[0-9A-FK-OR]/giu, 'format-code');
    add(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu, 'emoji');
    add(/!??\[[^\]\n]{0,240}\]\([^\s)]+(?:\s+"[^"]*")?\)/gu, 'markdown-link');

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
    const source = String(text || '');
    if (!ranges?.length) return source;
    const chars = source.split('');
    for (const range of ranges) {
      const a = Math.max(0, range.start);
      const b = Math.min(chars.length, range.end);
      for (let i = a; i < b; i++) {
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

  function isAbbreviationBefore(text, periodIndex) {
    let i = periodIndex - 1;
    while (i >= 0 && /[A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]/u.test(text[i])) i--;
    const word = text.slice(i + 1, periodIndex).toLocaleLowerCase('tr-TR');
    if (!word) return false;
    if (ABBREVIATIONS.has(word)) return true;
    if (word.length === 1 && /[A-Za-zÇĞİÖŞÜ]/u.test(text[i + 1] || '')) return true;
    return false;
  }

  function splitLongSegment(segment, maxLength = 1600) {
    if (!segment || segment.end - segment.start <= maxLength) return segment ? [segment] : [];
    const out = [];
    const text = segment.text;
    let localStart = 0;
    while (localStart < text.length) {
      let localEnd = Math.min(text.length, localStart + maxLength);
      if (localEnd < text.length) {
        const floor = Math.max(localStart + Math.floor(maxLength * 0.55), localStart + 1);
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

  function sentenceSegments(text, ranges = null, maxLength = 1600) {
    const source = String(text || '');
    if (!source) return [];
    const protectedList = mergeRanges(ranges || protectedRanges(source));
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
        if (ch === '.' && isAbbreviationBefore(source, i)) {
          i++;
          continue;
        }
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

  function tokens(text, ranges = null) {
    const source = String(text || '');
    const protectedList = ranges || protectedRanges(source);
    const out = [];
    TOKEN_RE.lastIndex = 0;
    let match;
    while ((match = TOKEN_RE.exec(source))) {
      const start = match.index;
      const end = start + match[0].length;
      if (!isProtected(protectedList, start, end)) out.push({word:match[0],start,end});
      if (!match[0].length) TOKEN_RE.lastIndex++;
    }
    return out;
  }

  function changedRange(before, after) {
    const oldText = String(before || '');
    const newText = String(after || '');
    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) start++;
    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }
    return {start,oldEnd,newEnd,delta:newText.length - oldText.length};
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
    const previous = segments[index - 1]?.text || '';
    const current = segments[index]?.text || '';
    const next = segments[index + 1]?.text || '';
    return `${hashString(previous)}:${hashString(current)}:${hashString(next)}:${flags}`;
  }

  const api = {VERSION,mergeRanges,protectedRanges,rangeAt,isProtected,maskText,sentenceSegments,paragraphSegments,tokens,changedRange,hashString,cacheKey};
  window.WarextTextCoreV110 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
