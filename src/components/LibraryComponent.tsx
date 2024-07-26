import { Webnovel } from "@/components/Types";
import WebnovelComponent from "@/components/WebnovelComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

const LibraryComponent = ({ library }: { library: Webnovel[] }) => {

    const {dictionary, language} = useLanguage();

    return (
        <div className="flex flex-col space-y-8">
            { library?
            <div className="text-2xl font-bold">{phrase(dictionary, "myLibrary", language)}</div>
            : <div>{phrase(dictionary, "noWebnovelsFound", language)}</div>}
            <div className="flex flex-wrap space-x-4">
            {library.map((item, index) => (
                <WebnovelComponent key={index} webnovel={item} index={index} ranking={false} width={200} height={120} />
            ))}
            </div>
        </div>
    )
}

export default LibraryComponent;