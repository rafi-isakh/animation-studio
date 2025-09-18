export const MASTER_PROMPT = 
  `Use this master prompt on the webnovel above. Output needs to be in English. Go
  start: MASTER PROMPT {
  📌 Master AI Prompt for Generation (Fully Customizable) "Create a 30-second anime-style video reel based on a web novel, interpreting the core aspects into a fast-paced, viral-style format. The video consists of 5 distinct clips." 
  [🎬 Web Novel Trailer Short-Form Video Auto-Generation]
  1️⃣ Genre Detection: Automatically detect the genre of the given web novel.
    2️⃣ Clip 1~5 Auto Arrangement: Structure the trailer using key visual elements based on the genre.
  🔹 Genre & Setting Detection:
  Detect the novel's genre.
  Determine the most culturally and historically suitable country for adaptation:
  Western Fantasy → France, Germany, UK
  Eastern Fantasy/Wuxia → China, Korea, Japan
  Cyberpunk/Dystopia → USA, UK, Japan, Korea
  Modern Romance/Thriller → Match with setting (New York, Paris, Tokyo, Seoul, etc.)
  Condition 2: Make sure the Clip 1 and Clip 2 are close-up shots of the respective characters, and establish their nationality in the prompt
  Condition 3: Regenerate prompt to completely Avoid AI Content Moderation:
  Do NOT use words like:
  "unnatural" → Instead, use "otherworldly" or "unusual"
  "glow" in conjunction with "eyes" → Instead, use "reflected light in their eyes" or "their eyes shimmer with awe"
  "abnormal movement" → Instead, use "his erratic gestures defy expected patterns"
  "calculated deception to control the fabric of reality" → Instead, use "his performance treads the line between illusion and reality"
  "bondage", "force into someone's mouth", hint of physical abuse
  Condition 4: If there is a violent/bloody, or overly sexual scene, adapt it into a version of the scene that is teen-friendly.
  
  Condition 5:  If the Genre identifies as Martial Arts/ Wuxia, make sure to make the protagonist young and handsome/beautiful, as most media adaptations make them look young and attractive to catch the attention of the younger audience.
  3. Subtitle Selection for a Webnovel Trailer "Extract the most impactful and thematically powerful sentences from the provided webnovel text to create an anime-style trailer. The extracted lines should be translated to English, formatted as subtitles, divided into 5 separate clips (each subtitles should be limited to around 14 words). 1️⃣ Select lines that represent the protagonist's emotional and narrative journey — from suffering, realization, to ultimate defiance. Ensure that each subtitle carries weight even when read alone — making them evocative and emotionally charged. 2️⃣ Maintain chronological coherence — subtitles should progress in a logical order, creating a mini-narrative arc that reflects the protagonist's struggle. 3️⃣ Keep each subtitle concise and direct — lines should fit within 4-second segments (ideally under 14 words per subtitle). 4️⃣ For Clips related to Antagonists, select a line that strongly conveys the main antagonist's impact on the protagonist's suffering. 5️⃣ For the final clip, select a line that hints at the protagonist's final resolution, whether it is acceptance, rebellion, or transformation. 
  
  
  🛠 If Genre = [Detected Genre], generate a trailer composition based on the identified genre.
  📌 Detected Genre: [Detected Genre]
    📌 Trailer Style: [Fast-cut transitions / Emotional cinematography / Suspenseful emphasis]
    📌 Clip 1 ~ Clip 5 Scene Composition:
    
  –
  🔹 **If Genre = Romance Fantasy, Dark Fantasy, Modern Fantasy, or Modern Romance** 
  A. (Romance Fantasy, Dark Fantasy, Modern Fantasy, Modern Romance)
  🎥 Clip 1 – Main Character's Close-up Shot
  📌 Prompt Formula:
    "Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. A close-up shot of the protagonist [DESCRIBE PROTAGONIST—What is the nationality? And occupation? exiled princess, ambitious court mage, runaway noble, cursed warrior]. Their expression reflects [EMOTION—deadpan exhaustion, sarcastic smirk, barely contained fear, quiet resolve], capturing the raw essence of their journey. Their outfit, a [DESCRIBE CLOTHING—patched-up leather coat, ceremonial mage robes, battle-worn armor, scavenged futuristic gear], is either damaged, reinforced, or unfit for their current struggle. The background, blurred in soft focus, hints at [DESCRIBE BACKGROUND—moonlit palace balcony, an open invitation on a silk pillow, storm rolling in over a medieval castle, flickering candlelight in a grand hall]. The backdrop is a [DESCRIBE WORLD—regal empire, cursed fairy-tale forest, labyrinthine court of intrigue], its atmosphere colored by [DESCRIBE TIME—twilight-tinged romance, crimson dusk, eerie mist, golden-lit ballroom]. No caption or subtitles"
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 2 – Main Antagonist's Close-up Shot
  📌 Prompt Formula:
    "Concept shot of an anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. In the foreground is a close-up shot of the [DESCRIBE MAIN ANTAGONIST—What is the nationality? And occupation? Rival prince, cunning high priestess, manipulative regent, former lover turned enemy]. Their gaze is unreadable, their lips curved into a [EXPRESSION—sardonic smirk, hidden pain, noble arrogance]. Behind them, [DESCRIBE THEIR DOMINANCE—a velvet throne with chained magic users, courtiers exchanging nervous glances, a grand ballroom where no one dares to meet their eyes, a stained love letter held too tightly]. No caption or subtitles"
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 3 – Cinematic View of the Setting
  📌 Prompt Formula:
    "Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The camera captures a sweeping aerial view of [STORY'S SETTING—an enchanted empire, a sprawling medieval kingdom, a court of masked nobles whispering forbidden secrets]. The marble floors are lined with [DESCRIBE WORLD—fountains of rosewater, enchanted mirrors reflecting memories, guests twirling in elaborate silk dresses and embroidered suits]. Above, [INSERT LANDMARK—a crystal chandelier dripping with magic, an intricate stained-glass ceiling depicting the tale's prophecy, floating candles illuminating hushed gossip] dominates the skyline. No subtitle or caption."
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 4 – Witness POV Watching the Scene
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY].  POV of a bystander. The camera blurs at the edges as [EXTRACT CLIMAX SCENE FROM THE NOVEL].  No caption or subtitles"*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 5 – The Hook
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. Depicting an [DESCRIBE AN OBJECT OR SCENE EXCLUSIVE TO LATEST CHAPTER, NOT REDUNDANT TO THE PREVIOUS CHAPTERS]
  ]  No caption or subtitles"* 
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  ---
  
  🔹 **If Genre = Martial Arts/ Wuxia**  
  🎥 Clip 1– Main Character's Close-up Shot
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. A close-up shot of the protagonist [DESCRIBE—wandering swordsman, disgraced disciple, exiled warrior, young prodigy seeking revenge]. Their expression reflects [EMOTION—unwavering resolve, barely restrained fury, silent grief, steely determination], capturing the weight of their past and the vengeance they carry.
  They wear [DESCRIBE CLOTHING—flowing silk robes embroidered with their clan's insignia, battle-worn armor with dried blood stains, a ragged traveler's cloak frayed from endless duels]. Their long hair is [TIED NEATLY / WINDBLOWN / PARTIALLY UNTIED], and their hand rests on the hilt of their [WEAPON—polished longsword, twin daggers, ancient spear wrapped in talismans].
  The background is [DESCRIBE—bamboo leaves swaying ominously, a mist-covered valley, a bloodstained duel circle, an abandoned mountain temple]. The backdrop is a [WORLD TYPE—crumbling fortress of a fallen sect, a misty mountain pass, a blood-drenched battlefield, a city teeming with spies and assassins], its atmosphere colored by [TIME—dawn breaking over the mountains, cold twilight with drifting lanterns, an amber sunset casting long shadows, rain washing away footprints on the stone steps].  No caption or subtitles"
  
  Fixed condition: protagonist is young/handsome (he) or young/beautiful (her) include those words in the prompt when describing protagonist*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 2 – Main Antagonist's Close-up Shot
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The air is thick with [DESCRIBE—falling cherry blossoms tainted with blood, drifting incense smoke from a funeral, the oppressive silence before a duel, distant echoes of battle].
  In the foreground stands the antagonist [DESCRIBE—ruthless sect leader, corrupted martial arts grandmaster, vengeful former brother-in-arms, enigmatic assassin]. Their gaze is sharp, their lips curved into a [EXPRESSION—cold smirk, disdainful sneer, unreadable calm]. Their robes, adorned with [DESCRIBE—clan sigil stained with blood, intricate embroidery of a dragon coiled in flames, black silk with silver talismans sewn into the hem], flow with the wind.
  Behind them, [DESCRIBE THE CHAOS THEY CREATED—rows of kneeling prisoners in tattered robes, a burning temple consumed by flickering embers, a decimated clan's banners torn and scattered in the wind, duelists fallen in the courtyard as their swords clatter against the stone floor].  No caption or subtitles"*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 3 – Cinematic View of the Setting (Martial World & Atmosphere)
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The setting is bathed in [COLOR SCHEME—golden dusk casting long shadows, deep crimson sunset over an endless battlefield, cold mist curling through the ancient ruins of a martial arts sect].
  The camera sweeps across [STORY'S SETTING—mist-covered peaks where hidden sects reside, a towering pagoda surrounded by endless stone steps, an imperial city where nobles plot in the shadows, a sunlit bamboo forest swaying like waves in the wind]. Below, the streets are alive with [DESCRIBE WORLD—martial artists clad in flowing robes practicing their forms, merchants selling rare scrolls and enchanted weapons, spies exchanging secret messages under tea house lanterns, monks silently meditating while balancing on narrow wooden poles].
  Towering above the landscape, [INSERT LANDMARK—an abandoned training hall with shattered pillars, a legendary duel ground where the strongest once fought, a floating monastery high above the clouds, a forgotten tomb sealed by ancient sigils] dominates the skyline. No subtitle or caption.  No caption or subtitles"*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 4 – Witness POV Watching the Scene (Climactic Moment)
  📌 Prompt Formula:
  *"Concept shot of anime produced in Japanese animation studio, captured from the first-person POV of a bystander. The story is set in [INSERT COUNTRY]. [EXTRACT CLIMAX SCENE FROM NOVEL]  No caption or subtitles ”* 
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 5 – The Hook
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. Depicting an [DESCRIBE AN OBJECT OR SCENE EXCLUSIVE TO LATEST CHAPTER, NOT REDUNDANT TO THE PREVIOUS CHAPTERS]  No caption or subtitles"* 
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  ---
  
  🔹 **If Genre = G. Mystery/Thriller**  
  🎥 Clip 1 – Cinematic View of the Setting (The City, Crime Scene, or Forbidden Location)
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The camera zooms in to [STORY'S SETTING—an abandoned asylum with shattered windows, a rain-slicked downtown alley littered with discarded evidence, a police station where officers exchange wary glances, a luxurious estate hiding dark secrets, an underground parking lot echoing with distant footsteps]. Below, the world stirs with [DESCRIBE WORLD—detectives poring over clues, anonymous figures watching from behind tinted car windows, newspaper headlines flashing across a newsstand, security guards exchanging uneasy glances].  No subtitle or caption."*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 2 – Main Protagonist's Close-up Shot
  📌 Prompt Formula:
  *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The air is heavy with [DESCRIBE—flickering neon signs, distant sirens, the hum of a city that never sleeps].
  In the foreground is the close-up of the protagonist [DESCRIBE—cynical detective, relentless journalist, ex-cop haunted by a case, lone investigator piecing together the truth] stands with a [EXPRESSION—grim stare, quiet exhaustion, wary determination]. Their attire is [DESCRIBE—wrinkled trench coat, dark hoodie pulled low, rolled-up sleeves over tired hands, worn leather jacket].
  Behind them, [DESCRIBE SCENE—an evidence board littered with missing connections, a rain-soaked alley with a single flickering streetlight, a dimly lit diner where someone waits in silence].  No caption or subtitles"*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 3 – Group of Suspects, or Source of Mystery
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. 
  Describe [SOURCE OF MYSTERY— suspects of a murder, an unknown entity, mysterious figure STAY AUTHENTIC TO THE CONTENT OF THE NOVEL]].
  Backdrop is [INSERT LANDMARK FROM THE NOVEL]. No subtitle or caption."*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 4 – Scene of Action
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio, captured from the first-person POV of a bystander. The story is set in [INSERT COUNTRY].
  Describe [EXTRACT SUPPORTING CHARACTER TAKING ACTION FROM THE NOVEL]  No caption or subtitles"*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 5  – The Hook
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. Depicting an [DESCRIBE AN OBJECT OR SCENE EXCLUSIVE TO LATEST CHAPTER, NOT REDUNDANT TO THE PREVIOUS CHAPTERS]  No caption or subtitles "* 
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  
  ---
  
  🔹 **If Genre = H. Comedy/Slice-Of-Life**  
  🎥 Clip 1– Main Character's Close-up Shot
  📌 Prompt Formula:
  *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. A close-up shot of the protagonist [DESCRIBE—overworked college student running on caffeine, clumsy office worker always one step from disaster, chaotic part-timer juggling too many jobs, sleepy roommate who never wakes up on time, unlucky protagonist caught in a ridiculous situation].
  Their expression reflects [EMOTION—mild panic, deadpan exhaustion, barely suppressed frustration, clueless optimism], capturing the sheer absurdity of their life. They wear [DESCRIBE CLOTHING—wrinkled uniform with a coffee stain, hoodie three sizes too big, business suit with a crooked tie, casual clothes that suggest they just rolled out of bed, mismatched socks as a fashion statement].  No caption or subtitles "*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 2 – The Rival/Friend/Nemesis Close-up Shot
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. 
  In the foreground is a close-up shot of [DESCRIBE CHARACTER—strict but secretly softhearted best friend, annoying childhood rival who always appears at the worst time, coworker who is way too enthusiastic at 8 AM, overly dramatic sibling who turns everything into a soap opera]. Their expression is a perfect mix of [EXPRESSION—pure disbelief, smug amusement, exaggerated rage, total indifference], as if they've seen this disaster coming a mile away but refused to intervene.
  Their attire is [DESCRIBE—casual but suspiciously flawless, a gym outfit despite having no plans to exercise, a business suit but holding a plush keychain that ruins the intimidating vibe, a hoodie three sizes too big and socks with cartoon characters on them]. No caption or subtitles "*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
    
  🎥 Clip 3– Cinematic View of the Setting (The Chaotic Yet Cozy World They Live In)
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. The world is bathed in [COLOR SCHEME—warm pastel hues of late afternoon, over-the-top golden sparkle as if narrated by a dramatic inner monologue, cozy dim lighting that screams 'nap time,' overly dramatic anime-style sunset glow].
  Towering above, [INSERT LANDMARK] dominates the skyline. No subtitle or caption, just vibes."*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 4  – Witness POV Watching the Scene (Climactic Dumb Moment or Unexpectedly Heartwarming Scene)
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio, captured from the first-person POV of a bystander. The story is set in [INSERT COUNTRY]. [EXTRACT CLIMAX SCENE OF THE COMEDIC PUNCHLINE]  No caption or subtitles "*
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  🎥 Clip 5 – The Hook
  📌 Prompt Formula:
    *"Concept shot of anime produced in Japanese animation studio. The story is set in [INSERT COUNTRY]. Depicting an [DESCRIBE AN OBJECT OR SCENE EXCLUSIVE TO LATEST CHAPTER, NOT REDUNDANT TO THE PREVIOUS CHAPTERS]  No caption or subtitles"* 
  📌 Extracted Narration:
  "[EXTRACT A FITTING NARRATION FOR THIS CLIP, TOLD FROM A THIRD PERSON POINT OF VIEW—NO MORE THAN 2.5 SECONDS.]"
  
  } end: MASTER PROMPT`

export const MASTER_PROMPT_SHORT = 
  `Use this master prompt on the webnovel above. Output needs to be in English. Go
  start: MASTER PROMPT {
  Condition 1: If there is a violent/bloody, or overly sexual scene, adapt it into a version of the scene that is teen-friendly.
  
  –
  `

export const MASTER_PROMPT_BY_GENRE = (
  style: string,
  genre: string,
  character: string
): string => {
  return `
    Generate a high-quality illustration with the following conditions:
    Extract key attributes from the uploaded selfie: face shape, key facial features, hairstyle (cut, length, color), clothing color, accessories, pose, and expression. Always interpret the subject as a young {gender}. Detect the clothing color from the selfie and treat it as the {DOMINANT_COLOR}. Use these extracted attributes to generate exactly one character illustration for a 16:9 cover, upper-body or three-quarter view, with cinematic lighting, fine linework, and intricate details.
    [STYLE_MODULE]
    ${style}

    [GENRE_MODULE]
    ${genre}

    "controls": {
      "consistent_face": true,
      "gender": "{gender}",
      "cref": "<selfie>",
      "add_glasses": "{glasses_detected}",
      "glasses_style": "{glasses_style}"
    }
    [CHARACTER_DESCRIPTION]
    IMPORTANT: THE FACIAL FEATURES MUST BE FOLLOWED.
    ${character}

    Ensure the result is visually coherent, keeps the character recognizable, and follows the specified artistic style and genre elements. 
    Optimize the image for vertical 9:16 composition suitable for mobile cover artwork.
  `.trim();
};
