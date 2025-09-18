export async function mergeWithOverlayAndCrop(
  base64Image: string,
  currentGenreLabel: string, // pass the genre label here
  width = 682,
  height = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject("No canvas context");

    const background = new Image();
    const overlay = new Image();

    background.crossOrigin = "anonymous";
    overlay.crossOrigin = "anonymous";

    // Choose a random number 1, 2, or 3
    const randomNum = Math.floor(Math.random() * 3) + 1;
    // Construct overlay path
    const overlayPath = `/images/event_landing/${currentGenreLabel}${randomNum}.png`;
    console.log(`${currentGenreLabel}${randomNum}`)

    background.onload = () => {
      // Crop center of the original image
      const sx = (background.width - width) / 2;
      const sy = (background.height - height) / 2;

      ctx.drawImage(
        background,
        sx, sy, width, height, // source crop
        0, 0, width, height    // destination on canvas
      );

      overlay.onload = () => {
        // Place overlay exactly atop the cropped image
        // Scale overlay to fill canvas (maintain its own aspect ratio)
        const scale = Math.min(width / overlay.width, height / overlay.height);
        const overlayWidth = overlay.width * scale;
        const overlayHeight = overlay.height * scale;

        const x = (width - overlayWidth) / 2;
        const y = (height - overlayHeight) / 2;

        ctx.drawImage(overlay, x, y, overlayWidth, overlayHeight);
        resolve(canvas.toDataURL("image/png"));
      };

      overlay.onerror = reject;
      overlay.src = overlayPath;
    };

    background.onerror = reject;
    background.src = `data:image/png;base64,${base64Image}`;
  });
}
