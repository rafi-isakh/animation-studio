export interface CharacterTemplate {
  path: string;
  label: string;
}

export const ALL_TEMPLATES: CharacterTemplate[] = [
  { path: "/images/character-templates/adult_man_rofan_dummy.png",   label: "ADULT_MAN_ROFAN"    },
  { path: "/images/character-templates/adult_man_rofan_dummy2.png",  label: "ADULT_MAN_ROFAN_2"  },
  { path: "/images/character-templates/adult_man_rofan_dummy3.jpeg", label: "ADULT_MAN_ROFAN_3"  },
  { path: "/images/character-templates/baby_dummy.png",              label: "BABY"               },
  { path: "/images/character-templates/boy_rofan_dummy.png",         label: "BOY_ROFAN"          },
  { path: "/images/character-templates/boy_rofan_dummy2.png",        label: "BOY_ROFAN_2"        },
  { path: "/images/character-templates/butler_dummy.png",            label: "BUTLER"             },
  { path: "/images/character-templates/concubine_rofan_dummy.png",   label: "CONCUBINE_ROFAN"    },
  { path: "/images/character-templates/emperor_rofan_dummy.png",     label: "EMPEROR_ROFAN"      },
  { path: "/images/character-templates/empress_rofan_dummy.png",     label: "EMPRESS_ROFAN"      },
  { path: "/images/character-templates/girl_rofan_dummy.png",        label: "GIRL_ROFAN"         },
  { path: "/images/character-templates/knights_rofan_dummy.png",     label: "KNIGHTS_ROFAN"      },
  { path: "/images/character-templates/maid_rofan_dummy.jpg",        label: "MAID_ROFAN"         },
  { path: "/images/character-templates/maid2_rofan_dummy.png",       label: "MAID_ROFAN_2"       },
  { path: "/images/character-templates/villainess_rofan_dummy.png",  label: "VILLAINESS_ROFAN"   },
  { path: "/images/character-templates/wizard_dummy.jpeg",           label: "WIZARD"             },
  { path: "/images/character-templates/woman_main_rofan_dummy.png",  label: "WOMAN_MAIN_ROFAN"   },
  { path: "/images/character-templates/woman_main_rofan_dummy2.png", label: "WOMAN_MAIN_ROFAN_2" },
];

const BABY_ROLE_KEYWORDS = ["baby", "infant", "newborn", "toddler"];
const CHILD_ROLE_KEYWORDS = ["son", "daughter", "child", "young", "childhood", "kid"];

const ROLE_TEMPLATE_MAP: Record<string, string> = {
  butler:     "/images/character-templates/butler_dummy.png",
  emperor:    "/images/character-templates/emperor_rofan_dummy.png",
  empress:    "/images/character-templates/empress_rofan_dummy.png",
  knight:     "/images/character-templates/knights_rofan_dummy.png",
  knights:    "/images/character-templates/knights_rofan_dummy.png",
  guard:      "/images/character-templates/knights_rofan_dummy.png",
  soldier:    "/images/character-templates/knights_rofan_dummy.png",
  maid:       "/images/character-templates/maid_rofan_dummy.jpg",
  servant:    "/images/character-templates/maid_rofan_dummy.jpg",
  concubine:  "/images/character-templates/concubine_rofan_dummy.png",
  villainess: "/images/character-templates/villainess_rofan_dummy.png",
  villain:    "/images/character-templates/villainess_rofan_dummy.png",
  wizard:     "/images/character-templates/wizard_dummy.jpeg",
  mage:       "/images/character-templates/wizard_dummy.jpeg",
  sorcerer:   "/images/character-templates/wizard_dummy.jpeg",
  witch:      "/images/character-templates/wizard_dummy.jpeg",
};

const MALE_DESCRIPTION_KEYWORDS = [
  "male", "man", "boy", "he ", "his ", "him ", "husband", "father", "brother",
  "son", "king", "prince", "lord", "duke", "count", "sir ",
];
const FEMALE_DESCRIPTION_KEYWORDS = [
  "female", "woman", "girl", "she ", "her ", "hers ", "wife", "mother", "sister",
  "daughter", "queen", "princess", "lady", "duchess", "countess",
];

function inferGender(prop: { gender?: string; role?: string; name?: string; description?: string }): boolean | null {
  // Explicit field wins
  const explicit = prop.gender?.toLowerCase();
  if (explicit === "male") return true;
  if (explicit === "female") return false;

  // Scan role + name + description for gender keywords
  const corpus = [prop.role, prop.name, prop.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const maleScore = MALE_DESCRIPTION_KEYWORDS.filter((k) => corpus.includes(k)).length;
  const femaleScore = FEMALE_DESCRIPTION_KEYWORDS.filter((k) => corpus.includes(k)).length;

  if (maleScore > femaleScore) return true;
  if (femaleScore > maleScore) return false;
  return null; // truly unknown
}

export function getSuggestedTemplates(prop: {
  gender?: string;
  role?: string;
  age?: string;
  name?: string;
  description?: string;
}): string[] {
  const genderMale = inferGender(prop); // true=male, false=female, null=unknown
  const isMale = genderMale === true;
  const ageNum = parseInt(prop.age || "20");

  // Combine role + description for keyword matching
  const searchCorpus = [prop.role, prop.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isBaby = ageNum < 2 || BABY_ROLE_KEYWORDS.some((k) => searchCorpus.includes(k));
  const isChild = !isBaby && (ageNum < 16 || CHILD_ROLE_KEYWORDS.some((k) => searchCorpus.includes(k)));

  if (isBaby) {
    return ["/images/character-templates/baby_dummy.png"];
  }

  if (isChild) {
    return isMale
      ? [
          "/images/character-templates/boy_rofan_dummy.png",
          "/images/character-templates/boy_rofan_dummy2.png",
        ]
      : ["/images/character-templates/girl_rofan_dummy.png"];
  }

  // Role-based override (search corpus covers both role field and description)
  for (const keyword of Object.keys(ROLE_TEMPLATE_MAP)) {
    if (searchCorpus.includes(keyword)) {
      return [ROLE_TEMPLATE_MAP[keyword]];
    }
  }

  // Default adult suggestions — if gender is truly unknown, return both male and female
  if (genderMale === null) {
    return [
      "/images/character-templates/adult_man_rofan_dummy.png",
      "/images/character-templates/woman_main_rofan_dummy.png",
    ];
  }

  return isMale
    ? [
        "/images/character-templates/adult_man_rofan_dummy.png",
        "/images/character-templates/adult_man_rofan_dummy2.png",
        "/images/character-templates/adult_man_rofan_dummy3.jpeg",
      ]
    : [
        "/images/character-templates/woman_main_rofan_dummy.png",
        "/images/character-templates/woman_main_rofan_dummy2.png",
      ];
}
