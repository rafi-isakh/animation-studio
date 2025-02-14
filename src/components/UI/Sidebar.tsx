"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Search, LibraryBig, LayoutGrid, SquarePlus, Bell, Gift, Settings } from "lucide-react"
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

export function Sidebar() {
  const pathname = usePathname()
  const { language, dictionary } = useLanguage();
  const { theme, toggleTheme } = useTheme()
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);
  const { isLoggedIn, loading, logout } = useAuth();
  const { email, nickname } = useUser();
  const isLoggedInAndRegistered = !!(isLoggedIn && email); 

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
    // { name: "Notifications", component: <NotificationButton />, icon: Bell },
  ]

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPopoverAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setPopoverAnchor(null);
  };

  const open = Boolean(popoverAnchor);

  return (
    <div className="flex h-full w-[72px] flex-col z-[99]
    fixed left-0 top-0 border-r dark:border-black
     border-gray-200 bg-white dark:bg-[#211F21]">
      {/* darkmode bg-[#211F21] */}
      <div className="flex h-16 items-center justify-center">
        <Link href="/?version=premium">
          <Image
            src='/images/N_logo.svg' alt="N_logo"
            width={30}
            height={30}
            style={{
              backgroundColor: `${theme === 'dark' ? 'white' : 'white'}`,
              borderColor: `${theme === 'dark' ? 'white' : '#e5e7eb'}`,
              border: `1px solid ${theme === 'dark' ? 'white' : '#e5e7eb'}`,
              borderRadius: "20%",
              padding: "5px",
            }} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-y-4 pt-4">
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
            <Setting isLoggedInAndRegistered={isLoggedInAndRegistered}/>
          </div>
        </div>
      </nav>
    </div>
  )
}

