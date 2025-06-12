"use client"
import { Button } from "@/components/shadcnUI/Button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/shadcnUI/Dialog"
import { Textarea } from "@/components/shadcnUI/Textarea"
import { Input } from "@/components/shadcnUI/Input"
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { ImageOrVideo } from "@/components/Types";
import { Label } from "@radix-ui/react-label";
import { X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/shadcnUI/ScrollArea"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import DictionaryPhrase from "./DictionaryPhrase"
import { useCreateMedia } from "@/contexts/CreateMediaContext"
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ShareAsToonyzPostModal({
    imageOrVideo,
    showShareAsPostModal,
    setShowShareAsPostModal,
    index,
    image, // image is base64 string
    videoFileName,
    webnovel_id,
    chapter_id,
    quote,
    isDesktop
}: {
    imageOrVideo: ImageOrVideo,
    showShareAsPostModal: boolean,
    setShowShareAsPostModal: (show: boolean) => void,
    index: number,
    image?: string, // image is base64 string
    videoFileName?: string, // fileName is name of file uploaded to S3. I know, inconsistent
    webnovel_id: string,
    chapter_id: string,
    quote: string,
    isDesktop?: boolean
}) {
    const { dictionary, language } = useLanguage();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const displayQuote = quote.length > 200 ? quote.slice(0, 200) + "..." : quote;
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { picture } = useCreateMedia();
    const router = useRouter();
    const handleShareAsPost = async () => {
        let postResponseData;
        try {
            setIsLoading(true);
            if (imageOrVideo === 'image') {
                if (!picture) {
                    console.error('Image is undefined');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Image is undefined"
                    });

                    setIsLoading(false);
                    return;
                }
                const fileBufferBase64 = Buffer.from(picture, 'base64').toString('base64');
                const fileName = `${index}-${Date.now()}.webp`;
                const fileType = 'image/webp';
                const bucketName = 'toonyzbucket'
                const [uploadResponse, createResponse] = await Promise.all([
                    fetch('/api/upload_picture_to_s3', {
                        method: 'POST',
                        body: JSON.stringify({ fileBufferBase64, fileName, fileType, bucketName }),
                    }),
                    fetch('/api/create_toonyz_post', {
                        method: 'POST',
                        body: JSON.stringify({ title, content, quote, fileName, type: "image", tags: tags.toString(), link: `/posts/${fileName}`, webnovel_id, chapter_id: chapter_id ?? "1" }),
                    }),
                ]);
                if (!uploadResponse.ok) {
                    console.error('Error uploading picture to S3');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Error uploading picture to S3"
                    });

                    return;
                }
                if (!createResponse.ok) {
                    console.error('Error creating Toonyz post');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Error creating Toonyz post"
                    });

                    return;
                }
                postResponseData = await createResponse.json();
            }
            else if (imageOrVideo === 'video') {
                console.log(videoFileName)
                if (!videoFileName) {
                    console.error('Video file name is undefined');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Video file name is undefined"
                    });
                    setIsLoading(false);
                    return;
                }
                console.log('chapter_id', chapter_id);
                console.log("chapter_id == null", chapter_id == null);
                const response = await fetch('/api/create_toonyz_post', {
                    method: 'POST',
                    body: JSON.stringify({ title, content, quote, fileName: videoFileName, type: "video", tags: tags.toString(), link: `/posts/${videoFileName}`, webnovel_id, chapter_id: chapter_id ?? "1" }),
                });

                if (!response.ok) {
                    console.error('Error creating Toonyz post');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Error creating Toonyz post"
                    });

                    return;
                }
                postResponseData = await response.json();
            }
            toast({
                title: "Success",
                description: "Post created successfully"
            });
            setShowShareAsPostModal(false);
            setIsLoading(false);
        } catch (error) {
            console.error('Unexpected error:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred: " + error
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (value.includes(',')) {
            const newTag = value.replace(',', '').trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        } else {
            setTagInput(value);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
                setTagInput('');
            }
        }
        else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <Dialog open={showShareAsPostModal} onOpenChange={() => setShowShareAsPostModal(false)}>
            <DialogContent
                className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-full select-none text-md'
                onClick={(e) => e.stopPropagation()}
                showCloseButton={true}
            >
                <ScrollArea className="relative flex flex-col justify-evenly md:h-full h-screen">
                    <DialogHeader className="text-md p-4">
                        <DialogTitle className="text-md">
                            <DictionaryPhrase phraseVar="shareAsToonyzPost" />
                        </DialogTitle>
                        <DialogDescription className="text-md">
                            {image && (<>
                                <div className="relative w-full aspect-[9/16] pt-4">
                                    <Image
                                        src={`data:image/png;base64,${image}`}
                                        alt={`Generated image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className={`object-cover rounded-xl group-hover:scale-105 transition-all duration-300`}
                                    />
                                </div>
                            </>
                            )}
                            {videoFileName && (
                                <div className="relative pt-4">
                                    <video
                                        src={getVideoUrl(videoFileName)}
                                        width={150}
                                        height={220}
                                        autoPlay={true}
                                        muted={true}
                                        loop={true}
                                        playsInline
                                        className='self-center object-cover rounded-xl border-none group-hover:opacity-50 transition-opacity duration-300'
                                    />
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col p-4">
                        <div className="items-center">
                            <Label htmlFor="name" className="text-left text-sm">
                                {phrase(dictionary, "title", language)}
                            </Label>
                            <Input
                                placeholder={phrase(dictionary, "title", language)}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="items-center">
                            <Label htmlFor="tags" className="text-left text-sm">
                                {phrase(dictionary, "tags", language)}
                            </Label>
                            <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 col-span-3">
                                {tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center"
                                    >
                                        {tag}
                                        <X
                                            size={14}
                                            className="ml-1 cursor-pointer"
                                            onClick={() => removeTag(tag)}
                                        />
                                    </span>
                                ))}
                                <Input
                                    placeholder={tags.length > 0 ? "" : phrase(dictionary, "tags_placeholder", language)}
                                    value={tagInput}
                                    onChange={handleTagInput}
                                    onKeyDown={handleTagKeyDown}
                                    className="flex-grow shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 min-w-20"
                                />
                            </div>
                        </div>
                        <div className="items-center">
                            <Label htmlFor="content" className="text-left text-sm">
                                {phrase(dictionary, "content", language)}
                            </Label>
                            <Textarea
                                placeholder={phrase(dictionary, "content_placeholder", language)}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className=""
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            disabled={isLoading}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                            onClick={() => handleShareAsPost()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
                                    <span className="text-[16px]">
                                        {phrase(dictionary, "generatingPrompt", language)}
                                    </span>
                                </>) : (

                                phrase(dictionary, "confirm", language))

                            }
                        </Button>
                        <Button
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                            onClick={() => setShowShareAsPostModal(false)}>
                            {phrase(dictionary, "cancel", language)}
                        </Button>
                    </DialogFooter>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}