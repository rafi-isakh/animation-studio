'use client'
import { Button } from "@/components/shadcnUI/Button";
import { Sparkles } from "lucide-react";
import CreateMediaArea from "@/components/CreateMediaArea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
// impo
import BlobButton from "@/components/UI/BlobButton";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateMediaProvider } from "@/contexts/CreateMediaContext";

const ViewWebnovelsLayout = ({ children }: { children: React.ReactNode }) => {
    // Define state variables directly instead of from useCreateMedia
    const [allowClose, setAllowClose] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [savedPrompt, setSavedPrompt] = useState("");
    const [prompts, setPrompts] = useState<string[]>([]);
    const [pictures, setPictures] = useState<string[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selection, setSelection] = useState<string>("");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    const promotionBannerRef = useRef(<PromotionBannerComponent />)
    const draggableNodeRef = useRef<HTMLDivElement>(null)
    const searchParams = useSearchParams()
    const webnovel_id = searchParams.get("id")

    const handleToggleMenu = () => {
        setOpenDialog((prevState: boolean) => !prevState);
    }

    return (
        <CreateMediaProvider>
            <div className="relative">
                {children}
                <div className="fixed bottom-0 right-0 -translate-x-1/2  z-[999]">
                    <Button variant="link" onClick={handleToggleMenu} className="!no-underline border-none hover:bg-transparent dark:hover:bg-transparent focus:bg-transparent bg-transparent dark:bg-transparent">
                        <div className="relative inline-flex group p-1 w-32 h-12 border-none" >
                            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200"></div>
                            <Sparkles size={20} />
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
                    chapter_id={"1"}
                    source={"webnovel"}
                    initialNarrations={[]}
                />
            </div>
        </CreateMediaProvider>
    )
}

export default ViewWebnovelsLayout;