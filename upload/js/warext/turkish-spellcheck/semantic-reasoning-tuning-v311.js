(() => {
  'use strict';

  if (window.__warextSemanticReasoningTuningV311) return;
  const engine = window.WarextTurkishSpellEngineV110;
  const core = window.WarextTextCoreV110;
  const kb = window.WarextSemanticKnowledgeV310;
  if (!engine?.analyzeMeaningGraph || !engine?.analyzeSemanticDocument || !engine?.analyzeParagraph || !core?.sentenceSegments || !kb) return;
  window.__warextSemanticReasoningTuningV311 = true;

  const VERSION = '3.1.1';
  const baseMeaning = engine.analyzeMeaningGraph.bind(engine);
  const baseDocument = engine.analyzeSemanticDocument.bind(engine);
  const baseParagraph = engine.analyzeParagraph.bind(engine);
  const normalize = kb.normalize;
  const CONFLICT_RULE = /(?:graph-state-contradiction|graph-quantity-conflict|graph-existence-quantity-conflict|graph-event-polarity-conflict)/u;
  const TRANSITION = /\b(?:sonra|ardından|ardindan|daha sonra|yeniden|tekrar|geri|açtı|acti|açıldı|acildi|kapattı|kapatti|kapandı|kapandi|başlattı|baslatti|başlatıldı|baslatildi|durdurdu|silindi|oluşturuldu|olusturuldu|eklendi|kaldırıldı|kaldirildi|bağlandı|baglandi|koptu|kilitlendi|kilidiaçıldı|kilidiacildi|onaylandı|onaylandi|reddedildi|etkinleştirildi|etkinlestirildi|devredışı|devredisi|arttı|artti|azaldı|azaldi|değişti|degisti|güncellendi|guncellendi)\b/iu;
  const PROPER = /\b[A-ZÇĞİÖŞÜ][a-zçğıöşüâîû]{1,}\b/gu;

  function unique(items) {
    const out = [];
    const seen = new Set();
    for (const item of items || []) {
      if (!item || !Number.isFinite(item.start) || !Number.isFinite(item.end)) continue;
      const key = `${item.start}:${item.end}:${item.rule || ''}:${item.message || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function frameAt(frames,position) {
    return frames.find(frame => position >= frame.start && position <= frame.end) || null;
  }

  function asserted(frame) {
    const mode = frame?.mode || {};
    return !mode.conditional && !mode.hypothetical && !mode.question && !mode.reported;
  }

  function sameTime(left,right) {
    const a = left?.time || 'unknown';
    const b = right?.time || 'unknown';
    if (a === 'unknown' || b === 'unknown') return true;
    return a === b;
  }

  function touches(frame,entity) {
    if (!frame || !entity) return false;
    if (frame.subject === entity || frame.object === entity) return true;
    if ((frame.states || []).some(item => item.entity === entity)) return true;
    if ((frame.quantities || []).some(item => item.entity === entity)) return true;
    return false;
  }

  function relevantTransition(frames,segments,from,to,entity) {
    if (from >= to) return false;
    for (let index = from + 1; index <= to; index++) {
      const frame = frames[index];
      if (!frame || !touches(frame,entity)) continue;
      const text = segments[index]?.text || '';
      if (TRANSITION.test(text)) return true;
      if ((frame.states || []).some(item => item.entity === entity && item.source === 'predicate')) return true;
    }
    return false;
  }

  function removeHypotheticalConflicts(warnings,frames) {
    return (warnings || []).filter(warning => {
      if (!CONFLICT_RULE.test(String(warning.rule || ''))) return true;
      const current = frameAt(frames,warning.start);
      if (current && !asserted(current)) return false;
      if (!current) return true;
      const entities = new Set([
        ...(current.states || []).map(item => item.entity),
        ...(current.quantities || []).map(item => item.entity),
        current.subject,
        current.object
      ].filter(Boolean));
      for (let index = 0; index < current.index; index++) {
        const prior = frames[index];
        if (!prior || asserted(prior)) continue;
        if ([...entities].some(entity => touches(prior,entity))) return false;
      }
      return true;
    });
  }

  function stateLedgerWarnings(frames,segments) {
    const out = [];
    const ledger = new Map();
    for (const frame of frames) {
      if (!asserted(frame)) continue;
      for (const state of frame.states || []) {
        const key = `${state.entity}:${state.family}`;
        const prior = ledger.get(key) || [];
        for (let index = prior.length - 1; index >= 0; index--) {
          const older = prior[index];
          if (older.value === state.value) continue;
          const olderFrame = frames[older.frameIndex];
          if (!asserted(olderFrame) || !sameTime(olderFrame,frame)) continue;
          if (relevantTransition(frames,segments,older.frameIndex,frame.index,state.entity)) continue;
          out.push({
            start:frame.start,
            end:frame.end,
            rule:'v311-entity-scoped-state-contradiction',
            confidence:0.96,
            category:'logic',
            severity:'warning',
            message:'Aynı varlık için birbiriyle çelişen durumlar kurulmuş ve aradaki cümlelerde bu varlığa ait gerçek bir durum değişikliği anlatılmamış.'
          });
          break;
        }
        prior.push({frameIndex:frame.index,value:state.value});
        ledger.set(key,prior.slice(-8));
      }
    }
    return out;
  }

  function eventPolarityWarnings(frames,segments) {
    const out = [];
    const events = [];
    for (const frame of frames) {
      if (!asserted(frame) || !frame.predicate) continue;
      for (let index = events.length - 1; index >= 0; index--) {
        const prior = events[index];
        if (frame.index - prior.frameIndex > 8) break;
        if (prior.predicate !== frame.predicate || prior.negated === frame.negated) continue;
        const sameSubject = frame.subject && prior.subject && frame.subject === prior.subject;
        const sameObject = frame.object && prior.object && frame.object === prior.object;
        if (!sameSubject && !sameObject) continue;
        const olderFrame = frames[prior.frameIndex];
        if (!sameTime(olderFrame,frame)) continue;
        const entity = sameObject ? frame.object : frame.subject;
        if (relevantTransition(frames,segments,prior.frameIndex,frame.index,entity)) continue;
        out.push({
          start:frame.start,
          end:frame.end,
          rule:'v311-entity-scoped-event-polarity-conflict',
          confidence:0.95,
          category:'logic',
          severity:'warning',
          message:'Aynı varlık ve aynı eylem, aynı zaman bağlamında hem gerçekleşmiş hem gerçekleşmemiş olarak anlatılıyor.'
        });
        break;
      }
      events.push({frameIndex:frame.index,predicate:frame.predicate,negated:!!frame.negated,subject:frame.subject || '',object:frame.object || ''});
      if (events.length > 80) events.shift();
    }
    return out;
  }

  function namedEntities(text) {
    const names = [];
    const seen = new Set();
    PROPER.lastIndex = 0;
    let match;
    while ((match = PROPER.exec(String(text || '')))) {
      const raw = match[0];
      const norm = normalize(raw);
      if (kb.kindsFor(norm)?.size) continue;
      if (/^(?:Bu|Şu|O|Ben|Sen|Biz|Siz|Onlar)$/u.test(raw)) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      names.push({raw,norm});
    }
    return names;
  }

  function ambiguousPronounWarnings(segments,frames) {
    const out = [];
    for (let index = 1; index < segments.length; index++) {
      const segment = segments[index];
      const match = /^\s*(O|o)(?:\s|[,;:])/u.exec(segment.text || '');
      if (!match) continue;
      const current = frames[index];
      if (current?.mode?.question || current?.mode?.conditional) continue;
      const names = namedEntities(segments[index - 1]?.text || '');
      if (names.length < 2) continue;
      const local = (segment.text || '').indexOf(match[1]);
      out.push({
        start:segment.start + Math.max(0,local),
        end:segment.start + Math.max(0,local) + 1,
        rule:'v311-reference-ambiguous-pronoun',
        confidence:0.97,
        category:'discourse',
        severity:'warning',
        message:`“${match[1]}” zamiri önceki cümledeki birden fazla kişiyle eşleşebilir (${names.slice(0,3).map(item => item.raw).join(', ')}). Gönderimin açıklaştırılması gerekir.`
      });
    }
    return out;
  }

  function quantityWarnings(frames,segments) {
    const out = [];
    const ledger = new Map();
    for (const frame of frames) {
      if (!asserted(frame)) continue;
      const frameText = segments[frame.index]?.text || '';
      if (TRANSITION.test(frameText)) continue;
      for (const quantity of frame.quantities || []) {
        const unit = quantity.unit || 'count';
        const key = `${quantity.entity}:${unit}`;
        const prior = ledger.get(key) || [];
        for (let index = prior.length - 1; index >= 0; index--) {
          const older = prior[index];
          if (Number(older.value) === Number(quantity.value)) continue;
          const olderFrame = frames[older.frameIndex];
          if (!sameTime(olderFrame,frame)) continue;
          if (relevantTransition(frames,segments,older.frameIndex,frame.index,quantity.entity)) continue;
          out.push({
            start:frame.start,
            end:frame.end,
            rule:'v311-entity-scoped-quantity-conflict',
            confidence:0.91,
            category:'logic',
            severity:'warning',
            message:`Aynı varlık için aynı bağlamda ${older.value} ve ${quantity.value} ${unit === 'count' ? '' : unit} değerleri veriliyor; bu varlığa ait miktar değişimi açıklanmıyor.`
          });
          break;
        }
        prior.push({frameIndex:frame.index,value:quantity.value});
        ledger.set(key,prior.slice(-8));
      }
    }
    return out;
  }

  function enhance(text,rawGraph) {
    const graph = rawGraph || {warnings:[],frames:[],graph:{}};
    const segments = core.sentenceSegments(String(text || ''));
    const frames = Array.isArray(graph.frames) ? graph.frames : [];
    const baseWarnings = removeHypotheticalConflicts(graph.warnings || [],frames);
    const added = [
      ...stateLedgerWarnings(frames,segments),
      ...eventPolarityWarnings(frames,segments),
      ...ambiguousPronounWarnings(segments,frames),
      ...quantityWarnings(frames,segments)
    ];
    const warnings = unique([...baseWarnings,...added]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const newLogic = added.filter(item => item.category === 'logic').length;
    const reference = added.filter(item => /reference/u.test(item.rule || '')).length;
    const baseScore = Number(graph.graph?.score ?? 100);
    return {
      ...graph,
      version:VERSION,
      warnings,
      graph:{
        ...(graph.graph || {}),
        score:Math.max(0,Math.min(100,Math.round(baseScore - newLogic * 5 - reference * 2))),
        v311EntityScopedConflicts:newLogic,
        v311ReferenceWarnings:reference
      },
      calibrationLayer:'v311-entity-scoped-reasoning',
      hypotheticalAssertionsExcluded:true,
      entityScopedTransitions:true,
      deltaQuantitiesExcluded:true,
      ambiguousPronounCalibration:true,
      fullyLocal:true,
      externalDependencies:0
    };
  }

  engine.analyzeMeaningGraph = function(rawText) {
    const text = String(rawText || '');
    return enhance(text,baseMeaning(text));
  };

  engine.analyzeSemanticDocument = function(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseDocument(text,context) || {warnings:[]};
    const graph = engine.analyzeMeaningGraph(text);
    const warnings = unique([...(base.warnings || []),...(graph.warnings || [])]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start);
    const baseScore = Number(base.coherence?.score ?? 100);
    const graphScore = Number(graph.graph?.score ?? 100);
    return {
      ...base,
      version:VERSION,
      warnings,
      semanticGraph:graph,
      coherence:{...(base.coherence || {}),score:Math.max(0,Math.min(100,Math.round(baseScore * 0.55 + graphScore * 0.45))),graphScore},
      reasoningLayer:'v311-local-graph-calibration',
      hypotheticalAssertionsExcluded:true,
      entityScopedTransitions:true,
      deltaQuantitiesExcluded:true,
      externalDependencies:0,
      fullyLocal:true
    };
  };

  engine.analyzeParagraph = function(rawText,context = {}) {
    const text = String(rawText || '');
    const base = baseParagraph(text,context) || {warnings:[],fixes:[]};
    const documentReport = engine.analyzeSemanticDocument(text,context);
    return {
      ...base,
      version:VERSION,
      warnings:unique([...(base.warnings || []),...(documentReport.warnings || [])]).sort((a,b) => (b.confidence || 0) - (a.confidence || 0) || a.start - b.start),
      semanticDocument:documentReport,
      semanticGraph:documentReport.semanticGraph,
      coherence:documentReport.coherence,
      reasoningLayer:'v311-local-graph-calibration',
      fullParagraphMeaning:true,
      localPropositionGraph:true,
      deltaQuantitiesExcluded:true,
      externalDependencies:0,
      fullyLocal:true
    };
  };

  engine.stats = {
    ...(engine.stats || {}),
    semanticReasoningLayer:'v311-local-graph-calibration',
    semanticCalibrationVersion:VERSION,
    hypotheticalAssertionsExcluded:true,
    entityScopedTransitions:true,
    deltaQuantitiesExcluded:true,
    ambiguousPronounCalibration:true,
    externalDependencies:0
  };
})();