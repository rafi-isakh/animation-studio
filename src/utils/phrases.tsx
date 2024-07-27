import { Dictionary, Language } from "@/components/Types"

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
    return Object.keys(dictionary).length != 0 && dictionary[variable][language];
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