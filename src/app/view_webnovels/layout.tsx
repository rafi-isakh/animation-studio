'use client'
import { Button } from "@/components/shadcnUI/Button";
import { Sparkles } from "lucide-react";
import CreateMediaArea from "@/components/CreateMediaArea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import BlobButton from "@/components/UI/BlobButton";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateMediaProvider, useCreateMedia } from "@/contexts/CreateMediaContext";
import { useUser } from "@/contexts/UserContext";
const ViewWebnovelsLayout = ({ children }: { children: React.ReactNode }) => {
    // Define state variables directly instead of from useCreateMedia
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const { stars } = useUser();

    useEffect(() => {
        if (id) {
            setWebnovelId(id);
        }
    }, [id]);

    const {
        isLoading,
        setIsLoading,
        progress,
        savedPrompt,
        prompts,
        pictures,
        openDialog,
        setOpenDialog,
        setSelection,
        promotionBannerRef,
        draggableNodeRef,
        chapter_id,
        webnovel_id,
        setWebnovelId,
    } = useCreateMedia();

    const handleToggleMenu = () => {
        setOpenDialog((prevState: boolean) => !prevState);
    }

    return (
            <div className="relative">
                {children}
                <div className="fixed bottom-0 left-0 right-0 flex items-end justify-center pointer-events-none pb-4 z-[500]">
                    <Button variant="link" onClick={handleToggleMenu} className="z-[500] !no-underline border-none hover:bg-transparent dark:hover:bg-transparent focus:bg-transparent bg-transparent dark:bg-transparent pointer-events-auto">
                        <div className="relative inline-flex group p-1 w-32 h-12 border-none" >
                            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200"></div>
                            <BlobButton text={<span className="flex items-center gap-2"><Sparkles size={20} /> Post</span>} />
                        </div>
                    </Button>
                </div>
                <CreateMediaArea
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    progress={progress}
                    savedPrompt={savedPrompt}
                    prompts={prompts}
                    pictures={pictures}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    setSelection={setSelection}
                    promotionBannerRef={promotionBannerRef}
                    draggableNodeRef={draggableNodeRef}
                    webnovel_id={webnovel_id!}
                    chapter_id={chapter_id}
                    source={"webnovel"}
                    initialNarrations={[]}
                    stars={stars}
                />
            </div>
    )
}

export default ViewWebnovelsLayout;