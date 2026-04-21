const CAMERA_3D_PATTERNS = [
  // English
  /camera\s+rot/i, /\borbit\b/i, /dolly\s+zoom/i, /crane\s+shot/i,
  /fly.?through/i, /drone\s+shot/i, /\b360\b/i, /\bparallax\b/i,
  /push\s+in/i, /camera\s+pan/i, /camera\s+tilt/i, /tracking\s+shot/i,
  /rack\s+focus/i, /depth\s+of\s+field/i, /\brevolv/i, /spinning\s+camera/i,
  // Korean
  /카메라\s*회전/i, /회전하/i, /오빗/i, /크레인\s*샷/i, /드론\s*샷/i,
  /패닝/i, /틸팅/i, /트래킹/i,
];

const NSFW_PATTERNS = [
  /\bnude\b/i, /\bnaked\b/i, /\bnsfw\b/i, /\bexplicit\b/i,
  /\bsexual\b/i, /\bsex\b/i, /\berotic/i, /\btopless\b/i,
  /\bnipple/i, /\bgenital/i,
  /야한/i, /성인물/i, /누드/i, /성적/i, /에로/i,
];

const ACTION_PATTERNS = [
  /\bfight/i, /\bbattle\b/i, /\bcombat\b/i, /\bpunch/i, /\bkick/i,
  /\bsword/i, /\battack/i, /action\s+scene/i,
  /격투/i, /전투/i, /싸움/i, /액션/i, /검투/i,
];

const DANCE_PATTERNS = [/\bdanc/i, /\btwirl/i, /\bpirouette/i, /춤/i, /댄스/i];

const TRANSFORM_PATTERNS = [/\btransform/i, /\bmorph/i, /power.?up/i, /변신/i, /변환/i, /파워업/i];

export type SeedanceAlertType = 'ACTION' | 'DANCE' | 'TRANSFORMATION';

export function detectApiForPrompt(prompt: string): string {
  if (!prompt.trim()) return 'wan22_i2v';
  if (NSFW_PATTERNS.some((p) => p.test(prompt))) return 'wan22_i2v';
  if (CAMERA_3D_PATTERNS.some((p) => p.test(prompt))) return 'veo3';
  return 'wan22_i2v';
}

const BGM_STRIP_PROVIDERS = new Set(['veo3', 'grok_i2v', 'grok_imagine_i2v', 'seedance']);

export function requiresBgmStripping(providerId: string): boolean {
  return BGM_STRIP_PROVIDERS.has(providerId);
}

export function stripBgmFromPrompt(prompt: string): string {
  return prompt
    .replace(/\bBGM:\s*[^\n]*/gi, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function detectSeedanceAlert(prompt: string): SeedanceAlertType | null {
  if (!prompt.trim()) return null;
  if (ACTION_PATTERNS.some((p) => p.test(prompt))) return 'ACTION';
  if (DANCE_PATTERNS.some((p) => p.test(prompt))) return 'DANCE';
  if (TRANSFORM_PATTERNS.some((p) => p.test(prompt))) return 'TRANSFORMATION';
  return null;
}