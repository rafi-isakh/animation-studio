import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Button } from "@mui/material";
import { MdStars } from "react-icons/md";

export default function PurchaseStarsComponent() {
    const starsOptions = [10, 30, 50, 100, 300]
    const { dictionary, language } = useLanguage();

    return (
        <div className="flex flex-col w-[360px] space-y-4 items-center justify-center m-auto tall:h-[calc(100vh-16rem)]">
            <h1 className="text-2xl font-extrabold">{phrase(dictionary, "stars", language)}</h1>
            {starsOptions.map((stars, index) => (
                <Button key={index} href={`/toss/${stars}`} variant="outlined" color="gray" className="text-xl flex items-center justify-between w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                            <MdStars className="text-xl text-pink-500" />
                            <h1 className="text-xl">{stars.toLocaleString()}</h1>
                        </div>
                        <h1 className="text-xl">{(stars * 100).toLocaleString()}원</h1>
                    </div>
                </Button>
            ))}
        </div>
    );
}
