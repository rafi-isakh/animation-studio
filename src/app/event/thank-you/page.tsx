"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LottieLoader from "@/components/LottieLoader";
import animationData from "@/assets/N_logo_with_heart.json";
import Image from "next/image";

export default function ThankYouPage() {
  const { email } = useUser();
  const { language } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submitSavedAnswers = async () => {
      const stored = localStorage.getItem("event_answers");
      if (!stored || !email) {
        setLoading(false);
        return;
      }

      const answers = JSON.parse(stored);
      if (!answers[1] && !answers[2]) {
        setLoading(false);
        return;
      }

      try {
        const payload = {
          is_helpful: answers[1] === "yes",
          is_want: answers[2] === "yes",
        };

        const res = await fetch("/api/add_event_answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          console.log("Event answers submitted:", data);
          localStorage.removeItem("event_answers");
        } else {
          console.error("Failed to submit answers:", data.message);
        }
      } catch (err) {
        console.error("Error submitting answers:", err);
      } finally {
        setLoading(false);
      }
    };

    submitSavedAnswers();
  }, [email]);

  if (loading) {
    return <LottieLoader width="w-40" animationData={animationData} />;
  }

  // Text depending on language
  const texts =
    language === "ko"
      ? [
          "회원 가입을 축하드립니다.",
          "이벤트 응모가 완료 되었습니다.",
          "당첨 결과를 9월 23일까지 이메일을 통해 알려드리겠습니다.",
          "Toonyz를 탐험하세요"
        ]
      : [
          "Thank you for Joining!",
          "Your event registration is complete!",
          "We’ll notify you of the results via your registered email on September 20th",
          "Explore Toonyz"
        ];

  return (
    <div className="flex flex-col items-center text-center min-h-screen justify-center px-6 gap-6">
      <p className="text-[#DB2879] text-[24px] font-bold">{texts[0]}</p>
      <p className="text-white text-[20px]">{texts[1]}</p>
      <p className="text-white text-[20px]">{texts[2]}</p>

      <img
        src="/images/event_teaser/stelly_pc.png"
        alt="Thank You Image"
        className="rounded-xl max-w-[300px]"
      />

      <button
        className="mt-6 px-6 py-3 rounded-lg bg-[#DB2879] text-white font-medium text-lg"
        onClick={() => router.push("/")}
      >
        {texts[3]}
      </button>
    </div>
  );
}
