export type { CsvColumnMapping, CsvFrame, CsvFrameStatus } from '../ImageToVideo/CsvVideoGenerator/types';

export const DEFAULT_WEBNOVEL_MAPPING = {
  frameNumber:       '',
  veoPrompt:         '',   // mapped to headers[31] (column AF) on auto-detect
  referenceFilename: '',
  dialogue:          '',
  sfx:               '',
  clipLength:        '',
  videoApi:          '',
};
