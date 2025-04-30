"use client"
import { ReactNode, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcnUI/Accordion"
import { Button } from "@/components/shadcnUI/Button"
import { Input } from "@/components/shadcnUI/Input"
import { Textarea } from "@/components/shadcnUI/Textarea"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"



interface FaqItem {
    question_ko: string
    question_en: string
    answer_ko: string | ReactNode
    answer_en: string | ReactNode
}


export const ContactForm = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [userMessage, setUserMessage] = useState("")
    const { dictionary, language } = useLanguage()
    const { toast } = useToast()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendMessage()
    }

    function sendMessage() {
        const message = `Name: ${name} <br/> Email: ${email} <br/> Message: ${userMessage}`;
        fetch("/api/send_email", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                staffEmail: 'dami@stelland.io, min@stelland.io',
                message: message,
                subject: "Report - FAQ",
                templateType: 'report'
            })
        })
            .then(response => {
                // Check if the response was successful (status code 200-299)
                if (!response.ok) {
                    // If not OK, try to read error as text or throw a generic error
                    return response.text().then(text => {
                        throw new Error(text || `HTTP error! status: ${response.status}`);
                    });
                }
                // If OK, read the response as TEXT since API sends "Email sent"
                return response.text();
            })
            .then(data => {
                toast({
                    title: "Email sent",
                    description: "We will get back to you as soon as possible.",
                    variant: "success",
                })
                console.log("Success:", data);
                // Add any success handling logic here (e.g., show a success message to the user)
            })
            .catch(error => {
                toast({
                    title: "Error sending message",
                    description: "Please try again.",
                    variant: "destructive",
                })
                console.error("Error sending message:", error);
                // Add any error handling logic here (e.g., show an error message to the user)
            });
    }

    return (
        <div className="bg-[#FECACA] p-8 lg:p-16">
            <div className="max-w-md mx-auto">
                <h2 className="text-3xl text-black mb-2 uppercase">
                    {/* DIDN'T FIND YOUR ANSWER? */}
                    {phrase(dictionary, "MayIHelpYou", language)}
                </h2>
                <p className="text-black/80 mb-8">
                    {phrase(dictionary, "emailUs", language)}
                </p>

                <form className="space-y-6">
                    <Input
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/20 border-0 text-black placeholder:text-black/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Input
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/20 border-0 text-black placeholder:text-black/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Textarea
                        placeholder="Message"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="bg-white/20 border-0 text-black placeholder:text-black/60 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                        onClick={(e) => handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                        className="bg-white text-black hover:bg-white/90 rounded-full px-8 uppercase">
                        {/* SEND MESSAGE */}
                        {phrase(dictionary, "sendMessage", language)}
                    </Button>
                </form>
            </div>
        </div>
    )
}




export default function FAQ({ faqItems }: { faqItems?: FaqItem[] }) {
    const { dictionary, language } = useLanguage()


    const faqDefaultItems: FaqItem[] = [
        {
            question_ko: "투니즈 포스트는 무엇 인가요?",
            question_en: "What is a Toonyz Post?",
            answer_ko: (
                <div>
                    투니즈 포스트는 투니즈 회원들이 웹소설을 기반으로 이미지와 비디오를 자유롭게 창작하고 공유할 수 있는 포스트입니다.
                    <Link href="https://www.toonyz.com/feeds">투니즈 피드</Link>는 투니즈 포스트를 공유하는 커뮤니티 공간입니다.
                    투니즈 포스트를 이용하시기 전에 튜토리얼을 보시려면 {' '}
                    <Link href="https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view" target="_blank" className="text-[#DE2B74] underline">
                        여기
                    </Link>를 클릭해주세요.
                </div>
                ),
            answer_en: (
                <div>
                    A Toonyz Post is an image or video based on a webnovel, created by users. 
                    {' '}<Link href="/feeds" className="text-[#DE2B74] underline">Toonyz Feeds</Link> is a community space where you can freely share Toonyz Posts.
                    If you want to see the tutorial before creating a Toonyz Post, 
                    please click {' '}
                    <Link href="https://drive.google.com/file/d/1Ce2JA6MmJxZ5KFJPCwSYW68wj_FaPCBH/view?usp=drive_link" target="_blank" className="text-[#DE2B74] underline">
                        here
                    </Link>.
                </div>
            ),
        },
        {
            question_ko: "이미지/비디오 생성은 무료인가요? 어떻게 하나요?",
            question_en: "Is image/video generation free? How do I do it?",
            answer_ko: (
                <>
                   이미지 및 비디오 생성에는 티켓이 소모됩니다. 처음 투니즈에 가입하신 회원분들을 위해, 티켓을 무료로 제공해드리고 있어 
                   이미지와 비디오 생성을 무료로 체험해보실 수 있습니다. 
                   여러분이 만든 콘텐츠는 &apos;피드&apos; 커뮤니티에 자유롭게 공유하실 수 있습니다. 별이 부족할 경우, <Link href="https://www.toonyz.com/stars">샵</Link>에서 별을 충전해 사용하실 수 있습니다.
                </>
            ),
            answer_en: (
                <>
                    Image/video generation consumes tickets. We offer free tickets to our first-time members, 
                    and you can freely create and share images and videos in our Feed community space. 
                    If you run out of tickets, you can charge them using the <Link href="https://www.toonyz.com/stars" className="text-[#DE2B74] underline">shop</Link>.
                </>
            ),
        },
        {
            question_ko: "내가 만든 이미지는 어디서 볼 수 있나요?",
            question_en: "Where can I see my generated images?",
            answer_ko:
                "피드에 공유한 이미지는 여러분의 프로필 페이지에서 볼 수 있습니다. 추후에는 업데이트로 생성한 모든 이미지를 보실 수 있을 것입니다.",
            answer_en:
                "Images shared to the Feed are available on your profile page. In the future, you will be able to see all the images you have generated. (This feature will be available in the future)",
        },
        {
            question_ko: "저작권 문제는 없나요?",
            question_en: "Are there any copyright issues?",
            answer_ko:
                "2차 저작물에 대한 저작권에 동의한 작품에 대하여 이미지와 비디오 생성이 가능하고 상업적 이용으로 하지 않는 경우에 한해 저작권 문제가 발생하지 않습니다. 하지만 상업적으로 무단 이용할 경우 추후 저작권 문제가 발생할 수 있고, 이 경우 투니즈 포스트 이용이 제한될 수 있습니다.",
            answer_en:
                "For works that have agreed to the copyright for secondary works, image and video generation is possible, and there is no copyright issue as long as it is not used for commercial purposes.",
        },
        {
            question_ko: "연재 및 투고 방법",
            question_en: "How can I submit my work?",
            answer_ko: (
                <>
                   투니즈 포스트에 이미지와 비디오 생성을 한 경우, 투니즈 피드 페이지에 공유가 가능하고 {' '}
                   <Link href="https://www.toonyz.com/feeds" className="text-[#DE2B74] underline">투니즈 피드</Link>에서 투니즈 회원님들의 다양한 포스트를 볼 수 있습니다. 
                   자유연재는<Link href="https://www.toonyz.com/new_webnovel" className="text-[#DE2B74] underline"> 이곳</Link>에서 회원 가입 후 바로 글을 쓰고 투고할 수 있습니다. 
                   완성된 작품이 있으시다고요? lisa@stelland.io로 문의 주시면 검토 후 투니즈에서 프리미엄 연재 및 투고 방법을 안내해드립니다.
                </>
            ),
            answer_en: (
                <>
                    If you have generated images and videos on Toonyz Post, you can share the post to <Link href="https://www.toonyz.com/feeds" className="text-[#DE2B74] underline">Toonyz Feed</Link>. 
                    You can submit your story to the community <Link href="https://www.toonyz.com/new_webnovel" className="text-[#DE2B74] underline">here</Link>.
                    If you have a completed story, please contact lisa@stelland.io for feedback. We will help you publish your story as a Toonyz premium story and get more views and potentially monetization.
                </>
            ),
        },
    ]



    return (
        <div className="relative w-full bg-white dark:bg-black p-4 md:p-4 flex flex-col flex-shrink-0 flex-grow-0 items-center justify-center">
            <div className="w-full max-w-6xl  overflow-hidden">
                {/* rounded-[32px] */}
                <div className="grid lg:grid-cols-2">
                    {/* FAQ Section */}
                    <div className="bg-gray-100 dark:bg-[#211F21] p-4 lg:p-16">
                        {/* bg-gradient-to-r from-[#8B6B6B] to-[#A9A889] */}
                        <h1 className="text-4xl md:text-6xl font-light text-black dark:text-white md:mb-12 mb-4">FAQ</h1>

                        <div className="space-y-4">
                            <p className="text-black dark:text-white text-sm mb-8">
                                {language === "ko" ? "문의하실 내용이 있으시다면" : "Please contact us at"} {" "}
                                <Link href="mailto:hello@stelland.io" className="underline">
                                    hello@stelland.io
                                </Link>{" "}
                                {language === "ko" ? "에 문의해주세요." : "for more information."}
                            </p>
                            <Accordion type="single" collapsible className="space-y-4">
                                {faqItems?.map((item, index) => (
                                    <AccordionItem key={index} value={`${item.question_en}-${index}`} className="border-b border-black/20">
                                        <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                            {language === "en" ? item.question_en : item.question_ko}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-black/80 dark:text-white">
                                            {language === "en" ? item.answer_en : item.answer_ko}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}

                                {faqDefaultItems.map((item, index) => (
                                    <AccordionItem key={index} value={`${item.question_en}-${index}`} className="border-b border-black/20">
                                        <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                            {language === "en" ? item.question_en : item.question_ko}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-black/80 dark:text-white">
                                            {language === "en" ? item.answer_en : item.answer_ko}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}

                            </Accordion>
                        </div>
                    </div>
                    {/* Contact Form Section */}
                    <ContactForm />
                </div>
            </div>
        </div>
    )
}
