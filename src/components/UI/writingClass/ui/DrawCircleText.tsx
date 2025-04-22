import React from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/contexts/LanguageContext";

export const DrawCircleText = () => {
  const { language } = useLanguage();
  return (

    <div className="grid place-content-center bg-transparent px-4 pt-24 text-black">
      <h1 className="max-w-2xl text-center text-4xl leading-snug mx-auto">
     {language === "en" ? <>Want to become a writer?<br/> </> : <>작가가 되고 싶다고요?<br/></>}
        {language === "en" ? "Make" : "풍부한"} {' '}
        <span className="relative">
        {language === "en" ? "your dreams" : "당신의 상상력"}
          <svg
            viewBox="0 0 286 73"
            fill="none"
            className="absolute -left-2 -right-2 -top-6 bottom-0 translate-y-1"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{
                duration: 1.25,
                ease: "easeInOut",
              }}
              d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
              stroke="#DE2B74"
              strokeWidth="3"
            />
          </svg>
        </span>{" "}
        {language === "en" ? "come true" : "꿈을 이루어 보세요"}
      </h1>


      <p className="pt-10 text-xl text-black whitespace-pre-line break-keep text-center">
            {language === "en" ? <>Toonyz Writing Class is offering a free writing guide PDF for the first step to become a successful webnovel writer.</>
              : "투니즈 글쓰기 101 클래스는 성공적인 웹소설 작가가 되기 위한 첫걸음, 무료 작법서 PDF 가이드를 드립니다."} <br />
            {language === "en" ? "Practical writing tips, proven plot design methods, and actual writer's secrets are all included."
              : "실전에서 바로 써먹을 수 있는 글쓰기 팁, 검증된 플롯 설계법, 실제 작가들의 노하우까지 모두 담았습니다."}
      </p>
    </div>
  );
};