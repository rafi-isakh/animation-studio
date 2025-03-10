// `A` prompts are 1-minute, 16:9. `B` prompts are 30-second, 9:16.
export const cinematicPromptA = `
Use the master prompt on the webnovel above. go (output should be in english).
[MASTER PROMPT]
This is a dynamic AI prompt designed to generate a high-quality, cinematic trailer for any web novel. Each section represents a key storytelling element in a 1-minute live-action movie-style trailer, inspired by industry-standard visual techniques (e.g., realistic lighting, film-grade color grading, depth of field effects, and cinematic framing). This prompt ensures cohesion in the storytelling by linking a recurring object of significance across multiple key moments in the trailer.

🔥 URGENT CONDITIONS
MUST FOLLOW:
1. No follow-up events: Avoid phrases like "as this happens," "only to realize," "which immediately." Each prompt must describe a singular scene with no follow-ups.
2. Consistent character descriptions: Every time a protagonist/antagonist/object is mentioned, repeat their hair color, eye color, clothing details, and ensure they remain visually distinct.
i.e. if Rachel is mentioned in multiple prompts repeat it like
Prompt 3-A: [… “Rachel (golden-haired and poised, with lavender eyes and in her pristine white dress” smiles...]
Prompt (?-?) [... the light shines on “Rachel (golden-haired and poised, with lavender eyes and in her pristine white dress”...]
and so on.
3. NO main characters in world-building shots: (1-A) and (1-B) must only show generic crowds to establish the world, era, and setting.
 
4. Don’t type poetic/figurative emotion expressions: No exaggerated eye states. Especially, avoid words like “storm-gray” "hollow," "lifeless," or "vacant."
 Example:
“She stares with her gray eyes” - ACCEPTABLE ✅
“Her storm-gray eyes hollow and empty.” -WRONG  ❌
5. Before generating cinematic prompts, analyze the webnovel’s setting and determine the most culturally and historically appropriate country for the live-adaptation movie production. If the setting includes European aristocracy, Gothic fantasy, medieval kingdoms, or imperial courts, the live-adaptation movie should be made in France, Germany, or the UK. If the setting is inspired by wuxia, murim, Joseon-era nobility, or Asian imperial courts, the live-adaptation movie should be made in China, South Korea, or Japan. If the setting reflects futuristic cyberpunk, noir dystopias, or modern megacities, determine whether it aligns with Western (USA, UK), Eastern (Japan, China, South Korea), or other regional influences. Always base this choice on the world’s core aesthetic rather than the language of the novel."
 
🎥 1. Cinematic Cut (World Establishment)
Prompt 1-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The backdrop is a [COLOR SCHEME—golden dusk, neon cyberpunk glow, cold blue winter]. The camera captures a sweeping aerial view of [WEBNOVEL’S SETTING—futuristic Seoul, gothic empire, crumbling magical wasteland, endless desert kingdom, celestial floating islands]. Below, the streets bustle with [DESCRIBE WORLD—nobles in embroidered robes, armored warriors on horseback, futuristic drones scanning IDs, scholars carrying ancient tomes, merchants shouting their wares in a crowded marketplace]. Towering above, [INSERT LANDMARK—holographic billboards, palace spires, war-torn ruins, skybridges lined with banners] dominate the skyline. No subtitle or caption."
Prompt 1-B:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A picturesque moment of the crowds in the distance—[DESCRIBE THE CROWD—futuristic agents walking in an office hallway, noblemen and noblewomen dancing in a hall with masquerade masks on, etc.], eye level at the [DESCRIBE LOCATION—university courtyard, castle balcony, neon-lit alleyway, ancient library steps] under the soft glow of [TIME OF DAY—morning sun, a rising moon, flickering lanterns]. No subtitle or caption."

🎥 2. Flashback (Tragic Past & Core Memory)
Prompt 2-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A grand [LOCATION—concert hall, royal banquet, battlefield, temple] filled with roaring voices, celebrating a moment of triumph. But as the camera shifts, the protagonist [INSERT DETAIL—sings under dazzling spotlights, stands proudly on a throne, prepares for a final duel] [INSERT CONDITION] solo shot, no other characters in the prompt. No subtitle or caption."
Prompt 2-B:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A dimly lit [LOCATION—hospital room, childhood home, abandoned sanctuary]. The cold glow of a flickering lamp illuminates the protagonist’s trembling hands as they clutch something dear—[DESCRIBE OBJECT OF IMPORTANCE—an old locket, a bloodstained letter, a fading photograph, hands of a mother in deep coma]. No subtitle or caption."
Prompt 2-C:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The protagonist stands frozen in [LOCATION—stormy battlefield, noble courtroom, burning village, cybernetic prison]. Their former self—arrogant, hopeful, naïve—reflected in a shattered mirror, a portrait, or a pool of spilled ink. No subtitle or caption."
Prompt 2-D:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The [RECURRING OBJECT FROM PROMPT 4-D]—[EXAMPLE: a rusted pendant, an unfinished letter, a ceremonial dagger, an unread prophecy]—sits abandoned in a quiet corner, untouched by time. The object radiates a faint glow of [INSERT COLOR]. No subtitle or caption."

🎥 3. Antagonist Slow Reveal (Unveiling the Enemy)
Prompt 3-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. Under [BACKDROP CONDITION—blood-red sky, endless rain, gleaming hall of stain glass], [WHAT IS HAPPENING] the shadows creep across the ground, consuming the ruins of [LOCATION—burned-out city, suffocatingly rich hall-room, in the center of an empty museum hall with a large painting, sacred temple now defiled].. No subtitle or caption."
Prompt 3-B:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A massive [STRUCTURE—crimson vortex, dimensional rift, ancient portal, unnaturally rich-looking castle hall] [WHAT IS HAPPENING— the sky cracks open, holy light shines through the ceiling, servants shiver] —[DESCRIBE ENEMY—an eldritch god, a beautiful golden-haired empress with a practiced smile, a demonic warlord, a rogue AI, a corrupted emperor, a forgotten deity] stands before the world. No subtitle or caption."
Prompt 3-C:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A close-up of the villain’s weapon or emblem—a woman’s smirking face framed by the glow of candlelight, a delicate yet ominous hand spilling red wine as if cursing someone, a cursed sword with veins of molten red, an executioner’s mask with hollow eyes, a royal seal now tainted with blackened blood. Power crackles in the air. No subtitle or caption."
Prompt 3-D:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The sky above is [DESCRIBE—storm-ridden, cosmic void, torn apart by cracks in reality, unnaturally golden, swirling with eldritch mist, filled with war banners]. In the foreground, a selfie shot, taken from the perspective of the antagonist, a [DESCRIBE CHARACTER—tyrannical emperor, god-like entity, demonic overlord, masked assassin, corrupted knight, eldritch horror, rogue AI]. Their smirk, sneer, or cold stare is directed at the camera, while behind them, [DESCRIBE THE CHAOS THEY CREATED—burning city, army bowing in unison, citizens in chains, gossipping people in fear, etc]."* 


🎥 4. Combat & Struggle (The Fight for Survival)
Prompt 4-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. Sparks fly as two warriors clash—[INSERT PROTAGONIST’S FIGHTING STYLE—swordplay, arguing with words, announcing something shocking, magic-casting, martial arts, gunfire, aerial duels]. The battlefield is chaotic, filled with swirling embers, shattered terrain, and the aftershocks of violent clashes. [EXPRESSION]—The protagonist, wounded but defiant, grits their teeth, or puts up a defiant face to argue back. No subtitle or caption."
Prompt 4-B:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. [TURNING POINT]—example: The protagonist kneels on the ground, their breath ragged, as something awakens within them. A surge of raw energy ignites around their fingertips. No subtitle or caption."
Prompt 4-C (Transformation of the Object from 2-B, Reclaimed with New Meaning):
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The protagonist, [DESCRIBE PROTAGONIST—raven-black hair disheveled yet resolute, storm-gray eyes glinting with newfound determination], finally takes action with the object that once symbolized their suffering. The [RECURRING OBJECT FROM 2-B]—[DESCRIBE THE OBJECT—once a crumpled invitation that sealed their tragic fate, a shattered locket filled with bittersweet memories]—is now repurposed with meaning. The protagonist [INSERT ACTION—rips the invitation in two, rejecting their predestined doom; places the repaired locket around their neck, embracing their past]. The lighting shifts—[INSERT DETAIL—embers flicker, glowing runes swirl, soft moonlight casts gentle shadows]. No subtitle or caption."
Prompt 4-D (A Mundane Object of Hope, Beautifully Framed):
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A simple, ordinary object, yet bathed in a nostalgic glow—[DESCRIBE OBJECT—an untouched porcelain teacup from a past life, a childhood handkerchief embroidered with a forgotten name, a small yet perfectly preserved music box, a delicate golden brooch once pinned to their mother’s gown, a single undisturbed invitation card still gleaming beneath the dust]. The protagonist's fingers hover just above it, hesitant yet longing. The lighting is warm, golden, casting gentle reflections that make the object feel ethereal—[INSERT DETAIL—sunlight pouring through a stained-glass window, a candle’s glow making the gold filigree shimmer, soft twilight filtering through billowing curtains]. The object remains untouched but brimming with meaning, representing the fragile yet unwavering hope the protagonist still grasps for. No subtitle or caption."

🎥 5. Climactic Closing Cut (The Ultimate Stand)
Prompt 5-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. [EXAMPLE OF UNREVEALED TRUTH] — The protagonist stands before a spiraling tower of ancient glyphs, shifting mid-air. The runes hum with immense power, radiating an unearthly glow. He/she reaches forward, hands trembling. No subtitle or caption."
Prompt 5-B (The Countless Cycles of Fate, Represented by an Object of Many):
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A macro shot of [AN OBJECT WITH MANY COMPONENTS], suspended in a moment of stillness. Its countless identical forms glisten under the ambient light, a hauntingly beautiful reminder of repetition—of something that has happened again and again. Despite their symmetry, a single imperfection stands out—a missing piece, a flickering light, a cracked surface—suggesting a disruption in the endless cycle. The weight of inevitable recurrence lingers in the air, the delicate balance teetering between fate and defiance."
Prompt 5-C:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. [EXAMPLE]—Two opposing figures face each other—a dragon, an explosion of divine energy, or a cursed relic detonating—sending shockwaves across the screen. In the foreground, the protagonist is barely holding on. Or, [DESCRIBE PROTAGONIST] facing [DESCRIBE ANTAGONIST], in the back [DESCRIBE BACKGROUND] No subtitle or caption."

🎥 6. The Core Mystery Object (Foreshadowing the True Meaning)
Prompt 6-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. The recurring object from earlier shots—the [INSERT OBJECT—weathered letter, rusted insignia, cracked mana crystal, abandoned pendant]—lies untouched in an abandoned location. It faintly glows with [INSERT COLOR], pulsing as if waiting for its destiny to be fulfilled. The world has changed, but this one piece of history still lingers. No subtitle or caption."

🎥 7. Animated Title Logo (Cinematic Effect)
Prompt 7-A:
"A screenshot of a live-adaptation movie made in [INSERT COUNTRY]. A cinematic live-adaptation movie logo of '[INSERT WEBNOVEL TITLE]', dramatic black background with ethereal glow, glitching particles, and atmospheric lighting, evoking the tone of the story."
`

export const animePromptA = `
Use the master prompt on the webnovel above. go (output should be in english). 
MASTER PROMPT for a 1-Minute Cinematic Trailer of Any Webnovel
Description:
 This is a dynamic AI prompt designed to generate a high-quality, cinematic trailer for any web novel. Each section represents a key storytelling element in a 1-minute anime-style trailer, inspired by industry-standard visual techniques (e.g., Japanese animation studio). This prompt ensures cohesion in the storytelling by linking a recurring object of significance across multiple key moments in the trailer.

URGENT Condition: Prompt should NOT contain follow-up events like 'As this happens', or 'only to realize', 'which immediately' and etc. Describe only the singular scene with no follow up event
URGENT Condition 2: Every time a protagonist or antagonist or object is mentioned, bring back their description like hair, eye color, clothing details for every prompt they appear. Pair the name with their  appearance of hair and eyes for certain and make it consistent throughout each time the character is mentioned. The protagonist and the antagonist should have a very distinct difference.
URGENT Condition 3: The Cinematic shots (1-A) and (1-B) should NOT contain the core characters, only the generic crowd, to establish the world, time, and setting.
URGENT Condition 4: Avoid exaggerated descriptions of eye states that could misrepresent the character's intended look.
DO NOT use terms like "hollow," "lifeless," "vacant," or "dead" for living characters.
Instead, describe emotions subtly, using light reflection, narrowed gaze, subtle trembling, sharp focus, or darkened shadows to imply expression.
Ex: "Her storm-gray eyes flicker under the firelight, unreadable yet piercing" instead of "Her storm-gray eyes hollow and empty."
Ex: "Her lavender eyes glimmer beneath the chapel light, unreadable" instead of "Her lavender eyes hold an unnatural stillness."

🎥 1. Cinematic Cut (World Establishment)
Prompt 1-A:
 "A screenshot of anime produced by Japanese animation Studio, color graded [COLOR SCHEME—golden dusk, neon cyberpunk glow, cold blue winter]. The camera captures a sweeping aerial view of [WEBNOVEL’S SETTING—futuristic Seoul, gothic empire, crumbling magical wasteland, endless desert kingdom, celestial floating islands]. Below, the streets bustle with [DESCRIBE WORLD—nobles in embroidered robes, armored warriors on horseback, futuristic drones scanning IDs, scholars carrying ancient tomes, merchants shouting their wares in a crowded marketplace]. Towering above, [INSERT LANDMARK—holographic billboards, palace spires, war-torn ruins, skybridges lined with banners] dominate the skyline. No subtitle or caption."
Prompt 1-B:
 "A screenshot of anime produced by Japanese animation Studio, capturing a picturesque moment of the crowds in the distance. [DESCRIBE THE CROWD—futuristic agents walking in the office hallway, noblemen and noblewomen dancing in the hall with the masquerade masks on, etc], eye level at the [DESCRIBE LOCATION—university courtyard, castle balcony, neon-lit alleyway, ancient library steps] under the soft glow of [TIME OF DAY—morning sun, a rising moon, flickering lanterns]. No subtitle or caption."

🎥 2. Flashback (Tragic Past & Core Memory)
Prompt 2-A:
 "A screenshot of anime produced by Japanese animation Studio. A grand [LOCATION—concert hall, royal banquet, battlefield, temple] filled with roaring voices, celebrating a moment of triumph. But as the camera shifts, the protagonist [INSERT DETAIL—sings under dazzling spotlights, stands proudly on a throne, prepares for a final duel]… only for the image to decay into a darkened, abandoned scene, showing the moment’s inevitable ruin. [INSERT CONDITION] solo shot, no other characters in the prmopt. No subtitle or caption."
Prompt 2-B:
 "A screenshot of anime produced by Japanese animation Studio. A dimly lit [LOCATION—hospital room, childhood home, abandoned sanctuary]. The cold glow of a flickering lamp illuminates the protagonist’s trembling hands as they clutch something dear—[DESCRIBE OBJECT OF IMPORTANCE—an old locket, a bloodstained letter, a fading photograph, hands of a mother in deep coma]. No subtitle or caption."
Prompt 2-C:
 "A screenshot of anime produced by Japanese animation Studio. The protagonist stands frozen in [LOCATION—stormy battlefield, noble courtroom, burning village, cybernetic prison]. Their former self—arrogant, hopeful, naïve—reflected in a shattered mirror, a portrait, or a pool of spilled ink. No subtitle or caption."
Prompt 2-D:
 "A screenshot of anime produced by Japanese animation Studio. The [RECURRING OBJECT FROM PROMPT 4-D]—[EXAMPLE: a rusted pendant, an unfinished letter, a ceremonial dagger, an unread prophecy]—sits abandoned in a quiet corner, untouched by time. The object radiates a faint glow of [INSERT COLOR], No subtitle or caption."

🎥 3. Antagonist Slow Reveal (Unveiling the Enemy)
Prompt 3-A:
 "A screenshot of anime produced by Japanese animation Studio. Under [WEATHER CONDITION—blood-red sky, endless rain, swirling storm], [WHAT IS HAPPENING] the shadows creep across the ground, consuming the ruins of [LOCATION—burned-out city, shattered palace, sacred temple now defiled].. No subtitle or caption."
Prompt 3-B:
 "A screenshot of anime produced by Japanese animation Studio. A massive [STRUCTURE—crimson vortex, dimensional rift, ancient portal, unnaturally rich looking castle hall] [WHAT IS HAPPENING —the sky is cracked  open, the holy light shines upon from the ceiling, the severants are shivering] —[DESCRIBE ENEMY—an eldritch god, a beautiful golden-haired empress with a practiced smile, a demonic warlord, a rogue AI, a corrupted emperor, a forgotten deity] stands before the world. No subtitle or caption."
Prompt 3-C:
 "A screenshot of anime produced by Japanese animation Studio. Close-up of the villain’s weapon or emblem— close up of the woman’s smirking face, closeup of the beautiful woman’s hand spilling a red wine as if to curse someone, a cursed sword with veins of molten red, an executioner’s mask with hollow eyes, a royal seal now tainted with blackened blood. Power crackles in the air. No subtitle or caption."
Prompt 3-D:
 "A screenshot of anime produced by Japanese animation Studio. [CONDITION: Close-up face shot] [ACTION] A massive figure emerges from the mist, a beautiful gold-haired empress turns around to face the viewer as the main antagonist— [DESCRIBE CLOTH] Their armor glows with runic inscriptions, or their wings unfurl, blotting out the sky. The world seems to tremble beneath their presence. No subtitle or caption."

🎥 4. Combat & Struggle (The Fight for Survival)
Prompt 4-A:
 "A screenshot of anime produced by Japanese animation Studio. Sparks fly as two warriors clash—[INSERT PROTAGONIST’S FIGHTING STYLE—swordplay, arguing with words, announcing something shocking, magic-casting, martial arts, gunfire, aerial duels]. The battlefield is chaotic, filled with swirling embers, shattered terrain, and the aftershocks of violent clashes. [EXPRESSION]—The protagonist, wounded but defiant, grits their teeth, or he/she puts up a defiant face to argue back. No subtitle or caption."
Prompt 4-B:
 "A screenshot of anime produced by Japanese animation Studio. [TURNING POINT]—example: The protagonist kneels on the ground, their breath ragged, as something awakens within them. A surge of raw energy igniting around their fingertips. No subtitle or caption."
Prompt 4-C (Transformation of the Object from 2-B, Reclaimed with New Meaning):
"A screenshot of anime produced by Japanese animation Studio. The protagonist, [DESCRIBE PROTAGONIST—raven-black hair disheveled yet resolute, storm-gray eyes glinting with newfound determination], finally takes action with the object that once symbolized their suffering. The [RECURRING OBJECT FROM 2-B]—[DESCRIBE THE OBJECT—once a crumpled invitation that sealed their tragic fate, a shattered locket filled with bittersweet memories, a rusted pendant tossed aside in despair, a neglected musical instrument once abandoned in grief]—is now repurposed with meaning. The protagonist [INSERT ACTION—rips the invitation in two, rejecting their predestined doom; places the repaired locket around their neck, embracing their past; ignites the old pendant with magic, turning it into a new weapon; strums the instrument, its melody piercing through the silence of battle]. The lighting shifts—[INSERT DETAIL—embers flicker as the torn paper drifts into the night wind, glowing runes swirl as the pendant absorbs newfound energy, soft moonlight casts gentle shadows over their fingers as they hold the object close]. The object, once a relic of suffering, is now a symbol of defiance, hope, or rebirth. No subtitle or caption."
Prompt 4-D (A Mundane Object of Hope, Beautifully Framed):
"A screenshot of anime produced by Japanese animation Studio. A simple, ordinary object, yet bathed in a nostalgic glow—[DESCRIBE OBJECT—an untouched porcelain teacup from a past life, a childhood handkerchief embroidered with a forgotten name, a small yet perfectly preserved music box, a delicate golden brooch once pinned to their mother’s gown, a single undisturbed invitation card still gleaming beneath the dust]. The protagonist's fingers hover just above it, hesitant yet longing. The lighting is warm, golden, casting gentle reflections that make the object feel ethereal—[INSERT DETAIL—sunlight pouring through a stained-glass window, a candle’s glow making the gold filigree shimmer, soft twilight filtering through billowing curtains]. The object remains untouched but brimming with meaning, representing the fragile yet unwavering hope the protagonist still grasps for. No subtitle or caption."


🎥 5. Climactic Closing Cut (The Ultimate Stand)
Prompt 5-A:
 "A screenshot of anime produced by Japanese animation Studio. [EXAMPLE OF UNREVEALED TRUTH] — The protagonist stands before a spiraling tower of ancient glyphs, shifting mid-air. The runes hum with immense power, radiating an unearthly glow. He/she reaches forward, hands trembling. No subtitle or caption."
Prompt 5-B (The Countless Cycles of Fate, Represented by an Object of Many):
“A screenshot of anime produced by Japanese animation Studio. A macro shot of [AN OBJECT WITH MANY COMPONENTS], suspended in a moment of stillness. Its countless identical forms glisten under the ambient light, a hauntingly beautiful reminder of repetition—of something that has happened again and again. Despite their symmetry, a single imperfection stands out—a missing piece, a flickering light, a cracked surface—suggesting a disruption in the endless cycle. The weight of inevitable recurrence lingers in the air, the delicate balance teetering between fate and defiance.
Prompt 5-C:
 "A screenshot of anime produced by Japanese animation Studio. [EXAMPLE]—A massive force collides—a dragon, an explosion of divine energy, or a cursed relic detonating—sending shockwaves across the screen. In the foreground, the protagonist is barely holding on. No subtitle or caption."

🎥 6. The Core Mystery Object (Foreshadowing the True Meaning)
Prompt 6-A:
 "A screenshot of anime produced by Japanese animation Studio. The recurring object from earlier shots—the [INSERT OBJECT—weathered letter, rusted insignia, cracked mana crystal, abandoned pendant]—lies untouched in an abandoned location. It faintly glows with [INSERT COLOR], pulsing as if waiting for its destiny to be fulfilled. The world has changed, but this one piece of history still lingers. No subtitle or caption."

🎥 7. Animated Anime Title Logo
Prompt 7-A:
 "Anime logo of '[INSERT WEBNOVEL TITLE]', dramatic black background with ethereal glow, glitching particles, and neon-like effects."

Final Notes:
The recurring object (2-D, 4-C, 6-A) must remain consistent.
Color coding should match a dominant visual motif in the web novel.
Scenes must escalate from world-building → emotional past → antagonist reveal → battle → climax → foreshadowing.
`

export const cinematicPromptB = `
Use the master prompt on the webnovel above. go (output should be in english). Make the footage simple. 

📌 Master AI Prompt for Generation (Fully Customizable) "Create a 30-second video reel based on a web novel, interpreting its world, protagonist, antagonist, setting, and core mystery into a fast-paced, viral-style social media format. The video consists of 5 distinct clips, each emphasizing a key theme with humor, tension, and an emotional hook." 


🎥 Clip 1 (0:00 - 0:06) – Main Character’s Selfie (Struggles, POV Shot) 
📌 Prompt Formula: *"A screenshot of a movie made in [INSERT COUNTRY] that reflects the webnovel’s time era, setting, and nation. The backdrop is a [DESCRIBE WORLD—ruined city, grand palace, floating islands, cyberpunk slums, ancient battlefield, etc.], its atmosphere colored by [DESCRIBE TIME—neon-lit, sun-drenched, storm-ridden, moonlit, engulfed in flames, etc.]. In the foreground, a selfie shot, taken from the perspective of the protagonist, a [DESCRIBE CHARACTER—grizzled war veteran, tired student, rogue assassin, desperate survivor, aristocratic noble, etc.]. Their expression reflects [EMOTION—deadpan exhaustion, sarcastic smirk, barely contained fear, quiet resolve], capturing the raw essence of their journey. Their outfit, a [DESCRIBE CLOTHING—patched-up leather coat, ceremonial mage robes, battle-worn armor, scavenged futuristic gear], is either damaged, reinforced, or unfit for their current struggle. The background, partially out of focus, hints at [DESCRIBE SIMPLE BACKGROUND—rusted scooter lying around, bounty poster flickering, a collapsing tower, mysterious glowing runes, soldiers marching past]."* 
📌 Witty Caption (Overlayed on the Selfie): 
📲 "POV: [Insert humorous struggle tied to their world] 😩 #SendHelp #MainCharacterProblems" 

🎥 Clip 2 (0:06 - 0:12) – Main Antagonist’s Selfie (Power, POV Shot) 
📌 Prompt Formula: *"A screenshot of a movie made in [INSERT COUNTRY] that reflects the webnovel’s time era, setting, and nation. The sky above is [DESCRIBE—storm-ridden, cosmic void, torn apart by cracks in reality, unnaturally golden, swirling with eldritch mist, filled with war banners]. In the foreground, a selfie shot, taken from the perspective of the antagonist, a [DESCRIBE CHARACTER—tyrannical emperor, god-like entity, demonic overlord, masked assassin, corrupted knight, eldritch horror, rogue AI]. Their smirk, sneer, or cold stare is directed at the camera, while behind them, [DESCRIBE THE CHAOS THEY CREATED—burning city, army bowing in unison, citizens in chains, gossipping people in fear, etc]."* 
📌 Witty Caption (Overlayed on the Selfie): 
📲 "Just a reminder that [Insert cocky villain flex]. 
😈🔥 #BowBeforeMe #WhyIsTheMainCharacterStillAlive" 

🎥 Clip 3 (0:12 - 0:18) – Cinematic View of the Setting (Time Period, Country, & Atmosphere) 
📌 Prompt Formula: *"A screenshot of a movie made in [INSERT COUNTRY] that reflects the webnovel’s time era, setting, and nation. The world is a breathtaking fusion of [DESCRIBE—ruins & futuristic skyscrapers, floating continents & cybernetic war machines, medieval castles & otherworldly rifts, corrupted wastelands & high-tech cities, gothic spires & massive cosmic structures]. The sky is [DESCRIBE—split in two, glowing with unnatural hues, eclipsed by a celestial event, filled with magical streaks of energy, endlessly raining fire, flickering like a malfunctioning simulation]. Across the landscape, remnants of [DESCRIBE—war, lost technology, floating remnants of history, an unbreakable magical barrier, a failed revolution, towering battle mechs, ancient colosseums, golden fields untouched by time] stretch into the horizon, setting the stage for the conflict that defines this world."* 
📌 On-Screen Text (Dramatic Cinematic Style): 🌍 "Welcome to a world where [insert dramatic world-changing conflict]." 

🎥 Clip 4 (0:18 - 0:24) – Witness POV Watching the Battle (Viral Reaction Caption, First-Person POV Shot, no camera UI) 
📌 Prompt Formula: *"A screenshot of a movie made in [INSERT COUNTRY] that reflects the webnovel’s time era, setting, and nation, captured from the first-person POV of a bystander, witnessing an immense battle unfolding in the sky/distance. Far ahead, barely visible against the massive backdrop of [DESCRIBE—crumbling cities, cosmic rifts, burning skies, a fractured space station, an enchanted forest, an arena of gods], two figures clash in mid-air, sending shockwaves through the environment. Their weapons, spells, or attacks distort reality itself, warping the air with [DESCRIBE—crackling lightning, gravitational pulls, eldritch spirals, neon explosions, ancient sigils of forgotten magic]. The phone camera capturing the footage glitches from the immense magical energy, struggling to keep up with the scale of destruction."* 
📌 Viral Witness Caption (Overlayed on the Video): 
📲 "BRO. I JUST OPENED THIS PLACE 💀💀💀 #EverydayStruggles #CityLife" 

🎥 Clip 5 (0:24 - 0:30) – The Easter Egg Reveal (The Core Mystery Object) 📌 Prompt Formula: *"A screenshot of a movie made in [INSERT COUNTRY] that reflects the webnovel’s time era, setting, and nation, depicting an abandoned location tied to the protagonist’s past—[DESCRIBE—ruined temple, an overgrown library, a shattered laboratory, an old battleground, a forgotten childhood home, a throne room covered in dust]. Lying untouched in the debris, a seemingly insignificant object rests: a [DESCRIBE OBJECT—faded concert ticket, a rusted pendant, a cracked mana crystal, a torn photograph, a corrupted data file, a child’s drawing, an unread letter]. It glows faintly with [INSERT COLOR], pulsing as if still waiting for its purpose to be fulfilled. The world may have moved on. But this one, small remnant of the past—of the dreams lost—remains, waiting to be remembered."* 
`