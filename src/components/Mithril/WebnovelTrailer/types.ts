export type { CsvColumnMapping, CsvFrame, CsvFrameStatus } from '../ImageToVideo/CsvVideoGenerator/types';
import type { CsvColumnMapping } from '../ImageToVideo/CsvVideoGenerator/types';

export interface WebnovelTrailerColumnMapping extends CsvColumnMapping {
  endImagePrompt: string; // "Image Prompt (End)" — if non-empty, a B sibling clip is created
}

export interface RefineResult {
  clipId: string;
  action: 'kept' | 'refined';
  originalPrompt: string;
  refinedPrompt: string;
  reason: string;
}

export const DEFAULT_WEBNOVEL_MAPPING: WebnovelTrailerColumnMapping = {
  frameNumber:       '',
  veoPrompt:         '',   // mapped to headers[31] (column AF) on auto-detect
  referenceFilename: '',
  dialogue:          '',
  sfx:               '',
  clipLength:        '',
  videoApi:          '',
  endImagePrompt:    '',   // "Image Prompt (End)" — auto-detected by column name
};
