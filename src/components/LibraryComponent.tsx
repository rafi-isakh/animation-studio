import { Webnovel } from "@/components/Types";
import WebnovelComponent from "@/components/WebnovelComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Image from "next/image";

const LibraryComponent = ({ library }: { library: Webnovel[] }) => {

    const {dictionary, language} = useLanguage();

    return (
        <div className="flex flex-col space-y-8">
            { library.length > 0?
            <div className="text-2xl font-bold">{phrase(dictionary, "myLibrary", language)}</div>
            : <div className="flex flex-col justify-center items-center space-y-2">
              <Image src="/stelli_3.png" alt="noWebnovelsFound" width={150} height={100} />
              <p className="text-sm font-bold"> {phrase(dictionary, "noWebnovelsFound", language)} </p>
              <p className="text-sm"> {phrase(dictionary, "noWebnovelsFound_subtitle", language)} </p>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-md"> 
                {/* Start to write your story  */}
                {phrase(dictionary, "writeYourStory", language)} 
             </button>
            </div>
            }
            <div className="flex flex-wrap space-x-4">
            {library.map((item, index) => (
                <WebnovelComponent key={index} webnovel={item} index={index} ranking={false} />
            ))}
            </div>
        </div>
    )
}

export default LibraryComponent;