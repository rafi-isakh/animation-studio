import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerationResult } from "@/components/Mithril/StoryboardGenerator";

interface StoryboardRequest {
  sourceText: string;
  storyCondition: string;
  imageCondition: string;
  videoCondition: string;
  soundCondition: string;
  imageGuide: string;
  videoGuide: string;
  // New configuration parameters (from reference)
  targetTime?: string;
  customInstruction?: string;
  backgroundInstruction?: string;
  negativeInstruction?: string;
  videoInstruction?: string;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

const IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles";

function appendSuffix(prompt: string): string {
  if (!prompt) return prompt;
  const trimmed = prompt.trim();
  const suffixLower = IMAGE_PROMPT_SUFFIX.toLowerCase();
  const promptLower = trimmed.toLowerCase();

  // Check if suffix is already included (with or without period)
  if (promptLower.endsWith(suffixLower) || promptLower.endsWith(suffixLower + '.')) {
    return trimmed;
  }

  // Connect naturally based on punctuation
  const connector = (trimmed.endsWith('.') || trimmed.endsWith(',')) ? " " : ", ";
  return `${trimmed}${connector}${IMAGE_PROMPT_SUFFIX}`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateStoryboardWithRetry(
  params: StoryboardRequest
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const {
    sourceText,
    storyCondition,
    imageCondition,
    videoCondition,
    soundCondition,
    imageGuide,
    videoGuide,
    // New configuration parameters
    targetTime = "03:00",
    customInstruction = "",
    backgroundInstruction = "",
    negativeInstruction = "",
    videoInstruction = "",
  } = params;

  // Parse target time to get total seconds and clip count
  const [minutes, seconds] = targetTime.split(":").map(Number);
  const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
  const estimatedClipCount = Math.round(totalSeconds / 1.8); // ~1.8 seconds per clip average

  const prompt = `
    다음 원본 텍스트를 기반으로 총 5개의 '씬'과 반드시 ${estimatedClipCount}개의 클립으로 구성된, 정확히 ${totalSeconds}초(${targetTime}) 분량의 애니메이션 콘티를 제작해 주세요.
    각 '씬'에 포함될 클립의 수는 서사의 흐름에 따라 유동적으로 결정되어야 합니다. 어떤 씬은 20개보다 많을 수도, 적을 수도 있습니다.

    **[CRITICAL: 클립 길이 계산 규칙 (엄격 준수)]**
    모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.** 대사가 있는 경우, **'dialogueEn'의 단어 수를 직접 세어서** 아래 표에 따라 시간을 할당하십시오. 대사가 있는 경우, "1~2초 역동성 규칙"은 **무시**하고 아래 규칙이 **최우선**입니다.

    | dialogueEn 단어 수 | 할당 시간 | 비고 |
    | :--- | :--- | :--- |
    | **0 ~ 5 단어** | **2초** | 짧은 감탄사, 단답 |
    | **6 단어 이상** | **4초** | **최대 길이**. 만약 4초 안에 대사를 다 칠 수 없을 정도로 길다면, **반드시 대사를 쪼개어 B-roll 클립과 함께 여러 클립으로 나누세요.** |

    **[경고]** 8초, 10초 등 **4초를 초과하는 길이는 절대 허용되지 않습니다.** 긴 문장은 반드시 끊어서 여러 클립으로 배치하세요.

    **[실패 예시 - 절대 따라하지 마시오]**
    - 대사: "In the course of repeating my life nearly a hundred times... (약 20단어)"
    - 잘못된 설정: "8초" (X) -> 4초 초과 불가능.
    - **올바른 설정: 클립 1(4초, 말하는 모습) + 클립 2(4초, 회상 장면 B-roll)로 나누어 대사를 분배함.**

    **[기본 규칙]**
    - **대사가 없는 액션/반응 클립**: 1초 또는 2초 (역동성 유지).

    **[가장 중요한 규칙]**
    - 하나의 클립은 반드시 하나의 단일 동작이나 정지된 장면만을 묘사해야 합니다. 'A가 문을 연다'와 'B가 방으로 들어온다'와 같은 연속적인 동작은 **절대로** 하나의 클립에 포함될 수 없으며, 반드시 별개의 클립으로 분리해야 합니다.
    - 출력은 반드시 유효한 JSON 객체여야 하며, 'scenes', 'voicePrompts', 'characterIdSummary', 'genre'라는 네 개의 키를 가져야 합니다.
    - 'scenes' 키의 값은 각 객체가 단일 '씬'을 나타내는 객체 배열이어야 합니다. 각 '씬' 객체는 "sceneTitle"과 "clips" 키를 가져야 합니다.
    - 'clips' 키의 값은 각 객체가 단일 클립을 나타내는 객체 배열이어야 하며, 각 클립 객체는 "story", "imagePrompt", "videoPrompt", "soraVideoPrompt", "dialogue", "dialogueEn", "sfx", "sfxEn", "bgm", "bgmEn", "length", "accumulatedTime", "backgroundPrompt", "backgroundId" 키를 가져야 합니다.
    - 'voicePrompts' 키의 값은 주요 캐릭터들의 보이스 프롬프트가 포함된 객체 배열이어야 합니다. 각 객체는 'promptKo' (한국어 버전)와 'promptEn' (영어 버전) 키를 가져야 합니다. 이 프롬프트는 ElevenLabs에서 사용될 것이며, 각 캐릭터의 성격, 특성을 반영하고 참고할 만한 실제 인물의 목소리를 추천해야 합니다. **원문에서 언급된 모든 주요 캐릭터를 포함해야 합니다.** **참고 인물을 추천할 때, 'promptKo'에는 한국인을, 'promptEn'에는 미국인을 추천해야 합니다.**
    - 'characterIdSummary' 키의 값은 **모든 클립의 imagePrompt에 등장하는 모든 대문자 캐릭터 ID**를 분석하여 생성한 요약 리스트입니다. 각 객체는 'characterId'와 'description' 키를 가져야 합니다.
      **[characterIdSummary 생성 규칙]**:
      1. **현재 시점의 주인공을 식별하고 가장 먼저 나열하되, "Protagonist. Default"라고 설명합니다.**
      2. **각 캐릭터 그룹(예: LEON_*, KAIDEN_*, ELISA_*)에서 디폴트 버전을 먼저 식별합니다.** 디폴트는 가장 자주 등장하거나 현재 시점의 버전입니다.
      3. **디폴트 캐릭터는 주인공과의 관계를 설명하고 "Default"를 추가합니다** (예: "Son of Protagonist. Default", "Husband of Protagonist. Default").
      4. **변형(Variant) 캐릭터는 반드시 해당 캐릭터의 디폴트 ID를 기준으로 설명합니다. 주인공이 아닌 디폴트 ID와의 관계를 명시하세요:**
         - 나이 변형: "6 year old version of [DEFAULT_ID]", "Adult past 25 year old version of [DEFAULT_ID]"
         - 의상/상황 변형: "wearing [clothing description]" (디폴트 ID 언급 불필요), "[situational context]"
      5. **각 설명은 한 줄로 간결하게 작성하며, 강조할 특징(나이, 의상, 상황)을 명확히 표현합니다.**
      6. **올바른 예시 형식**:
         - ELISA_PRESENT: Protagonist. Default
         - ELISA_PAST_19: 19 year old version of ELISA_PRESENT
         - LEON_PRESENT_CHILD: Son of Protagonist. Default
         - LEON_PAST_CHILD: 6 year old version of LEON_PRESENT_CHILD
         - LEON_PAST_ADULT: Adult past 25 year old version of LEON_PRESENT_CHILD
         - KAIDEN_EMPEROR: Husband of Protagonist. Default
         - KAIDEN_BALLROOM: Husband of Protagonist, wearing formal ballroom attire
         - KAIDEN_EMPEROR_PAST: 25 year old version of KAIDEN_EMPEROR
      7. **잘못된 예시 (따라하지 마시오)**:
         - ❌ LEON_PAST_ADULT: 30 year old son of the protagonist (variant가 protagonist 언급)
         - ❌ LEON_PRESENT_CHILD: 10 year old version of LEON_PAST_ADULT. Default (default가 variant 언급)
         - ✅ LEON_PRESENT_CHILD: Son of Protagonist. Default (default는 protagonist 관계)
         - ✅ LEON_PAST_ADULT: Adult past 25 year old version of LEON_PRESENT_CHILD (variant는 default 언급)
    - 'genre' 키의 값은 원본 텍스트의 장르를 분석하여 한국어와 영어로 모두 표기한 문자열입니다.
      **[genre 생성 규칙]**:
      1. **원본 텍스트의 배경, 설정, 분위기, 캐릭터 관계를 종합적으로 분석하여 가장 적합한 장르를 결정합니다.**
      2. **형식: "한국어 장르명 (English Genre Name)"** (예: "서양 판타지 (Western Fantasy)", "무협 (Wuxia)")
      3. **장르 예시**:
         - 서양 판타지 (Western Fantasy) - 중세 유럽풍 마법, 기사, 용 등
         - 동양 판타지 (Eastern Fantasy) - 도사, 신선, 영물 등
         - 무협 (Wuxia) - 강호, 무림, 무공 등
         - 현대 로맨스 (Modern Romance) - 현대 배경의 연애물
         - 현대 판타지 액션 (Modern Fantasy Action) - 현대 배경 + 초능력/이능
         - 현대 사이버펑크 (Modern Cyberpunk) - 미래 도시, 첨단기술, 디스토피아
         - 역사물 (Historical Drama) - 역사적 사건 기반
         - 스릴러 (Thriller) - 긴장감, 추리, 범죄
         - SF (Science Fiction) - 우주, 외계, 미래 과학 기술
         - 학원물 (School Life) - 학교 배경
      4. **명확한 장르로 분류하되, 복합 장르인 경우 가장 주된 장르를 선택하거나 두 장르를 조합합니다** (예: "현대 판타지 로맨스 (Modern Fantasy Romance)")

    **[전체 콘티 공통 연출 가이드라인 (필수 적용)]**
    1. **동적/정적 밸런스 (33% vs 66%)**:
       - 전체 클립 중 약 **33%**는 캐릭터가 걷거나 뛰거나 액션을 취하는 등 움직임이 있는 **동적인 클립**으로 구성하세요.
       - 나머지 **66%**는 카메라 무빙이 없거나 미세한, 캐릭터가 대화를 하거나 가만히 서 있는 **정적인 클립**으로 구성하세요.
    2. **긴 대사 처리 (B-roll 활용 및 4초 제한)**:
       - 어떠한 경우에도 클립 당 4초를 넘기지 마세요.
       - 대사가 4초 안에 끝나지 않는 길이라면, 반드시 문장을 적절히 잘라 다음 클립으로 넘기되, 이어지는 클립은 **B-roll (인서트 컷)**로 설정하세요.
       - **중요**: B-roll 클립일지라도 \`dialogue\` 필드에는 이어지는 대사가 들어가야 하지만, **\`videoPrompt\`와 \`soraVideoPrompt\`에는 말하는 모습 대신 인서트 컷(소품, 풍경, 듣는 사람의 반응 등)에 대한 묘사**가 들어가야 합니다.

    각 필드에 대해 다음의 구체적인 지침을 따라주세요:

    1.  **sceneTitle**:
        - 각 씬의 주요 내용을 요약하는 제목을 한국어로 작성합니다.

    2.  **story**:
        - 규칙: ${storyCondition}
        - **지침: 위의 '[가장 중요한 규칙]'에 따라, 원본 텍스트를 바탕으로 하나의 단일하고 구체적인 장면(1~2초)을 묘사합니다.**

    3.  **backgroundId**:
        - 형식: "#-#[ -#]" (예: 1-1, 1-2, 1-1-1, 1-2-1).
        - **첫 번째 숫자 (Background Number)**: 배경(backgroundPrompt)이 바뀔 때마다 1씩 증가합니다. 첫 번째 배경은 1로 시작합니다. 예: 첫 번째 장소(1-X), 두 번째 장소(2-X).
        - **두 번째 숫자 (Shot Type)**: 다음 1~9 중 하나를 선택하여 적용합니다. 씬 내에서 연속적으로 같은 번호를 사용하지 말고 다양하게 변주하세요.
        - **세 번째 숫자 (Variation Index)**: **[필수 - 유니크 ID 규칙]**: 만약 씬 내에서 동일한 'Background Number-Shot Type' 조합이 다시 사용될 경우(예: 1-1이 쓰이고 나중에 또 1-1 앵글이 필요한 경우), 두 번째 등장부터는 반드시 뒤에 -1, -2, -3... 순서로 숫자를 덧붙여 **고유한 ID**를 생성해야 합니다. (예: 1-1 (최초) -> 1-1-1 (두번째) -> 1-1-2 (세번째)). 이는 같은 앵글 안에서도 미세한 연출 차이(Variation)를 주기 위함입니다.
          **중요: 대사(Dialogue)가 오가는 장면에서는 3, 4번(Close-up)에만 의존하지 말고, 7번과 8번(Over the shoulder shot)을 동등한 비율로 적극적으로 사용하여 단조로움을 피하세요.**
          - **1**: Full shot (두 인물이 대화하거나 배경 소개. 인물이 있다면 측면/정면 랜덤)
          - **2**: Full shot from below (긴장감 강조. 인물이 있다면 측면/정면 랜덤)
          - **3**: Close-up (주요 캐릭터 A)
          - **4**: Close-up (주요 캐릭터 B)
          - **5**: Medium shot (제3자 무리 관전 혹은 2명 이상 이동 시)
          - **6**: Bird's eye view (배경 다양성 확보, 혹은 2명 이상 다양한 샷)
          - **7**: Over the shoulder shot from behind (캐릭터 A의 등 뒤에서 B를 봄. 대화 장면에서 적극 활용)
          - **8**: Over the shoulder shot from behind (캐릭터 B의 등 뒤에서 A를 봄. 대화 장면에서 적극 활용)
          - **9**: Close up of hand/feet (손/발/걸음 강조. 소매나 신발 묘사 포함)
        - **예외**: 배경이 보이지 않을 정도의 **Extreme close-up(눈만 보임 등)**이나 **Macro shot(물건 초접사)**인 경우, 이 필드를 빈 문자열 ""로 비워둡니다.

    4.  **imagePrompt**:
        - 반드시 영어로 작성해야 합니다.
        - **중요**: 이 프롬프트는 **backgroundId**의 두 번째 숫자에 해당하는 샷 키워드를 **반드시** 포함해야 합니다.
        - 규칙: ${imageCondition}
        - 통합할 가이드 프롬프트: ${imageGuide || '없음'}
        - **[필수 지침]**:
          **'story'에 묘사된 단일 장면을 나타내는 '하나의' 정지 이미지를 영어로 상세히 묘사합니다. 이 프롬프트는 '[Image N]'과 같은 분할 형식을 포함해서는 안 됩니다.**
          **각 프롬프트는 '캐릭터(인물)', '핵심 행동/표정/자세', '배경', '구도(카메라 앵글)'를 명확하고 구체적으로 포함해야 합니다. 캐릭터는 'Baby'나 'Mother'와 같은 일반적인 명칭이 아닌, 원본 텍스트에 나오는 실제 이름(예: Arel, Rifana)을 사용해야 합니다. 이 프롬프트는 나노바나나(gemini-2.5-flash-image) 모델에 최적화되어야 합니다.**
        - **[Entity & Object Naming - IMPORTANT (Applies ONLY to imagePrompt)]:**
          1. **[Uppercase IDs]:** 1클립 이상 지속적으로 등장하거나, Start/End 프레임에 모두 등장하거나, 상태가 변화하는 모든 **캐릭터, 생명체(Mobs), 조연(Extras), 주요 아이템**은 반드시 **대문자(UPPERCASE)**로 표기하십시오. (예: KNIGHT, DRAGON, CHEST FULL OF COINS).
          2. **[Material Integration]:** 물체의 재질(Material)이 중요한 경우, 'glass BOTTLE'처럼 형용사로 분리하지 말고, **'GLASS_BOTTLE'** 처럼 언더바를 사용하여 하나의 대문자 ID로 통합하십시오.
          3. **[Quantifiable Objects Only]:** 셀 수 있는 구체적인 사물(Countable Nouns)만 대문자 ID로 만드십시오. 셀 수 없는 명사(예: juice, water, smoke)는 대문자 ID로 표기하지 마십시오. 단, 용기에 담긴 경우 용기 ID를 사용하십시오 (예: GLASS_OF_JUICE).
          4. **[Crowd Exception]:** 일반적인 군중(crowd, people)은 대문자 ID를 사용하지 않고 소문자로 표기합니다. (예: 'crowd', not 'CROWD'). 단, 특정 역할이 있는 고유 집단(예: ROYAL_GUARDS)은 대문자로 표기합니다.
          5. **[No Punctuation]:** ID 내에 **아포스트로피(')나 따옴표(")**를 절대 포함하지 마십시오.
          6. **[Naming Convention for Relations/Possessions]:** 소유격('s)이나 "and" 같은 연결사를 통한 모호한 명명을 사용하지 마십시오. 특정 캐릭터와 연관된 인물(시녀, 탈것 등)이나 아이템은 언더바(_)를 사용하여 대문자로 명확히 구분하십시오.
             - 예: 'KANIA and KANIA'S SERVANT' (X) -> 'KANIA, KANIA_SERVANT' (O)
             - 예: 'AREL'S HORSE' (X) -> 'AREL_HORSE' (O)
             - 예: 'KANIA'S SWORD' (X) -> 'KANIA_SWORD' (O)
          7. **[No Visual Descriptors with Names]:** 캐릭터 이름 앞뒤에 외형적 묘사나 직함(Title)을 절대 붙이지 마십시오. 외형은 캐릭터 시트에서 처리됩니다. 오직 정확한 '대문자 캐릭터 이름'만 사용하십시오. (예: 'Princess KANIA' (X) -> 'KANIA' (O) / 'Beautiful RIFANA' (X) -> 'RIFANA' (O)).
          8. **[Action & Interaction Specifics]:**
             - **전투/액션**: 단순히 'fights'나 'attacks'로 뭉뚱그리지 말고, **어떤 무기(대문자 아이템)**를 사용하여 어떤 공격을 가하는지 구체적으로 서술하십시오. (예: 'KANIA skillfully swings KANIA_SWORD' (O) vs 'KANIA fights' (X)).
             - **탑승(Riding)**: 단순히 'on horses'라고 하지 말고, **누가 어떤 탈것(대문자 ID)**을 타고 있는지 각각 명시하십시오. (예: 'AREL rides AREL_HORSE along with KANIA riding KANIA_HORSE' (O) vs 'AREL and KANIA on their horses' (X)).

    5.  **videoPrompt**:
        - 반드시 영어로 작성해야 합니다.
        - 규칙: ${videoCondition}
        - 통합할 가이드 프롬프트: ${videoGuide || '없음'}
        - **지침: 'story'에 묘사된 단일 동작을 기반으로 한 비디오 클립을 영어로 묘사합니다. 'imagePrompt'와 달리, 캐릭터의 실제 이름 대신 'the baby', 'the nanny'와 같이 역할이나 상태를 나타내는 설명적인 명사구를 사용해야 합니다. 대사가 포함된 클립의 경우, 'the character speaks'와 같이 말하는 동작을 명확히 포함해야 합니다. 대사가 2초 이상 지속될 경우 'speaks continuously'와 같이 지속성을 표현해야 합니다. (예: "A door bursts open violently.")**
        - **[B-roll 적용]: 상단 '전체 콘티 공통 연출 가이드라인'에 따라 대사가 길어질 경우, 화자가 아닌 관련 B-roll(풍경, 소품 등)을 묘사하세요.**

    6.  **dialogue**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: 캐릭터가 직접 말하는 **대사**가 있는 경우에만 작성합니다. 대사가 없는 클립은 반드시 빈 문자열 ""로 둡니다.
        - 형식: '캐릭터이름: [감정] "대사내용"'. (예: '리파나: [놀라며] "이럴 수가!"')

    7.  **dialogueEn**:
        - 'dialogue' 필드의 영어 번역본입니다. 대사가 없으면 빈 문자열 ""로 둡니다.

    7-1. **narration**:
        - 한국어로 작성합니다.
        - **지침**: 캐릭터 대사(dialogue)가 없는 클립의 경우, 해당 클립의 'story' 열 내용을 바탕으로 영상의 흐름을 설명하는 **나레이션**을 반드시 작성하십시오.
        - 캐릭터가 직접 말하는 장면(dialogue 존재)인 경우 나레이션은 비워두거나, 대사 전후의 상황을 설명하는 매우 짧은 나레이션만 포함하십시오.
        - 형식: '[어조] "나레이션 내용"'. (예: '[차분하게] "그녀는 조용히 문을 열었다."')

    7-2. **narrationEn**:
        - 'narration' 필드의 영어 번역본입니다. 나레이션이 없으면 빈 문자열 ""로 둡니다.

    8.  **sfx**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: **효과음(SFX)**만 작성합니다. 없으면 빈 문자열 ""로 둡니다.
        - 형식: 소리 묘사. (예: '천둥 소리', '문이 닫히는 소리'). **괄호 ()를 절대 사용하지 마십시오.**

    9.  **sfxEn**:
        - 'sfx' 필드의 영어 번역본입니다. 없으면 빈 문자열 ""로 둡니다.
        - **괄호 ()를 절대 사용하지 마십시오.**

    10. **bgm**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: **배경음악(BGM)**만 작성합니다. 없으면 빈 문자열 ""로 둡니다.
        - 형식: (분위기/장르). (예: '(긴장감 넘치는 음악)', '(평화로운 피아노 선율)')

    11. **bgmEn**:
        - 'bgm' 필드의 영어 번역본입니다. 없으면 빈 문자열 ""로 둡니다.

    12. **soraVideoPrompt**:
        - 반드시 영어로 작성해야 합니다.
        - **지침**: 이 필드는 Sora 비디오 생성 AI에 바로 입력될 프롬프트입니다.
        - **[순서]**: 이 필드는 반드시 \`dialogueEn\`, \`sfxEn\`, \`bgmEn\` 값이 모두 생성된 **후에** 생성되어야 하며, 그 값들을 반영해야 합니다.
        - **[Visual 구성]**: 인물의 이름(예: Arel, Rifana)을 **절대 사용하지 마십시오**. 대신, (Image Prompt)에서처럼 해당 인물의 외형, 의상, 특징을 구체적인 키워드로 묘사해야 합니다 (예: "a silver-haired young man in a suit"). (Video Prompt)의 카메라 무빙이나 연출 키워드도 포함하세요.
        - **[B-roll 적용]**: 긴 대사 구간의 B-roll 클립인 경우, 대사는 오디오로 들리지만 화면은 소품이나 풍경이어야 하므로 비주얼 묘사에 인물이 말하는 모습을 제외하세요.
        - **[Audio 반영 필수]**:
          1. 비디오 묘사가 끝난 후 **줄바꿈**을 두 번 합니다.
          2. \`dialogueEn\` 필드가 비어있지 않다면, 그 내용에서 **대사 내용**과 **감정**을 추출하여 다음 형식을 반드시 프롬프트 끝에 추가합니다:
             \`The [character description] says [emotion], "[dialogue content]"\`
             *(주의: \`dialogueEn\`에 있는 '캐릭터 이름'을 그대로 쓰지 말고, 반드시 외형 묘사(description)로 바꿔야 합니다.)*
          3. \`sfxEn\` 필드가 비어있지 않다면 다음 줄에 추가: \`sfx: [sfxEn content]\`
          4. \`bgmEn\` 필드가 비어있다면 다음 줄에 추가: \`bgm: [bgmEn content]\`
          5. 해당 필드가 비어있다면 그 줄은 생략합니다.

          *(예시)*:
          A dramatic snap zoom into a five-year-old boy's eyes. They widen in sheer horror, the pupils constricting. The lighting becomes harsh and dramatic.

          The young boy says shocked, "N-no way...."
          sfx: Dramatic sting, like a thunderclap

    13. **length**:
        - 클립의 길이를 "1초", "2초", "4초" 등의 형식으로 표시합니다.
        - **지침: 대사가 있는 경우, 반드시 위 '클립 길이 계산 규칙'을 따르십시오. 최대 길이는 4초입니다.**

    14. **accumulatedTime**:
        - 이전 클립까지의 누적 시간에 현재 클립의 길이를 더한 값을 "MM:SS" 형식으로 표시합니다. 예: "00:03", "00:07", "01:25"
        - **전체 누적 시간은 반드시 ${totalSeconds}초가 되어야 하며, 마지막 클립의 값은 "${targetTime}"이어야 합니다.**

    15. **backgroundPrompt**:
        - 반드시 영어로 작성해야 합니다.
        - **지침: 클립의 정적 배경을 'imagePrompt'와는 별개로, 매우 상세하고 풍부하게 묘사합니다. 배경의 분위기, 주요 사물, 빛의 상태, 재질감 등 시각적 요소를 풍부하게 포함해야 합니다. 동일한 배경을 공유하는 연속적인 클립에는 동일한 \`backgroundPrompt\` 값을 사용해야 합니다. 씬 내에서 배경이 변경될 때만 이 프롬프트를 변경합니다.**
        - **예시: "A dimly lit, ornate Victorian-style bedroom with a large four-poster bed, a vintage wooden wardrobe, and flickering gas lamps. Dust motes visible in the sparse light."**

    16. **characterInfo**:
        - 반드시 영어로 작성해야 합니다.
        - **지침: 해당 클립에 등장하는 주요 캐릭터들의 간단한 관계 정보를 작성합니다. 각 캐릭터는 "CHARACTER_ID=주인공과의 관계 또는 특징" 형식으로 1~2단어 이내로 요약하여, 쉼표(,)로 구분하여 나열합니다.**
        - **형식: "CHARACTER_ID1=relationship/trait, CHARACTER_ID2=relationship/trait"**
        - **예시: "AREL=Protagonist's son, RIFANA=Nursemaid, KANIA=19-year-old self"**
        - **중요: imagePrompt에 등장하는 모든 대문자 캐릭터 ID에 대해 작성하되, 배경이나 사물은 제외합니다. 관계는 주인공 기준으로 작성하며, 매우 간결하게 표현해야 합니다 (예: "son", "wife", "younger self", "Master", "Rival").**
        - **클립에 캐릭터가 등장하지 않거나 캐릭터 정보가 불필요한 경우 빈 문자열 ""로 둡니다.**

    ${customInstruction ? `
    **[사용자 특별 지시사항 (Story Guide)]**
    다음 지시사항을 반드시 따르세요. 무엇을 강조하고, 무엇을 생략하며, 어떤 서사를 확장할지에 대한 사용자의 요청입니다:
    ${customInstruction}
    ` : ''}

    ${backgroundInstruction ? `
    **[배경 ID 지시사항]**
    다음 배경 ID 규칙을 적용하세요:
    ${backgroundInstruction}
    ` : ''}

    ${negativeInstruction ? `
    **[Negative Prompt - 절대 피해야 할 요소]**
    다음 요소들은 imagePrompt, videoPrompt, soraVideoPrompt에서 절대 사용하지 마십시오:
    ${negativeInstruction}
    ` : ''}

    ${videoInstruction ? `
    **[비디오 프롬프트 추가 규칙]**
    videoPrompt와 soraVideoPrompt 생성 시 다음 규칙을 추가로 적용하세요:
    ${videoInstruction}
    ` : ''}

    원본 텍스트는 다음과 같습니다:
    ---
    ${sourceText}
    ---
  `;

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneTitle: {
              type: Type.STRING,
              description: "The title of the scene in Korean.",
            },
            clips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  story: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                  soraVideoPrompt: {
                    type: Type.STRING,
                    description:
                      "Visual description (no names) + camera moves + dialogue/sfx/bgm info appended at the end.",
                  },
                  dialogue: {
                    type: Type.STRING,
                    description:
                      "Character dialogue or narration in Korean. Empty if none.",
                  },
                  dialogueEn: {
                    type: Type.STRING,
                    description:
                      "Character dialogue in English. Empty if none.",
                  },
                  narration: {
                    type: Type.STRING,
                    description:
                      "Narration text in Korean for clips without dialogue. Describes the scene flow. Empty if dialogue exists.",
                  },
                  narrationEn: {
                    type: Type.STRING,
                    description:
                      "Narration text in English. Empty if none.",
                  },
                  sfx: {
                    type: Type.STRING,
                    description:
                      "Sound effects in Korean. No parentheses. Empty if none.",
                  },
                  sfxEn: {
                    type: Type.STRING,
                    description:
                      "Sound effects in English. No parentheses. Empty if none.",
                  },
                  bgm: {
                    type: Type.STRING,
                    description:
                      "Background music description in Korean. Empty if none.",
                  },
                  bgmEn: {
                    type: Type.STRING,
                    description:
                      "Background music description in English. Empty if none.",
                  },
                  length: {
                    type: Type.STRING,
                    description:
                      "Duration. Max 4 seconds. Split dialogue if longer.",
                  },
                  accumulatedTime: { type: Type.STRING },
                  backgroundPrompt: { type: Type.STRING },
                  backgroundId: {
                    type: Type.STRING,
                    description:
                      "The ID # of the background and shot type, e.g. 1-2 or 1-2-1. Empty for extreme close-ups.",
                  },
                  characterInfo: {
                    type: Type.STRING,
                    description:
                      "Brief character relationships in format 'CHARACTER_ID=relationship, CHARACTER_ID2=relationship'. Empty if no characters appear.",
                  },
                },
                required: [
                  "story",
                  "imagePrompt",
                  "videoPrompt",
                  "soraVideoPrompt",
                  "dialogue",
                  "dialogueEn",
                  "narration",
                  "narrationEn",
                  "sfx",
                  "sfxEn",
                  "bgm",
                  "bgmEn",
                  "length",
                  "accumulatedTime",
                  "backgroundPrompt",
                  "backgroundId",
                  "characterInfo",
                ],
                propertyOrdering: [
                  "dialogue",
                  "dialogueEn",
                  "narration",
                  "narrationEn",
                  "sfx",
                  "sfxEn",
                  "bgm",
                  "bgmEn",
                  "length",
                  "accumulatedTime",
                  "backgroundId",
                  "backgroundPrompt",
                  "characterInfo",
                  "story",
                  "imagePrompt",
                  "videoPrompt",
                  "soraVideoPrompt",
                ],
              },
            },
          },
          required: ["sceneTitle", "clips"],
          propertyOrdering: ["sceneTitle", "clips"],
        },
      },
      voicePrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            promptKo: { type: Type.STRING },
            promptEn: { type: Type.STRING },
          },
          required: ["promptKo", "promptEn"],
          propertyOrdering: ["promptKo", "promptEn"],
        },
      },
      characterIdSummary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            characterId: {
              type: Type.STRING,
              description: "The uppercase character ID (e.g., ELISA_PRESENT, KAIDEN_EMPEROR).",
            },
            description: {
              type: Type.STRING,
              description:
                "Brief description of the character's role and variant details (e.g., 'Protagonist. Default', '19 year old version of ELISA_PRESENT').",
            },
          },
          required: ["characterId", "description"],
          propertyOrdering: ["characterId", "description"],
        },
      },
      genre: {
        type: Type.STRING,
        description: "Story genre in both Korean and English (e.g., '서양 판타지 (Western Fantasy)', '무협 (Wuxia)').",
      },
    },
    required: ["scenes", "voicePrompts", "characterIdSummary", "genre"],
    propertyOrdering: ["scenes", "voicePrompts", "characterIdSummary", "genre"],
  };

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text?.trim();
      if (!jsonText) {
        throw new Error("Empty response from Gemini API");
      }

      const storyboardData = JSON.parse(jsonText) as GenerationResult;

      // Post-process: apply suffix to imagePrompt and append Background ID
      storyboardData.scenes.forEach((scene) => {
        scene.clips.forEach((clip) => {
          // 1. Apply suffix to imagePrompt (ensures "No vfx..." is always appended)
          clip.imagePrompt = appendSuffix(clip.imagePrompt);

          // 2. Append Background ID to imagePrompt (for UI/CSV)
          if (clip.backgroundId && clip.backgroundId.trim() !== "") {
            clip.imagePrompt = `${clip.imagePrompt}\n\nBackground ID: ${clip.backgroundId}`;
          }

          // Note: soraVideoPrompt is now generated inline by the model with audio info appended
        });
      });

      return storyboardData;
    } catch (error: unknown) {
      const errorMessage = String(error);

      // Check for transient errors that should be retried
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn(
            `Attempt ${attempt} failed due to model overload. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
      }

      // Don't retry on non-transient errors
      throw error;
    }
  }

  throw new Error("API call failed after all retries.");
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryboardRequest = await request.json();
    const {
      sourceText,
      storyCondition,
      imageCondition,
      videoCondition,
      soundCondition,
      imageGuide,
      videoGuide,
      // New configuration parameters
      targetTime,
      customInstruction,
      backgroundInstruction,
      negativeInstruction,
      videoInstruction,
    } = body;

    // Validation
    if (!sourceText || typeof sourceText !== "string") {
      return NextResponse.json(
        { error: "Source text is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await generateStoryboardWithRetry({
      sourceText,
      storyCondition: storyCondition || "",
      imageCondition: imageCondition || "",
      videoCondition: videoCondition || "",
      soundCondition: soundCondition || "",
      imageGuide: imageGuide || "",
      videoGuide: videoGuide || "",
      // New configuration parameters
      targetTime: targetTime || "03:00",
      customInstruction: customInstruction || "",
      backgroundInstruction: backgroundInstruction || "",
      negativeInstruction: negativeInstruction || "",
      videoInstruction: videoInstruction || "",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in generate_storyboard API:", error);

    const errorMessage = String(error);

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI model is currently overloaded. Please try again in a few moments.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
