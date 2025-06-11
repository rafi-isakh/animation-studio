export function textPostProcess(text: string): string {
    return replaceSingleNewlines(text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replaceAll("  ", " "))
  }

export function replaceSmartQuotes(text: string): string {
    return text?.replaceAll(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  }

  function replaceSingleNewlines(text: string): string {
    return text.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
  }