import { Button } from "@/components/shadcnUI/Button";
import { PenLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

const UploadNewChapterButton = ({ onNewChapter }: { onNewChapter?: () => void }) => {
    const { dictionary, language } = useLanguage();
    return (
        <Button
            color='gray'
            variant='outline'
            onClick={onNewChapter}
            className='w-full flex-1 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
        >
            <span className='inline-flex gap-2 items-center text-black dark:text-white  hover:text-[#DB2777]'>
                <PenLine className='hover:text-[#DB2777]' size={18} />{phrase(dictionary, "uploadNewChapter", language)}
            </span>
        </Button>
    )
}

export default UploadNewChapterButton;