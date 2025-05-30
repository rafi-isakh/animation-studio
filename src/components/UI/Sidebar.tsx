"use client"

import React, { useState, createContext, useContext, useEffect, } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import {
  LibraryBig,
  LayoutGrid,
  SquarePlus,
  Bell,
  Gift,
  ChevronFirst,
  Home,
  TvMinimalPlay,
} from "lucide-react"
import Image from "next/image"
import { useTheme } from "@/contexts/providers"
import Setting from '@/components/UI/Setting';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import UserProfileButton from '@/components/UI/UserProfileButton';
import NotificationButton from '@/components/UI/NotificationButton';

interface SidebarContextType {
  expanded: boolean;
  isLoggedInAndRegistered: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
  isLoggedInAndRegistered: false
});


export function GlobalSidebar() {
  const pathname = usePathname();
  const { dictionary, language } = useLanguage();

  return (
    <Sidebar>
      <SidebarItem
        icon={<Home />}
        text={phrase(dictionary, "sidebar_home", language)}
        active={pathname === '/'}
        alert={false}
        href="/"
        type="link"
      />
      <SidebarItem
        icon={<TvMinimalPlay />}
        text={phrase(dictionary, "sidebar_shorts", language)}
        active={pathname.startsWith('/shorts')}
        alert={false}
        href="/shorts"
        type="link"
      />
      <SidebarItem
        icon={<LayoutGrid />}
        text={phrase(dictionary, "sidebar_feed", language)}
        active={pathname.startsWith('/feed')}
        alert={false}
        href="/feed"
        type="link"
      />
      <SidebarItem
        icon={<SquarePlus />}
        text={phrase(dictionary, "sidebar_create", language)}
        active={pathname.startsWith('/new_webnovel')}
        alert={false}
        href="/new_webnovel"
        type="link"
      />
      <SidebarItem
        icon={<Gift />}
        text={phrase(dictionary, "sidebar_shop", language)}
        active={pathname.startsWith('/stars')}
        alert={false}
        href="/stars"
        type="link"
      />
     
    </Sidebar>
  )
}

export function SidebarItem({ icon, text, active, alert, href, type }:
  {
    icon: React.ReactNode,
    text: string,
    active: boolean,
    alert: boolean,
    href: string,
    type: string
  }) {
  const { expanded, isLoggedInAndRegistered } = useContext(SidebarContext)
  if (type === "link") {
    return (
      <Link
        key={text}
        href={href ?? ""}
      >
        <li className={`relative flex items-center py-2 px-6 my-1 font-medium 
                      rounded-md cursor-pointer transition-colors group whitespace-nowrap
                      ${active ? "bg-gradient-to-tr from-pink-100 to-pink-100 text-[#DE2B74]"
                    : "text-gray-400 hover:bg-gray-50 dark:hover:bg-black/50"}`}>
          <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
            {icon}
            <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>{text}</span>
          </div>
          {alert && (
            <div className={`absolute right-2 w-2 h-2 rounded bg-[#DE2B74] ${expanded ? "" : "top-2"}`}>
            </div>
          )}
          {!expanded && (
            // Tooltip
            <span className={`absolute w-fit rounded-md px-2 py-1 ml-12
                       bg-[#707070] text-white whitespace-nowrap
                        text-sm invisible opacity-20 group-hover:visible
                        -translate-x-3 transition-all duration-75 ease-in-out  
                        group-hover:opacity-100 group-hover:translate-x-0`}>
              {text}
            </span>
          )}
        </li>
      </Link>
    )
  }
  if (type === "component") {
    return isLoggedInAndRegistered ? (
      <li className="relative flex rounded-md items-center w-full">
        <NotificationButton expanded={expanded} alert={alert} />
      </li>
    ) : null;
  }
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { language, dictionary } = useLanguage();
  const { theme, toggleTheme } = useTheme()
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
  const { isLoggedIn, loading, logout } = useAuth();
  const { email, nickname } = useUser();
  const isLoggedInAndRegistered = !!(isLoggedIn && email);
  const [expanded, setExpanded] = useState(false)

  const open = Boolean(popoverAnchor);


  const hideSidebarInPages = () => {
    if (pathname.startsWith('/writing-class')) {
      return "hidden"
    }
    return ""
  }

  return (
    <>
      <aside className={`flex h-full flex-col md:z-[1300] transition-all duration-300 ease-in-out
                     fixed left-0 top-0 border-r dark:border-black text-base
                    border-gray-200 bg-white dark:bg-[#211F21] ${expanded ? "w-[240px]" : "w-[72px]"} ${hideSidebarInPages()}`}>
        {/* side bar z-[1300] because chapter_view/viewer_footer.tsx z-index is 1250 */}
        {/* darkmode color bg-[#211F21] */}
        <div className="flex h-16 items-center justify-center">
          <div className={`flex flex-row items-center justify-between ${expanded ? "gap-10" : "gap-0"}`}>
            <Link href="/">
              {expanded && <Image
                src={theme === 'dark' ? '/toonyz_logo_white.svg' : '/toonyz_logo_pink.svg'}
                alt="N_logo"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "inline-flex" : "hidden"}`}
                width={100}
                height={30}
              />}
            </Link>
            <button onClick={() => setExpanded((curr) => !curr)} className="self-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] hover:text-black dark:hover:text-gray-100">
              {expanded ? <ChevronFirst className='' />
                : <Image
                  src='/images/N_logo.svg'
                  alt="N_logo"
                  className={`overflow-hidden transition-all duration-300 ease-in-out `} //${expanded ? "hidden" : "inline-flex"}
                  width={30}
                  height={30}
                  style={{
                    backgroundColor: `${theme === 'dark' ? 'white' : 'white'}`,
                    borderColor: `${theme === 'dark' ? 'white' : '#e5e7eb'}`,
                    border: `1px solid ${theme === 'dark' ? 'white' : '#e5e7eb'}`,
                    borderRadius: "20%",
                    padding: "5px",
                  }} />
              }
            </button>
          </div>
        </div>
        <SidebarContext.Provider value={{ expanded, isLoggedInAndRegistered: isLoggedInAndRegistered ?? false }}>
          <nav className="flex flex-1 flex-col gap-y-4 pt-4">
            {children}
            {/* Setting btn */}
            <div className="flex flex-col gap-y-4 mt-auto pb-10">
              {isLoggedInAndRegistered ? ( 
              <div className='flex items-center justify-center'>
                <UserProfileButton expanded={expanded} mode='sidebar' className='text-gray-400 dark:text-white whitespace-nowrap' />
              </div> ): <></>
              }
              <Setting isLoggedInAndRegistered={isLoggedInAndRegistered} expanded={expanded} />
            </div>
          </nav>
        </SidebarContext.Provider>
      </aside>
    </>
  )
}
