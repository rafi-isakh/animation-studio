"use client"

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import Image from "next/image"

const Header = () => {
  
  const { setIsLoggedIn } = useAuth();
  const { isLoggedIn } = useAuth();

  const [themeMenuOpened, setThemeMenuOpened] = useState(false);
  const themeMenu = useRef(null);
  const themeMenuButton = useRef(null);
  useEffect(() => {
    if (!themeMenuOpened) {
      document.activeElement.blur();
    } else if (
      themeMenuOpened &&
      !themeMenu.current.contains(document.activeElement)
    ) {
      setThemeMenuOpened(false);
    }
  }, [themeMenuOpened]);

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
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">Stella& Webnovels</Link>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />
        </div>
        <div ref={themeMenu} className="dropdown dropdown-end">
          <div ref={themeMenuButton} tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar"
            onBlur={(e) => {
              setThemeMenuOpened(false);
            }}
            onClick={(e) => {
              if (themeMenuOpened) {
                setThemeMenuOpened(false);
              } else {
                setThemeMenuOpened(true);
              }
            }}
          >
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
            </div>
          </div>
          <ul
              onBlur={(e) => {
                themeMenuButton.current.focus();
              }}
              onFocus={(e) => {
                setThemeMenuOpened(true);
              }}
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            {isLoggedIn? 
            <li>
              <Link className="justify-between" href="/profile">
                Profile
              </Link>
            </li>
            :<main></main>
            }
            <li><a>Settings</a></li>
            {isLoggedIn ? 
              <li><a onClick={handleSignOut}>Logout</a></li>
            : <li><Link href="/signin">Login</Link></li>}
          </ul>
        </div>
      </div>
    </div>
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