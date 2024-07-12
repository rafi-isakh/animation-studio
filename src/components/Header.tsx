"use client"

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SearchComponent from '@/components/SearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/components/Types';
import { useRouter } from 'next/navigation';

const Header = () => {

  const router = useRouter();
  const { setIsLoggedIn } = useAuth();
  const { isLoggedIn } = useAuth();
  const { language, setLanguage } = useLanguage();

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

  const handleLanguageChange = ( language: Language ) => {
    setLanguage(language);
    window.location.reload();
  }

  return (
    <div className='fixed top-0 left-0 right-0 dark z-50'>
      <nav className="bg-white border-gray-200 dark:bg-black dark:border-gray-700">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src="/toonyz_logo_pink.svg" className="h-8" alt="Stelland Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white"></span>
          </a>
          <button data-collapse-toggle="navbar-dropdown" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-dropdown" aria-expanded="false">
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
          <div className="hidden w-full md:block md:w-auto" id="navbar-dropdown">
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-black dark:border-gray-700">
              <li>
                <SearchComponent />
              </li>
              <li>
                <a href="/news" className="flex block px-4 py-2 text-black rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:w-auto dark:text-white md:dark:hover:text-pink-500 dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-700 md:dark:hover:bg-transparent">
                  <i className="fas fa-newspaper"></i></a>
              </li>
              <li className="py-2">
                <button id="dropdownNavbarLink" data-dropdown-toggle="dropdownNavbarLanguage" className="block px-4 py-5 flex items-center justify-between w-full text-black rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:p-0 md:w-auto dark:text-white md:dark:hover:text-pink-500 dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-700 md:dark:hover:bg-transparent">
                  <i className="fa-solid fa-globe"></i>
                  <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg></button>
                <div id="dropdownNavbarLanguage" className="z-10 hidden font-normal bg-white divide-y divide-gray-100 shadow w-44 dark:bg-black dark:divide-gray-600">
                  <ul className="py-2 text-sm text-gray-700 dark:text-gray-400" aria-labelledby="dropdownLargeButton">
                    <li>
                        <a href="#" onClick={() => handleLanguageChange('ko')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                        한국어
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={() => handleLanguageChange('en')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                        English
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={() => handleLanguageChange('ja')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                        日本語
                        </a>
                    </li>
                    <li>
                        <a href="#" onClick={() => handleLanguageChange('ar')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                        العربية
                        </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="py-2">
                <button id="dropdownNavbarLink" data-dropdown-toggle="dropdownNavbar" className="block px-4 py-5 flex items-center justify-between w-full text-black rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:p-0 md:w-auto dark:text-white md:dark:hover:text-pink-500 dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-700 md:dark:hover:bg-transparent">
                  <i className="fa-solid fa-user"></i>
                  <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg></button>
                <div id="dropdownNavbar" className="z-10 hidden font-normal bg-white divide-y divide-gray-100 shadow w-44 dark:bg-black dark:divide-gray-600">
                  <ul className="py-2 text-sm text-gray-700 dark:text-gray-400" aria-labelledby="dropdownLargeButton">
                    {isLoggedIn ?
                      <li>
                        <a href="/new_webnovel" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">새 작품</a>
                      </li> : <main></main>
                    }
                    {isLoggedIn ?
                      <li>
                        <a href="/my_webnovels" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">내 작품</a>
                      </li> : <main></main>
                    }
                    {isLoggedIn ?
                      <li>
                        <a href="/library" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">내 서재</a>
                      </li> : <main></main>
                    }
                    {isLoggedIn ?
                      <li>
                        <a href="/profile" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">계정설정</a>
                      </li> : <main></main>
                    }
                    {isLoggedIn ?
                      <li>
                        <a href="#" onClick={handleSignOut} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">로그아웃</a>
                      </li> :
                      <li>
                        <a href="/signin" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">로그인</a>
                      </li>}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
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