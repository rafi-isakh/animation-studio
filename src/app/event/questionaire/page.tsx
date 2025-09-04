"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import SignInComponent from "@/components/SignInComponent";
import dynamic from "next/dynamic";

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), { ssr: false });
import animationData from "@/assets/N_logo_with_heart.json";
import ThankYouComponent from "./thank-you-component";

export default function EventPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { email } = useUser();

  const [hasAnsweredEvent, setHasAnsweredEvent] = useState(false);
  const [loading, setLoading] = useState(true); // <--- loading state for thank you submission
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{ [key: number]: string | null }>({ 1: null, 2: null });

  const images = [
    { src: "/images/event_teaser/QKR_1.webp", alt: "Section 1 KO" },
    { src: "/images/event_teaser/QEN_1.webp", alt: "Section 1 EN" },
    { src: "/images/event_teaser/QKR_2.webp", alt: "Section 2 KO" },
    { src: "/images/event_teaser/QEN_2.webp", alt: "Section 2 EN" },
    { src: "/images/event_teaser/yesBtn.png", alt: "Yes Button" },
    { src: "/images/event_teaser/yesBtn_onClick.png", alt: "Yes Button Selected" },
    { src: "/images/event_teaser/noBtn.png", alt: "No Button" },
    { src: "/images/event_teaser/noBtn_onClick.png", alt: "No Button Selected" },
  ];

  // --------------------
  // Effect: check if user already answered
  // --------------------
  useEffect(() => {
    const checkAnswer = async () => {
      try {
        const res = await fetch("/api/check_event_answer", { method: "GET" });
        if (res.ok) {
          const answered = await res.json();
          setHasAnsweredEvent(answered === true);
        } else console.error("Failed to fetch event answer status:", res.status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAnswer();
  }, [email]);

  // --------------------
  // Effect: submit saved answers if user has answered
  // --------------------
  useEffect(() => {
    const submitSavedAnswers = async () => {
      const stored = localStorage.getItem("event_answers");
      if (!stored || !email) return;

      const parsed = JSON.parse(stored);
      if (!parsed[1] && !parsed[2]) return;

      try {
        const payload = {
          is_helpful: parsed[1] === "yes",
          is_want: parsed[2] === "yes",
        };

        const res = await fetch("/api/add_event_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) localStorage.removeItem("event_answers");
      } catch (err) {
        console.error(err);
      }
    };

    if (hasAnsweredEvent) submitSavedAnswers();
  }, [hasAnsweredEvent, email]);

  // --------------------
  // Event page helpers
  // --------------------
  const handleSelect = (section: number, value: "yes" | "no") => {
    setAnswers((prev) => {
      const updated = { ...prev, [section]: value };
      localStorage.setItem("event_answers", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBack = () => step === 1 ? router.push("/event/teaser") : setStep(step - 1);
  const handleNext = () => step === 1 ? setStep(2) : console.log("Next step");

  const getButtonImage = (section: number, value: "yes" | "no") => {
    if (value === "yes") return answers[section] === "yes" ? 5 : 4;
    if (value === "no") return answers[section] === "no" ? 7 : 6;
    return value === "yes" ? 4 : 6;
  };

  const handleSubmit = async () => {
    if (!email) {
      setStep(3); // show sign in
      return;
    }

    try {
      const payload = { is_helpful: answers[1] === "yes", is_want: answers[2] === "yes" };
      const res = await fetch("/api/add_event_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem("event_answers");
        setHasAnsweredEvent(true);
      } else alert(data.message || "Failed to submit answers");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LottieLoader width="w-40" animationData={animationData} />;

  if (hasAnsweredEvent) return <ThankYouComponent />;

  return (
    <div className="flex flex-col min-h-screen items-center justify-between p-6 relative bg-black">
      <div className="flex flex-col items-center">
        {step < 3 && (
          <>
            <Image
              src={images[language === "ko" ? (step === 1 ? 0 : 2) : (step === 1 ? 1 : 3)].src}
              alt={`Section ${step}`}
              width={400}
              height={300}
              className="rounded-xl"
            />

            <div className="flex justify-between w-full max-w-lg mt-6 px-16 gap-4">
              <div className="cursor-pointer" onClick={() => handleSelect(step, "yes")}>
                <Image
                  src={images[getButtonImage(step, "yes")].src}
                  alt={images[getButtonImage(step, "yes")].alt}
                  width={120}
                  height={60}
                />
              </div>

              <div className="cursor-pointer" onClick={() => handleSelect(step, "no")}>
                <Image
                  src={images[getButtonImage(step, "no")].src}
                  alt={images[getButtonImage(step, "no")].alt}
                  width={120}
                  height={60}
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <SignInComponent redirectTo="/event/questionaire" />
        )}

        <div className="absolute bottom-6 left-0 w-full flex justify-center px-6 pb-12">
          <div className="flex justify-between w-full max-w-lg px-16">
            <button
              className="px-6 py-2 w-24 rounded-lg border-2 border-[#DB2879] bg-black text-white font-medium"
              onClick={handleBack}
            >
              Back
            </button>

            {step < 3 && (
              <button
                className={`px-6 py-2 w-24 rounded-lg border-2 border-[#DB2879] bg-[#DB2879] text-white font-medium ${!answers[step] ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={step === 2 ? handleSubmit : handleNext}
                disabled={!answers[step]}
              >
                {step === 2 ? "Submit" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
