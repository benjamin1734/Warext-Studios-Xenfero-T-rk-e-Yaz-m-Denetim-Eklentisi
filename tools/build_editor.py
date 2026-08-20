import argparse
from pathlib import Path


def replace_once(source, old, new, label):
    if old not in source:
        raise SystemExit(f'Editör dönüşümü bulunamadı: {label}')
    return source.replace(old, new, 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    parts = sorted(source_dir.glob('editor-v300.part*'))
    if not parts:
        raise SystemExit('Editör kaynak parçaları bulunamadı')
    source = ''.join(path.read_text(encoding='utf-8') for path in parts)
    source = source.replace('__warextTurkishSpellCheckV300', '__warextTurkishSpellCheckV110')
    source = source.replace("const VERSION = '3.0.0';", "const VERSION = '1.3.0';")
    source = source.replace('WarextTurkishSpellEngineV300', 'WarextTurkishSpellEngineV110')
    source = source.replace('warextSpellCustomV300', 'warextSpellCustomV110')
    source = source.replace('warextSpellIgnoredV300', 'warextSpellIgnoredV110')
    source = source.replace('wtsc-dictionary-dialog-v300', 'wtsc-dictionary-dialog-v110')
    source = source.replace('wtsc-style-v300', 'wtsc-style-v110')
    source = source.replace('wtsc-v300', 'wtsc-v110')
    source = replace_once(
        source,
        "      informal: boolValue(data.informal),\n      maxSuggestions:",
        "      informal: boolValue(data.informal),\n      deepContext: boolValue(data.deepContext),\n      semantic: boolValue(data.semantic),\n      semanticSensitivity: Math.max(70, Math.min(99, Number(data.semanticSensitivity || 88))),\n      maxSuggestions:",
        'semantic-config'
    )
    source = replace_once(
        source,
        "    const key = `${rawWord}\\u0000${context?.previousWord || ''}\\u0000${context?.sentenceStart ? 1 : 0}\\u0000${cfg.properNames ? 1 : 0}\\u0000${cfg.informal ? 1 : 0}`;",
        "    const key = `${rawWord}\\u0000${context?.previousWord || ''}\\u0000${context?.sentenceStart ? 1 : 0}\\u0000${cfg.properNames ? 1 : 0}\\u0000${cfg.informal ? 1 : 0}\\u0000${String(context?.previousSentence || '').slice(-96)}\\u0000${String(context?.nextSentence || '').slice(0,96)}`;",
        'context-cache-key'
    )
    source = replace_once(
        source,
        "  function textualProtectedRanges(text) {\n    const ranges = [];",
        "  function textualProtectedRanges(text) {\n    const shared = window.WarextTextCoreV110;\n    if (shared?.protectedRanges) return shared.protectedRanges(text);\n    const ranges = [];",
        'shared-protection'
    )
    helper = """  function neighborSentences(state, bounds) {\n    if (!cfg.deepContext) return { previousSentence:'', nextSentence:'' };\n    const shared = window.WarextTextCoreV110;\n    if (!shared?.sentenceSegments) return { previousSentence:'', nextSentence:'' };\n    const segments = shared.sentenceSegments(state.text, state.protectedRanges || []);\n    const index = segments.findIndex(segment => segment.start <= bounds.start && segment.end >= bounds.end);\n    if (index < 0) {\n      const nearest = segments.findIndex(segment => bounds.start >= segment.start && bounds.start <= segment.end);\n      if (nearest < 0) return { previousSentence:'', nextSentence:'' };\n      return { previousSentence:segments[nearest - 1]?.text || '', nextSentence:segments[nearest + 1]?.text || '' };\n    }\n    return { previousSentence:segments[index - 1]?.text || '', nextSentence:segments[index + 1]?.text || '' };\n  }\n\n"""
    source = replace_once(source, "  function tokensInRange(text, start, end, protectedRanges = []) {", helper + "  function tokensInRange(text, start, end, protectedRanges = []) {", 'neighbor-sentences')
    source = replace_once(
        source,
        "    const prev = previousToken(state.text, token, bounds.start, state.protectedRanges);\n    const sentenceStart = isSentenceStart(state.text, token.start, bounds.start);\n    const result = cachedCheck(token.word, {",
        "    const prev = previousToken(state.text, token, bounds.start, state.protectedRanges);\n    const sentenceStart = isSentenceStart(state.text, token.start, bounds.start);\n    const neighbors = neighborSentences(state, bounds);\n    const result = cachedCheck(token.word, {",
        'token-neighbor-context'
    )
    source = replace_once(
        source,
        "      before: state.text.slice(0, token.end),\n      properNames: cfg.properNames,",
        "      before: state.text.slice(0, token.end),\n      previousSentence: neighbors.previousSentence,\n      nextSentence: neighbors.nextSentence,\n      properNames: cfg.properNames,",
        'token-context-fields'
    )
    source = replace_once(
        source,
        "    if (cfg.grammar && typeof localEngine.analyzeSentence === 'function') {\n      const languageIssues = localEngine.analyzeSentence(analysisText, { properNames: cfg.properNames, punctuation: cfg.punctuation }) || [];",
        "    if (cfg.grammar && typeof localEngine.analyzeSentence === 'function') {\n      const neighbors = neighborSentences(state, bounds);\n      const languageIssues = localEngine.analyzeSentence(analysisText, { properNames: cfg.properNames, punctuation: cfg.punctuation, previousSentence:neighbors.previousSentence, nextSentence:neighbors.nextSentence, longText:false, semantic:cfg.semantic, semanticSensitivity:cfg.semanticSensitivity }) || [];",
        'sentence-neighbor-context'
    )
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(source, encoding='utf-8')


if __name__ == '__main__':
    main()
