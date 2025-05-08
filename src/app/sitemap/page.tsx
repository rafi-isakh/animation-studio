'use client'
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ChevronRight, MessageSquare } from "lucide-react"
import { MdStars } from "react-icons/md";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/shadcnUI/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/shadcnUI/Dialog";
import { useTheme } from '@/contexts/providers'
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/shadcnUI/Label";
import { Switch } from "@/components/shadcnUI/Switch";
import { ContactForm } from "@/components/UI/FAQ";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isLoggedIn, logout } = useAuth();
  const { dictionary, language } = useLanguage();
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async (event: React.FormEvent) => {
    event.preventDefault();
    logout(true, '/');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="md:max-w-screen-md w-full mx-auto flex flex-col bg-white dark:bg-[#121212] text-black dark:text-white p-4">
        {/* Header */}
        <header className="md:py-4 py-4">
          <h1 className="text-2xl font-bold">{phrase(dictionary, "moreOptions", language)}</h1>
        </header>
        {/* Banner */}
        {!isLoggedIn ? (
          <div className="relative w-full h-32 bg-[#FECACA] mb-4 rounded-lg">
            <Link href="/signin">
              <div className="absolute inset-0 overflow-hidden">
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black dark:text-black">
                <p className="md:text-lg text-xs mb-1">{phrase(dictionary, "signup_description", language)}</p>
                <h2 className="md:text-2xl text-lg font-bold">
                  {/* {phrase(dictionary, "toonyz", language)}{" "} */}
                  {phrase(dictionary, "do_signup", language)}
                </h2>
              </div>
            </Link>
          </div>
        ) : (
          <div className="relative w-full h-32 bg-[#FECACA] mb-4 rounded-lg">
            <Link href="/stars">
              <div className="absolute inset-0 overflow-hidden">
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black dark:text-black">
                <p className="md:text-lg text-xs mb-1">{phrase(dictionary, "charge_stars_description", language)}</p>
                <h2 className="md:text-2xl text-lg font-bold">
                  {phrase(dictionary, "charge_stars", language)}{" "}
                  <span className="inline-flex items-center justify-center bg-[#D92979] text-white w-6 h-6 rounded-full mx-1">
                    <MdStars className="text-lg md:text-xl text-white" />
                  </span>{" "}
                  {phrase(dictionary, "go_to_charge", language)}
                </h2>
              </div>
            </Link>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1">
          <MenuItem label={phrase(dictionary, "myProfile", language)} href="/my_profile" />
          <MenuItem label={phrase(dictionary, "newWebnovel", language)} href="/new_webnovel" />
          <MenuItem
            icon={
              <div className="bg-[#D92979] w-6 h-6 rounded-full flex items-center justify-center text-white font-bold">
                <MdStars className="text-lg md:text-xl text-white" />
              </div>
            }
            label={phrase(dictionary, "stars", language)}
            href="/stars"
          />
          <MenuItem label={phrase(dictionary, "redeem_code", language)} href="/stars/redeem" />
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MenuItem label={phrase(dictionary, "notice", language)} href="#" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" >
              <p>{phrase(dictionary, "preparing", language)}</p>
            </TooltipContent>
          </Tooltip> */}
          <MenuItem label={phrase(dictionary, "contact", language)} href="/faq" />
          {/* {phrase(dictionary, "theme", language)} */}
          <div className="flex flex-row items-center justify-between gap-x-3 p-4 text-base font-normal">
            <div className="flex items-center gap-1">
              <Label htmlFor="dark-mode">
                {theme === 'dark' ? <span className="text-base font-normal">{phrase(dictionary, "DarkMode", language)}</span> : <span className="text-base font-normal">{phrase(dictionary, "LightMode", language)}</span>}
              </Label>
              {theme === 'dark' ? <Sun className=" w-6 h-6" /> : <Moon className=" w-6 h-6" />}
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="data-[state=checked]:bg-pink-800 data-[state=unchecked]:bg-gray-200"
            />
          </div>

          {/* Footer */}
          {!isLoggedIn ? (
            <footer className="w-full py-4">
              <Button variant="outline" className="w-full flex items-center justify-center  border text-black hover:text-[#D92979] dark:text-white shadow-none">
                <Link href="/signin">
                  {phrase(dictionary, "do_signup", language)}
                </Link>
              </Button>
            </footer>
          ) : (
            <footer className="w-full py-4">
              <Button variant="outline" className="w-full flex items-center justify-center text-black hover:text-[#D92979]  dark:text-white shadow-none" onClick={handleSignOut}>
                {phrase(dictionary, "logout", language)}
              </Button>
            </footer>
          )}
        </nav>

        {/* Bottom Buttons */}
        <div className="w-full gap-4">
          <Dialog open={inquiryDialogOpen} onOpenChange={setInquiryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 hover:text-[#D92979] shadow-none ">
                <span>{phrase(dictionary, "inquiry", language)}</span>
                <MessageSquare size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto' showCloseButton={true}>
              <DialogHeader className='p-4' >
                <DialogTitle>
                  <p className="text-left">{phrase(dictionary, "inquiry", language)}</p>
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="w-full h-full">
                <ContactForm />
              </DialogDescription>
              <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end'>
                <Button
                  onClick={() => setInquiryDialogOpen(false)}
                  className={cn("!rounded-none flex-1 w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}
                >
                  {phrase(dictionary, "close", language)}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* <Button variant="outline" className="flex items-center justify-center gap-2  dark:bg-zinc-800 rounded-lg py-4 w-full">
            <span>공모전</span>
            <Star size={20} />
          </Button> */}
          <div className="h-[10vh]"></div>
        </div>
      </div>
    </TooltipProvider>
  )
}

interface MenuItemProps {
  label: string
  icon?: React.ReactNode
  highlighted?: boolean
  href?: string
}

function MenuItem({ label, icon, highlighted = false, href = "#" }: MenuItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between p-4 border-b border-zinc-800 text-base font-normal ${highlighted ? "bg-zinc-900" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={highlighted ? "font-bold" : ""}>{label}</span>
        {icon}
      </div>
      <ChevronRight size={20} className="text-zinc-500" />
    </Link>
  )
}

