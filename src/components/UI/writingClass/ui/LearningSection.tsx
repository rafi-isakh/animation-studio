'use client'
import { Check } from "lucide-react"
import RoundedButton from "@/components/UI/writingClass/RoundedButton/RoundedButton"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
export default function LearningSection() {
  const { language } = useLanguage();
  const features = [
    language === "en" ? "Writing guide books for beginners to pros" 
                      : "초보자에서 전문가까지 큐레이션 된 체계적인 작법서 시리즈",
    language === "en" ? "Tips and tricks by pros and best-selling authors" 
                      : "프로 전문가와 현업 웹소설 작가들의 팁과 노하우",
    language === "en" ? "Learning Paths to help you achieve your goals" 
                      : "목표를 달성하는 데 도움이 되는 학습 경로 제공",
    language === "en" ? "Practical tips for real-world writing" 
                      : "현업에 바로 적용할 수 있는 웹소설 글쓰기 팁",
  ]

  return (
    <div className="w-full bg-gray-100 text-black pt-16 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 pt-2 gap-10 items-center">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight ">
            {language === "en" ? "Master Webnovel Writing" 
                               : "마스터 웹소설 작법서"}
          </h2>
          <p className="text-xl pb-4">
            {language === "en" ? "Start your global webnovel journey now" 
                               : "지금 바로 글로벌 웹소설 작가의 여정을 시작하세요"}
          </p>
          <RoundedButton className='w-[330px] md:mx-0 mx-auto'>
            <Link href="/writing-class/downloads">
              {language === "en" ? "Download Now" : "무료로 5강 다운로드 받기"}
            </Link>
          </RoundedButton>
        </div>

        <div className="space-y-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="bg-[#DE2B74] rounded-full p-1 mt-1 flex-shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <p className="text-xl md:text-2xl font-medium">{feature}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center pt-14">
      </div>
    </div>
  )
}
