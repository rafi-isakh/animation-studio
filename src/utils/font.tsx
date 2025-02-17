export function textPostProcess(text: string): string {
    return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replaceAll("  ", " ");
  }

export function replaceSmartQuotes(text: string): string {
    return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  }