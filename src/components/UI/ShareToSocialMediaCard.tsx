"use client"

import type { ToonyzPost } from "@/components/Types"
import { Button } from "@/components/shadcnUI/Button"
import { WhatsappShareButton, TwitterShareButton, WhatsappIcon, TelegramShareButton, TelegramIcon, PinterestShareButton, LinkedinShareButton, LinkedinIcon } from "react-share"
import { Link } from "lucide-react"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { useCopyToClipboard } from "@/utils/copyToClipboard"
import { useTheme } from '@/contexts/providers'

export function ShareToSocialMediaCard({ post }: { post?: ToonyzPost }) {
    const copyToClipboard = useCopyToClipboard()
    const { theme } = useTheme()
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/toonyz_posts/${post?.id}`

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="flex flex-row justify-between w-full mb-6 gap-2">
                {/* Copy Link Button */}
                <div className="flex flex-col items-center">
                    <Button
                        onClick={() => copyToClipboard(shareUrl)}
                        variant="outline"
                        size="icon"
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                        <Link className="w-6 h-6" />
                    </Button>
                    <span className="mt-2 text-sm">Copy link</span>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col items-center">
                    <WhatsappShareButton
                        url={shareUrl}
                        className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center"
                    >
                        <WhatsappIcon size={22} round={true} />
                    </WhatsappShareButton>
                    <span className="mt-2 text-sm">WhatsApp</span>
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col items-center">
                    <LinkedinShareButton
                        url={shareUrl}
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center"
                    >
                        <LinkedinIcon size={22} round={true} />
                    </LinkedinShareButton>
                    <span className="mt-2 text-sm">LinkedIn</span>
                </div>

                {/* Telegram */}
                <div className="flex flex-col items-center">
                    <TelegramShareButton
                        url={shareUrl}
                        className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center"
                    >
                        <TelegramIcon size={22} round={true} />
                    </TelegramShareButton>
                    <span className="mt-2 text-sm">Telegram</span>
                </div>

                {/* X (Twitter) */}
                <div className="flex flex-col items-center">
                    <TwitterShareButton
                        url={shareUrl}
                        className="w-6 h-6 rounded-full bg-black flex items-center justify-center"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={theme === "dark" ? "white" : "black"}>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </TwitterShareButton>
                    <span className="mt-2 text-sm">X</span>
                </div>
            </div>

           
        </div>
    )
}

export default ShareToSocialMediaCard