import { Webnovel } from "@/components/Types";
import WebnovelComponent from "@/components/WebnovelComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import { Button } from "@mui/material";
import Link from "next/link";
const LibraryComponent = ({ library }: { library: Webnovel[] }) => {

    const { dictionary, language } = useLanguage();

    return (
        <div className="md:max-w-screen-lg w-full flex flex-row justify-center mx-auto h-screen md:mt-[-96px] mt-[-80px]">
        <div className="flex flex-col justify-center items-center">
            {library.length > 0 ?
                <div className="text-2xl font-bold">{phrase(dictionary, "myLibrary", language)}</div>
                : <div className="flex flex-col justify-center items-center space-y-2">
                    <Image src="/stelli/stelli_3.png" alt="noWebnovelsFound" width={150} height={100} />
                    <p className="pt-3 text-md font-bold"> {phrase(dictionary, "noViewingWebnovelsFound", language)} </p> 
                    
                    <p className="text-md"> {phrase(dictionary, "noViewingWebnovelsFound_subtitle", language)} </p>
                    <Button className="bg-[#8A2BE2] text-md text-white px-4 py-2 rounded-md mb-10 ">
                        {/* 보고 있는 웹소설이 없습니다.  */}
                        {/*  (8A2BE2) */}
                        <Link href="/">
                            {phrase(dictionary, "discoverStories", language)}
                        </Link>
                    </Button>
                </div>
            }
            <div className="flex flex-wrap space-x-4">
                {library.map((item, index) => (
                    <WebnovelComponent key={index} webnovel={item} index={index} ranking={false} chunkIndex={0} />
                ))}
            </div>
        </div>
     </div>
    )
}

export default LibraryComponent;