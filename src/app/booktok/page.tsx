"use client"

import { EmailSignupPage } from "@/components/UI/booktok/EmailSignupPage"
import Footer from "@/components/Footer"
import Image from "next/image"
const backgroundStyle = `
  .bg-pattern {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
  }
`

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(to right, #FFF, #e0e0e0)",
      }}
    >
      <section className="w-full h-full flex justify-center items-center mx-auto py-10">
      
      </section>
      <style jsx global>
        {backgroundStyle}
      </style>

      <div className="bg-pattern"></div>
      <div className="content w-full">
  
        <EmailSignupPage />
      </div>
      
      <Footer />
    </div>
  )
}
