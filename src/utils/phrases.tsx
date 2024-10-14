import { Dictionary, Language } from "@/components/Types"

export const langPairList = [
    {
        code: 'ko',
        name: '한국어'
    },
    {
        code: 'en',
        name: 'English'
    },
    {
        code: 'ja',
        name: '日本語'
    },
    {
        code: 'zh-CN',
        name: '中国语（繁体）'
    },
    {
        code: 'zh-TW',
        name: '中國語（簡體）'
    },
    {
        code: 'th',
        name: 'ภาษาไทย'
    },
    {
        code: 'id',
        name: 'Bahasa Indonesia'
    },
    {
        code: 'vi',
        name: 'Tiếng Việt'
    },
    {
        code: 'ar',
        name: 'العربية'
    }
]

const phrases = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_phrases`);
        const dictionary = await response.json();
        return dictionary;
    }
    catch (error) {
        console.error("Error retrieving dictionary", error);
        throw new Error("Error retrieving dictionary",);
    }
}

export default phrases

export const phrase = (dictionary: Dictionary, variable: string, language: Language) => {
    try  {
        if (Object.keys(dictionary).length != 0) {
            const result = dictionary[variable][language];
            if (result) {
                return result;
            } else {
                return dictionary[variable]['en']; // default to english if translation is not found
            }
        }
        return "";
    } catch {
        return "";
    }
}

export const code_to_lang = (iso_code: string) => {
    if (iso_code == 'ko') {
        return 'korean';
    } else if (iso_code =='en') {
        return 'english';
    } else if (iso_code == 'ja') {
        return 'japanese';
    } else if (iso_code == 'zh-CN') {
        return 'chineseSimplified';
    } else if (iso_code == 'zh-TW') {
        return 'chineseTraditional';
    } else if (iso_code == 'th') {
        return 'thai';
    } else if (iso_code == 'id') {
        return 'indonesian';
    } else if (iso_code == 'vi') {
        return 'vietnamese';
    } else if (iso_code == 'ar') {
        return 'arabic';
    } else {
        return '';
    }
}