export function textPostProcess(text: string): string {
    return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replaceAll("  ", " ").replaceAll("\n", "\n\n").replaceAll("\n\n\n\n", "\n\n");
  }

export function replaceSmartQuotes(text: string): string {
    return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  }