import React from 'react';

interface Props {
  text: string;
}

export const RichTextWithLineBreaks: React.FC<Props> = ({ text }) => {
  const formattedHtml = text
    .split('\n')
    .map(line => `<div class="line">${escapeHtml(line)}</div>`)
    .join('');

  return (
    <div
      className="text-container"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
