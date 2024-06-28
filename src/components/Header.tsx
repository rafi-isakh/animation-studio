"use client"

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import Image from "next/image"
import SearchComponent from '@/components/SearchComponent';

const Header = () => {
  
  const { setIsLoggedIn } = useAuth();
  const { isLoggedIn } = useAuth();

  const handleSignOut = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/signout', {
        method: 'POST',
      });
      if (response.ok) {
        setIsLoggedIn(false);
        window.location.href = '/';
      } else {
        console.error('Failed to sign out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
      <nav className="bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <img src="/logo.png" className="h-8" alt="Stelland Logo" />
              <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Stelland Webnovels</span>
          </a>
          <button data-collapse-toggle="navbar-dropdown" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-dropdown" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
              </svg>
          </button>
          <div className="hidden w-full md:block md:w-auto" id="navbar-dropdown">
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <SearchComponent/>
              </li>
              <li>
                <a href="/mynovels" className="flex block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">내 작품</a>
              </li>
              <li className="py-2">
                <button id="dropdownNavbarLink" data-dropdown-toggle="dropdownNavbar" className="block px-4 py-5 flex items-center justify-between w-full text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:p-0 md:w-auto dark:text-white md:dark:hover:text-pink-500 dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-700 md:dark:hover:bg-transparent">계정<svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
        </svg></button>
                  <div id="dropdownNavbar" className="z-10 hidden font-normal bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
                      <ul className="py-2 text-sm text-gray-700 dark:text-gray-400" aria-labelledby="dropdownLargeButton">
                        {isLoggedIn? <li>
                          <a onClick={handleSignOut} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">로그아웃</a>
                        </li>:
                        <li>
                          <a href="/signin" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">로그인</a>
                        </li>}
                        {isLoggedIn?
                        <li>
                          <a href="/profile" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">프로필</a>
                        </li>:<main></main>
                        }
                      </ul>
                  </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>

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

/*
<div>
<nav className="flex flex-row-reverse space-x-4 space-x-reverse m-4">
    <Link href={isLoggedIn ? '/profile' : '/signin'}>
        {isLoggedIn ? '프로필' : '로그인'}
    </Link>
    <div>언어 선택</div>
    <div>검색</div>
</nav>
<Link href="/"><Image className="m-4" src="/logo.png" alt="Stelland Logo" width={100} height={100}/></Link>

</div>
*/

export default Header;