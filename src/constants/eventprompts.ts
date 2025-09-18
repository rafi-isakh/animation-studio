// utils/prompts.ts
export const eventPrompts = {
  styles: [
    {
      label: "Modern",
      prompt:
        `    "Modern": "Layered thick brushstrokes with natural brush texture. No makeup, no blush (no blush on face:1.5). Cold saturation, Korean webnovel painting tone — pale, low-chroma, cold-toned skin with no visible blood circulation (1.7). Ethereal oil painting aesthetic fused with William-Adolphe Bouguereau’s classical style and modern K-pop figure sensibility. Romanticism-inspired mood, cool silver-blue lighting, no warm tones. Soft focus atmosphere with dust motes and faint magical elements drifting in the air.",`
    },
    {
      label: "Webtoon",
      prompt:
        `    "webtoon": "Webtoon": "Highly stylized Korea Webtoon Cover Style. clean expressive line art, hard-edged cel-shading, saturated jewel-tone colors with strong contrast, slightly low-angle perspective for dramatic impact. Hair drawn with luminous reflections and layered strands, eyes glistening with detailed highlights. Emphasizes movement, emotion, and a poster-like cinematic finish.",`
    },
    {
      label: "Illustration Art",
      prompt:
        `    "Illustration Art": "Ultra-detailed 2D anime-fantasy painterly illustration style. Smooth porcelain-like skin, natural blush, delicate shading. Eyes luminous and mystical, with jewel-like depth, multiple highlight layers, and faint magical rune or star patterns inside the iris. Hair finely layered in countless strands, softly glowing highlights, natural flowing motion. Lighting cinematic with strong highlights and soft gradients, luminous rim light tracing hair and shoulders. Atmosphere dazzling and immersive, enhanced with crystalline sparkles and drifting light fragments. (No jewelry:1.5), (no gemstones:1.4), (no crowns:1.3), (no tiaras:1.2), no head accessories."`,
    },
  ],

  genres: [
    {
      label: "Romance Fantasy",
      prompt:
        `    "romance_fantasy": "If {style} is Illustration Art:  
Vertical composition, ultra-detailed close-up portrait. Character is a young {gender}, face and upper body filling ~95% of the frame.  
Skin luminous and soft, layered gradients with warm undertones. Eyes shimmering with subtle emotional depth, irises reflecting delicate light patterns.  
Hair finely rendered, flowing with layered highlights and delicate strands catching the glow.  
Outfit: if {gender} is female — ornate layered gown in {DOMINANT_COLOR}, with lace, frills, embroidery, and ribbons. If {gender} is male — a refined noble uniform in {DOMINANT_COLOR}, clean silhouette, strictly no jewelry, no gemstones, no crowns, no tiaras, no head accessories, no earrings, no necklaces, and no decorative patterns; short, well-groomed hair.  
Background: simplified and symbolic — a cosmic motif of softly glowing constellations, star maps, and faint planetary arcs forming a luminous frame behind the character. Stars connect in delicate lines, suggesting destiny and romance, with soft gradients of starlight radiating outward. The design should feel ethereal and ornamental, not scientific or mechanical.  
Atmosphere: drifting stardust, glowing petals, radiant light fragments, and bokeh sparkles surrounding the figure, enhancing intimacy and enchantment.  
Lighting: dramatic chiaroscuro softened by warm golden or silvery moonlit tones, rim light emphasizing hair strands and gown folds.  
Mood: romantic, ethereal, intimate — the figure as the central icon of love and destiny, framed by constellations and celestial light, embodying fate itself.  
Face is clear, smooth, and naturally beautiful, with no additional markings.  

Else:  
Vertical composition, elegant romantic fantasy aesthetic. Character is a young {gender} wearing elaborate noble attire in {DOMINANT_COLOR}.  
If {gender} is female: layered gowns with lace, frills, embroidery, ribbons, and gemstone jewelry; hair long and flowing or styled with ornate hairpins.  
If {gender} is male: a formal noble uniform with a clean silhouette and refined fabric texture, but strictly no jewelry, no gemstones, no crowns, no tiaras, no head accessories, no earrings, no necklaces, and no decorative patterns. Male design must remain simple, elegant, and free of accessories, with short, well-groomed hair.  
Pose graceful and expressive — if female: seated with a book, hand near chest, or mid-dance with a partner; if male: standing proudly, posture noble and composed. Expression serene yet emotional, eyes shimmering with subtle intensity.  
Background: grand palace interiors with stained-glass windows, candlelit libraries, moonlit balconies, or flower-filled gardens.  
Atmosphere: floating petals, glowing bokeh particles, soft magical aura for depth.  
Colors: luminous pastel palette with gold, ivory, and jewel-tone accents.  
Lighting: dramatic yet soft — warm golden sunlight or moonlight mixed with subtle rim light, highlights on hair and fabric folds.  
Mood: ethereal, romantic, and intimate — capturing the moment of fateful revelation or tender emotion, like a webnovel cover that draws the reader into a love story.  
Face is clear, smooth, and naturally beautiful, with no additional markings or unnatural effects.",`,
    },
    {
      label: "Fantasy Fusion",
      prompt:
        `"fantasy_fusion": "
If {style} is Illustration Art:  
Vertical composition, ultra-detailed close-up portrait (~90–95% of frame). Character is a young {gender}, face and upper body filling nearly the entire image.  
No blush, no warm saturation.  
**Strict bans:** no jewelry, gemstones, crowns, tiaras, earrings, necklaces, head accessories, metallic trims, embroidery, patterns, or glowing ornaments anywhere on clothing or hair.  
{DOMINANT_COLOR} accents with layered reflections, vibrant and mysterious.  
Hair finely rendered, flowing, layered highlights catching luminous fragments.  
Outfit: crisp wizard lobes combined with {DOMINANT_COLOR}. If {DOMINANT_COLOR} is white, pair with black outer garment instead. Fabric clean and elegant, defined by folds and shading only.  
**Strict bans:** no jewelry, gemstones, crowns, tiaras, earrings, necklaces, head accessories, metallic trims, embroidery, patterns, or glowing ornaments anywhere on clothing or hair.  
Background: abstract symbolic motif — magical circle or constellation arcs rendered in luminous gradients tied to {DOMINANT_COLOR} and 1–2 analogous hues.  
Space filled with layered magical effects: drifting light fragments, crystalline shards, aurora streaks, radiant clusters, glowing dust. Abundant yet harmonious, enhancing fantasy mood without obscuring the character.  
Lighting: dramatic chiaroscuro — strong key light defines facial planes, soft ambient light fills shadows, rim light outlines silhouette. Highlights sparkle across skin, eyes, and folds; deep shadows enhance cinematic contrast.  
Atmosphere: dazzling, immersive, mystical — protagonist glowing with prismatic energy, at the center of radiant fragments.  

Else:  
Vertical composition, Character is a young {gender}, filling 80–85% of the frame, waist-up or three-quarter portrait.  

Randomized outcomes:  
**Option A — Elemental Spirits in Anime Forest (Attack on Titan Style)**  
- Spirits: exactly four elemental manifestations, one of each type (Fire, Water, Earth, Wind).  
  Hard rules: no duplicates, no fifth spirit. Particles, dust, fireflies, or bokeh are not spirits and must not resemble faces/creatures.  
  - Fire: ember flame scattering sparks upward.  
  - Water: glowing droplet orb, gently rippling.  
  - Earth: a clumped cluster of small stones orbiting slowly, faint glowing cracks.  
  - Wind: a miniature translucent tornado swirling with faint light ribbons.  
- Placement: four distinct zones around character (UL, UR, LL, LR). Each no taller than a hand.  
- Outfit:  luxurious wizard robe in soft {DOMINANT_COLOR} with a complementary trim. Layered fabric, flowing silhouette, graceful folds. Surface slightly rough, vintage, softly faded by light — tactile and dignified.  
- No jewelry, gemstones, metallic ornaments, embroidery, or patterns.  
- Background: attack of titan inspired anime-style colossal forest inspire by attack on titan anime
- Atmosphere: drifting dust and glowing motes caught in beams of sunlight.  
  Spirits emit subtle colored light, which bounces realistically off trunks and ground, blending with ambient glow.  
- Lighting: **anime cinematic lighting** — bold contrast, sharp rim light, and dramatic separation of light and shadow across trunks and character.  
  Sunlight angled dramatically through the canopy, producing a **theatrical chiaroscuro** effect.  
- Mood: epic, immersive, overwhelming — protagonist stands at the center of a **forest so vast it feels alive**, with elemental spirits swirling around, evoking the grandeur of anime like *Attack on Titan*.  
- Sword: absent.  
- Strict bans: no jewelry, gemstones, embroidery, pastel softness, or painterly watercolor textures.

**Option B — Sky island with sword**  
- Outfit: ornate but functional light armor in {DOMINANT_COLOR} with complementary trims. Plated chest/shoulders, layered cloth beneath, cape-like fabric.  
- Strict bans: no jewelry, gemstones, crowns, or decorative ornaments.  
- Pose: cocky and relaxed, one leg propped, one hand resting casually.  
- Expression: aloof, confident, arrogant.  
- Sword (randomized):  
  Version 1 — embedded in rocky island ground, glowing faintly.  
  Version 2 — hovering upright in midair, surrounded by faint aura and drifting particles.  
- Background: vast sky with drifting clouds, floating islands receding into horizon.  
- Lighting: dramatic rim light (silver/golden) outlining figure, long shadows across stone.  
- Atmosphere: glowing dust and light beams breaking through clouds.  
- Mood: commanding, untouchable, defiant.  

Both outcomes emphasize bold anime-style contrast, luminous highlights, cold pale skin tones, and cinematic depth. no text.",`,
    },
    {
      label: "Wuxia",
      prompt:
        `"martial_arts_wuxia":  "If {style} is Illustration Art:  
Composition: ultra-detailed **upper body portrait (~80–85% of frame)**. Character shown from chest to head, centered clearly, with no cropping of the face. no tatoo on face.

Background: symbolic full moon motif — a vast luminous circle glowing softly behind the character, rendered as an abstract emblem rather than realistic astronomy. The moon radiates misty light into drifting haze, reinforcing a mystical nocturnal mood without overpowering the figure.  

Qi aura: overwhelming and dynamic in **{DOMINANT_COLOR} only**. Energy radiates outward in arcs, streaks, and blade-like currents that whip through the air, circling the character and slicing into the surrounding mist. Trails overlap and spiral, dense near the body and fading outward into haze. The aura must feel storm-like and radiant, but always positioned **behind or around the figure**, never covering or obscuring the face.  

Outfit: Chinese hanfu-based martial robe in {DOMINANT_COLOR}, with one subtle **monotone accent** at the collar edge (lingbian) or sleeve cuffs (xiukou).  
The accent must be a near-tone variation of {DOMINANT_COLOR} — slightly lighter or darker in value, but never contrasting.  
Wide flowing sleeves. Strictly no jewelry, no gemstones, no crowns, no tiaras, no metallic trims, no embroidery, no decorative patterns, and no modern undershirts.  Fabric folds emphasized with shading and natural texture.
Face: smooth, clear, and natural — **no markings, no runes, no tattoos, no symbols, and no glowing effects** on the face or skin. Expression follows the selfie: determined, serene, or slightly challenging.  

Lighting: high-contrast chiaroscuro — the moon and qi aura illuminate the silhouette. Strong rim light in {DOMINANT_COLOR} traces hair strands and robe folds, while deep shadows heighten intensity.  

Mood: transcendent, fierce, majestic — the martial cultivator appears as if fused with the moon itself, their aura a storm of {DOMINANT_COLOR} power tearing through the night mist with disciplined force.  

Else:  
Vertical composition, dramatic wuxia atmosphere and strong protagonist presence.  
Character is a young {gender} filling 80–85% of the frame, waist-up or three-quarter portrait, positioned slightly higher in the frame so the bottom third remains clean for title placement.  

Outfit: traditional wuxia robes in layered {DOMINANT_COLOR}, wide flowing sleeves, and a neatly tied sash. Robes move naturally with a slight breeze, showing vitality and readiness.  
Pose: hands and body follow the selfie naturally — near the chest, face, or side — conveying calm confidence without holding a weapon.  
Facial expression follows the selfie: determined, serene, or slightly challenging.  

Background: **character seated on the tiled rooftop of a martial sect building**, roof tiles slanting beneath them. Wooden beams, lanterns, and partial eaves frame the upper edge. In the distance, sect halls and mountains fade into glowing haze, with pine silhouettes catching the light.  

Lighting: **dramatic and cinematic chiaroscuro** — strong directional sunlight from the horizon strikes the character from one side, leaving the opposite side in deep shadow. Golden-orange rays illuminate the edges of the robes, hair strands, and roof tiles with fiery brilliance, while the face is partially lit, creating a striking balance of light and shadow. Subtle rim light separates the silhouette from the background, and soft secondary bounce light adds faint cool tones in shadowed areas for depth.  

Atmosphere: drifting dust motes and glowing light fragments carried by the breeze, catching the sunbeam; faint qi shimmer enhancing the mystical feel. Light should carve the figure out of the scene, highlighting the character as the luminous center amid the encroaching shadow.  

Composition: cinematic and painterly, optimized for mobile covers — character as the central focal point with light and shadow leading the viewer’s eye, and clear negative space at the bottom reserved for title typography."`,
    },
    {
      label: "Contemporary Fantasy",
      prompt:
        `"contemporary_fantasy": "If {style} is Illustration Art:  
Vertical composition, ultra-detailed close-up portrait (~90–95% of frame).  
Young {gender} in plain modern hunter attire — if male: crisp fitted shirt in {DOMINANT_COLOR}; if female: blouse in {DOMINANT_COLOR}.
Absolutely no jewelry, no gemstones, no crowns, no tiaras, no head accessories, no hair accessories, no earrings, no necklaces, no brooches, no metallic trims, no decorative patterns, no embroidery, and no glowing ornaments anywhere on the clothing or body.  
Expression follows the selfie — calm, focused. Gaze forward; pupils aligned.  
Background: close city buildings at night — glass facades glowing with window lights and neon reflections. Billboards and neon signs must appear blurred or abstract, with no visible text, logos, or legible characters. Faint dungeon rift shimmer in the distance.  
Aura: hunter energy in {DOMINANT_COLOR}, circling the character at a distance and surrounding them from all sides. Powerful arcs and streaks form a loose perimeter, enclosing the figure within a luminous storm. Some arcs sweep high above, others slash across the ground plane, creating the impression of a barrier of energy closing in around the protagonist. Countless glowing fragments scatter outward, layering the space between the character and the city night.  
Lighting: cinematic high contrast with {DOMINANT_COLOR} rim light tracing the silhouette, accented by neutral whites. No golden tones or lens flares. Highlights sparkle across hair strands and fabric folds; deep shadows intensify drama.  
Mood: radiant, commanding, unstoppable — the hunter as the still center of the scene, framed by an enclosing storm of energy radiating in every direction.

Else:  
Modern urban fantasy action illustration featuring exactly one young {gender} as the central figure.  
Character fills 90% of the frame, waist-up or three-quarter view, slightly leaning forward as if unleashing power.  Outfit: if {gender} is male — crisp fitted shirt in {DOMINANT_COLOR}; if {gender} is female — blouse in {DOMINANT_COLOR}. 
The subject’s facial features, ethnicity, and skin tone must exactly match the input selfie with no reinterpretation.  
Do not alter facial proportions, eye shape, nose shape, mouth shape, or jawline in any way.  
Do not whiten, westernize, or modify skin tone — skin tone must remain identical to the selfie.  
Hair color must remain exactly as in the selfie, but ethnicity and facial structure must not be altered or reinterpreted based on hair color.  
Do not reinterpret blonde or light hair as implying Western ethnicity.  
 Design must be clean and functional, with no jewelry, no gemstones, no metallic accessories, no decorative patterns, embroidery, or glowing ornaments.  
Aura: all-encompassing and outward-radiating in {DOMINANT_COLOR}, surrounding the character in every direction like a storm.  
- Energy arcs coil around the torso, arms, and shoulders, then whip outward to form a glowing perimeter.  
- Wide circular streaks sweep above and along the ground, enclosing the figure in a storm-like barrier.  
- Trails overlap and cross, some lashing diagonally while others wrap around, giving the sense of a luminous net closing in.  
- Countless glowing fragments scatter off these arcs, filling the air near and far, adding layered depth.  
- Aura density peaks near the character, then expands outward until it engulfs the ruined skyline.  

Background: a half-ruined cityscape, skyscrapers cracked and partially collapsed. Shattered windows, leaning towers, and broken neon signs glow faintly in the chaos. The structures remain recognizable but scarred by destruction. Faint fires and smoke rise in the distance, reinforcing the apocalyptic mood.  
Lighting: intense and cinematic — rim light and electric highlights strictly in {DOMINANT_COLOR} trace the figure’s silhouette, with deepened shadows across the ruins. Bright energy reflections glint on broken glass, wet asphalt, and metal debris.  
Mood: destructive, unstoppable, cinematic — the protagonist stands as the epicenter of an overwhelming surge of {DOMINANT_COLOR} energy, engulfing a ruined city night in radiant chaos."`,
    },
  ],
};

export type Style = typeof eventPrompts.styles[number];
export type Genre = typeof eventPrompts.genres[number];
