"use client";
import SignInComponent from "@/components/SignInComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { MASTER_PROMPT_BY_GENRE } from "@/constants/masterprompt";
import { eventPrompts } from "@/constants/eventprompts";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import animationData from '@/assets/N_logo_with_heart.json';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
  ssr: false,
});

export default function EventLandingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { email } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Overlay selections
  const [overlayImageStyle, setOverlayImageStyle] = useState(-1);
  const [overlayImageGenre, setOverlayImageGenre] = useState(-1);

  const handleClickStyle = (idx: number) => {
    setOverlayImageStyle(overlayImageStyle === idx ? -1 : idx);
    setSelectedStyleIndex(idx);
  };

  const handleClickGenre = (idx: number) => {
    setOverlayImageGenre(overlayImageGenre === idx ? -1 : idx);
    setSelectedGenreIndex(idx);
  };

  // --- New useStates from first component ---
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(-1);
  const [selectedGenreIndex, setSelectedGenreIndex] = useState(-1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const currentStyle = eventPrompts.styles[selectedStyleIndex];
  const currentGenre = eventPrompts.genres[selectedGenreIndex];

  const [styleText, setStyleText] = useState("");
  const [genreText, setGenreText] = useState("");

  useEffect(() => setStyleText(currentStyle?.prompt || ""), [currentStyle]);
  useEffect(() => setGenreText(currentGenre?.prompt || ""), [currentGenre]);

  const [finalPrompt, setFinalPrompt] = useState("");

  // --- File handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadedImage(URL.createObjectURL(selectedFile));
  };

  // --- Upload + prompt generation ---
  const handleUploadClick = async (model: string) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose an image before uploading",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bufferBase64 = Buffer.from(arrayBuffer).toString("base64");

      const promptResponse = await fetch(`/api/get_prompt_from_image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: bufferBase64,
          image_type: file.type,
        }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        throw new Error(errorData.error || "Failed to generate prompt");
      }

      const characterData = await promptResponse.json();

      toast({
        title: "Prompt generated",
        description: characterData.prompt,
      });

      const imagePrompt = MASTER_PROMPT_BY_GENRE(
        styleText,
        genreText,
        characterData.prompt
      );

      setFinalPrompt(imagePrompt);
      console.log("Final Prompt:", imagePrompt);

      const imageResponse = await fetch(`/api/generate_character_${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const imageData = await imageResponse.json();
      if (imageData.image) setImage(imageData.image);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // --- Trigger file upload from box click ---
  const handleBoxClick = () => {
    document.getElementById("fileInput")?.click();
  };

  useEffect(() => {
    if (image) {
      setStep(3);
    }
  }, [image]);

  return (
    <>
      {!email && (
        <div className="flex flex-col min-h-screen items-center justify-between p-6 relative bg-black">
          <SignInComponent redirectTo="/event/landing" />
        </div>
      )}

      {email && (
        <div
          className="flex flex-col items-center w-full bg-center"
          style={{
            backgroundImage: "url('/images/event_landing/background.png')",
            backgroundSize: "100% auto",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "center top",
            padding: 12,
          }}
        >
          {step === 1 && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-[75%] aspect-[3/2]">
                <Image
                  src="/images/event_landing/page1_header.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative w-[75%] aspect-[3/2]" style={{ marginBottom: 20 }}>
                <Image
                  src="/images/event_landing/page1_image.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="relative w-[75%] aspect-[3/2]">
                <Image
                  src="/images/event_landing/page1_text.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </div>
              <button
                className="relative w-[75%] aspect-[2/1]"
                onClick={() => setStep(2)}
              >
                <Image
                  src="/images/event_landing/page1_button.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="w-full flex flex-col items-center">
              {/* ... Page 2 style/genre selectors unchanged ... */}
              <div className="relative w-[60%] aspect-square">
                <Image
                  src="/images/event_landing/page2_text.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="relative w-full flex flex-col items-center mb-20">
                {/* Top row container (90% of parent width) */}
                <div className="relative w-[90%] flex flex-row items-center justify-center z-10 -ml-[7%]">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="relative w-1/2 aspect-[9/11] cursor-pointer -mr-[7%]"
                      onClick={() => handleClickStyle(idx)}
                    >
                      <Image
                        src={`/images/event_landing/page2_select${idx + 1}.png`}
                        alt={`Parallelogram ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Overlay images (scale with container) */}
                {[0, 1, 2].map(
                  (idx) =>
                    overlayImageStyle === idx && (
                      <div
                        key={idx}
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[50%] aspect-[9/11]"
                        style={{
                          top: "calc(50%)",
                          left: `calc(50% + ${(idx - 1) * 30}%)`, // shift left/right in %
                        }}
                      >
                        <Image
                          src={`/images/event_landing/page2_image${idx + 1}.png`}
                          alt={`Overlay ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div
                          className="absolute top-0 left-0 w-full h-full cursor-pointer"
                          style={{
                            clipPath: "polygon(27% 7%, 93% 7%, 73% 93%, 7% 93%)",
                            pointerEvents: "auto",
                          }}
                          onClick={() => handleClickStyle(idx)}
                        />
                      </div>
                    )
                )}
              </div>

              <div className="relative w-[60%] aspect-[2/1]">
                <Image
                  src="/images/event_landing/page3_text.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Genre Selector */}
              <div className="relative w-full flex flex-col items-center mb-20 gap-2">
                {[0, 1].map((group) => (
                  <div
                    key={group}
                    className="relative w-[90%] flex flex-row items-center justify-center gap-2"
                  >
                    {[0, 1].map((idx) => {
                      const globalIdx = group * 2 + idx;
                      return (
                        <div
                          key={globalIdx}
                          className="relative w-1/3 aspect-[7/10] cursor-pointer"
                          onClick={() => handleClickGenre(globalIdx)}
                        >
                          <Image
                            src={`/images/event_landing/page3_card${globalIdx + 1}.png`}
                            alt={`Parallelogram ${globalIdx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* ✅ overlays rendered AFTER the groups */}
                {[0, 1, 2, 3].map((globalIdx) =>
                  overlayImageGenre === globalIdx ? (
                    <div
                      key={`overlay-${globalIdx}`}
                      className="absolute z-[1000] -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-[9/11]"
                      style={{
                        top: `calc(50% + ${(Math.floor(globalIdx / 2) - 0.5) * 50}%)`,
                        left: `calc(50% + ${((globalIdx % 2) - 0.5) * 30}%)`,
                      }}
                    >
                      <Image
                        src={`/images/event_landing/page3_image${globalIdx + 1}.png`}
                        alt={`Overlay ${globalIdx + 1}`}
                        fill
                        className="object-cover"
                        onClick={() => handleClickGenre(globalIdx)}
                      />
                    </div>
                  ) : null
                )}
              </div>
              {/* Page 4 box triggers file upload */}

              <div className="relative w-[60%] aspect-square" style={{ marginBottom: 20 }}>
                <Image
                  src="/images/event_landing/page4_text.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>
              
              <div
                className={`relative aspect-square mb-20 cursor-pointer transition-all duration-300`}
                style={{
                  width: uploadedImage ? "100%" : "50%",
                }}
                onClick={handleBoxClick}
              >
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Uploaded Preview"
                    className="absolute inset-0 w-full h-full object-contain rounded"
                  />
                ) : (
                  <Image
                    src="/images/event_landing/page4_box.png"
                    alt="Upload or Take Photo"
                    fill
                    className="object-contain"
                  />
                )}
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
              </div>

              {uploading ? (
                // 🔄 Show loader instead of upload button
                <div className="relative w-[60%] aspect-square flex items-center justify-center" style={{ marginBottom: 20 }}>
                  <LottieLoader animationData={animationData} />
                </div>
              ) : (
                <button
                  className="relative w-[60%] aspect-square"
                  style={{ marginBottom: 20 }}
                  onClick={() => {
                    if (styleText && genreText && file) {
                      handleUploadClick("gemini");
                    }
                  }}
                >
                  <Image
                    src="/images/event_landing/page4_button_2.png"
                    alt="Header text 2"
                    fill
                    className="object-contain cursor-pointer"
                    style={{
                      opacity:
                        overlayImageStyle !== -1 && overlayImageGenre !== -1 && file
                          ? 1
                          : 0.5,
                    }}
                  />
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex flex-col items-center pb-40">
              <div className="relative w-[50%] aspect-[2/1]">
                <Image
                  src="/images/event_landing/page5_logo.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </div>

              {image && (
                <img
                  src={`data:image/png;base64,${image}`}
                  alt="Generated"
                  style={{
                    marginTop: 24,
                    maxWidth: "75%",
                    borderRadius: 8,
                    marginBottom: 100,
                  }}
                  id="generatedImage"
                />
              )}

              <div
                className="relative w-[75%] aspect-[3/2]"
                style={{ marginBottom: 20 }}
              >
                <Image
                  src="/images/event_landing/page5_text.png"
                  alt="Header text 1"
                  fill
                  className="object-contain"
                />
              </div>

              <div className="w-[50%] flex flex-row items-center">
                {/* Download Button */}
                <div
                  className="relative w-[50%] aspect-square cursor-pointer"
                  onClick={() => {
                    if (!image) return;
                    const link = document.createElement("a");
                    link.href = `data:image/png;base64,${image}`;
                    link.download = "generated.png";
                    link.click();
                  }}
                >
                  <Image
                    src="/images/event_landing/page5_button1.png"
                    alt="Download Button"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Share Button */}
                <div
                  className="relative w-[50%] aspect-square cursor-pointer"
                  onClick={() => {
                    if (!image) return;
                    const blob = fetch(`data:image/png;base64,${image}`)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File([blob], "generated.png", {
                          type: "image/png",
                        });

                        if (navigator.share) {
                          navigator
                            .share({
                              title: "Check out my generated character!",
                              text: "Made with the Event Generator ✨",
                              files: [file],
                            })
                            .catch((err) => console.error("Share failed:", err));
                        } else {
                          window.open("https://www.instagram.com/", "_blank");
                        }
                      });
                  }}
                >
                  <Image
                    src="/images/event_landing/page5_button2.png"
                    alt="Share Button"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
