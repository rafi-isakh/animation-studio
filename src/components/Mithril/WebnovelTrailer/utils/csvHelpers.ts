import type { CsvFrame } from '../types';
import type { WebnovelTrailerColumnMapping } from '../types';

/**
 * Parse CSV text into a 2D array of strings.
 * Handles: quoted fields (with commas/newlines), BOM, CRLF.
 */
export function parseCSV(text: string): string[][] {
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

  row.push(field);
  if (row.some(f => f.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

/**
 * Normalize a raw CSV "Video API" cell value to a recognized provider ID.
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
  return raw.trim() || undefined;
}

/**
 * Auto-detect column mapping from CSV headers.
 * Defaults video prompt to column AF (index 31) for WebnovelTrailerStoryboardGenerator CSVs.
 * Also detects "Image Prompt (End)" by name for A/B clip splitting.
 */
export function autoDetectMapping(headers: string[]): WebnovelTrailerColumnMapping {
  const findByName = (...names: string[]) => {
    const idx = headers.findIndex((h) =>
      names.some((n) => h.trim().toLowerCase() === n.toLowerCase())
    );
    return idx > -1 ? (headers[idx] ?? '') : '';
  };

  const videoApiIndex = headers.findIndex((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '') === 'videoapi'
  );

  return {
    frameNumber:       headers[1]  ?? '',
    clipLength:        headers[2]  ?? '',
    veoPrompt:         headers[31] ?? '',  // column AF (WebnovelTrailerStoryboardGenerator layout)
    dialogue:          headers[11] ?? '',
    sfx:               headers[13] ?? '',
    referenceFilename: headers[16] ?? '',
    videoApi:          videoApiIndex > -1 ? (headers[videoApiIndex] ?? '') : '',
    endImagePrompt:    findByName('Image Prompt (End)', '이미지 프롬프트 (End)'),
  };
}

/**
 * Apply a column mapping to parsed CSV rows and produce CsvFrame[].
 * Rows with an empty veoPrompt are filtered out.
 * If a row has a non-empty "Image Prompt (End)" value, it produces TWO frames:
 *   - Frame A: frameNumber suffixed with " A"
 *   - Frame B: frameNumber suffixed with " B" (same prompt, no image yet)
 */
export function applyMapping(
  headers: string[],
  rows: string[][],
  mapping: WebnovelTrailerColumnMapping,
): CsvFrame[] {
  const idx = (col: string) => (col ? headers.indexOf(col) : -1);

  const frameIdx        = idx(mapping.frameNumber);
  const promptIdx       = idx(mapping.veoPrompt);
  const filenameIdx     = idx(mapping.referenceFilename);
  const dialogueIdx     = idx(mapping.dialogue);
  const sfxIdx          = idx(mapping.sfx);
  const lengthIdx       = idx(mapping.clipLength);
  const videoApiIdx     = idx(mapping.videoApi);
  const endPromptIdx    = idx(mapping.endImagePrompt ?? '');

  const now = Date.now();
  const frames: CsvFrame[] = [];
  let rowIndex = 0;

  for (const row of rows) {
    const baseFrameNumber = frameIdx > -1 ? (row[frameIdx] ?? '').trim() : String(rowIndex + 1);
    const veoPrompt       = promptIdx > -1 ? (row[promptIdx] ?? '').trim() : '';
    if (!veoPrompt) continue;

    const referenceFilename = filenameIdx  > -1 ? (row[filenameIdx]  ?? '').trim() : '';
    const dialogue          = dialogueIdx  > -1 ? (row[dialogueIdx]  ?? '').trim() || undefined : undefined;
    const sfx               = sfxIdx       > -1 ? (row[sfxIdx]       ?? '').trim() || undefined : undefined;
    const clipLength        = lengthIdx    > -1 ? (row[lengthIdx]    ?? '').trim() || undefined : undefined;
    const videoApi          = videoApiIdx  > -1 ? normalizeVideoApiValue((row[videoApiIdx] ?? '').trim()) : undefined;
    const endImagePrompt    = endPromptIdx > -1 ? (row[endPromptIdx]  ?? '').trim() : '';

    const hasEndFrame = endImagePrompt !== '';

    const baseFrame: CsvFrame = {
      id:                `frame-${rowIndex}-${now}`,
      rowIndex,
      frameNumber:       hasEndFrame ? `${baseFrameNumber} A` : baseFrameNumber,
      veoPrompt,
      referenceFilename,
      dialogue,
      sfx,
      clipLength,
      videoApi,
      imageData:         null,
      endFrameData:      null,
      imageUrl:          null,
      videoUrl:          null,
      jobId:             null,
      s3FileName:        null,
      status:            'idle',
    };
    frames.push(baseFrame);
    rowIndex++;

    if (hasEndFrame) {
      const bFrame: CsvFrame = {
        id:                `frame-${rowIndex}-${now}`,
        rowIndex,
        frameNumber:       `${baseFrameNumber} B`,
        veoPrompt,
        referenceFilename: '',
        dialogue,
        sfx,
        clipLength,
        videoApi,
        imageData:         null,
        endFrameData:      null,
        imageUrl:          null,
        videoUrl:          null,
        jobId:             null,
        s3FileName:        null,
        status:            'idle',
      };
      frames.push(bFrame);
      rowIndex++;
    }
  }

  return frames;
}
