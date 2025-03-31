'use client'
import type React from "react"
import Link from "next/link"
import { ChevronRight, MessageSquare, Star } from "lucide-react"
import { MdStars } from "react-icons/md";
import { useAuth, logout } from "@/contexts/AuthContext";

const handleSignOut = async (event: React.FormEvent) => {
  event.preventDefault();
  logout(true, '/');
};

export default function Home() {
  const { isLoggedIn } = useAuth();
  return (
    <div className="md:max-w-screen-md w-full mx-auto flex flex-col min-h-screen bg-white dark:bg-[#121212] text-black dark:text-white p-4">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold">더보기</h1>
      </header>

      {/* Banner */}
      { !isLoggedIn ? <div className="relative w-full h-32 bg-[#FECACA] mb-4 rounded-lg">
        <Link href="/signin">
          <div className="absolute inset-0 overflow-hidden">
            {/* Bitcoin icons as decorative elements */}
            <div className="absolute top-2 left-2 w-12 h-12 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute bottom-4 left-8 w-8 h-8 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute bottom-8 right-2 w-6 h-6 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute right-16 top-2 w-8 h-8 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black dark:text-black">
            <p className="text-lg mb-1">회원 가입 하고 무료로 별 받아가세요!</p>
            <h2 className="text-2xl font-bold">
              투니즈{" "}
              <span className="inline-flex items-center justify-center bg-[#D92979] text-white w-8 h-8 rounded-full mx-1">
                <MdStars className="text-lg md:text-xl text-white" />
              </span>{" "}
              회원가입하기
            </h2>
          </div>
        </Link>
      </div> : <div className="relative w-full h-32 bg-[#FECACA] mb-4 rounded-lg">
        <Link href="/signin">
          <div className="absolute inset-0 overflow-hidden">
            {/* Bitcoin icons as decorative elements */}
            <div className="absolute top-2 left-2 w-12 h-12 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute bottom-4 left-8 w-8 h-8 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute top-4 right-4 w-10 h-10 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute bottom-8 right-2 w-6 h-6 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
            <div className="absolute right-16 top-2 w-8 h-8 bg-[#D92979] rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black dark:text-black">
            <p className="text-lg mb-1">회원 가입 하고 무료로 별 받아가세요!</p>
            <h2 className="text-2xl font-bold">
              별 충전{" "}
              <span className="inline-flex items-center justify-center bg-[#D92979] text-white w-8 h-8 rounded-full mx-1">
                <MdStars className="text-lg md:text-xl text-white" />
              </span>{" "}
              하러가기
            </h2>
          </div>
        </Link>
      </div>}

      {/* Menu Items */}
      <nav className="flex-1">
        <MenuItem
          icon={
            <div className="bg-[#D92979] w-6 h-6 rounded-full flex items-center justify-center text-white font-bold">
              <MdStars className="text-lg md:text-xl text-white" />
            </div>
          }
          label="별 충전하기"
        />
        {/* <MenuItem label="이벤트" />
        <MenuItem label="게임" /> */}
        <MenuItem label="쿠폰등록" />
        <MenuItem label="공지사항" />
        <MenuItem label="고객센터" />
        {/* Footer */}
        { !isLoggedIn ? <footer className="p-4 border-none text-black dark:text-white">
          <div className="flex items-center justify-center">
            <Link href="/signin" className="text-[#D92979]">
              로그인 · 회원가입
            </Link>
          </div>
        </footer> : <footer className="p-4 border-none text-black dark:text-white">
          <div className="flex items-center justify-center">
            <Link href="#" onClick={handleSignOut} className="text-[#D92979]">
              로그아웃
            </Link>
          </div>
        </footer>}
      </nav>


      {/* Bottom Buttons */}
      {/* <div className="grid grid-cols-2 gap-4 p-4">
        <Link href="#" className="flex items-center justify-center gap-2 bg-zinc-800 rounded-lg p-4">
          <span>연재문의</span>
          <MessageSquare size={20} />
        </Link>
        <Link href="#" className="flex items-center justify-center gap-2 bg-zinc-800 rounded-lg p-4">
          <span>공모전</span>
          <Star size={20} />
        </Link>
      </div> */}


    </div>
  )
}

interface MenuItemProps {
  label: string
  icon?: React.ReactNode
  highlighted?: boolean
}

function MenuItem({ label, icon, highlighted = false }: MenuItemProps) {
  return (
    <Link
      href="#"
      className={`flex items-center justify-between p-4 border-b border-zinc-800 ${highlighted ? "bg-zinc-900" : ""}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className={highlighted ? "font-bold" : ""}>{label}</span>
      </div>
      <ChevronRight size={20} className="text-zinc-500" />
    </Link>
  )
}

