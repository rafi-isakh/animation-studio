"use client"

import React, { useState, createContext, useContext } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import {
  ChevronFirst,
  FolderOpen,
  Wand2,
  LogOut,
  Settings,
  Globe,
  Shield,
} from "lucide-react"
import Image from "next/image"
import { useMithrilAuth } from '@/components/Mithril/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { langPairList } from '@/utils/phrases';
import { Language } from '@/components/Types';

interface SidebarContextType {
  expanded: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
});

export function MithrilSidebar() {
  const pathname = usePathname();
  const { dictionary, language } = useLanguage();
  const { isAdmin } = useMithrilAuth();

  return (
    <Sidebar>
      {isAdmin && (
        <SidebarItem
          icon={<Shield size={20} />}
          text={phrase(dictionary, "sidebar_admin", language) || "Admin"}
          active={pathname.startsWith('/mithril/admin')}
          href="/mithril/admin"
        />
      )}
      <SidebarItem
        icon={<FolderOpen size={20} />}
        text={phrase(dictionary, "sidebar_projects", language) || "Projects"}
        active={pathname === '/projects' || pathname === '/'}
        href="/projects"
      />
      <SidebarItem
        icon={<Wand2 size={20} />}
        text={phrase(dictionary, "sidebar_mithril", language) || "Mithril"}
        active={pathname.startsWith('/mithril') && !pathname.startsWith('/mithril/admin')}
        href="/mithril"
      />
    </Sidebar>
  )
}

function SidebarItem({ icon, text, active, href }: {
  icon: React.ReactNode,
  text: string,
  active: boolean,
  href: string,
}) {
  const { expanded } = useContext(SidebarContext)

  return (
    <Link href={href}>
      <li className={`relative flex items-center py-2 px-6 my-1 font-medium
                    rounded-md cursor-pointer transition-colors group whitespace-nowrap
                    ${active
                      ? "bg-gradient-to-tr from-pink-100 to-pink-100 text-[#DE2B74]"
                      : "text-gray-400 hover:bg-gray-50 dark:hover:bg-black/50"
                    }`}>
        <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
          {icon}
          <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>
            {text}
          </span>
        </div>
        {!expanded && (
          <span className={`absolute w-fit rounded-md px-2 py-1 ml-12
                     bg-[#707070] text-white whitespace-nowrap
                      text-sm invisible opacity-20 group-hover:visible
                      -translate-x-3 transition-all duration-75 ease-in-out
                      group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
            {text}
          </span>
        )}
      </li>
    </Link>
  )
}

function Sidebar({ children }: { children: React.ReactNode }) {
  const { language, dictionary, setLanguageOverride } = useLanguage();
  const { user, logout, isAuthenticated } = useMithrilAuth();
  const [expanded, setExpanded] = useState(false);
  const [openLanguageDialog, setOpenLanguageDialog] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguageOverride(lang);
    setOpenLanguageDialog(false);
  };

  return (
    <>
      <aside className={`flex h-full flex-col md:z-[1300] transition-all duration-300 ease-in-out
                   fixed left-0 top-0 border-r dark:border-black text-base
                  border-gray-200 bg-white dark:bg-[#211F21] ${expanded ? "w-[240px]" : "w-[72px]"}`}>
        <div className="flex h-16 items-center justify-center">
          <div className={`flex flex-row items-center justify-between ${expanded ? "gap-10" : "gap-0"}`}>
            <Link href="/projects">
              {expanded && (
                <Image
                  src='/toonyz_logo_white.svg'
                  alt="Toonyz Logo"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "inline-flex" : "hidden"}`}
                  width={100}
                  height={30}
                />
              )}
            </Link>
            <button
              onClick={() => setExpanded((curr) => !curr)}
              className="self-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] hover:text-black dark:hover:text-gray-100"
            >
              {expanded ? (
                <ChevronFirst />
              ) : (
                <Image
                  src='/images/N_logo.svg'
                  alt="N_logo"
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  width={30}
                  height={30}
                  style={{
                    backgroundColor: 'white',
                    borderColor: 'white',
                    border: '1px solid white',
                    borderRadius: "20%",
                    padding: "5px",
                  }}
                />
              )}
            </button>
          </div>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <nav className="flex flex-1 flex-col gap-y-4 pt-4">
            {children}

            {/* Settings section at bottom */}
            <div className="flex flex-col gap-y-2 mt-auto pb-10">
              {/* Language button */}
              <button
                onClick={() => setOpenLanguageDialog(true)}
                className={`relative flex items-center py-2 px-6 my-1 font-medium
                          rounded-md cursor-pointer transition-colors group whitespace-nowrap
                          text-gray-400 hover:bg-gray-50 dark:hover:bg-black/50`}
              >
                <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
                  <Globe size={20} />
                  <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>
                    {phrase(dictionary, "language", language) || "Language"}
                  </span>
                </div>
                {!expanded && (
                  <span className={`absolute w-fit rounded-md px-2 py-1 ml-12
                             bg-[#707070] text-white whitespace-nowrap
                              text-sm invisible opacity-20 group-hover:visible
                              -translate-x-3 transition-all duration-75 ease-in-out
                              group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
                    {phrase(dictionary, "language", language) || "Language"}
                  </span>
                )}
              </button>

              {/* Logout button (only if authenticated) */}
              {isAuthenticated && (
                <button
                  onClick={() => logout()}
                  className={`relative flex items-center py-2 px-6 my-1 font-medium
                            rounded-md cursor-pointer transition-colors group whitespace-nowrap
                            text-gray-400 hover:bg-gray-50 dark:hover:bg-black/50`}
                >
                  <div className={`flex items-center ${expanded ? "" : "justify-center w-full"}`}>
                    <LogOut size={20} />
                    <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}`}>
                      {phrase(dictionary, "logout", language) || "Logout"}
                    </span>
                  </div>
                  {!expanded && (
                    <span className={`absolute w-fit rounded-md px-2 py-1 ml-12
                               bg-[#707070] text-white whitespace-nowrap
                                text-sm invisible opacity-20 group-hover:visible
                                -translate-x-3 transition-all duration-75 ease-in-out
                                group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
                      {phrase(dictionary, "logout", language) || "Logout"}
                    </span>
                  )}
                </button>
              )}

              {/* User info when expanded */}
              {expanded && isAuthenticated && user && (
                <div className="px-6 py-2 text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              )}
            </div>
          </nav>
        </SidebarContext.Provider>
      </aside>

      {/* Language Dialog */}
      <Dialog open={openLanguageDialog} onOpenChange={setOpenLanguageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{phrase(dictionary, "language", language) || "Language"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {langPairList.map((langPair) => (
              <Button
                key={langPair.code}
                variant={language === langPair.code ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleLanguageChange(langPair.code as Language)}
              >
                {langPair.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MithrilSidebar;