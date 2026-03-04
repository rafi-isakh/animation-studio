import type { GenrePreset } from './types';

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'modern-romance',
    name: '현대 로맨스 (Modern Romance)',
    description: '감정선과 관계 변화를 중심으로 한 현대 로맨스',
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
3. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
4. 관계(dynamic)과 감정선(emotion arc)의 변화가 드러나는 '결정적 모먼트'를 우선적으로 선택한다. "연인 아닌 평행선", "진지한 제안이 시작되는 순간", "키스 직전의 숨 멎는 거리감" 같은 관계 변화 지점, 감정선이 바뀌는 초단위 순간을 이미지·비디오 프롬프트에서 자동으로 우선 묘사하도록 설계. 러브 코미디·오피스 로맨스의 핵심인 아이러니(코믹 연출 + 진지한 감정의 대비), 내면 독백(black void / spotlight 연출), 긴장–해소 구조를 시각적으로 표현하는 지점을 항상 우선 반영.`,
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

2. '관계의 거리감(Relational Distance)'을 카메라 구도로 명확하게 표현한다. 서먹·동료 단계 → "Profile Two Shot", "Side-by-side framing", "Parallel blocking", "High Angle for vulnerability" 관심이 생기는 순간 → "Slow Dolly In", "Tight Two Shot", "Reduced background noise", "Soft focus on faces" 로맨틱 임팩트 순간 → "Negative Space background", "Shallow depth of field", "Extreme Close-Up of lips/eyes", "Spotlight emotional focus"
25. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
26. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성 (예를들어 캐릭터가 대사를 말하거나 대화할때)
27. 대사를 추출했을때 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기하고`,
    video: `1. 캐릭터의 감정 상태에 따라 카메라 무빙을 자동으로 바꾼다. 당황·코믹 → whip pan / crash zoom / shaky handheld-lite 진지·고백·제안 → slow dolly-in / shallow focus 서먹함 → profile shot side-by-side / high angle vulnerability 로맨틱 온기 증가 → steady cam, soft light, closer two-shot

3. 로맨틱/코믹 대사가 포함된 씬은 '시선 블로킹(Sight Blocking)'을 명시한다. 비디오 프롬프트에서 대사 장면일 경우: "He speaks while looking away" "She speaks without making eye contact" "They speak while slowly turning toward each other" "He speaks directly facing her"

4. 감정적 반전(아이러니) 연출을 카메라가 '먼저 감지'하는 방식으로 묘사한다. "Romantic lighting shifts abruptly" "Spotlight collapses into normal lighting" "Soft focus breaks into sharp mundane focus"

7. 말하는 장면 → 반드시 "정면 안정 헤드각(he stays still)"+ "입 모양 보임" + "카메라 거리 명시" "close-up, he speaks softly, his head angle stays still" "two-shot, they speak quietly, their head angles stay still"`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
  {
    id: 'medieval-fantasy',
    name: '중세 액션 판타지 (Medieval Fantasy)',
    description: '중세 배경의 전투와 마법이 있는 액션 판타지',
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
3. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
4. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
Gate 진입 → Tracking Shot 기반 전환
전투 돌입 → Whip Pan + Hard Cut
위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
5. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
분노 폭발: Push-In + Backlighting(실루엣 강조)
각성/파워업: Slow-Motion + Tilt Up
6. 전투는 속도감 구조를 시퀀스로 고정한다.
Approach → Clash → Impact → Aftermath
각 단계에서 Pan, Tilt, Tracking Shot, Impact Zoom 등을 배치하여 영상적 리듬을 만들어낸다.
7. 콘티에서 스토리 칼럼은 한글로 표시한다. 영어번역 x`,
    image: `[가장 중요한 규칙 1] 모든 이미지 프롬프트의 가장 시작 부분은 반드시 "[CameraAngle][ShotType] of [CHARACTER ID], [Action]." 형식의 문법 구조를 따라야 합니다. 카메라 앵글과 샷 타입을 결합하여 문장의 주어로 사용하고, 이후 행동을 쉼표(,)로 연결하십시오. 배경 ID 자체는 프롬프트에 넣지 마십시오.

[가장 중요한 규칙 2] 캐릭터가 등장하는 경우 오직 이름(CHARACTER ID)으로만 지칭하십시오. 캐릭터/아이템이 어떻게 생겼는지(머리색, 눈색, 피부톤 등)나 무엇을 입고 있는지(갑옷, 로브 등)에 대한 신체적/외형적 묘사는 일절 언급하지 마십시오. 오직 ID로만 지칭하십시오.

8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
18. 캐릭터 중심으로 클로즈업된 경우, 특수 감정이 최고조에 달한 경우에는 5개 클립 중 2개 비율로 다음 중 1개를 추가로 이미지 프롬프트에 설정해줘. (1. Point of View Shot, 2. Extreme Close-Up, 3. Close-Up, 4. Medium Shot, 7. Two Shot / Group Shot, 8. Shallow Depth of Field, 9. Macro Shot)
20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation and misgeneration. If a character is shocked, just say 'he is shocked', don't say 'he is frozen in shock', as frozen can induce generation of ice which is irrelevant.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, Mention whose height is similar to who, and who is smaller/taller than who.
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한 (Visual Constraint): 등장인물의 수는 화면 구성의 명확성을 위해 반드시 최대 5명 이하로 제한한다. (변환 규칙: 원문에 다수 등장 시 가장 가까이 있는 3~5명의 인물로 축소하여 묘사한다. 금지 사항: 'All 20 scholars', 'The crowd'와 같이 전체를 지칭하는 표현을 금지하고 구체적인 숫자를 명시한다. 예외: 대규모 전투씬은 제외한다.)
25. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
26. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성 (예를들어 캐릭터가 대사를 말하거나 대화할때)
28. When two or more people are conversing in a frame, mention in the image prompt comparing heights and whether both are standing or sitting on a [EQUIPMENT].
29. When a subject matter is mentioned within a dialogue for more than 3 seconds, make a B-roll supplement clip showing the subject. Include "flashback white blurry frame" at the end of the image prompt.`,
    video: `0. [가장 중요한 규칙] 모든 비디오 프롬프트의 가장 시작 부분에 반드시 카메라 워킹(Camera Movement)을 명시하십시오. (예: Still shot, Tracking shot, POV crane shot, Panning left, Panning right, Tilt up, Tilt down, Zoom in, Zoom out 등). 이는 어떠한 경우에도 생략해서는 안 되며, 최우선 문법 규칙으로 적용됩니다.
1. 카메라 앵글과 동작 위주로 간결하게 구성한다. Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
3. 캐릭터 이름 대신 역할 기반 묘사 사용 (the knight, the mage, the rogue, the archer, the awakened one 등)
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
7. 액션·마법·초자연적 현상과 결합된 발화 장면 규칙: 말하면서 Push-In, Handheld Shake, Slow Tracking Forward 등 카메라 반응 가능
8. 스킬 발동·게이트·아우라 등장 시: Snap Zoom-In, Tilt Up, Pedestal Up
9. 전투 중 발화 장면 규칙: Speak moment → Quick camera reaction → Maintain head angle
10. 콘티에서 신속한 움직임이 있는 장면이나, 전투씬에 해당되는 장면이 감지되는 경우 비디오 프롬프트 뒤에 '4k anime opening quality' 붙여줘.`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기합니다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
  {
    id: 'modern-action-fantasy',
    name: '현대 액션 판타지 (Modern Action Fantasy)',
    description: '현대 도시 배경의 게이트/헌터 액션 판타지',
    story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
3. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
4. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
Gate 진입 → Tracking Shot 기반 전환
전투 돌입 → Whip Pan + Hard Cut
위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
5. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
분노 폭발: Push-In + Backlighting(실루엣 강조)
각성/파워업: Slow-Motion + Tilt Up
6. 현대 배경(도시, 빌딩, 지하철, 아파트 단지)의 거대함과 위압을 표현하기 위해 로우 앵글 계열을 적극 활용한다.
고층 빌딩 → Low Angle + Tilt Down
강적 등장 → Low Angle + Backlighting 실루엣 강조
주인공의 성장이 드러나는 씬 → Pedestal Up
7. 전투는 속도감 구조를 시퀀스로 고정한다.
Approach → Clash → Impact → Aftermath
8. 대규모 게이트·이형 존재·마력/스킬 등장 씬의 경우 현실 공간 대비 비현실적 '괴리감'을 강조한다.
현세(도시/실내)는 차갑고 정적
이계/스킬은 밝고 동적인 조명·채도`,
    image: `3. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
4. 불필요한 텍스트나 워터마크를 포함하지 않는다.
5. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
6. 날씨나 계절감을 시각적으로 표현한다.
7. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
8. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
9. 현대 액션 판타지 특화 카메라워크 키워드를 사용한다.
Low Angle + Backlighting / Tracking Shot / Pedestal Up / Push-In / Tilt Down / Impact Zoom
10. 감정 임팩트 강화 규칙을 적용한다.
공포: Extreme Close-Up, Low Key Lighting, Shallow Depth
분노/결의: Push-In, Backlighting, Medium Close-Up
힘의 위계 표현: Low Angle + Dramatic Lighting Contrast
각성/파워업: Pedestal Up + Slow Push-In
13. 'frozen'이라는 단어를 절대 사용하지 않는다.
14. 이미지 프롬프트 뒤에 반드시 "No vfx or visual effects, no dust particles"를 붙인다.
15. 여러 캐릭터가 등장하는 경우 반드시 누가 누구보다 더 큰지 식으로 서술한다.
16. 등장인물은 최대 5명 이하로 제한한다. (전투씬은 예외)
19. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 풍부한 연출을 위해 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
21. 전체 클립중 약 33%의 클립은 캐릭터가 걷거나 뛰는 등 동적인 클립, 나머지 66%은 카메라 액션/무브먼트가 없는 정적인 클립으로 구성
22. 대사를 추출했을때 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기하고`,
    video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
현대 액션 판타지 장면에서는 Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
강적 등장 장면: Low Angle + Backlighting 실루엣.
이동/추격: Tracking 또는 Dynamic Follow.
긴장 고조: Slow Push-In 또는 Snap Zoom-In.
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
잘못된 예: "delivers a warning", "expresses fear", "shoots a look"
올바른 예: "the swordsman shouts angrily", "the hunter speaks quickly"
3. 캐릭터 이름 대신 역할 기반 묘사 사용
예: the baby, the nanny, the hunter, the swordsman, the agent, the awakened one 등
현대적 직업군 포함: soldier, exorcist, gate operative, ranker, rogue 등
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
7. 액션·마법·초자연적 현상과 결합된 발화 장면 규칙: 말하면서 Push-In, Handheld Shake, Slow Tracking Forward 등 카메라 반응 가능
8. 스킬 발동·게이트·아우라 등장 시: Snap Zoom-In, Tilt Up, Pedestal Up
9. 전투 중 발화 장면 규칙
구조: Speak moment → Quick camera reaction → Maintain head angle
폭발·충돌 직전 발화: Low Angle → Backlighting → Shout → Head angle stays still`,
    sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기합니다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다. i.e. ELISA_PRESENT: [침착하게] 너가 행복했으면 한단다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
  },
  {
    id: 'custom',
    name: '커스텀 (Custom)',
    description: '직접 조건을 정의하세요',
    story: '',
    image: '',
    video: '',
    sound: '',
  },
];
