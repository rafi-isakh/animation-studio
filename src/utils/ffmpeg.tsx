import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import path from "path";
import { NextRequest } from "next/server";
import { uploadFile } from "./s3";

export const ffmpegCombineToSlideshow = async (pictures: string[], request: NextRequest) => {
    // pictures is an array of base64 images
    const tempDir = path.join(__dirname, "temp_images");
    fs.ensureDirSync(tempDir);

    // Write images with sequential names
    pictures.forEach((base64, index) => {
        const filePath = path.join(tempDir, `image${index + 1}.png`);
        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    });

    // Ensure we have valid images to process
    if (pictures.length === 0) {
        console.error("No valid images to process.");
        process.exit(1);
    }

    // Set output file
    const fileName = `slideshow-${Date.now()}.mp4`;
    const outputVideo = path.join(__dirname, fileName);
    const inputPattern = path.join(tempDir, "image%d.png"); // expects image1.png, image2.png, etc.

    // Create FFmpeg command using the file pattern
    ffmpeg(inputPattern)
        // Use a framerate input option so that each image is displayed for 1 second
        .inputOptions(["-framerate 2"])
        .outputOptions([
            "-c:v libx264",      // Use H.264 codec
            "-pix_fmt yuv420p",  // Ensure compatibility
            "-r 30"              // Output frame rate (optional; can differ from input framerate)
        ])
        .output(outputVideo)
        .on("start", commandLine => console.log("FFmpeg command:", commandLine))
        .on("progress", progress => console.log(`Processing: ${progress.percent}% done`))
        .on("end", () => {
            console.log("Slideshow video created successfully!");
            // Optionally remove temporary images:
            fs.removeSync(tempDir);

            // Now that the video is done, read the file and upload it
            const fileBuffer = fs.readFileSync(outputVideo);
            const fileType = "video/mp4";
            uploadFile(fileBuffer, fileName, fileType, request);
        })
        .on("error", err => console.error("Error:", err))
        .run();

    return fileName;
};
