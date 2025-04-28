'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/shadcnUI/Button"
import { Input } from "@/components/shadcnUI/Input"
import { Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/shadcnUI/Avatar"


export function EmailForm() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const [clickCount, setClickCount] = useState(11)

  useEffect(() => {
    // Get the stored count on component mount
    const storedCount = localStorage.getItem('waitlistCount')
    if (storedCount) {
      setClickCount(parseInt(storedCount))
    }
  }, [])

  const updateClickCount = (newCount: number) => {
    setClickCount(newCount)
    localStorage.setItem('waitlistCount', newCount.toString())
  }

  const handleSubmit = async (formData: FormData) => {
    await sendNotification(formData)
    await sendEmail(formData)
    const newCount = clickCount + 1
    updateClickCount(newCount)
  }

  const sendNotification = async (formData: FormData) => {
    const email = 'dami@stelland.io, ellie@stelland.io'
    const subject = 'BookTok Creator Campaign signup notification'
    const message = `New signup: ${email}`
    const response = await fetch('/api/send_email', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        subject, 
        message,
        templateType: 'staff'
      })
    })
    if (response.ok) {
      toast({
        title: "Success!",
        variant: "success",
        description: "We got your email! we will be in touch very soon!",
      })
    } else {
      toast({
        title: "Error!",
        variant: "destructive",
        description: "Email not sent",
      })
    }
  }

  const sendEmail = async (formData: FormData) => {
    const email = formData.get('email') as string
    const subject = 'BookTok Creator Campaign signup notification'
    const message = `New signup: ${email}`
    const response = await fetch('/api/send_email', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        subject, 
        message,
        templateType: 'creator'
      })
    })
    if (response.ok) {
      toast({
        title: "Success!",
        variant: "success",
        description: "Email sent successfully",
      })
    } else {
      toast({
        title: "Error!",
        variant: "destructive",
        description: "Email not sent",
      })
    }
  }

  return (
    <div>
      <form action={handleSubmit} className="w-full md:max-w-screen-sm mx-auto space-y-4 mb-8">
        <div className="flex overflow-hidden rounded-xl bg-white/5 p-1 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-blue-500 border-2 border-[#DE2E8A] dark:border-[#DE2E8A]">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby="email-error"
            className="w-full border-0 bg-transparent text-black dark:text-white placeholder:text-gray-400 focus:ring-0 focus:border-transparent focus-visible:border-transparent focus:outline-none active:ring-0 active:outline-none focus-visible:ring-0 focus-visible:outline-none active:border-transparent focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="bg-black hover:bg-gray-800 text-white font-semibold px-4 rounded-xl transition-all duration-300 ease-in-out focus:outline-none w-fit"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Join BookTok'
            )}
          </Button>
        </div>
      </form>

      <div>
        <div className="flex items-center justify-center mt-8">
          <div className="flex -space-x-2 mr-4">
            <Avatar>
              <AvatarFallback className="bg-gray-200">
                I
              </AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-gray-200">
                K
              </AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-gray-200">
                P
              </AvatarFallback>
            </Avatar>
          </div>
          <p className="text-black font-semibold">{clickCount}+ people on the waitlist</p>
        </div>
      </div>
    </div>
  )
}
