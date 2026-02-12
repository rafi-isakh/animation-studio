"use client";

import { useState, useCallback, useEffect } from "react";

export interface GenrePresetData {
  story: string;
  image: string;
  video: string;
  sound: string;
}

export interface GenrePreset extends GenrePresetData {
  id: string;
  nameKey?: string; // i18n key for system presets
  name?: string; // display name for custom presets
  isSystem: boolean;
}

const STORAGE_KEY = "mithril_genre_presets";

// System preset data — these are always force-overwritten on load
const SYSTEM_PRESETS: GenrePreset[] = [
  {
    id: "modern_romance",
    nameKey: "genre_modern_romance",
    isSystem: true,
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 관계(dynamic)과 감정선(emotion arc)의 변화가 드러나는 '결정적 모먼트'를 우선적으로 선택한다. 샘플 분석처럼 "연인 아닌 평행선", "진지한 제안이 시작되는 순간", "키스 직전의 숨 멎는 거리감" 같은 관계 변화 지점, 감정선이 바뀌는 초단위 순간을 이미지·비디오 프롬프트에서 자동으로 우선 묘사하도록 설계. 러브 코미디·오피스 로맨스의 핵심인 아이러니(코믹 연출 + 진지한 감정의 대비), 내면 독백(black void / spotlight 연출), 긴장–해소 구조를 시각적으로 표현하는 지점을 항상 우선 반영.`,
    image: `8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
11. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
18. 캐릭터 중심으로 클로즈업된 경우, 특수 감정이 최고조에 달한 경우에는 5개 클립 중 2개 비율로 다음 중1개를 추가로 이미지 프롬프트에 설정해줘.
1. Point of View Shot
2. Extreme Close-Up
3. Close-Up
4. Medium Shot
7. Two Shot / Group Shot
8. Shallow Depth of Field
9. Macro Shot

20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation and misgeneration. If a character is shocked, just say 'he is shocked', don't say 'he is frozen in shock', as frozen can induce generation of ice which is irrelevant.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, Mention whose height is similar to who, and who is smaller/taller than who. (i.e. Rifana's height is the same as Pinellia, Kania is much smaller than Chena, etc)
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한 (Visual Constraint): 등장인물의 수는 화면 구성의 명확성을 위해 반드시 최대 5명 이하로 제한한다.
-변환 규칙: 원문에 다수(예: 20명, 군중, 학자들 전체)가 등장하더라도, 이미지 프롬프트 작성 시에는 가장 가까이 있는 3~5명의 인물로 축소하여 묘사한다.
-금지 사항: 'All 20 scholars', 'The crowd'와 같이 전체를 지칭하는 표현을 금지하고, '3 scholars', '5 people'과 같이 구체적인 숫자를 명시한다.
-예외: 대규모 전투씬(Battle scenes)은 이 규칙에서 제외한다.

2. '관계의 거리감(Relational Distance)'을 카메라 구도로 명확하게 표현한다. 샘플 분석처럼 두 사람의 관계 변화는 앵글과 거리로 표현되므로 아래 키워드를 자동 삽입하도록끔 규칙 강화: 서먹·동료 단계 → "Profile Two Shot", "Side-by-side framing", "Parallel blocking", "High Angle for vulnerability" 관심이 생기는 순간 → "Slow Dolly In", "Tight Two Shot", "Reduced background noise", "Soft focus on faces" 로맨틱 임팩트 순간 → "Negative Space background", "Shallow depth of field", "Extreme Close-Up of lips/eyes", "Spotlight emotional focus"
5. 감정 피크 장면은 '시각적 대비(Contrast Mise-en-scène)'를 적극적으로 활용한다. 샘플에서처럼: High-Key Morning Light ↔ Panic Whip Pan Deep Focus Crowd ↔ Black Void Monologue Profile Shot Deadpan ↔ Romantic Negative Space
6. 샷의 앵글과 구도는 Background ID의 지침을 따른다.
7. 출근길·도시·직장 환경의 리얼리즘을 유지하되, '문학적 상징성'을 시각적으로 치환하도록 한다. 샘플처럼 직장/도시 공간은 현실적인데, 캐릭터 심리는 그래픽 처리·스포트라이트 등으로 표현하는 "듀얼 톤 연출"을 반영: 현실 공간: deep focus / tracking / bird's-eye view 내면 감정: black void / spotlight / manga crash zoom / simplified background
15. 역동성보다 '감정의 압축된 임팩트'를 우선한다. 기존 15번(동작보다 순간 keyframe)을 현대 로맨스 맞춤으로 리파인) Extreme Close-Up (eyes, lips, trembling hand) Profile Two Shot (romantic tension) Slow Dolly In keyword Black Void + Spotlight (monologue) Negative Space (romantic anticipation)
25. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
26. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성 (예를들어 캐릭터가 대사를 말하거나 대화할때)
27. 대사를 추출했을때 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기하고`,
    video: `1. 캐릭터의 감정 상태에 따라 카메라 무빙을 자동으로 바꾼다. 당황·코믹 → whip pan / crash zoom / shaky handheld-lite 진지·고백·제안 → slow dolly-in / shallow focus 서먹함 → profile shot side-by-side / high angle vulnerability 로맨틱 온기 증가 → steady cam, soft light, closer two-shot

3. 로맨틱/코믹 대사가 포함된 씬은 '시선 블로킹(Sight Blocking)'을 명시한다. 샘플에서 연출의 핵심은 서로를 바라보는지, 안 보는지가 관계 변화의 상징임. 비디오 프롬프트에서 대사 장면일 경우: "He speaks while looking away" "She speaks without making eye contact" "They speak while slowly turning toward each other" "He speaks directly facing her"

4. 감정적 반전(아이러니) 연출을 카메라가 '먼저 감지'하는 방식으로 묘사한다. 샘플에서 가장 강력한 코믹 로맨스 모먼트는: 로맨틱한 조명 → 건조한 대사 카베동 구도 → 게임기 등장 이러한 아이러니를 시각적으로 표현하기 위해: "Romantic lighting shifts abruptly" "Spotlight collapses into normal lighting" "Soft focus breaks into sharp mundane focus"

7. 말하는 장면 → 반드시 "정면 안정 헤드각(he stays still)"+ "입 모양 보임" + "카메라 거리 명시" 현대 어덜트 로맨스 특유의 '밀착 대사', '고백 직전', '말문 막힘', '작은 말 한마디로 분위기 바뀜'을 정확히 잡기 위해: "close-up, he speaks softly, his head angle stays still" "two-shot, they speak quietly, their head angles stay still" "medium close-up, she speaks while her hands cover her mouth slightly, but her speech is visible"`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
  {
    id: "medieval_action_fantasy",
    nameKey: "genre_medieval_action_fantasy",
    isSystem: true,
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
Gate 진입 → Tracking Shot 기반 전환
전투 돌입 → Whip Pan + Hard Cut
위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
6. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
분노 폭발: Push-In + Backlighting(실루엣 강조)
각성/파워업: Slow-Motion + Tilt Up
7. 현대 배경(도시, 빌딩, 지하철, 아파트 단지)의 거대함과 위압을 표현하기 위해 로우 앵글 계열을 적극 활용한다.
고층 빌딩 → Low Angle + Tilt Down
강적 등장 → Low Angle + Backlighting 실루엣 강조
주인공의 성장이 드러나는 씬 → Pedestal Up
8. 전투는 속도감 구조를 시퀀스로 고정한다.
Approach → Clash → Impact → Aftermath
 각 단계에서 Pan, Tilt, Tracking Shot, Impact Zoom 등을 배치하여 영상적 리듬을 만들어낸다.
9. 대규모 게이트·이형 존재·마력/스킬 등장 씬의 경우 현실 공간 대비 비현실적 '괴리감'을 강조한다.
현세(도시/실내)는 차갑고 정적
이계/스킬은 밝고 동적인 조명·채도
 → Lighting Contrast Rule 추가
10. 장면이나 장소가 바뀔 때, 1초 이상 짧게라도 환경 변화, 배경 디테일, 혹은 간단한 서사적 힌트를 포함해 트랜지션을 삽입하여 스토리 흐름이 자연스럽게 이어지도록 한다. 장소 바뀌기 전에도 그 Scene의 서사가 갑작스런 변화없이 부드럽게 마무리되도록 해. 단, 씬 변경이 아닌 소문의 흐름으로 구성되어 연결하는 연출로 진행한다면, 트랜지션 없는 공간변화가 더 적절해. 필요할때 장소변경이 되었다는 클립이 등장하게 해줘.
11. 원문 txt에서 독자들을 뒷내용이 궁금하게 만드는 클리프행어를 detect해서, ##내용## 이런 식으로 클리프행어를 csv에서 감싸는 형식으로 해시태그 표시해줘. 콘티에서 3분에 해당하는 마지막 장면은 클리프행어에서 끝나야해
12. 4초 이상의 긴 대사를 하나의 클립으로 절대 생성하지말고, 반드시 (B-roll)로 표기하여 연속으로 붙일 수 있는 후속클립을 별도로 생성하도록 한다. 각 클립은 4초 이하여야 한다.
13. 콘티에서 스토리 칼럼은 한글로 표시한다. 영어번역 x
14. 클립 당 절대로 4초를 넘기지 않는다. 긴 대사는 B-roll 클립을 만들어 쪼개어 옮긴다.`,
    image: `[가장 중요한 규칙 1] 모든 이미지 프롬프트의 가장 시작 부분은 반드시 "[CameraAngle][ShotType] of [CHARACTER ID], [Action]." 형식의 문법 구조를 따라야 합니다. (예: Eyelevel Midshot of Nursemaid, holding the diamond tightly against her chest. Her eyes are closed in relief, sun setting in background.) 카메라 앵글과 샷 타입을 결합하여 문장의 주어로 사용하고, 이후 행동을 쉼표(,)로 연결하십시오. 배경 ID 자체는 프롬프트에 넣지 마십시오.

[가장 중요한 규칙 2] 캐릭터가 등장하는 경우 오직 이름(CHARACTER ID)으로만 지칭하십시오. 캐릭터/아이템이 어떻게 생겼는지(머리색, 눈색, 피부톤 등)나 무엇을 입고 있는지(갑옷, 로브 등)에 대한 신체적/외형적 묘사는 일절 언급하지 마십시오. 오직 ID로만 지칭하십시오.

8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
18. 캐릭터 중심으로 클로즈업된 경우, 특수 감정이 최고조에 달한 경우에는 5개 클립 중 2개 비율로 다음 중 1개를 추가로 이미지 프롬프트에 설정해줘. (1. Point of View Shot, 2. Extreme Close-Up, 3. Close-Up, 4. Medium Shot, 7. Two Shot / Group Shot, 8. Shallow Depth of Field, 9. Macro Shot)
20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation and misgeneration. If a character is shocked, just say 'he is shocked', don't say 'he is frozen in shock', as frozen can induce generation of ice which is irrelevant.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, Mention whose height is similar to who, and who is smaller/taller than who. (i.e. Rifana's height is the same as Pinellia, Kania is much smaller than Chena, etc)
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한 (Visual Constraint): 등장인물의 수는 화면 구성의 명확성을 위해 반드시 최대 5명 이하로 제한한다. (변환 규칙: 원문에 다수 등장 시 가장 가까이 있는 3~5명의 인물로 축소하여 묘사한다. 금지 사항: 'All 20 scholars', 'The crowd'와 같이 전체를 지칭하는 표현을 금지하고 구체적인 숫치를 명시한다. 예외: 대규모 전투씬은 제외한다.)
25. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
26. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성 (예를들어 캐릭터가 대사를 말하거나 대화할때)
27. 대사를 추출했을때 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기해.
28. When two or more people are conversing in a frame (apply to over the shoulder shots as well), mention in the image prompt comparing heights such as '[Character B] is slightly taller than [Character A]. Include by interpreting the webnovel context and also attach whether both of them are standing or sitting on a [EQUIPMENT]. (i.e. [Character A] and [Character B] are both standing)
29. This is when monologue, narration, or dialogue carries on for more than 3 seconds. When a subject matter is mentioned within a dialogue, make a B-roll supplement clip showing the subject of the conversation, with the narration/dialogue carrying on during the supplement clip. When a character is imagining a character or an action, make a separate B roll supplement clip and in the image prompt. For all of these situations, include "flashback white blurry frame" in the end of the image prompt.
30. **[배경 ID 생성 규칙]**:
    - **N 사용 조건**: 클립이 (B-roll)이거나, 메인 장소가 아닌 고유의 커스텀 배경을 가진 회상(Flashback) 장면이거나, 배경이 완전히 소실되어 장소적 의미가 없는 Extreme close-up인 경우에만 샷타입 자리에 'N'을 사용하십시오 (예: 1-N).
    - **숫자 사용 조건**: 클로즈업이나 매크로 샷이라 하더라도, 해당 동작이 **메인 장소(Location) 내에서 직접적으로 일어나는 경우**에는 'N' 대신 해당 샷타입 번호(예: 9)를 사용하십시오.
    - **번호 부여**: 동일 샷타입(또는 N)이 반복될 경우 순차적으로 번호를 부여하십시오 (예: 1-4-1, 1-N-1). '1-?'와 같은 불명확한 표기는 절대 금지합니다.`,
    video: `0. [가장 중요한 규칙] 모든 비디오 프롬프트의 가장 시작 부분에 반드시 카메라 워킹(Camera Movement)을 명시하십시오. (예: Still shot, Tracking shot, POV crane shot, Panning left, Panning right, Panning up, Panning down, Tilt up, Tilt down, Zoom in, Zoom out 등). 이는 어떠한 경우에도 생략해서는 안 되며, 최우선 문법 규칙으로 적용됩니다.
1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
 Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
 강적 등장 장면: Low Angle + Backlighting 실루엣 (드래곤, 악마, 거대 적)
 이동/추격: Tracking 또는 Dynamic Follow (기사 추격, 기병 돌진)
 긴장 고조: Slow Push-In 또는 Snap Zoom-In (마법 폭발 직전, 적 등장 직전)
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
 톤이나 상황에 따라 speaks firmly / speaks quickly / shouts angrily / yells breathlessly 등 추가 가능.
 발화 장면에서 애매하거나 비유적 표현 금지.
3. 캐릭터 이름 대신 역할 기반 묘사 사용
 the knight, the mage, the rogue, the archer, the squire, the awakened one 등
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
 예: "the [subject] covers his mouth with a hood or cloak but speaks urgently"
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
 예: "he speaks, asking why the rift is opening"
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
 예: "the knight shouts during impact, the camera snap-zooms in, his head angle stays still"
7. 액션·마법·초자연적 현상과 결합된 발화 장면 규칙
 말하면서 Push-In, Handheld Shake, Slow Tracking Forward 등 카메라 반응 가능
8. 스킬 발동·게이트·아우라 등장 시: Snap Zoom-In, Tilt Up, Pedestal Up
 예: "the mage speaks as the rift bursts open behind him, the camera tilts up to the light, his head angle stays still"
9. 전투 중 발화 장면 규칙
 구조: Speak moment → Quick camera reaction → Maintain head angle
 예: "the knight shouts during impact, the camera snap-zooms in, his head angle stays still"
 폭발·충돌 직전 발화: Low Angle → Backlighting → Shout → Head angle stays still
10. 콘티에서 신속한 움직임이 있는 장면이나, 전투씬에 해당되는 장면이 감지되는 경우 비디오 프롬프트 뒤에 '4k anime opening quality' 붙여줘. 그게 아닌 나머지는 video prompt에서 그 프롬프트 빼.`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기합니다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
  {
    id: "modern_action_fantasy",
    nameKey: "genre_modern_action_fantasy",
    isSystem: true,
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
Gate 진입 → Tracking Shot 기반 전환
전투 돌입 → Whip Pan + Hard Cut
위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
6. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
분노 폭발: Push-In + Backlighting(실루엣 강조)
각성/파워업: Slow-Motion + Tilt Up
7. 현대 배경(도시, 빌딩, 지하철, 아파트 단지)의 거대함과 위압을 표현하기 위해 로우 앵글 계열을 적극 활용한다.
고층 빌딩 → Low Angle + Tilt Down
강적 등장 → Low Angle + Backlighting 실루엣 강조
주인공의 성장이 드러나는 씬 → Pedestal Up
8. 전투는 속도감 구조를 시퀀스로 고정한다.
Approach → Clash → Impact → Aftermath
 각 단계에서 Pan, Tilt, Tracking Shot, Impact Zoom 등을 배치하여 영상적 리듬을 만들어낸다.
9. 대규모 게이트·이형 존재·마력/스킬 등장 씬의 경우 현실 공간 대비 비현실적 '괴리감'을 강조한다.
현세(도시/실내)는 차갑고 정적
이계/스킬은 밝고 동적인 조명·채도
 → Lighting Contrast Rule 추가
10. 장면이나 장소가 바뀔 때, 1초 이상 짧게라도 환경 변화, 배경 디테일, 혹은 간단한 서사적 힌트를 포함해 트랜지션을 삽입하여 스토리 흐름이 자연스럽게 이어지도록 한다. 장소 바뀌기 전에도 그 Scene의 서사가 갑작스런 변화없이 부드럽게 마무리되도록 해.`,
    image: `3. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
4. 불필요한 텍스트나 워터마크를 포함하지 않는다.
5. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
6. 날씨나 계절감을 시각적으로 표현한다.
7. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
8. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
9. 현대 액션 판타지 특화 카메라워크 키워드를 사용한다.
Low Angle + Backlighting
Tracking Shot
Pedestal Up
Push-In
Tilt Down
Impact Zoom
10. 감정 임팩트 강화 규칙을 적용한다.
공포: Extreme Close-Up, Low Key Lighting, Shallow Depth
분노/결의: Push-In, Backlighting, Medium Close-Up
힘의 위계 표현: Low Angle + Dramatic Lighting Contrast
각성/파워업: Pedestal Up + Slow Push-In
11. 현대 공간 연출 규칙 적용
금속·유리·도시 조명 등 현대적 질감 강조
Wide Shot → Medium Shot 구조로 공간 스케일을 명확히 전달
12. 전투 Keyframe 연출 공식 적용
타격 직전/직후 장면을 시네마틱 콘트라스트로 묘사한다.
캐릭터 중심 클로즈업 시, 특수 감정이 최고조라면 5개 중 2개 비율로 아래 중 하나를 반드시 추가한다:
POV Shot / 2. Extreme Close-Up / 3. Close-Up / 4. Medium Shot / 7. Two Shot / Group Shot / 8. Shallow Depth / 9. Macro Shot
13. 'frozen'이라는 단어를 절대 사용하지 않는다.
14. 이미지 프롬프트 뒤에 반드시 "No vfx or visual effects, no dust particles"를 붙인다.
15. 여러 캐릭터가 등장하는 경우 반드시 누가 누구보다 더 큰지 식으로 서술한다.
16. 등장인물은 최대 5명 이하로 제한한다. (전투씬은 예외)
18. 시각적 인물 수 제한 (Visual Constraint): 등장인물의 수는 화면 구성의 명확성을 위해 반드시 최대 5명 이하로 제한한다. -금지 사항: 'All 20 scholars', 'The crowd'와 같이 전체를 지칭하는 표현을 금지하고, '3 scholars', '5 people'과 같이 구체적인 숫자를 명시한다.
19. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
20. 감정 최고조 하이라이트 장면 룰 (현대 액션 판타지용)
적용 시점: 캐릭터의 감정이 최고조(극도의 분노, 절망, 결의, 공포 등)에 도달한 하이라이트 2~3장면에만 사용
Camera Directing:
강한 Backlighting / Rimlight + Chiaroscuro → 캐릭터 윤곽 강조, 감정 극대화
Eye Light / Magic Glow 등 색상 대비 강조 → 눈빛, 능력 발현, 감정의 시각적 임팩트
Lens & Angle: Slight Low Angle, Wide-angle Lens, 필요 시 Fish-eye Effect → 캐릭터·액션 위엄/확장감 강조
Focus: Depth of Field를 사용해 감정 중심 캐릭터 강조, 배경은 흐림 처리 가능
Background Choice: 단순 색상(Gradient, Solid등)으로도 충분히 감정 전달 가능 → 화려한 입자/효과는 선택 사항
장면 선정은 스토리상 감정 최고조 도달 순간 기준
나머지 장면은 기존 Camera/Lighting 조건 유지
(조건 20의 끝)
21. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성 (예를들어 캐릭터가 대사를 말하거나 대화할때)
22. 대사를 추출했을때 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기하고`,
    video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
현대 액션 판타지 장면에서는 Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
강적 등장 장면: Low Angle + Backlighting 실루엣.
이동/추격: Tracking 또는 Dynamic Follow.
긴장 고조: Slow Push-In 또는 Snap Zoom-In.
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
톤이나 상황에 따라 speaks firmly / speaks quickly / shouts angrily / yells breathlessly 등 추가 가능.
발화 장면에서 애매하거나 비유적 표현 금지.
잘못된 예: "delivers a warning", "expresses fear", "shoots a look"
올바른 예: "the swordsman shouts angrily", "the hunter speaks quickly"
3. 캐릭터 이름 대신 역할 기반 묘사 사용
예: the baby, the nanny, the hunter, the swordsman, the agent, the awakened one 등
현대적 직업군 포함: soldier, exorcist, gate operative, ranker, rogue 등
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
예: "the agent covers his mouth with a glove but speaks urgently"
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
예: "he speaks, asking why the rift is opening"
"repeats his question" 같은 모호한 표현 금지
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
예: "the hunter shouts as debris falls behind him, his head angle stays still"
"the swordsman speaks through heavy breath, his head angle stays still"
7. 액션·마법·초자연적 현상과 결합된 발화 장면 규칙
말하면서 Push-In, Handheld Shake, Slow Tracking Forward 등 카메라 반응 가능
8. 스킬 발동·게이트·아우라 등장 시: Snap Zoom-In, Tilt Up, Pedestal Up
예: "the exorcist speaks as the rift bursts open behind him, the camera tilts up to the light, his head angle stays still"
9. 전투 중 발화 장면 규칙
구조: Speak moment → Quick camera reaction → Maintain head angle
예: "the tank shouts during impact, the camera snap-zooms in, his head angle stays still"
폭발·충돌 직전 발화: Low Angle → Backlighting → Shout → Head angle stays still`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기합니다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
];

function getNextCustomId(presets: GenrePreset[]): string {
  const customIds = presets
    .filter((p) => !p.isSystem)
    .map((p) => {
      const match = p.id.match(/^custom_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
  const maxId = customIds.length > 0 ? Math.max(...customIds) : 0;
  return `custom_${maxId + 1}`;
}

function loadPresets(): GenrePreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: GenrePreset[] = JSON.parse(stored);
      // Keep custom presets from storage, force-overwrite system presets
      const customPresets = parsed.filter((p) => !p.isSystem);
      return [...SYSTEM_PRESETS, ...customPresets];
    }
  } catch {
    // Corrupted storage, reset
  }
  return [...SYSTEM_PRESETS];
}

function savePresets(presets: GenrePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Storage full or unavailable
  }
}

export function useGenrePresets() {
  const [presets, setPresets] = useState<GenrePreset[]>(() => loadPresets());

  // Sync to localStorage whenever presets change
  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  const systemPresets = presets.filter((p) => p.isSystem);
  const customPresets = presets.filter((p) => !p.isSystem);

  const addPreset = useCallback(
    (name: string, data: GenrePresetData) => {
      setPresets((prev) => {
        const newPreset: GenrePreset = {
          id: getNextCustomId(prev),
          name,
          isSystem: false,
          ...data,
        };
        return [...prev, newPreset];
      });
    },
    []
  );

  const updatePreset = useCallback(
    (id: string, data: Partial<GenrePresetData>) => {
      setPresets((prev) =>
        prev.map((p) => {
          if (p.id !== id || p.isSystem) return p;
          return { ...p, ...data };
        })
      );
    },
    []
  );

  const renamePreset = useCallback((id: string, name: string) => {
    setPresets((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.isSystem) return p;
        return { ...p, name };
      })
    );
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target || target.isSystem) return prev;
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  return {
    presets,
    systemPresets,
    customPresets,
    addPreset,
    updatePreset,
    renamePreset,
    deletePreset,
  };
}
