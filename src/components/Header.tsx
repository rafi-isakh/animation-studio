"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import Image from "next/image"

const Header = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div>
        <nav className="flex flex-row-reverse space-x-4 space-x-reverse m-4">
            <Link href={isLoggedIn ? '/profile' : '/signin'}>
                {isLoggedIn ? '프로필' : '로그인'}
            </Link>
            <div>언어 선택</div>
            <div>검색</div>
        </nav>
        <Link href="/"><Image className="m-4" src="/logo.png" alt="Stelland Logo" width={100} height={100}/></Link>
        <div className="flex space-x-4 m-4">
            <div className="text-xl">로판</div>
            <div className="text-xl">로맨스</div>
            <div className="text-xl">BL</div>
            <div className="text-xl">현판</div>
            <div className="text-xl">게임물</div>
        </div>
    </div>
  );
};

export default Header;