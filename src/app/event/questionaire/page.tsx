"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import SignInComponent from "@/components/SignInComponent";
import ThankYouComponent from "./thank-you-component";

export default function EventPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [hasAnsweredEvent, setHasAnsweredEvent] = useState(false);
  const { email } = useUser();

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

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<{ [key: number]: string | null }>({
    1: null,
    2: null,
  });

  const handleSelect = (section: number, value: "yes" | "no") => {
    setAnswers((prev) => {
      const updated = { ...prev, [section]: value };
      // 🔹 Save to localStorage
      localStorage.setItem("event_answers", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/event/teaser");
    } else {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else console.log("Submitted answers:", answers);
  };

  // Helper function to get correct button image
  const getButtonImage = (section: number, value: "yes" | "no") => {
    if (value === "yes") return answers[section] === "yes" ? 5 : 4;
    if (value === "no") return answers[section] === "no" ? 7 : 6;
    return value === "yes" ? 4 : 6;
  };

  // 🔹 After loading user, check if they answered the event
  useEffect(() => {
    const checkAnswer = async () => {
      try {
        const answerRes = await fetch("/api/check_event_answer", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (answerRes.ok) {
          console.log("Fetched event answer status");
          const answered = await answerRes.json();
          setHasAnsweredEvent(answered === true);
        } else {
          console.error("Failed to fetch event answer status:", answerRes.status);
        }
      } catch (err) {
        console.error("Error fetching event answer status:", err);
      }
    };

    checkAnswer();
  }, [email]);

  const handleSubmit = async () => {
    if (!email) {
      setStep(3);
      return;
    }

    try {
      const payload = {
        is_helpful: answers[1] === "yes", // step 1 = is_helpful
        is_want: answers[2] === "yes"     // step 2 = is_want
      };

      const res = await fetch("/api/add_event_answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        console.log("Event answers submitted:", data);
        localStorage.removeItem("event_answers"); // clear local storage
        setHasAnsweredEvent(true);
        // router.push("/event/thank-you"); // or any page you want
        router.push("/event/thank-you");
      } else {
        alert(data.message || "Failed to submit answers");
      }
    } catch (err) {
      console.error("Error submitting event answers:", err);
    }
  };

  if (hasAnsweredEvent) return <ThankYouComponent />;

  return (
    
    <div className="flex flex-col min-h-screen items-center justify-between p-6 relative bg-black">
      <div className="flex flex-col items-center">
        {(step < 3) &&
        <>
          {/* Section Image */}
          <Image
            src={images[language === "ko" ? (step === 1 ? 0 : 2) : (step === 1 ? 1 : 3)].src}
            alt={`Section ${step}`}
            width={400}
            height={300}
            className="rounded-xl"
          />

          {/* Yes/No Image Buttons */}
          <div className="flex justify-between w-full max-w-lg mt-6 px-16 gap-4">
            <div
              className="cursor-pointer"
              onClick={() => handleSelect(step, "yes")}
            >
              <Image
                src={images[getButtonImage(step, "yes")].src}
                alt={images[getButtonImage(step, "yes")].alt}
                width={120}
                height={60}
              />
            </div>

            <div
              className="cursor-pointer"
              onClick={() => handleSelect(step, "no")}
            >
              <Image
                src={images[getButtonImage(step, "no")].src}
                alt={images[getButtonImage(step, "no")].alt}
                width={120}
                height={60}
              />
            </div>
          </div>
        </>
        }
        {step === 3 && 
          <>
            { language === "en" ?
              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-[#DB2879] text-[24px] font-medium">Be the lead in our event!</p>
                <p className="text-white text-[18px]">Sign up and be the part of the action</p>
              </div>
              :
              <div className="flex flex-col items-center text-center gap-1">
                <p className="text-[#DB2879] text-[24px] font-medium">이벤트의 주인공이 되어보세요</p>
                <p className="text-white text-[18px]">가입을 완료하면 이벤트 응모가 완료 됩니다.</p>
              </div>
            }
            <SignInComponent redirectTo="/event/thank-you" />
          </>
        }

        {/* Navigation Buttons */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center px-6 pb-12">
          <div className="flex justify-between w-full max-w-lg px-16">
            <button
              className="px-6 py-2 w-24 rounded-lg border-2 border-[#DB2879] bg-black text-white font-medium"
              onClick={handleBack}
            >
              Back
            </button>

            {step < 3 &&
              <button
                className={`px-6 py-2 w-24 rounded-lg border-2 border-[#DB2879] bg-[#DB2879] text-white font-medium ${
                  !answers[step] ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={step === 2 ? handleSubmit : handleNext}
                disabled={!answers[step]}
              >
                {step === 2 ? "Submit" : "Next"}
              </button>}
          </div>
        </div>
      </div>
    </div>
  );
}
