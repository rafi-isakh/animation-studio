import { phrase } from "@/utils/phrases";
import { Button } from "@/components/shadcnUI/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { useState } from "react";
import { UserStripped } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink } from "lucide-react";
import SharingModal from '@/components/UI/SharingModal';

export default function ProfileShareButton({ user, id }: { user: UserStripped, id: string }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const { language, dictionary } = useLanguage();

    return (
        <>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button color='gray' variant='outline' onClick={() => setShowShareModal(true)} className='border-2 bg-white border-gray-300 rounded-sm px-4 py-2 w-16 flex flex-row justify-center items-center gap-1'>
                            <ExternalLink size={10} />
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