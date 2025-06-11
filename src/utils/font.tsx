export function textPostProcess(text: string, is_premium: boolean, sourceLanguage: string, language: string): string {
  const smart_quotes_replaced = text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replaceAll("  ", " ")
  if (is_premium && sourceLanguage === language) { // premium webnovels are parsed wrongly, and need to be reuploaded. for now, this is a temporary fix.
                    // at the same time, *translated* premium webnovels are parsed correctly, because cha and ellie fix the newlines.
                    // so these should not be normalized.
    return normalizeNewlines(smart_quotes_replaced)
  }
  return smart_quotes_replaced // community webnovels have proper newlines, so no need to normalize.
}

export function replaceSmartQuotes(text: string): string {
  return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function normalizeNewlines(text: string): string {
  // replace all newline runs with double newlines.
  return text.replace(/\n+/g, '\n\n');
}