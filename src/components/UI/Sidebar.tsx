"use client"

import React, { useState, createContext, useContext, } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import {
  Search,
  LibraryBig,
  LayoutGrid,
  SquarePlus,
  Bell,
  Gift,
  ChevronFirst,
  ChevronLast,
  MoreVertical,
  Home
} from "lucide-react"
import Image from "next/image"
import { useTheme } from "@/contexts/providers"
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Setting from '@/components/UI/Setting';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import UserProfileButton from '@/components/UI/UserProfileButton';
import NotificationButton from '@/components/UI/NotificationButton';

interface SidebarContextType {
  expanded: boolean;
}

const SidebarContext = createContext<SidebarContextType>({ expanded: false });


export function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarItem icon={<Home />} text="Home" active={true} alert={false} href="/" />
      <SidebarItem
        icon={<Search />}
        text="Search"
        active={pathname.startsWith('/stars')}
        alert={false}
        href="/search"
      />
      <SidebarItem
        icon={<Gift />}
        text="Shop"
        active={pathname.startsWith('/stars')} // This will match /library and its subpaths
        alert={false}
        href="/stars"
      />
    </Sidebar>
  )
}

export function SidebarItem({ icon, text, active, alert, href }:
  { icon: React.ReactNode, text: string, active: boolean, alert: boolean, href: string }) {
  const { expanded } = useContext(SidebarContext)
  return (
    <Link
      key={text}
      href={href ?? ""}
    >
      <li className={`relative flex items-center py-2 px-5 my-1 font-medium 
                    rounded-md cursor-pointer transition-colors group 
                   ${active ? "bg-gradient-to-tr from-pink-100 to-pink-100 text-[#DE2B74]"
          : "hover:bg-indigo-50 text-gray-400"}`}>
        {icon}
        <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>{text}</span>
        {alert && (
          <div className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${expanded ? "" : "top-2"}`}>
          </div>
        )}

        {!expanded && (
          <div className={`absolute left-full rounded-md px-2 py-1 ml-6
                       bg-pink-200 text-indigo-800 
                        text-sm invisible opacity-20 
                        -translate-x-3 transition-all group-hover:visible 
                        group-hover:opacity-100 group-hover:translate-x-0`}>
            {text}
          </div>
        )}
      </li>
    </Link>
  )
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

  const navigation = [
    { name: "Search", href: "/search", icon: Search },
    { name: "Explore", href: "#", icon: LibraryBig },
    { name: "Feeds", href: "#", icon: LayoutGrid },
    { name: "Create", href: "#", icon: SquarePlus },
    { name: "Gift Shop", href: "/stars", icon: Gift },

    ...(isLoggedInAndRegistered ? [
      {
        name: "Notifications",
        type: "component",
        component: NotificationButton,
        icon: Bell
      }
    ] : []),
  ]

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopoverAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setPopoverAnchor(null);
  };

  const open = Boolean(popoverAnchor);

  return (
    <>
      <aside className={`flex h-full w-[72px] flex-col z-[99] transition-all duration-300 ease-in-out
                    fixed left-0 top-0 border-r dark:border-black
                    border-gray-200 bg-white dark:bg-[#211F21] ${expanded ? "w-[240px]" : "w-[72px]"}`}>
        {/* darkmode bg-[#211F21] */}
        <div className="flex h-16 items-center justify-center">
          <div className={`flex flex-row items-center justify-between ${expanded ? "gap-10" : "gap-0"}`}>
            <Link href="/?version=premium">
              {expanded && <Image
                src={theme === 'dark' ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
                alt="N_logo"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "inline-flex" : "hidden"}`}
                width={100}
                height={30}
              />}
            </Link>
            <button onClick={() => setExpanded((curr) => !curr)} className="self-center rounded-lg hover:bg-gray-100">
              {expanded ? <ChevronFirst /> : <Image
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
                }} />}
            </button>
          </div>
        </div>
        <SidebarContext.Provider value={{ expanded }}>
          <nav className="flex flex-1 flex-col gap-y-4 pt-4">
            {children}

            <div className="flex flex-col justify-between h-full">
              {navigation.map((item) => {
                const Icon = item.icon
                if (item.type === 'component') {
                  return (
                    <Tooltip
                      key={item.name}
                      arrow
                      title={item.name}
                      placement="right"
                      slotProps={{
                        popper: {
                          modifiers: [
                            {
                              name: 'offset',
                              options: {
                                offset: [0, -14],
                              },
                            },
                          ],
                          [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]: {
                            margin: '0px',
                          },
                        },
                      }}
                    >
                      <div className='flex h-14 rounded-md justify-center items-center w-full'>
                        <NotificationButton />
                      </div>
                    </Tooltip>
                  )
                }
                return (
                  <Tooltip
                    key={item.name}
                    arrow
                    title={item.name}
                    placement="right"
                    slotProps={{
                      popper: {
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [0, -14],
                            },
                          },
                        ],
                        [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
                        {
                          margin: '0px',
                        },
                      },
                    }}>
                    <Link
                      key={item.name}
                      href={item.href ?? ""}
                      className={`flex h-14 items-center justify-center rounded-md
                  hover:bg-gray-50 dark:hover:bg-black/50 
                  ${pathname === item.href ? "bg-gray-50 dark:bg-black/50" : ""}
                  `}
                    >
                      <Icon className={"h-6 w-6 text-gray-400"} />
                    </Link>
                  </Tooltip>
                )
              })}
              {/* Setting btn */}
              <div className="flex flex-col gap-y-4 mt-auto pb-10">
                {isLoggedInAndRegistered ? <div className='flex justify-center items-center'>
                  <UserProfileButton />
                </div> : <></>}
                <Setting isLoggedInAndRegistered={isLoggedInAndRegistered} />
              </div>
            </div>

          </nav>
        </SidebarContext.Provider>
      </aside>
    </>
  )
}
