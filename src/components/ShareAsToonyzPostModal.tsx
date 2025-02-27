"use client"
import { Button } from "@mui/material";
import { Box, TextField } from "@mui/material";
import { useModalStyle } from "@/styles/ModalStyles";
import { useState } from "react";
import { Modal } from "@mui/material"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { ImageOrVideo } from "@/components/Types";

export default function ShareAsToonyzPostModal({
    imageOrVideo,
    showShareAsPostModal,
    setShowShareAsPostModal,
    index,
    image,
    videoFileName,
    webnovel_id,
    chapter_id,
    quote
}: {
    imageOrVideo: ImageOrVideo,
    showShareAsPostModal: boolean,
    setShowShareAsPostModal: (show: boolean) => void,
    index: number,
    image?: string, // image is base64 string
    videoFileName?: string, // fileName is name of file uploaded to S3. I know, inconsistent
    webnovel_id: string,
    chapter_id: string,
    quote: string
}) {
    const { dictionary, language } = useLanguage();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const handleShareAsPost = async () => {
        if (imageOrVideo === 'image') {
            if (!image) {
                console.error('Image is undefined');
                throw new Error('Image is undefined');
            }
            const fileBufferBase64 = Buffer.from(image, 'base64').toString('base64');
            const fileName = `${index}-${Date.now()}.png`;
            const fileType = 'image/png';
            const [uploadResponse, createResponse] = await Promise.all([
                fetch('/api/upload_picture_to_s3', {
                    method: 'POST',
                    body: JSON.stringify({ fileBufferBase64, fileName, fileType, bucketName: "toonyzbucket" }),
                }),
                fetch('/api/create_toonyz_post', {
                    method: 'POST',
                    body: JSON.stringify({ title, content, quote, fileName, type: "image", tags: tags.toString(), link: `/posts/${fileName}`, webnovel_id, chapter_id }),
                }),
            ]);
            if (!uploadResponse.ok) {
                console.error('Error uploading picture to S3');
                throw new Error('Error uploading picture to S3');
            }
            if (!createResponse.ok) {
                console.error('Error creating Toonyz post');
                throw new Error('Error creating Toonyz post');
            }
        }
        else if (imageOrVideo === 'video') {
            if (!videoFileName) {
                console.error('Video file name is undefined');
                throw new Error('Video file name is undefined');
            }
            fetch('/api/create_toonyz_post', {
                method: 'POST',
                body: JSON.stringify({ title, content, quote, fileName: videoFileName, type: "video", tags: tags.toString(), link: `/posts/${videoFileName}`, webnovel_id, chapter_id }),
            })
        }
        alert("Post created successfully");
        setShowShareAsPostModal(false);
};

    const handleSetTags = (value: string) => {
        setTags(value.split(',').map(tag => tag.trim()));
    }

    return (
        <Modal open={showShareAsPostModal} onClose={() => setShowShareAsPostModal(false)}>
            <Box sx={useModalStyle}>
                <div className="flex flex-col space-y-4 items-center justify-center select-none">
                    <h2>{phrase(dictionary, "ShareAsPostImage", language)}</h2>
                    <TextField
                        label={phrase(dictionary, "title", language)}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <h2>{phrase(dictionary, "quote", language)}</h2>
                    <Button
                        value={quote}
                        disabled
                        variant="text"
                        className="w-full select-none"
                        sx={{
                            '&.Mui-disabled': {
                                color: 'black',
                                opacity: 1,
                            },
                        }}
                    >
                        {quote}
                    </Button>
                    <TextField
                        label={phrase(dictionary, "content", language)}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        multiline
                        rows={4}
                    />
                    <TextField
                        label={phrase(dictionary, "tags", language)}
                        value={tags}
                        onChange={(e) => handleSetTags(e.target.value)}
                    />
                    <Button variant="outlined" color="gray" onClick={() => handleShareAsPost()}>{phrase(dictionary, "yes", language)}</Button>
                    <Button variant="outlined" color="gray" onClick={() => setShowShareAsPostModal(false)}>{phrase(dictionary, "no", language)}</Button>
                </div>
            </Box>
        </Modal>
    )
}