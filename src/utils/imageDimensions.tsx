import sharp from 'sharp';
import axios from 'axios';

export async function getImageDimensions(url: string) {
    try {
        const response = await axios({
            url,
            responseType: 'arraybuffer'
        });

        const imageBuffer = Buffer.from(response.data, 'binary');
        const metadata = await sharp(imageBuffer).metadata();

        return {
            width: metadata.width,
            height: metadata.height
        };
    } catch (error) {
        console.error('Error fetching image dimensions:', error);
        throw error;
    }
}