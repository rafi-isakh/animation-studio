/* eslint-disable @next/next/no-img-element */
"use client";

import SignInComponent from "@/components/SignInComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function EventLandingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { email } = useUser();
  const [step, setStep] = useState(1);

  const [overlayImageStyle, setOverlayImageStyle] = useState(-1);

  const handleClickStyle = (idx: number) => {
    if (overlayImageStyle === idx) {
      setOverlayImageStyle(-1);
    }
    else setOverlayImageStyle(idx);
  };

  const [overlayImageGenre, setOverlayImageGenre] = useState(-1);

  const handleClickGenre = (idx: number) => {
    if (overlayImageGenre === idx) {
      setOverlayImageGenre(-1);
    }
    else setOverlayImageGenre(idx);
  };

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
            backgroundSize: "100% auto", // stretch to full width
            backgroundRepeat: "repeat-y", // repeat vertically
            backgroundPosition: "center top",
            padding: 12,
          }}
        >
          { step === 1 && (
            <>
              <img
                src="/images/event_landing/page1_header.png"
                alt="Event Landing Header"
                className="max-w-full h-auto"
              />
              <img
                src="/images/event_landing/page1_image.png"
                alt="Event Landing Header"
                className="max-w-full h-auto"
              />
              <button
                className="relative flex items-center justify-center"
                onClick={() => setStep(2)}
              >
                <img
                  src="/images/event_landing/page1_button.png"
                  alt="Event Landing Button Large"
                  className="max-w-full h-auto"
                />
              </button>
            </>
          )}
          {step === 2 && (
            <div className="w-full flex flex-col items-center">

              <div className="relative w-[60%] aspect-square" style={{ marginBottom: 20 }}>
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

              <div className="relative w-[60%] aspect-square" style={{ marginBottom: 20 }}>
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

              <div className="relative w-[60%] aspect-square" style={{ marginBottom: 20 }}>
                <Image
                  src="/images/event_landing/page4_text.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>

              <div className="relative w-1/2 aspect-square" style={{ marginBottom: 20 }}>
                <Image
                  src="/images/event_landing/page4_box.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>


              <div className="relative w-[60%] aspect-square" style={{ marginBottom: 20 }}>
                <Image
                  src="/images/event_landing/page4_button_2.png"
                  alt="Header text 2"
                  fill
                  className="object-contain"
                />
              </div>

            </div>
          )}
        </div>
      )}
    </>
  );
}
