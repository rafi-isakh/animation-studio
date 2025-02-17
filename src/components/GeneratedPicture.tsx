import { Box, Button, Modal, TextField } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { useModalStyle } from "@/styles/ModalStyles"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases"
import { uploadFile } from "@/utils/s3";

export default function GeneratedPicture({ index, image }: { index: number, image: string }) {
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const { language, dictionary } = useLanguage();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const handleShareAsPost = async () => {
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
                body: JSON.stringify({ title, content, fileName, type: "image", tags: tags.toString(), link: `/posts/${fileName}` }),
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
        alert("Post created successfully");
        setShowShareAsPostModal(false);
    };

    const handleSetTags = (value: string) => {
        setTags(value.split(',').map(tag => tag.trim()));
    }

    return (
        <>
            <div
                className="w-80 h-80 relative"
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
            <Modal open={showShareAsPostModal} onClose={() => setShowShareAsPostModal(false)}>
                <Box sx={useModalStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        <h2>{phrase(dictionary, "ShareAsPostImage", language)}</h2>
                        <TextField
                            label={phrase(dictionary, "title", language)}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
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
        </>
    )
}
