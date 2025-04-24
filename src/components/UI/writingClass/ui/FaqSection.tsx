"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcnUI/Accordion"
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { ReactNode } from "react";

interface FaqItem {
  question_ko: string
  question_en: string
  answer_ko: string | ReactNode
  answer_en: string | ReactNode
}

export default function FaqSection() {
  const { language } = useLanguage();
  const faqItems: FaqItem[] = [
    {
      question_ko: "투니즈 작법서는 무료인가요?",
      question_en: "Are Toonyz writing class books free?",
      answer_ko:
        "투니즈 작법서는 현재 무료이지만 유료 컨텐츠로 전환될 예정입니다. 회원가입 후 무료로 다운받으실 수 있습니다. 다운로드 페이지에서 확인하실 수 있습니다.",
      answer_en:
        "Toonyz writing guide books are free now. You can download books directly through the download page. Simply browse or search for the book you want and click the download button.",
    },
    {
      question_ko: "투니즈 작법서는 어디서 다운받을 수 있나요?",
      question_en: "Where can I download Toonyz writing class books?",
      answer_ko: (
        <>
          투니즈 작법서는 회원가입 후 무료로 다운받으실 수 있습니다. <Link href="/writing-class/downloads" className="text-[#DE2B74] underline">다운로드 페이지</Link>에서 확인하실 수 있습니다. 화면 상단의 투니즈 작법서 다운로드 버튼을 클릭하시면 됩니다. 책들은 현재 무료이지만 유료 컨텐츠로 전환될 예정입니다.
        </>
      ),
      answer_en: (
        <>
          You can download Toonyz writing class books from our <Link href="/writing-class/downloads" className="text-[#DE2B74] underline">downloads page</Link>. Tap the text appearance button (aA) to access controls for text size, font, background color, and other display settings to customize your reading experience.
        </>
      ),
    },
    {
      question_ko: "투니즈 작법서를 읽고나서 피드백을 받을 수 있나요?",
      question_en: "Can I get feedback after reading Toonyz writing class books?",
      answer_ko:
        "작법서를 읽으신 다음 피드백에 관한 문의는 lisa@stelland.io로 문의해 주세요. 신인 작가이신 경우 여러분의 작품에 관한 피드백을 꼼꼼히 도와드립니다.",
      answer_en:
        "Yes, you can get feedback after reading Toonyz writing class books. Please contact lisa@stelland.io for feedback. If you are a new writer, we will provide detailed feedback on your work.",
    },
    {
      question_ko: "투니즈에 자유연재 투고를 할 수 있나요?",
      question_en: "Can I submit free-to-publish works to Toonyz?",
      answer_ko:
        "여러분은 언제든지 투니즈에 자유연재 투고를 할 수 있습니다. toonyz.com 에서 회원가입 후 연재할 수 있습니다. 완성된 작품이 있으시다면, lisa@stelland.io로 문의해 주세요. 투니즈에 프리미엄 연재를 진행할 수 있도록 도와드리겠습니다. ",
      answer_en:
        "Yes, you can write your stories to Toonyz in the community section. Please contact lisa@stelland.io if you have a completed story. We will help you publish your story as the Toonyz premium story and get more views benefits.",
    }
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">
        {language === "en" ? "Frequently Asked Questions" : "자주 묻는 질문"}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-[#d2d2d7]">
            <AccordionTrigger className="text-lg text-left py-5 text-[#1d1d1f] hover:no-underline hover:text-[#DE2B74] font-medium">
              {language === "en" ? item.question_en : item.question_ko}
            </AccordionTrigger>
            <AccordionContent className="text-[#86868b] pb-5">
              {language === "en" ? item.answer_en : item.answer_ko}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
