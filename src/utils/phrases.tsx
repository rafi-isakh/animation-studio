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
        name: '中国语（简体）'
    },
    {
        code: 'zh-TW',
        name: '中國語（繁體）'
    },
    {
        code: 'th',
        name: 'ภาษาไทย'
    },
    {
        code: 'fr',
        name: 'Français'
    },
    {
        code: 'es',
        name: 'Español'
    }
]

const phrases = async (): Promise<Dictionary> => {
    try {
        const response = await fetch(`/translations.csv`);
        const csvText = await response.text();
        const dictionary: Dictionary = {};
        
        const rows = csvText.split('\n');
        const languageCodes = rows[0].split(",");
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(/(?<!\\),/); // split by comma, except for escaped commas
            if (row.length === 0) continue;
            
            const tsx = row[0];
            const entry: { [key: string]: string } = {};
            
            for (let j = 1; j < row.length; j++) {
                const languageCode = languageCodes[j];
                entry[languageCode] = row[j].replace(/\\,/g, ','); // replace escaped commas with actual commas
            }
            
            dictionary[tsx] = entry;
        }
        
        return dictionary;
    } catch (error) {
        console.error("Error retrieving dictionary", error);
        throw new Error("Error retrieving dictionary");
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
    } else if (iso_code == 'fr') {
        return 'french';
    } else if (iso_code == 'es') {
        return 'spanish';
    } else {
        return '';
    }
}