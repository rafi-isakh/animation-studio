"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcnUI/Accordion"
import { useLanguage } from "@/contexts/LanguageContext";

interface FaqItem {
  question: string
  answer: string
}

export default function FaqSection() {
  const { language } = useLanguage();
  const faqItems: FaqItem[] = [
    {
      question: "How do I purchase books?",
      answer:
        "You can purchase books directly through the Books app. Simply browse or search for the book you want, then tap the price button and follow the prompts to complete your purchase using your Apple ID.",
    },
    {
      question: "Can I read my purchased books on multiple devices?",
      answer:
        "Yes, books purchased through the Books app can be read on any device where you're signed in with the same Apple ID. Your reading progress, bookmarks, and notes will sync automatically across all your devices.",
    },
    {
      question: "How do I download books for offline reading?",
      answer:
        "When browsing your library, books that aren't downloaded to your device will have a cloud icon. Tap the cloud icon to download the book for offline reading. You can manage your downloads in the Library section of the Books app.",
    },
    {
      question: "Can I adjust the text size and appearance?",
      answer:
        "Yes, while reading a book, tap the text appearance button (aA) to access controls for text size, font, background color, and other display settings to customize your reading experience.",
    },
    {
      question: "How do I organize my book collection?",
      answer:
        "You can create custom collections to organize your books. In the Library view, tap Collections, then tap New Collection. Give your collection a name, then add books by selecting them from your library.",
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">
        {language === "en" ? "Frequently Asked Questions" : "자주 묻는 질문"}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b border-[#d2d2d7]">
            <AccordionTrigger className="text-lg text-left py-5 text-[#1d1d1f] hover:no-underline hover:text-[#0066cc] font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-[#86868b] pb-5">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
