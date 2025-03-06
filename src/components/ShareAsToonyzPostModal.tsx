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
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { ImageOrVideo } from "@/components/Types";
import { Label } from "@radix-ui/react-label";
import { X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/shadcnUI/ScrollArea"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image";
import { getImageUrl, getVideoUrl } from "@/utils/urls";

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

    const handleShareAsPost = async () => {
        try {
            setIsLoading(true);
            if (imageOrVideo === 'image') {
                if (!image) {
                    console.error('Image is undefined');
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Image is undefined"
                    });

                    setIsLoading(false);
                    return;
                }
                const fileBufferBase64 = Buffer.from(image, 'base64').toString('base64');
                const fileName = `${index}-${Date.now()}.png`;
                const fileType = 'image/png';
                const [uploadResponse, createResponse] = await Promise.all([
                    fetch('/api/upload_picture_to_s3', {
                        method: 'POST',
                        body: JSON.stringify({ fileBufferBase64, fileName, fileType }),
                    }),
                    fetch('/api/create_toonyz_post', {
                        method: 'POST',
                        body: JSON.stringify({ title, content, quote, fileName, type: "image", tags: tags.toString(), link: `/posts/${fileName}`, webnovel_id, chapter_id }),
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
                const response = await fetch('/api/create_toonyz_post', {
                    method: 'POST',
                    body: JSON.stringify({ title, content, quote, fileName: videoFileName, type: "video", tags: tags.toString(), link: `/posts/${videoFileName}`, webnovel_id, chapter_id }),
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
                description: "An unexpected error occurred"
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
                className={`select-none no-scrollbar backdrop-blur-md z-[9999]
                     ${isDesktop ? ' backdrop-blur-md  bg-gradient-to-r dark:from-blue-500/10 dark:to-blue-900/10  from-purple-100/50 to-blue-100/50' : 'bg-white dark:bg-[#211F21]'}`}
                onClick={(e) => e.stopPropagation()}
                showCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle>Share as Toonyz Post</DialogTitle>
                    <DialogDescription>
                        {image && (<>
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt={`image ${index + 1}`}
                                width={200}
                                height={200}
                                className="object-cover rounded-xl border-none group-hover:opacity-50 transition-opacity duration-300"
                            />
                            <div
                                className="w-full !select-none text-black dark:text-white  bg-gray-100 dark:bg-[#211F21] p-4 rounded-md"
                            >
                                {displayQuote}
                            </div>
                        </>)
                        }
                        {videoFileName && (
                            <>
                            <video
                                src={getVideoUrl(videoFileName)}
                                // alt={`Generated video ${index + 1}`}
                                width={200}
                                height={200}
                                />
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex flex-col">
                    <div className="items-center">
                        <Label htmlFor="name" className="text-right text-sm">
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
                        <Label htmlFor="tags" className="text-right text-sm">
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
                                placeholder={tags.length > 0 ? "" : phrase(dictionary, "tags", language)}
                                value={tagInput}
                                onChange={handleTagInput}
                                onKeyDown={handleTagKeyDown}
                                className="flex-grow shadow-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 min-w-20"
                            />
                        </div>
                    </div>
                    <div className="items-center">
                        <Label htmlFor="content" className="text-right text-sm">
                            {phrase(dictionary, "content", language)}
                        </Label>
                        <Textarea
                            placeholder={phrase(dictionary, "content", language)}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className=""
                            rows={4}
                        />
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button
                        disabled={isLoading}
                        variant="outline"
                        className="bg-[#DE2B74] hover:bg-pink-400 text-white"
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
                    <Button variant="outline" color="gray" onClick={() => setShowShareAsPostModal(false)}>{phrase(dictionary, "cancel", language)}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}