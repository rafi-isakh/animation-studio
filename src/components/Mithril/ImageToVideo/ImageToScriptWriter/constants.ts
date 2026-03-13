import type { GenrePreset } from './types';

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'modern-romance',
    name: '현대 로맨스 (Modern Romance)',
    description: '감정선과 관계 변화를 중심으로 한 현대 로맨스',
  story: '',
  image: '',
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
    story: '',
    image: '',
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
    story: '',
    image: '',
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
