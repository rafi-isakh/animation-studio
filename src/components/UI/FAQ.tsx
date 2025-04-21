"use client"
import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcnUI/Accordion"
import { Button } from "@/components/shadcnUI/Button"
import { Input } from "@/components/shadcnUI/Input"
import { Textarea } from "@/components/shadcnUI/Textarea"
import Link from "next/link"

export default function FAQ() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendMessage()
    }

    function sendMessage() {
        fetch("api/send_email", {
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
            // 'data' will now be the string "Email sent"
            console.log("Success:", data);
            // Add any success handling logic here (e.g., show a success message to the user)
        })
        .catch(error => {
            console.error("Error sending message:", error);
            // Add any error handling logic here (e.g., show an error message to the user)
        });
    }

    return (
    <div className="relative bg-white p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl  overflow-hidden">
        {/* rounded-[32px] */}
        <div className="grid lg:grid-cols-2">
          {/* FAQ Section */}
          <div className="bg-gray-200  p-8 lg:p-16">
            {/* bg-gradient-to-r from-[#8B6B6B] to-[#A9A889] */}
            <h1 className="text-4xl md:text-6xl font-light text-black mb-12">FAQS</h1>
            <div className="space-y-4">
              <p className="text-black text-sm mb-8">
                Please read our{" "}
                <Link href="#" className="underline">
                  FAQs
                </Link>{" "}
                page to find out more.
              </p>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border-b border-black/20">
                  <AccordionTrigger className="text-black hover:text-black/80 text-left">
                    What materials are used in your sofas?
                  </AccordionTrigger>
                  <AccordionContent className="text-black/80">
                    Our sofas are crafted using premium materials including high-grade hardwood frames, high-resilience
                    foam cushioning, and a variety of upholstery options.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-black/20">
                  <AccordionTrigger className="text-black hover:text-black/80 text-left">
                    How do I care for and maintain my sofa?
                  </AccordionTrigger>
                  <AccordionContent className="text-black/80">
                    Regular maintenance includes vacuuming, spot cleaning spills immediately, and rotating cushions
                    periodically.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-black/20">
                  <AccordionTrigger className="text-black hover:text-black/80 text-left">
                    Can I customize the fabric or finish of my sofa?
                  </AccordionTrigger>
                  <AccordionContent className="text-black/80">
                    Yes, we offer a wide range of customization options for fabrics and finishes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-black/20">
                  <AccordionTrigger className="text-black hover:text-black/80 text-left">
                    Are your sofas suitable for small spaces?
                  </AccordionTrigger>
                  <AccordionContent className="text-black/80">
                    We offer various sizes, including apartment-sized pieces.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-b border-black/20">
                  <AccordionTrigger className="text-black hover:text-black/80 text-left">
                    Do your sofas come with a warranty?
                  </AccordionTrigger>
                  <AccordionContent className="text-black/80">
                    Yes, all our sofas come with a comprehensive warranty.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="bg-[#A9A889] p-8 lg:p-16">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl text-white mb-2">DIDN'T FIND YOUR ANSWER?</h2>
              <p className="text-white/80 mb-8">Don't hesitate to contact us</p>

              <form className="space-y-6">
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Textarea
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-white/20 border-0 text-white placeholder:text-white/60 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                 onClick={(e) => handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                 className="bg-white text-[#A9A889] hover:bg-white/90 rounded-full px-8">
                    SEND MESSAGE</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
