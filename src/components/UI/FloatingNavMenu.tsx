'use client '

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip"
import Link from "next/link"
import { BlobButton } from "@/components/UI/BlobButton"
import { Sparkles, Share2, X } from "lucide-react"

interface FloatingMenuNavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    color: string;
    type: 'normal' | 'blob';
}



const FloatingMenuNavItems: FloatingMenuNavItem[] = [
    { icon: <BlobButton text={<Sparkles size={30} strokeWidth={1} />} />, label: 'AI', href: '#', color: '', type: 'blob' },
    { icon: <Share2 size={30} strokeWidth={1} />, label: 'Share', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10', type: 'normal' },
    { icon: <X size={30} strokeWidth={1} />, label: 'Close', href: '#', color: 'bg-gray-200/20 dark:bg-black text-red-500 dark:text-red-500 hover:bg-red-500/10', type: 'normal' },
];

const FloatingMenuNav = ({
    handleOpenModal,
    handleClose,
    setShowShareDialog,
    generatePictures,
}: {
    handleOpenModal: () => void,
    handleClose?: () => void,
    setShowShareDialog: (showShareDialog: boolean) => void,
    generatePictures: () => Promise<void>,
}) => {

    return (
        <TooltipProvider delayDuration={0}>

            <div className="relative rounded-full dark:bg-black/50 backdrop-blur-sm">
                <div className="flex justify-evenly">
                    {FloatingMenuNavItems.map((item, index) => (
                        <div key={item.label} className="flex-1 w-full group">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="#"
                                        className="!no-underline flex items-center justify-center text-center mx-auto p-1">
                                        {item.type === 'blob' ? (
                                            <div className="relative inline-flex group p-1 w-16 h-16"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleOpenModal();
                                                }}
                                            >
                                                <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                                </div>
                                                {item.icon}
                                            </div>
                                        ) : (
                                            <span
                                                className={`${item.color} backdrop-blur-md flex flex-row rounded-full
                                                            group-hover:text-[#DE2B74] text-black dark:text-white 
                                                            ${item.type === 'normal' ? 'p-4' : ''}
                                                           `}
                                                onClick={(e) => {
                                                    if (item.label === 'Close') {
                                                        e.preventDefault();
                                                        handleClose?.();
                                                    }
                                                    if (item.label === 'Share') {
                                                        e.preventDefault();
                                                        console.log("share")
                                                        setShowShareDialog(true)
                                                    }
                                                }}
                                            >
                                                {item.icon}
                                            </span>
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider >
    );
};