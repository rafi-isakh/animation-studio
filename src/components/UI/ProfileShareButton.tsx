import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share2 } from "lucide-react";
import SharingModal from '@/components/UI/SharingModal';

export default function ProfileShareButton({ user, id }: { user: UserStripped, id: string }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const { language, dictionary } = useLanguage();

    return (
        <>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="!no-underline rounded-full" onClick={() => setShowShareModal(true)}>
                            <Share2 className='cursor-pointer' size={20} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {phrase(dictionary, "share", language)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <SharingModal
                isProfileOwner={id === user.id.toString()}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                user={user}
                onConfirm={() => { setShowShareModal(false) }}
                onCancel={() => { setShowShareModal(false) }}
            />
        </>
    )
}