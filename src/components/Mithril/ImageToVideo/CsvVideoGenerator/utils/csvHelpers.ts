import type { CsvColumnMapping, CsvFrame } from '../types';

/**
 * Parse CSV text into a 2D array of strings.
 * Handles: quoted fields (with commas/newlines), BOM, CRLF.
 */
export function parseCSV(text: string): string[][] {
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }

  // Last field/row
  row.push(field);
  if (row.some(f => f.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

/**
 * Normalize a raw CSV "Video API" cell value to a recognized provider ID.
 * Handles display names like "Wan 2.2", "Grok", "Sora", "Veo 3", etc.
 */
export function normalizeVideoApiValue(raw: string): string | undefined {
  const s = raw.trim().toLowerCase().replace(/[\s.\-]/g, '');
  if (!s) return undefined;
  if (s === 'sora')                                   return 'sora';
  if (s === 'veo3' || s === 'veo')                    return 'veo3';
  if (s === 'wan22i2v' || s === 'wan22')              return 'wan22_i2v';
  if (s === 'wani2v' || s === 'wan' || s === 'wan1')  return 'wan_i2v';
  if (s === 'grokimaginei2v' || s === 'grokimagine')  return 'grok_imagine_i2v';
  if (s === 'groki2v' || s === 'grok')                return 'grok_i2v';
  // Already a valid provider ID — pass through
  return raw.trim() || undefined;
}

/**
 * Auto-detect column mapping from CSV headers using reference-app default indices.
 * Default template layout:
 *   B (1)  = Frame Number
 *   C (2)  = Clip Length
 *   J (9)  = Veo Prompt
 *   L (11) = Dialogue
 *   N (13) = SFX
 *   Q (16) = Reference Filename
 */
export function autoDetectMapping(headers: string[]): CsvColumnMapping {
  // Prefer name-based matching for videoApi since its position varies
  const videoApiIndex = headers.findIndex((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '') === 'videoapi'
  );

  return {
    frameNumber:       headers[1]  ?? '',
    clipLength:        headers[2]  ?? '',
    veoPrompt:         headers[9]  ?? '',
    dialogue:          headers[11] ?? '',
    sfx:               headers[13] ?? '',
    referenceFilename: headers[16] ?? '',
    videoApi:          videoApiIndex > -1 ? (headers[videoApiIndex] ?? '') : '',
  };
}

/**
 * Apply a column mapping to parsed CSV rows and produce CsvFrame[].
 * Rows with an empty referenceFilename are filtered out.
 */
export function applyMapping(
  headers: string[],
  rows: string[][],
  mapping: CsvColumnMapping,
): CsvFrame[] {
  const idx = (col: string) => (col ? headers.indexOf(col) : -1);

  const frameIdx     = idx(mapping.frameNumber);
  const promptIdx    = idx(mapping.veoPrompt);
  const filenameIdx  = idx(mapping.referenceFilename);
  const dialogueIdx  = idx(mapping.dialogue);
  const sfxIdx       = idx(mapping.sfx);
  const lengthIdx    = idx(mapping.clipLength);
  const videoApiIdx  = idx(mapping.videoApi);

  const now = Date.now();

  return rows
    .map((row, i): CsvFrame => ({
      id:                 `frame-${i}-${now}`,
      rowIndex:           i,
      frameNumber:        frameIdx  > -1 ? (row[frameIdx]  ?? '').trim() : String(i + 1),
      veoPrompt:          promptIdx > -1 ? (row[promptIdx] ?? '').trim() : '',
      referenceFilename:  filenameIdx > -1 ? (row[filenameIdx] ?? '').trim() : '',
      dialogue:           dialogueIdx > -1 ? (row[dialogueIdx] ?? '').trim() : undefined,
      sfx:                sfxIdx     > -1 ? (row[sfxIdx]     ?? '').trim() : undefined,
      clipLength:         lengthIdx  > -1 ? (row[lengthIdx]  ?? '').trim() : undefined,
      videoApi:           videoApiIdx > -1 ? normalizeVideoApiValue((row[videoApiIdx] ?? '').trim()) : undefined,
      imageData:          null,
      endFrameData:       null,
      imageUrl:           filenameIdx > -1 && (row[filenameIdx] ?? '').trim().startsWith('http') ? (row[filenameIdx] ?? '').trim() : null,
      videoUrl:           null,
      jobId:              null,
      s3FileName:         null,
      status:             'idle',
    }))
    .filter(f => f.referenceFilename !== '');
}
