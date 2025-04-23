"use client"
import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcnUI/Accordion"
import { Button } from "@/components/shadcnUI/Button"
import { Input } from "@/components/shadcnUI/Input"
import { Textarea } from "@/components/shadcnUI/Textarea"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { FaqItem } from "@/components/Types"
export const ContactForm = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const { dictionary, language } = useLanguage()
    const { toast } = useToast()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendMessage()
    }

    function sendMessage() {
        fetch("/api/send_email", {
            method: "POST",
            headers: { // Good practice to specify content type
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                subject: "Report"
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
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
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




export default function FAQ({  faqItems }: { faqItems?: FaqItem[] }) {
    const { dictionary, language } = useLanguage()

    return (
        <div className="relative w-full bg-white dark:bg-black p-4 md:p-4 flex flex-col flex-shrink-0 flex-grow-0 items-center justify-center">
            <div className="w-full max-w-6xl  overflow-hidden">
                {/* rounded-[32px] */}
                <div className="grid lg:grid-cols-2">
                    {/* FAQ Section */}
                    <div className="bg-gray-100 dark:bg-[#211F21] p-4 lg:p-16">
                        {/* bg-gradient-to-r from-[#8B6B6B] to-[#A9A889] */}
                        <h1 className="text-4xl md:text-6xl font-light text-black dark:text-white md:mb-12 mb-4">FAQS</h1>

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
                                    <AccordionItem key={index} value={`writing-class-item-${index}`} className="border-b border-black/20">
                                        <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                            {language === "en" ? item.question_en : item.question_ko}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-black/80 dark:text-white">
                                            {language === "en" ? item.answer_en : item.answer_ko}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}

                                <AccordionItem value="item-1" className="border-b border-black/20">
                                    <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                        {/* What's the Toonyz Post? */}
                                        {phrase(dictionary, "WhatIsToonyzPost", language)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black/80 dark:text-white">
                                        {language === "ko" ? <div>투니즈 포스트는 투니즈 회원들이 자유롭게 쓸 수 있는 포스트 입니다.
                                            생성한 이미지와 비디오를 자유롭게 창작하고 공유할 수 있는 커뮤니티 공간입니다.
                                            투니즈 포스트를 이용하시기 전에 튜토리얼을 보시려면 {' '}
                                            <Link href="https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view" target="_blank" className="underline">
                                                여기</Link>를 클릭해주세요.

                                        </div>
                                            : <>Toonyz Post is a post that Toonyz members can freely write. It is a community space where you can freely create and share images and videos. If you want to see the tutorial before using Toonyz Post, please click <Link href="https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view" target="_blank" className="underline">here</Link>.</>}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2" className="border-b border-black/20">
                                    <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                        {/* 이미지/비디오 생성은 무료인가요? */}
                                        {phrase(dictionary, "HowDoIGenerateImagesOrVideos", language)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black/80 dark:text-white">
                                        {language === "ko" ? <>이미지 및 비디오 생성에는 별 15개가 소모됩니다.
                                            처음 투니즈에 가입하신 회원분들을 위해, 소량의 별을 무료로 제공해드리고 있어 이미지와 비디오 생성을 무료로 체험해보실 수 있습니다.
                                            여러분이 만든 콘텐츠는 &apos;투니즈 포스트&apos; 커뮤니티에 자유롭게 공유하실 수 있습니다.
                                            별이 부족할 경우, 스타샵에서 별을 충전해 사용하실 수 있습니다.</>
                                            : <>Image/video generation consumes 15 stars. We offer free stars to our first-time members, and you can freely create and share images and videos in the community space, Toonyz Post. If you run out of stars, you can charge them using the star charge. If you run out of stars, you can charge them using the star charge. If you run out of stars, you can charge them using the star charge.</>}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3" className="border-b border-black/20">
                                    <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                        {/* 내가 만든 이미지는 어디서 볼 수 있나요? */}
                                        {phrase(dictionary, "WhereCanISeeMyGeneratedImages", language)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black/80 dark:text-white">
                                        {language === "ko" ? <>투니즈 포스트로 공유한 이미지는 여러분의 프로필 페이지에서 볼 수 있습니다.
                                            추후 업데이트로 생성한 모든 이미지를 보실 수 있습니다.</>
                                            : <>Shared images to Toonyz Post are available on your profile page. In the future, you will be able to see all the images you have generated.</>}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4" className="border-b border-black/20">
                                    <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                        {/* 저작권 문제가 있나요? */}
                                        {phrase(dictionary, "IsThereAnyCopyrightIssues", language)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black/80 dark:text-white">
                                        {language === "ko" ? <>2차 저작물에 대한 저작권에 동의한 작품에 대하여 이미지와 비디오 생성이 가능하고 상업적 이용으로 하지 않는 경우에 한해 저작권 문제가 발생하지 않습니다. 하지만 상업적으로 무단 이용할 경우 추후 저작권 문제가 발생할 수 있고, 이 경우 투니즈 포스트 이용이 제한될 수 있습니다.</>
                                            : <>For works that have agreed to the copyright for secondary works, image and video generation is possible, and there is no copyright issue as long as it is not used for commercial purposes.</>}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-5" className="border-b border-black/20">
                                    <AccordionTrigger className="text-black dark:text-white hover:text-black/80 text-left">
                                        {/* 연재 및 투고 방법 */}
                                        {phrase(dictionary, "HowToSubmitOrPublish", language)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-black/80 dark:text-white">
                                        {language === "ko" ? <>투니즈 포스트에 이미지와 비디오 생성을 한 경우, 공유가 가능하고 <Link href="https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view" target="_blank" className="underline">이곳</Link>에서 투니즈 포스트 방법을 확인할 수 있습니다.
                                            자유연재에 투고 방법은 <Link href="https://www.toonyz.com/new_webnovel" target="_blank" className="underline">이곳</Link>에서 바로 글을 쓰고 투고할 수 있습니다. 완성된 작품이 있으시다고요? lisa@stelland.io로 문의 주시면 검토 후 투니즈에서 프리미엄 연재 및 투고 방법을 안내해드립니다.</>
                                            : <>If you have generated images and videos on Toonyz Post, you can share the post, and you can check the submission method <Link href="https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view" target="_blank" className="underline">here</Link>.</>}
                                    </AccordionContent>
                                </AccordionItem>
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