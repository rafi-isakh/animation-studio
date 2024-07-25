import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

const News = () => {
    const {language, dictionary} = useLanguage();
    return (
        <div className="max-w-screen-xl mx-auto">
            {phrase(dictionary, "preparing", language)}
        </div>
    )
}

export default News;