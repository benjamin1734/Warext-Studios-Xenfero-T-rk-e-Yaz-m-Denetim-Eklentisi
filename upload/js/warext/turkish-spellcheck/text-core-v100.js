(() => {
  'use strict';
  const VERSION = '1.0.0';
  const letters = 'A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû';
  const tokenRe = new RegExp(`[${letters}]{2,}`,'gu');
  const closers = new Set(['"','”','’',"'",')',']','}']);
  const abbreviations = new Set(['dr','doç','prof','sn','bkz','vb','vs','örn','yak','no','md','hz','tc','t.c','mr','mrs','ms']);
  const mergeRanges = ranges => {
    const sorted = (ranges || []).filter(x => x && x.end > x.start).sort((a,b) => a.start - b.start || a.end - b.end);
    const out = [];
    for (const range of sorted) {
      const last = out.at(-1);
      if (last && range.start <= last.end) last.end = Math.max(last.end,range.end);
      else out.push({start:range.start,end:range.end,kind:range.kind || ''});
    }
    return out;
  };
  const protectedRanges = text => {
    const source = String(text || '');
    const ranges = [];
    const add = (re,kind) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(source))) {
        ranges.push({start:m.index,end:m.index + m[0].length,kind});
        if (!m[0].length) re.lastIndex++;
      }
    };
    add(/\[(?:CODE|PHP|HTML|ICODE|PLAIN|QUOTE)\b[^\]]*\][\s\S]*?\[\/(?:CODE|PHP|HTML|ICODE|PLAIN|QUOTE)\]/giu,'bbcode-block');
    add(/\[\/?[A-Z][^\]\n]{0,240}\]/giu,'bbcode');
    add(/```[\s\S]*?```/gu,'fenced-code');
    add(/`[^`\n]+`/gu,'inline-code');
    add(/<\/?[A-Za-z][^<>\n]{0,500}>/gu,'html');
    add(/(?:https?|ftp|ftps|ssh|git|sftp):\/\/[^\s<>()\[\]{}"']+/giu,'url');
    add(/\bwww\.[A-Z0-9.-]+(?:\/[^\s<>()\[\]{}"']*)?/giu,'url');
    add(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/giu,'email');
    add(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|dev|app|ai|co|me|info|biz|xyz|online|site|store|cloud|gg|tv|edu|gov|mil|tr|de|it|fr|uk|eu)(?:\/[^\s<>()\[\]{}"']*)?/giu,'domain');
    add(/(?<![A-Za-z0-9])(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?::\d{1,5})?(?:\/\d{1,2})?(?![A-Za-z0-9])/gu,'ipv4');
    add(/(?<![A-Fa-f0-9:])(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{0,4}(?:%[A-Za-z0-9_.-]+)?(?:\/\d{1,3})?(?![A-Fa-f0-9:])/gu,'ipv6');
    add(/(?<![A-Fa-f0-9:])(?:[A-Fa-f0-9]{0,4}:){1,7}:[A-Fa-f0-9]{0,4}(?:%[A-Za-z0-9_.-]+)?(?:\/\d{1,3})?(?![A-Fa-f0-9:])/gu,'ipv6');
    add(/\b(?:[A-F0-9]{2}[:-]){5}[A-F0-9]{2}\b/giu,'mac');
    add(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu,'uuid');
    add(/\b(?:sha(?:1|224|256|384|512):)?[A-F0-9]{32,128}\b/giu,'hash');
    add(/(?<![A-Za-z0-9])v?\d+(?:\.\d+){1,4}(?:[-+][0-9A-Za-z.-]+)?(?![A-Za-z0-9])/gu,'version');
    add(/(?<!\d)(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])(?!\d)/gu,'date');
    add(/(?<!\d)(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:[.,]\d{1,6})?)?(?!\d)/gu,'time');
    add(/\b[A-Za-z]:\\(?:[^\\\s<>:"|?*]+\\)*[^\\\s<>:"|?*]*/gu,'windows-path');
    add(/(?<![A-Za-z0-9])(?:~\/|\.\.?\/|\/)(?:[A-Za-z0-9_.@+-]+\/)+[A-Za-z0-9_.@+-]*(?![A-Za-z0-9])/gu,'unix-path');
    add(/(?<![A-Za-z0-9])--?[A-Za-z][A-Za-z0-9_-]*(?:=[^\s,;]+)?/gu,'cli');
    add(/\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|%[A-Za-z_][A-Za-z0-9_]*%/gu,'env');
    add(/(?<![A-Za-z0-9])\.[A-Za-z][A-Za-z0-9_.-]{1,63}(?![A-Za-z0-9])/gu,'dotfile');
    add(/\b[A-Za-z0-9_-]+\.(?:php|phtml|js|mjs|cjs|ts|tsx|jsx|json|xml|ya?ml|ini|conf|cfg|log|txt|md|css|scss|less|html?|sql|jar|zip|rar|7z|tar|gz|png|jpe?g|gif|webp|svg|exe|dll|so|class|py|rb|go|rs|java|kt|sh|bat|cmd|ps1|env)\b/giu,'filename');
    add(/\b[A-Za-z_$][A-Za-z0-9_$]*(?:::|->|\.)[A-Za-z_$][A-Za-z0-9_$]*(?:\([^\n)]{0,160}\))?/gu,'symbol');
    add(/(?<![A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû0-9])[@#][A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{2,}/gu,'mention');
    add(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu,'emoji');
    add(/!??\[[^\]\n]{0,240}\]\([^\s)]+(?:\s+"[^"]*")?\)/gu,'markdown');
    return mergeRanges(ranges);
  };
  const rangeAt = (ranges,pos) => {
    for (const range of ranges || []) {
      if (pos < range.start) return null;
      if (pos >= range.start && pos < range.end) return range;
    }
    return null;
  };
  const isProtected = (ranges,start,end = start + 1) => (ranges || []).some(range => range.start < Math.max(start + 1,end) && range.end > start);
  const maskText = (text,ranges) => {
    const chars = String(text || '').split('');
    for (const range of ranges || []) for (let i = Math.max(0,range.start); i < Math.min(chars.length,range.end); i++) if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = '\uE000';
    return chars.join('');
  };
  const trim = (text,start,end) => {
    let a = Math.max(0,start), b = Math.min(text.length,end);
    while (a < b && /\s/u.test(text[a])) a++;
    while (b > a && /\s/u.test(text[b - 1])) b--;
    return b > a ? {start:a,end:b,text:text.slice(a,b)} : null;
  };
  const splitLong = (segment,max = 1600) => {
    if (!segment || segment.end - segment.start <= max) return segment ? [segment] : [];
    const out = [];
    for (let start = 0; start < segment.text.length;) {
      let end = Math.min(segment.text.length,start + max);
      if (end < segment.text.length) {
        const floor = start + Math.floor(max * .55);
        for (let i = end; i > floor; i--) if (/[;,:\s]/u.test(segment.text[i - 1] || '')) { end = i; break; }
      }
      const piece = trim(segment.text,start,end);
      if (piece) out.push({start:segment.start + piece.start,end:segment.start + piece.end,text:piece.text});
      start = Math.max(end,start + 1);
    }
    return out;
  };
  const sentenceSegments = (text,ranges = null,max = 1600) => {
    const source = String(text || '');
    if (!source) return [];
    const protectedList = mergeRanges(ranges || protectedRanges(source));
    const base = [];
    let start = 0, i = 0;
    const push = end => { const segment = trim(source,start,end); if (segment) base.push(segment); start = end; };
    while (i < source.length) {
      const protectedRange = rangeAt(protectedList,i);
      if (protectedRange) { i = protectedRange.end; continue; }
      const ch = source[i];
      if (ch === '\n') { push(i); start = ++i; continue; }
      if (/[.!?…]/u.test(ch)) {
        if (ch === '.') {
          let j = i - 1;
          while (j >= 0 && /[A-Za-zÇĞİÖŞÜçğıöşü]/u.test(source[j])) j--;
          if (abbreviations.has(source.slice(j + 1,i).toLocaleLowerCase('tr-TR'))) { i++; continue; }
        }
        let end = i + 1;
        while (end < source.length && /[.!?…]/u.test(source[end])) end++;
        while (end < source.length && closers.has(source[end])) end++;
        if (end >= source.length || /\s/u.test(source[end])) { push(end); while (end < source.length && /\s/u.test(source[end])) end++; start = end; i = end; continue; }
      }
      i++;
    }
    push(source.length);
    return base.flatMap(segment => splitLong(segment,max));
  };
  const paragraphSegments = text => {
    const source = String(text || '');
    const out = [];
    const re = /(?:\r?\n){2,}/gu;
    let start = 0, m;
    while ((m = re.exec(source))) { const segment = trim(source,start,m.index); if (segment) out.push(segment); start = m.index + m[0].length; }
    const end = trim(source,start,source.length); if (end) out.push(end); return out;
  };
  const tokens = (text,ranges = null) => {
    const source = String(text || '');
    const protectedList = ranges || protectedRanges(source);
    const out = [];
    tokenRe.lastIndex = 0;
    let m;
    while ((m = tokenRe.exec(source))) if (!isProtected(protectedList,m.index,m.index + m[0].length)) out.push({word:m[0],start:m.index,end:m.index + m[0].length});
    return out;
  };
  const changedRange = (before,after) => {
    const a = String(before || ''), b = String(after || '');
    let start = 0, oldEnd = a.length, newEnd = b.length;
    while (start < oldEnd && start < newEnd && a[start] === b[start]) start++;
    while (oldEnd > start && newEnd > start && a[oldEnd - 1] === b[newEnd - 1]) { oldEnd--; newEnd--; }
    return {start,oldEnd,newEnd,delta:b.length - a.length};
  };
  const hashString = value => { let hash = 2166136261; for (const ch of String(value || '')) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash,16777619); } return (hash >>> 0).toString(36); };
  const cacheKey = (segments,index,flags = '') => `${hashString(segments[index - 1]?.text || '')}:${hashString(segments[index]?.text || '')}:${hashString(segments[index + 1]?.text || '')}:${flags}`;
  const api = {VERSION,mergeRanges,protectedRanges,rangeAt,isProtected,maskText,sentenceSegments,paragraphSegments,tokens,changedRange,hashString,cacheKey};
  window.WarextTextCoreV100 = api;
  window.WarextLongTextCoreV310 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
