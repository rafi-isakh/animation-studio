import { UserRoundX } from "lucide-react";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipTrigger, TooltipProvider, TooltipContent } from "@/components/shadcnUI/Tooltip";

const DeleteAccountButton = ({ setShowDeleteAccountModal }: { setShowDeleteAccountModal: (show: boolean) => void }) => {
    const { dictionary, language } = useLanguage();
    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="!no-underline rounded-full"
                        onClick={() => setShowDeleteAccountModal(true)}>
                        <UserRoundX className='cursor-pointer' size={20} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                     {phrase(dictionary, "deleteAccount", language)}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default DeleteAccountButton;