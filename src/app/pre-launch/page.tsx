import CountdownTimer from "@/components/UI/preLaunch/CountdownTimer"
// import EmailSignup from "@/components/UI/preLaunch/EmailSignup"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:p-24 p-10 font-pretendard">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="mb-4 text-4xl font-extrabold leading-none 
                      tracking-tight text-gray-900
                       md:text-5xl lg:text-6xl dark:text-white">
          Coming Soon: Toonyz App
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
          Get ready for something amazing! 
          We&apos;re working hard to bring you the best experience possible.
        </p>
        <CountdownTimer targetDate="2025-04-30T23:59:59" />
        {/* <EmailSignup /> */}
      </div>
    </main>
  )
}

