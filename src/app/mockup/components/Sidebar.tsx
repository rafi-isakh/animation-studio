"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, LibraryBig, LayoutGrid, SquarePlus, Palette, Bell, Settings } from "lucide-react"
import Image from "next/image"

const navigation = [
  { name: "Home", href: "/", icon: Search },
  { name: "Get started", href: "/get-started", icon: LibraryBig },
  { name: "Develop", href: "/develop", icon: LayoutGrid },
  { name: "Foundations", href: "/foundations", icon: SquarePlus },
  { name: "Components", href: "/components", icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-[72px] flex-col fixed left-0 top-0 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-center">
        <Link href="/mockup">
          <Image
            src='/images/N_logo.svg' alt="N_logo"
            width={30}
            height={30}
            style={{
              borderColor: "#e5e7eb",
              border: "1px solid #e5e7eb",
              borderRadius: "20%",
              padding: "5px",
            }} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-y-4 pt-4">
        <div className="flex flex-col justify-between h-full">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex h-14 items-center justify-center 
                  hover:bg-gray-50 ${pathname === item.href ? "bg-gray-50" : ""}
                  `}
              >
                <Icon className={"h-6 w-6 text-gray-400"} />
              </Link>
            )
          })}
          <div className="mt-auto pb-10">
            <div className="flex items-center justify-center ">
              <Link href="#" className={`flex h-14 w-full items-center justify-center hover:bg-gray-50 `} >
                <Settings className="h-6 w-6 text-gray-400 hover:bg-gray-50" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

    </div>
  )
}

