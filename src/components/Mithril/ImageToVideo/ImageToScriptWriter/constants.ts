import type { GenrePreset } from './types';

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Epic fantasy with magic and adventure',
    story: `1. Faithfully reflect the original text content while enhancing visual narrative for animation.
2. Ensure smooth scene transitions.
3. Maintain short clips (1-2 seconds) for dynamic pacing.`,
    image: `1. Maintain consistent character appearances (hair color, clothing, etc.).
2. Match shot angles with background ID guidelines.
3. Reflect the time period and atmosphere accurately.`,
    video: `1. Keep camera angles and movements concise.
2. When characters speak, include speaking animation description.
3. Use pronouns instead of character names.`,
    sound: `1. Categorize into dialogue, sound effects, and background music.
2. If manga panel has text, prioritize using it as dialogue.
3. Leave dialogue field empty for scenes without speech.`,
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Emotional romance and drama',
    story: `1. Focus on emotional beats and character expressions.
2. Include internal monologue where appropriate.
3. Emphasize meaningful glances and subtle gestures.`,
    image: `1. Soft, warm color palette for romantic moments.
2. Detailed facial expressions and body language.
3. Atmospheric lighting to enhance mood.`,
    video: `1. Slower pacing for emotional scenes.
2. Close-ups on character faces during key moments.
3. Smooth camera movements.`,
    sound: `1. Emotional background music selection.
2. Heartbeat effects for tense romantic moments.
3. Soft ambient sounds for intimate scenes.`,
  },
  {
    id: 'action',
    name: 'Action',
    description: 'Fast-paced action and battle scenes',
    story: `1. Emphasize impact and movement.
2. Break down complex actions into clear sequences.
3. Build tension through pacing.`,
    image: `1. Dynamic poses and angles.
2. Motion blur and impact effects.
3. Bold, contrasting colors for intensity.`,
    video: `1. Quick cuts for action sequences.
2. Emphasize speed lines and motion.
3. Impactful camera shakes.`,
    sound: `1. Punchy sound effects for impacts.
2. High-energy background music.
3. Character battle cries and reactions.`,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own conditions',
    story: '',
    image: '',
    video: '',
    sound: '',
  },
];
