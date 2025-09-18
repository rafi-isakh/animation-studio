// utils/prompts.ts
export type StyleLabel = 'Modern' | 'Webtoon' | 'Illustration Art';
export const eventPrompts = {
  styles: [
    {
      label: "Modern",
      prompt: `"Modern": "Layered thick brushstrokes with natural brush texture. No makeup, no blush (no blush on face:1.5). Cold saturation, Korean webnovel painting tone — pale, low-chroma, cold-toned skin with no visible blood circulation (1.7). Ethereal oil painting aesthetic fused with William-Adolphe Bouguereau’s classical style and modern K-pop figure sensibility. Romanticism-inspired mood, cool silver-blue lighting, no warm tones. Soft focus atmosphere with dust motes and faint magical elements drifting in the air.",`
    },
    {
      label: "Webtoon",
      prompt: `"Webtoon": "Highly stylized Korea Webtoon Cover Style. clean expressive line art, hard-edged cel-shading, saturated jewel-tone colors with strong contrast, slightly low-angle perspective for dramatic impact. Hair drawn with luminous reflections and layered strands, eyes glistening with detailed highlights. Emphasizes movement, emotion, and a poster-like cinematic finish.",`
    },
    {
      label: "Illustration Art",
      prompt: `"Illustration Art": "Ultra-detailed 2D anime-fantasy painterly illustration style. Smooth porcelain-like skin, natural blush, delicate shading. Eyes luminous and mystical, with jewel-like depth, multiple highlight layers, and faint magical rune or star patterns inside the iris. Hair finely layered in countless strands, softly glowing highlights, natural flowing motion. Lighting cinematic with strong highlights and soft gradients, luminous rim light tracing hair and shoulders. Atmosphere dazzling and immersive, enhanced with crystalline sparkles and drifting light fragments. (No jewelry:1.5), (no gemstones:1.4), (no crowns:1.3), (no tiaras:1.2), no head accessories."`,
    },
  ],
  genres: [
    {
      key: "contemporary_fantasy",
      label: "Contemporary Fantasy",
      prompts: {
        illustrationArt: `
Vertical composition, ultra-detailed close-up portrait (~90–95% of frame).
Young {gender} in plain modern hunter attire — if male: crisp fitted shirt in {DOMINANT_COLOR}; if female: blouse in {DOMINANT_COLOR}.
Absolutely no jewelry, no gemstones, no crowns, no tiaras, no head accessories, no hair accessories, no earrings, no necklaces, no brooches, no metallic trims, no decorative patterns, no embroidery, and no glowing ornaments.
Expression follows the selfie — calm, focused. Gaze forward; pupils aligned.
Background: close city buildings at night — glass facades glowing with window lights and neon reflections. Billboards and neon signs blurred/abstract (no readable text). Faint dungeon rift shimmer.
Aura: hunter energy in {DOMINANT_COLOR}, forming a luminous perimeter like a storm around the figure.
Lighting: cinematic high contrast with {DOMINANT_COLOR} rim light; no golden tones or lens flares.
Mood: radiant, commanding, unstoppable.
`,
        default: `
Modern urban fantasy action illustration; one young {gender}, waist-up or three-quarter, ~90% frame.
Outfit in {DOMINANT_COLOR}. Keep selfie-faithful facial features/ethnicity/skin tone; no westernization.
Aura: outward-radiating storm in {DOMINANT_COLOR} with arcs, circular streaks, and fragments.
Background: half-ruined cityscape with cracked skyscrapers and faint fires/smoke.
Lighting: intense rim light in {DOMINANT_COLOR}; deep shadows; reflections on glass/asphalt/metal.
Mood: destructive, unstoppable, cinematic.
`
      }
    },
    {
      key: "romance_fantasy",
      label: "Romance Fantasy",
      prompts: {
        illustrationArt: `
Vertical, ultra-detailed close-up (~95% frame). Luminous soft skin; eyes with subtle depth.
Hair: layered highlights catching glow.
Outfit: if female — ornate layered gown in {DOMINANT_COLOR}; if male — refined noble uniform in {DOMINANT_COLOR}, no jewelry or accessories.
Background: symbolic cosmic motif of softly glowing constellations/star arcs (ornamental, not scientific).
Atmosphere: stardust, glowing petals, radiant fragments, bokeh sparkles.
Lighting: dramatic chiaroscuro with warm/silvery rim.
Mood: romantic, ethereal, intimate.
Face: clear, smooth, no markings.
`,
        default: `
Vertical, elegant romantic fantasy. Young {gender} in elaborate noble attire in {DOMINANT_COLOR}.
Female: lace/frills/embroidery/ribbons/jewel accents (allowed here). Male: formal uniform, no jewelry/accessories.
Background: palace interiors, stained glass, moonlit balconies, or gardens.
Atmosphere: floating petals, glowing bokeh, soft aura. Colors: luminous pastel + gold/ivory/jewel accents.
Lighting: warm sunlight or moonlight with subtle rim light.
Mood: ethereal, romantic, intimate.
Face: clear, smooth, no unnatural effects.
`
      }
    },
    {
      key: "martial_arts_wuxia",
      label: "Wuxia",
      prompts: {
        illustrationArt: `
Upper-body portrait (~80–85%), centered; no face crop; no tattoo on face.
Background: symbolic full-moon emblem glowing into misty haze.
Qi aura: dynamic, {DOMINANT_COLOR}-only arcs/blades around/behind the figure (never covering the face).
Outfit: hanfu-based martial robe in {DOMINANT_COLOR} with subtle monotone accent (slightly lighter/darker).
No jewelry/gemstones/crowns/metal trims/embroidery/patterns/modern undershirts. Emphasize folds/texture.
Face: smooth/clear/natural — no markings, runes, tattoos, symbols, glowing effects.
Lighting: high-contrast chiaroscuro; moon/qi as key/rim.
Mood: transcendent, fierce, majestic.
`,
        default: `
Vertical, dramatic wuxia. Young {gender} fills 80–85% (waist-up or three-quarter), slightly higher for title space.
Outfit: layered {DOMINANT_COLOR} robes, wide sleeves, neat sash; natural breeze motion.
Pose/expression follow selfie (calm confidence; no weapon).
Background: seated on tiled rooftop; beams/lanterns/eaves; distant sect halls and mountains in haze.
Lighting: cinematic chiaroscuro; golden-orange horizon rays; deep shadows; subtle cool bounce in shadow.
Atmosphere: dust motes, light fragments, faint qi shimmer.
Composition: painterly mobile cover; clear bottom negative space.
`
      }
    },
    {
      key: "fantasy_fusion",
      label: "Fantasy Fusion",
      prompts: {
        illustrationArt: `
Vertical close-up (~90–95%). Young {gender}, face+upper body nearly full frame.
No blush, no warm saturation. Strict bans: no jewelry/gemstones/crowns/tiaras/earrings/necklaces/head accessories/metal trims/embroidery/patterns/glowing ornaments.
{DOMINANT_COLOR} accents; vibrant/mysterious. Hair layered highlights.
Outfit: crisp wizard robes in {DOMINANT_COLOR}. If {DOMINANT_COLOR} is white, pair with black outer.
Background: abstract magical circle/constellation arcs (analogous hues).
Space filled with layered magical effects (fragments/shards/aurora/radiant clusters/glow dust) without obscuring face.
Lighting: dramatic chiaroscuro; strong key; soft ambient; rim outline.
Mood: dazzling, immersive, mystical.
`,
        default: `
Vertical; young {gender} fills 80–85% (waist-up or three-quarter).
Option A — Elemental Spirits in Anime Forest (Attack on Titan vibe)
- Spirits: exactly four (Fire/Water/Earth/Wind), UL/UR/LL/LR; each ≤ hand height; no duplicates/fifth; particles ≠ spirits.
- Outfit: luxurious wizard robe in soft {DOMINANT_COLOR} with complementary trim; no jewelry/embroidery/patterns.
- Background: colossal anime-style forest; dust and motes in beams; spirits emit subtle colored bounce.
- Lighting: bold anime contrast; sharp rim; theatrical chiaroscuro.
- Mood: epic, immersive, overwhelming. Sword: absent.
Option B — Sky island with sword
- Outfit: ornate but functional light armor in {DOMINANT_COLOR} with complementary trims; no jewelry/crowns/ornaments.
- Pose: cocky/relaxed; one leg propped; one hand resting. Expression: aloof/confident/arrogant.
- Sword: embedded in rock (glowing) or hovering upright with faint aura.
- Background: vast sky; floating islands to horizon; light beams/dust.
- Lighting: dramatic rim (silver/golden); long stone shadows.
- Mood: commanding, untouchable, defiant.
Both emphasize bold anime contrast, luminous highlights, cold pale skin tones, cinematic depth. No text.
`
      }
    },
  ],
} as const;
export type Style = typeof eventPrompts.styles[number];
export type Genre = typeof eventPrompts.genres[number];

