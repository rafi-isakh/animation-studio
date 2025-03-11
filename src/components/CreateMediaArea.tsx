import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Skeleton } from "./shadcnUI/Skeleton";
import { RefreshCw, Video, X } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "./shadcnUI/Button";
import GeneratedPicture from "./GeneratedPicture";
import Link from "next/link"
import CardStyleButton from "./UI/CardStyleButton";
import { getImageUrl } from "@/utils/urls";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { ImageOrVideo } from "./Types";

export default function CreateMediaArea({
    isLoading,
    setIsLoading,
    progress,
    savedPrompt,
    prompts,
    pictures,
    webnovel_id,
    chapter_id,
    draggableNodeRef,
    openDialog,
    setOpenDialog,
    setSelection,
    promotionBannerRef,
    source,
    initialNarrations
}:
    {
        isLoading: boolean,
        setIsLoading: (isLoading: boolean) => void,
        progress: number,
        savedPrompt: string,
        prompts: string[],
        pictures: string[],
        webnovel_id: string,
        chapter_id: string,
        draggableNodeRef: React.RefObject<HTMLDivElement>,
        openDialog: boolean,
        setOpenDialog: (openDialog: boolean) => void,
        setSelection: (selection: string) => void,
        promotionBannerRef: React.MutableRefObject<React.JSX.Element>,
        source: 'webnovel' | 'chapter',
        initialNarrations: string[]
    }) { // Whether it's from the webnovel view page with all chapters or the chapter view page with short quote
    const { toast } = useToast();
    const [videoFileName, setVideoFileName] = useState<string | null>(null);
    const [showShareAsPostModal, setShowShareAsPostModal] = useState<boolean>(false);
    const [narrations, setNarrations] = useState<string[]>([]);
    const [loadingVideoGeneration, setLoadingVideoGeneration] = useState<boolean>(false);

    useEffect(() => {
        if (narrations.length == 0) {
            setNarrations(pictures.map(() => ""));
        }
    }, [pictures]);

    // there's makeSlideshow and makeVideo.
    // the logic is largely the same, except in makeSlideshow, we upload the pictures to s3, make a slideshow, then upload.
    // in makeVideo, we don't need to upload to s3 because we get a url back from vidu. so we generate videos, combine, then upload.
    // combining and uploading are done in the backend.
    const makeSlideshow = async () => {
        try {
            const pictureFilenames = [];
            for (const picture of pictures) {
                const pictureFilename = uuidv4() + ".png";
                const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                    method: 'POST',
                    // make just one picture to a video as test.
                    body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}`, fileType: "image/png", bucketName: "toonyzbucket" }),
                });
                if (!uploadResponse.ok) {
                    toast({
                        title: "Error",
                        description: "Failed to upload picture to s3, please try again later",
                        variant: "destructive"
                    })
                    throw new Error('Failed to upload picture to s3');
                }
                pictureFilenames.push(pictureFilename);
            }
            console.log("pictureFilenames", pictureFilenames.map(getImageUrl));
            const response = await fetch('/api/ffmpeg_combine_pictures_to_slideshow', {
                method: 'POST',
                body: JSON.stringify({ picture_urls: pictureFilenames.map(getImageUrl) }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to make slideshow",
                    variant: "destructive"
                })
                throw new Error('Failed to make slideshow, please try again later');
            }
            const data = await response.json();
            console.log(data);
            setVideoFileName(data.video_filename);
            toast({
                title: "Success",
                variant: "success",
                description: "Slideshow created successfully",
            })
            setShowShareAsPostModal(true);
        } catch (error) {
            console.error('Slideshow creation error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An unexpected error occurred creating slideshow",
                variant: "destructive"
            });
        }
    }

    const makeVideo = async () => {
        setLoadingVideoGeneration(true);
        const videoUrls: string[] = [];
        const processPromises = pictures.map(async (picture, i) => {
            const pictureFilename = uuidv4();
            const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
                method: 'POST',
                body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}.png`, fileType: "image/png", bucketName: "toonyzbucket" }),
            });
            if (!uploadResponse.ok) {
                toast({
                    title: "Error",
                    description: "Failed to upload picture to s3, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to upload picture to s3');
            }
            const image_url = getImageUrl(`${pictureFilename}.png`);
            const response = await fetch('/api/generate_video', {
                method: 'POST',
                body: JSON.stringify({ video_prompt: prompts[i], image_url: image_url }),
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to generate video, please try again later",
                    variant: "destructive"
                })
                throw new Error('Failed to generate video');
            }
            const data = await response.json();
            const url = data.video_url;
            console.log(`video ${i} url: `, url);
            return url;
        });

        const urls = await Promise.all(processPromises);
        videoUrls.push(...urls);

        const stitchedResponse = await fetch('/api/ffmpeg_combine_videos', {
            method: 'POST',
            body: JSON.stringify({ video_urls: videoUrls, narrations: narrations }),
        });
        if (!stitchedResponse.ok) {
            toast({
                title: "Error",
                description: "Failed to stitch videos",
                variant: "destructive"
            })
        }
        const stitchedData = await stitchedResponse.json();
        const videoFilename = stitchedData.video_filename;
        setVideoFileName(videoFilename);
        toast({
            title: "Success",
            variant: "success",
            description: "Video created successfully",
        })
        setShowShareAsPostModal(true);
        setLoadingVideoGeneration(false);
    }

    // const makeVideo = async (narrations: string[]) => {
    //     console.log("making video!");
    //     const videoUrls: string[] = [];
    //     const processPromises = pictures.map(async (picture, i) => {
    //         const pictureFilename = uuidv4();
    //         const uploadResponse = await fetch(`/api/upload_picture_to_s3`, {
    //             method: 'POST',
    //             body: JSON.stringify({ fileBufferBase64: picture, fileName: `${pictureFilename}.png`, fileType: "image/png", bucketName: "toonyzbucket" }),
    //         });
    //         if (!uploadResponse.ok) {
    //             toast({
    //                 title: "Error",
    //                 description: "Failed to upload picture to s3, please try again later",
    //                 variant: "destructive"
    //             })
    //             throw new Error('Failed to upload picture to s3');
    //         }
    //         const image_url = getImageUrl(`${pictureFilename}.png`);
    //         const response = await fetch('/api/generate_video', {
    //             method: 'POST',
    //             body: JSON.stringify({ video_prompt: prompts[i], image_url: image_url }),
    //         });
    //         if (!response.ok) {
    //             toast({
    //                 title: "Error",
    //                 description: "Failed to generate video, please try again later",
    //                 variant: "destructive"
    //             })
    //             throw new Error('Failed to generate video');
    //         }
    //         const data = await response.json();
    //         const url = data.video_url;
    //         console.log(`video ${i} url: `, url);
    //         return url;
    //     });

    //     const urls = await Promise.all(processPromises);
    //     videoUrls.push(...urls);

    //     const stitchedResponse = await fetch('/api/ffmpeg_combine_videos', {
    //         method: 'POST',
    //         body: JSON.stringify({ video_urls: videoUrls, narrations: narrations }),
    //     });
    //     if (!stitchedResponse.ok) {
    //         toast({
    //             title: "Error",
    //             description: "Failed to stitch videos",
    //             variant: "destructive"
    //         })
    //     }
    //     const stitchedData = await stitchedResponse.json();
    //     const videoFilename = stitchedData.video_filename;
    //     console.log(stitchedData);
    //     setVideoFileName(videoFilename);
    //     toast({
    //         title: "Success",
    //         variant: "success",
    //         description: "Video created successfully",
    //     })
    //     setShowShareAsPostModal(true);
    // }

    return (
        <div>
            <div
                ref={draggableNodeRef}
                className={`sm:max-w-[425px] max-h-screen h-screen select-none fixed top-0 right-1 p-0  
                            bg-gradient-to-r dark:from-gray-900/10 dark:to-blue-900/10 from-white/50 to-blue-100/50 backdrop-blur-md
                            rounded-lg no-scrollbar flex flex-col gap-0 transition-opacity duration-300
                            ${openDialog ? 'opacity-100 z-[999]' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className='drag-handle px-2 flex-shrink-0'>
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            {/* <Sparkles className="h-5 w-5 text-black dark:text-white" /> */}
                            <div>
                                <h1 className="text-xl font-medium uppercase">Toonyz Post</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                    <MoreVertical className="h-5 w-5" />
                                </Button> */}
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation()
                                    setOpenDialog(false);
                                    setIsLoading(false);
                                    setSelection('');
                                }}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
                <ScrollArea className='drag-handle flex-1 overflow-auto no-scrollbar'>
                    <div className='relative w-full'>
                        {isLoading && (
                            <div className="flex flex-col w-full gap-4">
                                <div className="flex flex-col mb-2">
                                    <div className="loader-container inline-flex flex-row">
                                        {/* <LottieLoader width="w-20" centered={false} animationData={animationData} /> */}
                                        <div className="my-6 space-y-4">
                                            <p className="text-sm text-muted-foreground self-end">
                                                Generating images... {Math.round(progress)}%
                                            </p>
                                            <div className="space-y-4">
                                                <div className="flex justify-end">
                                                    {savedPrompt &&
                                                        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm">
                                                            {savedPrompt}
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {[1, 2, 3, 4].map((item) => (
                                            <div
                                                key={item}
                                                className={`animate-ping relative aspect-square rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden opacity-0 animate-fadeIn`}
                                                style={{ animationDelay: `${(item - 1) * 300}ms`, animationFillMode: 'forwards' }}
                                            >
                                                <Skeleton className="animate-ping  absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent animate-shimmer" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {pictures.length > 0 && (
                            <div className="flex flex-col select-none">
                                {(savedPrompt || source === 'webnovel') && (
                                    <div className="my-6 space-y-4">
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-400">Generated a scene with</p>
                                        </div>

                                        <div className="space-y-3">
                                            {/* User message bubble */}
                                            <div className="flex justify-end">
                                                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-pink-600 text-white text-sm">
                                                    {savedPrompt}
                                                </div>
                                            </div>

                                            {/* AI response bubble */}
                                            <div className="flex justify-start">
                                                <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white shrink-0 mr-1">
                                                    <span className="text-xs font-medium"> <Sparkles className="w-4 h-4" /></span>
                                                </div>
                                                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-300 dark:bg-[#1a1b1f] border dark:border-[#2a2b2f] text-black dark:text-white text-sm">
                                                    I created visualizations for you by transforming the selected text into a vivid interpretation of the scene.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 overflow-x-auto w-full no-scrollbar scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                                            <Button
                                                variant="outline"
                                                className="rounded-full bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white hover:bg-[#2a2b2f] flex gap-2 shrink-0 shadow-none"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Generate again
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="rounded-full bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white hover:bg-[#2a2b2f] flex gap-2 shrink-0 shadow-none"
                                                disabled={loadingVideoGeneration}
                                                onClick={() => {
                                                    makeVideo();
                                                }}
                                            >
                                                {loadingVideoGeneration ? <CircularProgress /> : <Video className="w-4 h-4" />}
                                                Make a video
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-1">
                                    {pictures.map((picture, index) => {
                                        return (
                                            <div
                                                key={index}
                                                className="opacity-0 animate-fadeIn"
                                                style={{
                                                    animationDelay: `${index * 300}ms`,
                                                    animationFillMode: 'forwards'
                                                }}
                                            >
                                                <GeneratedPicture
                                                    key={index}
                                                    index={index}
                                                    image={picture}
                                                    webnovel_id={webnovel_id}
                                                    chapter_id={chapter_id}
                                                    quote={savedPrompt}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {pictures.length > 0 && (
                            <div className='flex md:flex-row flex-col gap-4 justify-center mt-1'>
                                {/* <Button
                                        variant="outline"
                                        // onClick={makeVideo}
                                        className='inline-flex h-52 w-full bg-pink-600 text-white text-lg font-medium tracking-wide p-2 rounded-3xl border-0'>
                                        Make Video
                                        <ArrowRight className='w-4 h-4' />
                                    </Button> */}
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("making slideshow clicked")
                                        makeSlideshow();
                                    }}
                                    className='w-full'>
                                    <CardStyleButton
                                        title="Slideshow"
                                        subtitle="Watch Ads to make a slideshow"
                                        ideaCount={pictures.length}
                                        images={pictures}
                                        gradientFrom="#DE2B74"
                                        gradientTo="#FF6F91"
                                        className='w-full'
                                    />
                                </Link>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                {/* Footer input */}
                <div className="flex flex-col space-y-3 backdrop-blur-md bg-gradient-to-r from-blue-50/90 to-gray-50/90 dark:from-black/10 dark:to-gray-900/20 rounded-b-lg flex-shrink-0">
                    {/* Ad banner */}
                    <div className='w-full flex-shrink-0'>
                        <div className='relative top-0 left-0 w-full'>
                            {promotionBannerRef.current}
                        </div>
                    </div>
                </div>
            </div>
            <ShareAsToonyzPostModal
                imageOrVideo={'video' as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={0}
                videoFileName={videoFileName!}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={savedPrompt}
            />
        </div>

    )
}