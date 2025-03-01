import Image from "next/image";
import { useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { Button } from "@/components/shadcnUI/Button";
import { Share, Image as ImageIcon, Clapperboard, Sparkles } from "lucide-react";

export default function GeneratedPicture({
    index,
    image,
    webnovel_id,
    chapter_id,
    quote,
    makeSlideshow,
    makeVideo
}:
    {
        index: number,
        image: string,
        webnovel_id: string,
        chapter_id: string,
        quote?: string,
        makeSlideshow: () => void,
        makeVideo: () => void
    }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);


    return (
        <>
            <div
                className="group relative w-80 h-80 select-none "
            >
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    width={320}
                    height={320}

                    className=" object-cover w-full h-full rounded-xl border-none  group-hover:opacity-50 transition-opacity duration-300"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex flex-row gap-2 justify-center items-center h-full w-full">
                    <Button
                        onClick={() => setShowShareAsPostModal(true)}
                        variant="outline"
                        className="group/share rounded-lg bg-[#DE2B74] hover:bg-pink-400 text-white">
                        <Share size={16} />
                        <span className="text-sm hidden group-hover/share:block">Share</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={makeSlideshow} 
                        className='group/slideshow rounded-lg bg-pink-600 text-white hover:bg-pink-400 border-0'>
                        <ImageIcon size={16} />
                        <span className="text-sm hidden group-hover/slideshow:block">Make Slideshow</span>
                    </Button>
                    <Button 
                    variant="outline" 
                    onClick={makeVideo} 
                    className='group/video rounded-lg bg-pink-600 text-white hover:bg-pink-400 border-0'>
                        <Clapperboard size={16} />
                        <span className="text-sm hidden group-hover/video:block">Make Video</span>
                    </Button>
                    </div>
                </div>
            </div>
            <ShareAsToonyzPostModal
                imageOrVideo={'image' as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={index}
                image={image}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={quote!}
            />
        </>
    )
}
