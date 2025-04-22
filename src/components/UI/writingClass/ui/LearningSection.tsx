'use client'
import { Check } from "lucide-react"
import RoundedButton from "@/components/UI/writingClass/RoundedButton/RoundedButton"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
export default function LearningSection() {
  const { language } = useLanguage();
  const features = [
    language === "en" ? "Thousands of creative classes. Beginner to pro." 
                      : "초보자에서 전문가까지 큐레이션 된 창의적인 클래스",
    language === "en" ? "Taught by creative pros and industry icons." 
                      : "프로 전문가와 현업 웹소설 작가들이 가르칩니다.",
    language === "en" ? "Learning Paths to help you achieve your goals." 
                      : "목표를 달성하는 데 도움이 되는 학습 경로 제공",
    language === "en" ? "Certificates to celebrate your accomplishments." 
                      : "당신의 성취를 축하하는 수료증 제공"
  ]

  return (
    <div className="w-full bg-gray-100 text-black pt-16 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 pt-2 gap-10 items-center">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight ">
            {language === "en" ? "Master Webnovel Writing" 
                               : "마스터 웹소설 클래스"}
          </h2>
          <p className="text-xl pb-4">
            {language === "en" ? "Start your global webnovel journey now" 
                               : "지금 바로 글로벌 웹소설 작가의 여정을 시작하세요"}
          </p>
          <RoundedButton className='w-[330px] md:mx-0 mx-auto'>
            <Link href="#">
              {language === "en" ? "Join Now" : "글쓰기 클래스 바로 신청하기"}
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
