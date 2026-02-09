import type { GenrePreset } from './types';

// Default conditions matching the reference implementation (Korean)
const DEFAULT_CONDITIONS = {
  story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
3. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.`,
  image: `2. 캐릭터의 외형적 특징(머리색, 의상 등)을 고정한다.
5. 샷의 앵글과 구도는 Background ID의 지침을 따른다.
7. 주요 오브젝트나 소품, 군중의 옷을 묘사할때, 웹소설 속 시대적 배경이나 장소의 분위기를 정확하게 반영한다.
8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, Mention whose height is similar to who, and who is smaller/taller than who.`,
  video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
2. 음향 중 캐릭터가 대사가 말하는 장면인 경우, 비디오 프롬프트에 애니메이션에서 말하는것처럼 말하는 묘사가 반드시 비디오 프롬프트에 포함되어야 한다.
3. 캐릭터 이름 대신 대명사(the baby, the nanny)를 사용하세요.
7. When a character is speaking, attach the prompt "(pronoun)'s head angle stays still" at the back.`,
  sound: `1. 음향은 대사, 효과음, 배경음악으로 구분한다.
2. 망가 패널의 텍스트가 있는 경우 이를 최우선으로 반영한다.
3. 대사가 없는 구간은 필드를 비워둔다.`,
};

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'fantasy',
    name: '판타지 (Fantasy)',
    description: '마법과 모험이 가득한 판타지',
    story: DEFAULT_CONDITIONS.story,
    image: DEFAULT_CONDITIONS.image,
    video: DEFAULT_CONDITIONS.video,
    sound: DEFAULT_CONDITIONS.sound,
  },
  {
    id: 'romance',
    name: '로맨스 (Romance)',
    description: '감정적인 로맨스와 드라마',
    story: `1. 감정의 비트와 캐릭터의 표정에 집중한다.
2. 적절한 곳에 내면 독백을 포함한다.
3. 의미 있는 시선과 섬세한 제스처를 강조한다.`,
    image: `1. 로맨틱한 순간에는 부드럽고 따뜻한 색감을 사용한다.
2. 상세한 표정과 바디 랭귀지를 묘사한다.
3. 분위기를 강화하는 조명을 사용한다.`,
    video: `1. 감정적인 장면에서는 느린 템포를 유지한다.
2. 중요한 순간에 캐릭터 얼굴 클로즈업.
3. 부드러운 카메라 움직임.`,
    sound: `1. 감정적인 배경 음악 선택.
2. 긴장되는 로맨틱 순간에 심장박동 효과음.
3. 친밀한 장면에서 부드러운 앰비언트 사운드.`,
  },
  {
    id: 'action',
    name: '액션 (Action)',
    description: '빠른 템포의 액션과 전투 장면',
    story: `1. 임팩트와 움직임을 강조한다.
2. 복잡한 액션을 명확한 시퀀스로 분해한다.
3. 페이싱을 통해 긴장감을 조성한다.`,
    image: `1. 다이나믹한 포즈와 앵글.
2. 모션 블러와 임팩트 효과.
3. 강렬함을 위한 대담하고 대비되는 색상.`,
    video: `1. 액션 시퀀스에서 빠른 컷.
2. 스피드 라인과 모션 강조.
3. 임팩트 있는 카메라 흔들림.`,
    sound: `1. 타격에 펀치감 있는 효과음.
2. 고에너지 배경 음악.
3. 캐릭터의 전투 함성과 반응.`,
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
