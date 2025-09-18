export async function mergeWithOverlayAndCrop(
  base64Image: string,
  currentGenreLabel: string, // pass the genre label here
  width = 1205,
  height = 1795
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

    // Choose a random overlay number (1, 2, or 3)
    const randomNum = Math.floor(Math.random() * 3) + 1;
    const overlayPath = `/images/event_landing/${currentGenreLabel}${randomNum}.png`;
    console.log(`Overlay path: ${overlayPath}`);

    background.onload = () => {
      // --- Compute crop to maintain target aspect ratio ---
      const targetRatio = width / height;
      const srcRatio = background.width / background.height;

      let sx = 0;
      let sy = 0;
      let sw = background.width;
      let sh = background.height;

      if (srcRatio > targetRatio) {
        // Source is wider → crop width
        sw = background.height * targetRatio;
        sx = (background.width - sw) / 2;
      } else {
        // Source is taller → crop height
        sh = background.width / targetRatio;
        sy = (background.height - sh) / 2;
      }

      // Draw the cropped background
      ctx.drawImage(background, sx, sy, sw, sh, 0, 0, width, height);

      // Load and draw overlay
      overlay.onload = () => {
        const scale = Math.min(width / overlay.width, height / overlay.height);
        const overlayWidth = overlay.width * scale;
        const overlayHeight = overlay.height * scale;

        const x = (width - overlayWidth) / 2;
        const y = (height - overlayHeight) / 2;

        ctx.drawImage(overlay, x, y, overlayWidth, overlayHeight);

        resolve(canvas.toDataURL("image/png"));
      };

      overlay.onerror = (err) => reject(`Overlay failed to load: ${err}`);
      overlay.src = overlayPath;
    };

    background.onerror = (err) => reject(`Background failed to load: ${err}`);
    background.src = `data:image/png;base64,${base64Image}`;
  });
}
