export function htmlToPlainText(html: string): string {
  const tempDiv: HTMLDivElement = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}