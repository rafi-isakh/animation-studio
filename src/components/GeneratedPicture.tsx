import Image from "next/image";
import { useState } from "react";
import { ImageOrVideo } from "./Types";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";

export default function GeneratedPicture({ 
    index, 
    image, 
    webnovel_id, 
    chapter_id, 
    quote 
  }:
    { index: number, 
      image: string, 
      webnovel_id: string, 
      chapter_id: string, 
      quote?: string 
    }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);


    return (
        <>
            <div
                className="relative w-80 h-80 select-none"
            >
                <Image
                    src={`data:image/png;base64,${image}`}
                    alt={`Generated image ${index + 1}`}
                    width={320}
                    height={320}
                    onClick={() => setShowShareAsPostModal(true)}
                    className="object-cover w-full h-full rounded-xl border-none"
                />
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
