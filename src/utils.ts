export const code_to_language = (code: string | undefined, language: string) => {
    if (code == "ko") {
        if (language == "ko") return "한국어";
        if (language == "en") return "Korean";
        if (language == "ar") return "الكورية";
        if (language == "ja") return "韓国語";
    }
    else if (code == "en") {
        if (language == "ko") return "영어";
        if (language == "en") return "English";
        if (language == "ar") return "الإنجليزية";
        if (language == "ja") return "英語";
    }
    else if (code == "ar") {
        if (language == "ko") return "아랍어";
        if (language == "en") return "Arabic";
        if (language == "ar") return "العربية";
        if (language == "ja") return "アラビア語";
    }
    else if (code == "ja") {
        if (language == "ko") return "일본어";
        if (language == "en") return "Japanese";
        if (language == "ar") return "اليابانية";
        if (language == "ja") return "日本語";
    }

}