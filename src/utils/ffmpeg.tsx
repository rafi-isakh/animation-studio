import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import path from "path";
import { NextRequest } from "next/server";
import { uploadFile } from "./s3";
export const ffmpegCombineToSlideshow = async (pictures: string[], request: NextRequest) => {
    // pictures is an array of base64 images
    const tempDir = path.join(__dirname, "temp_images");
    fs.ensureDirSync(tempDir);
    const imageFiles: string[] = [];
    pictures.forEach((base64, index) => {
        const filePath = path.join(tempDir, `image${index + 1}.png`);
        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
        imageFiles.push(filePath);
    });
    if (imageFiles.length === 0) {
        console.error("No valid images to process.");
        process.exit(1);
    }

    const videoFileName = `slideshow-${Date.now()}.mp4`;
    const outputVideo = path.join(__dirname, videoFileName);

    // Configuration: duration each image is shown and the duration of the transition
    const durationPerImage = 3; // seconds per image
    const transitionDuration = 1; // seconds for each fade

    // Build filter_complex parts:
    // For each input image we apply a fade. For the first image, we only fade out.
    // For the last image, we only fade in.
    // For middle images, we do fade in and fade out.
    const filterParts: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
        if (imageFiles.length === 1) {
            // If only one image, just fade in.
            filterParts.push(
                `[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`
            );
        } else {
            if (i === 0) {
                // First image: fade out at the end
                filterParts.push(
                    `[${i}:v]fade=t=out:st=${durationPerImage - transitionDuration}:d=${transitionDuration}[v${i}]`
                );
            } else if (i === imageFiles.length - 1) {
                // Last image: fade in at the start
                filterParts.push(
                    `[${i}:v]fade=t=in:st=0:d=${transitionDuration}[v${i}]`
                );
            } else {
                // Middle images: fade in at start, then fade out at the end
                filterParts.push(
                    `[${i}:v]fade=t=in:st=0:d=${transitionDuration},fade=t=out:st=${durationPerImage - transitionDuration}:d=${transitionDuration}[v${i}]`
                );
            }
        }
    }

    // Now, chain the images together with xfade transitions.
    // The first xfade happens between the first two images.
    // For subsequent transitions, we chain the result with the next image.
    // The offset for each xfade is computed so that the transition starts at:
    //    offset = (index) * (durationPerImage - transitionDuration)
    let xfadeChain = "";
    if (imageFiles.length > 1) {
        // First transition between [v0] and [v1]
        let offset = durationPerImage - transitionDuration;
        xfadeChain += `[v0][v1]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[x1]`;
        // For each additional image, chain using the previous xfade result.
        for (let i = 2; i < imageFiles.length; i++) {
            offset = i * (durationPerImage - transitionDuration);
            xfadeChain += `;[x${i - 1}][v${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[x${i}]`;
        }
    }

    // Combine all filter parts into one filter_complex string.
    let filterComplex = filterParts.join(";");
    if (xfadeChain) {
        filterComplex += ";" + xfadeChain;
    }
    console.log("Filter complex:", filterComplex);

    // Create the ffmpeg command.
    const command = ffmpeg();

    // For each image, add it as an input with options to loop it for the given duration.
    imageFiles.forEach(file => {
        command.input(file).inputOptions(["-loop 1", `-t ${durationPerImage}`]);
    });

    // The final output stream is the last xfade label if there is more than one image,
    // otherwise it's just [v0].
    const finalStreamLabel =
        imageFiles.length > 1
            ? `x${imageFiles.length - 1}`
            : "v0";

    command
        .complexFilter(filterComplex, finalStreamLabel)
        .outputOptions([
            "-c:v libx264",      // Use H.264 codec
            "-pix_fmt yuv420p",  // Ensure compatibility
            "-r 30"              // Set output frame rate (adjust as needed)
        ])
        .output(outputVideo)
        .on("start", commandLine => console.log("FFmpeg command:", commandLine))
        .on("progress", progress => console.log(`Processing: ${progress.percent}% done`))
        .on("end", () => {
            console.log("Slideshow video created successfully!");
            // Read the video and convert it to base64 for uploading
            const fileBuffer = fs.readFileSync(outputVideo);
            const fileType = "video/mp4";
            uploadFile(fileBuffer, videoFileName, fileType, request);
            // Optionally remove temporary images:
            fs.removeSync(tempDir);
        })
        .on("error", err => console.error("Error:", err))
        .run();
    return videoFileName;
};
