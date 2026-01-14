"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Palette } from "lucide-react";

export interface GenrePreset {
  id: string;
  nameKey: string;
  story: string;
  image: string;
  video: string;
  sound: string;
}

interface GenrePresetsProps {
  onApply: (preset: GenrePreset) => void;
}

export default function GenrePresets({ onApply }: GenrePresetsProps) {
  const { language, dictionary } = useLanguage();

  const presets = useMemo<GenrePreset[]>(() => [
    {
      id: "modern_romance",
      nameKey: "genre_modern_romance",
      story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 관계(dynamic)과 감정선(emotion arc)의 변화가 드러나는 '결정적 모먼트'를 우선적으로 선택한다.`,
      image: `2. 캐릭터의 외형적 특징(머리색, 의상 등)을 고정한다.
5. 샷의 앵글과 구도는 Background ID의 지침을 따른다.
7. 주요 오브젝트나 소품, 군중의 옷을 묘사할때, 웹소설 속 시대적 배경이나 장소의 분위기를 정확하게 반영한다.
8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
11. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 역동성보다 '감정의 압축된 임팩트'를 우선한다.
- Extreme Close-Up (eyes, lips, trembling hand)
- Profile Two Shot (romantic tension)
- Slow Dolly In keyword
- Black Void + Spotlight (monologue)
- Negative Space (romantic anticipation)
20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, mention whose height is similar to who.
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한: 등장인물의 수는 최대 5명 이하로 제한한다.
25. 샷의 앵글과 구도는 Background ID의 지침을 따르고, 연속적인 장면이 반복된 카메라앵글샷을 사용해서는 안된다.
26. 전체 클립중 약 33%의 클립은 동적인 클립, 나머지 66%은 정적인 클립으로 구성
27. 대사가 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기`,
      video: `1. 캐릭터의 감정 상태에 따라 카메라 무빙을 자동으로 바꾼다.
- 당황·코믹 → whip pan / crash zoom / shaky handheld-lite
- 진지·고백·제안 → slow dolly-in / shallow focus
- 서먹함 → profile shot side-by-side / high angle vulnerability
- 로맨틱 온기 증가 → steady cam, soft light, closer two-shot
3. 로맨틱/코믹 대사가 포함된 씬은 '시선 블로킹(Sight Blocking)'을 명시한다.
- "He speaks while looking away"
- "She speaks without making eye contact"
- "They speak while slowly turning toward each other"
7. 말하는 장면 → 반드시 "정면 안정 헤드각(he stays still)"+ "입 모양 보임" + "카메라 거리 명시"`,
      sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 인물명 (대사) 형식을 준수한다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
    },
    {
      id: "medieval_action_fantasy",
      nameKey: "genre_medieval_action_fantasy",
      story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
- Gate 진입 → Tracking Shot 기반 전환
- 전투 돌입 → Whip Pan + Hard Cut
- 위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
6. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
- 공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
- 분노 폭발: Push-In + Backlighting(실루엣 강조)
- 각성/파워업: Slow-Motion + Tilt Up
8. 전투는 속도감 구조를 시퀀스로 고정한다: Approach → Clash → Impact → Aftermath
10. 장면이나 장소가 바뀔 때, 1초 이상 짧게라도 환경 변화, 배경 디테일, 혹은 간단한 서사적 힌트를 포함해 트랜지션을 삽입하여 스토리 흐름이 자연스럽게 이어지도록 한다.
12. 4초 이상의 긴 대사를 하나의 클립으로 절대 생성하지말고, 반드시 (B-roll)로 표기하여 연속으로 붙일 수 있는 후속클립을 별도로 생성하도록 한다.`,
      image: `2. 캐릭터의 외형적 특징(머리색, 의상 등)을 고정한다.
7. 주요 오브젝트나 소품, 군중의 옷을 묘사할때, 웹소설 속 시대적 배경이나 장소의 분위기를 정확하게 반영한다.
8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
11. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
18. 캐릭터 중심으로 클로즈업된 경우, 특수 감정이 최고조에 달한 경우에는 5개 클립 중 2개 비율로 다음 중1개를 추가로 이미지 프롬프트에 설정:
- Point of View Shot
- Extreme Close-Up
- Close-Up
- Medium Shot
- Two Shot / Group Shot
- Shallow Depth of Field
- Macro Shot
20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, mention whose height is similar to who.
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한: 등장인물의 수는 최대 5명 이하로 제한한다. (전투씬은 예외)
26. 전체 클립중 약 33%의 클립은 동적인 클립, 나머지 66%은 정적인 클립으로 구성
27. 대사가 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기
28. When two or more people are conversing, mention comparing heights and whether both are standing or sitting.
29. When monologue/dialogue carries on for more than 3 seconds, make a B-roll supplement clip showing the subject of conversation with "flashback white blurry frame" at the end.`,
      video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
- Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
- 강적 등장 장면: Low Angle + Backlighting 실루엣 (드래곤, 악마, 거대 적)
- 이동/추격: Tracking 또는 Dynamic Follow (기사 추격, 기병 돌진)
- 긴장 고조: Slow Push-In 또는 Snap Zoom-In (마법 폭발 직전, 적 등장 직전)
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
3. 캐릭터 이름 대신 역할 기반 묘사 사용: the knight, the mage, the rogue, the archer, the squire 등
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
9. 전투 중 발화 장면 규칙: Speak moment → Quick camera reaction → Maintain head angle`,
      sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 인물명 (대사) 형식을 준수한다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
    },
    {
      id: "modern_action_fantasy",
      nameKey: "genre_modern_action_fantasy",
      story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.
5. 장면 전환은 액션 속도감에 맞춰 '카메라 무빙 기반'으로 설계한다.
- Gate 진입 → Tracking Shot 기반 전환
- 전투 돌입 → Whip Pan + Hard Cut
- 위기 상황 → Snap Zoom-In 후 다음 씬으로 전환
6. 등장인물의 감정이 폭발하는 순간에는 시네마틱 샷을 고정적으로 삽입한다.
- 공포·직감: Extreme Close-Up + Low Key Lighting + Shallow Depth
- 분노 폭발: Push-In + Backlighting(실루엣 강조)
- 각성/파워업: Slow-Motion + Tilt Up
7. 현대 배경(도시, 빌딩, 지하철, 아파트 단지)의 거대함과 위압을 표현하기 위해 로우 앵글 계열을 적극 활용한다.
- 고층 빌딩 → Low Angle + Tilt Down
- 강적 등장 → Low Angle + Backlighting 실루엣 강조
- 주인공의 성장이 드러나는 씬 → Pedestal Up
8. 전투는 속도감 구조를 시퀀스로 고정한다: Approach → Clash → Impact → Aftermath
9. 대규모 게이트·이형 존재·마력/스킬 등장 씬의 경우 현실 공간 대비 비현실적 '괴리감'을 강조한다.
10. 장면이나 장소가 바뀔 때, 1초 이상 짧게라도 트랜지션을 삽입하여 스토리 흐름이 자연스럽게 이어지도록 한다.`,
      image: `1. 캐릭터의 외형적 특징(머리색, 의상 등)을 고정한다.
2. 주요 오브젝트나 소품, 군중의 옷을 묘사할때, 웹소설 속 시대적 배경이나 장소의 분위기를 정확하게 반영한다.
3. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
4. 불필요한 텍스트나 워터마크를 포함하지 않는다.
5. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
6. 날씨나 계절감을 시각적으로 표현한다.
7. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
8. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
9. 현대 액션 판타지 특화 카메라워크 키워드를 사용한다:
- Low Angle + Backlighting
- Tracking Shot
- Pedestal Up
- Push-In
- Tilt Down
- Impact Zoom
10. 감정 임팩트 강화 규칙:
- 공포: Extreme Close-Up, Low Key Lighting, Shallow Depth
- 분노/결의: Push-In, Backlighting, Medium Close-Up
- 힘의 위계 표현: Low Angle + Dramatic Lighting Contrast
- 각성/파워업: Pedestal Up + Slow Push-In
11. 현대 공간 연출 규칙: 금속·유리·도시 조명 등 현대적 질감 강조
13. 'frozen'이라는 단어를 절대 사용하지 않는다.
14. 이미지 프롬프트 뒤에 반드시 "No vfx or visual effects, no dust particles"를 붙인다.
15. 여러 캐릭터가 등장하는 경우 반드시 누가 누구보다 더 큰지 서술한다.
16. 등장인물은 최대 5명 이하로 제한한다. (전투씬은 예외)
21. 전체 클립중 약 33%의 클립은 동적인 클립, 나머지 66%은 정적인 클립으로 구성
22. 대사가 4초 이상 되면, B-roll 용 클립으로 나누어 구분해줘. 이미지 프롬프트에는 (B-roll)로 표기`,
      video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
- 현대 액션 판타지 장면에서는 Tracking Shot, Handheld Follow, Snap Zoom-In, Push-In, Tilt Down, Low Angle Shot 등을 우선 활용한다.
- 강적 등장 장면: Low Angle + Backlighting 실루엣.
- 이동/추격: Tracking 또는 Dynamic Follow.
- 긴장 고조: Slow Push-In 또는 Snap Zoom-In.
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
3. 캐릭터 이름 대신 역할 기반 묘사 사용: the baby, the nanny, the hunter, the swordsman, the agent, the awakened one 등
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가
7. 액션·마법·초자연적 현상과 결합된 발화 장면 규칙
8. 스킬 발동·게이트·아우라 등장 시: Snap Zoom-In, Tilt Up, Pedestal Up
9. 전투 중 발화 장면 규칙: Speak moment → Quick camera reaction → Maintain head angle`,
      sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 인물명 (대사) 형식을 준수한다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
    },
  ], []);

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const preset = presets.find((p) => p.id === selectedId);
    if (preset) {
      onApply(preset);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <select
        onChange={handleSelectPreset}
        defaultValue=""
        className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none cursor-pointer"
      >
        <option value="" disabled>
          {phrase(dictionary, "genre_select_preset", language)}
        </option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {phrase(dictionary, preset.nameKey, language)}
          </option>
        ))}
      </select>
    </div>
  );
}