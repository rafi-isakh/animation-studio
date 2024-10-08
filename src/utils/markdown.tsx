import { marked } from 'marked';

export default function markdownToHtml(markdown: string) {
  return marked(markdown);
}