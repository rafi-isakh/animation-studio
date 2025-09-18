export async function mergeWithOverlayAndCrop(
  base64Image: string,
  overlayPath: string,
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
        // Draw overlay logo on top (scaled to 25% width)
        const logoSize = width * 0.25;
        const x = width - logoSize - 20;
        const y = height - logoSize - 20;

        ctx.drawImage(overlay, x, y, logoSize, logoSize);
        resolve(canvas.toDataURL("image/png"));
      };

      overlay.onerror = reject;
      overlay.src = overlayPath;
    };

    background.onerror = reject;
    background.src = `data:image/png;base64,${base64Image}`;
  });
}
