'use client';

import React, { useEffect, useRef, useState } from 'react';
import { User, Webnovel } from '@/components/Types';
import Link from 'next/link';
import WebnovelComponent from './WebnovelComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { uploadFile } from '@/utils/s3';
import { useUser } from '@/contexts/UserContext';
import { getImageURL } from '@/utils/cloudfront';
import Image from 'next/image'
import '@/styles/globals.css'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';


const ProfileComponent = ({ user, novels }: { user: User, novels: Webnovel[] }) => {

  const [introActive, setIntroActive] = useState<boolean>(true);
  const [viewActive, setViewActive] = useState<boolean>(false);
  const { language, dictionary } = useLanguage();
  const viewRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const novelsRef = useRef<HTMLDivElement>(null);
  const [introWidth, setIntroWidth] = useState<string>("0px")
  const [key, setKey] = useState(1000);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const { email } = useUser();
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    setKey(prevKey => prevKey + 1)
  }, [language])

  useEffect(() => {

    if (introRef.current) {
      const width = introRef.current.offsetWidth + 1 + 'px';
      setIntroWidth(width);
    }
  }, [language])

  useEffect(() => {
    if (novelsRef.current) {
      novelsRef.current.style.transform = `translateX(-${introWidth}px)`
    }
  }, [introWidth])


  const handleIntroClick = () => {
    setIntroActive(true);
    setViewActive(false);
    const intro = document.getElementById('intro');
    intro?.classList.add('font-bold');
    intro?.classList.add('border-[#142448]')
    intro?.classList.remove('border-gray')
    const view = document.getElementById('view');
    view?.classList.remove('font-bold');
    view?.classList.remove('border-[#142448]')
    view?.classList.add('border-gray')
    const bio = document.getElementById('bio');
    bio?.classList.remove('hidden');
    const works = document.getElementById('works');
    works?.classList.add('hidden');
  }

  const handleViewClick = () => {
    setIntroActive(false);
    setViewActive(true);
    const intro = document.getElementById('intro');
    intro?.classList.remove('font-bold');
    intro?.classList.remove('border-[#142448]')
    intro?.classList.add('border-gray')
    const view = document.getElementById('view');
    view?.classList.add('font-bold');
    view?.classList.add('border-[#142448]')
    view?.classList.remove('border-gray')
    const bio = document.getElementById('bio');
    bio?.classList.add('hidden');
    const works = document.getElementById('works');
    works?.classList.remove('hidden');
  }

  const handleProfilePictureUpload = () => {
    if (user.email == email) {
      document.getElementById('profilePicture')?.click();
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user.email != email) {
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));

      // Show picture and upload it to S3
      const formData = new FormData();
      formData.append('email', user.email)
      formData.append('bio', user.bio)
      formData.append('nickname', user.nickname)
      formData.append('file', file)

      const response = await fetch('/api/update-user', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Update user failed")
      }
    }
  };

  const handleDeleteAccount = async () => {
    const response = await fetch(`/api/delete-account?email=${email}`);
    if (!response.ok) {
      console.error("Deleting account failed");
    } else {
      try {
        const response = await fetch('/api/signout', {
          method: 'POST',
        });
        if (response.ok) {
          setIsLoggedIn(false);
          router.push('/')
        } else {
          console.error('Failed to sign out');
        }
      } catch (error) {
        console.error('Error signing out:', error);
      }
      finally {
      }
    }
  }

  const getNumberOfChapters = () => {
    let chapters = 0;
    for (let i = 0; i < novels.length; i++) {
      chapters += novels[i].chapters.length;
    }
    return chapters;
  }

  const getNumberOfLikes = () => {
    let likes = 0;
    for (let i = 0; i < novels.length; i++) {
      likes += novels[i].upvotes;
    }
    return likes;
  }

  return (
    <div className='max-w-screen-lg mx-auto flex flex-col md:flex-row my-auto justify-center md:items-start items-center md:justify-between'>
      {/*Left component*/}

      <div className='flex flex-col space-y-8 w-full md:w-3/4 order-2 md:order-1'>
        <div>
          <p className='text-xl font-bold'>{user.nickname}</p>
        </div>
        <div className="flex flex-row space-x-8">
          <div className='flex flex-col justify-center items-center'>
            <p>{Object.keys(dictionary).length != 0 && dictionary["numberOfWebnovels"][language]}</p>
            <p>{novels.length}</p>
          </div>
          <div className='flex flex-col justify-center items-center'>
            <p>{Object.keys(dictionary).length != 0 && dictionary["numTotalChapters"][language]}</p>
            <p>{getNumberOfChapters()}</p>
          </div>
          <div className='flex flex-col justify-center items-center'>
            <p><i className="fa-regular fa-heart"></i>{Object.keys(dictionary).length != 0 && dictionary["likes"][language]}</p>
            <p>{getNumberOfLikes()}</p>
          </div>
        </div>
        <div className='flex flex-row'>
          <Link href="#" onClick={handleIntroClick}>
            <p id='intro' className='text-xl w-fit px-4 font-bold border-b-2 border-[#142448]'>{Object.keys(dictionary).length != 0 && dictionary["authorBio"][language]}</p>
          </Link>
          <Link href="#" onClick={handleViewClick}>
            <p id='view' className='text-xl w-fit px-4 border-b-2 border-gray'>{Object.keys(dictionary).length != 0 && dictionary["viewWebnovels"][language]}</p>
          </Link>
        </div>
        <div className='flex flex-shrink-0 -translate-y-4' ref={introRef}>
          <div id='bio'>
            <OtherTranslateComponent key={key} content={user.bio} elementId={user.id.toString()} elementType='user' />
          </div>
        </div>
        <div className="flex flex-shrink-0 -translate-y-12" ref={viewRef} >
          <div id="works" ref={novelsRef} className={`max-w-screen-sm hidden md:max-w-screen-md flex flex-row flex-wrap after:content-[''] after:flex-auto`}>
            {novels.map((item, index) => (
              <div key={index} className='mx-2'> {/* This key may conflict with OtherTranslateComponent's key if len(webnovels) > 1000. */}
                <WebnovelComponent webnovel={item} index={index} ranking={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/*Right component*/}
      <div className='w-full md:w-1/4 flex flex-col justify-center items-center order-1 md:order-2 mb-10 md:mb-0'>
        <div className="w-[200px] h-[200px] overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
          <Link href={email == user.email ? "#" : ""}>
            {profilePicturePreview || user.picture ?
              <div className="mt-4">
                {profilePicturePreview ?
                  <a onClick={handleProfilePictureUpload}> <Image src={profilePicturePreview} alt="Profile Picture Preview" className="max-w-xs m-auto" width={200} height={200} />
                  </a>
                  :
                  user.picture ?
                    <a onClick={handleProfilePictureUpload}>
                      <Image src={getImageURL(user.picture)} className="max-w-xs m-auto -translate-y-10" alt="Profile Picture Preview" width={200} height={200} />
                    </a>
                    : <></>
                }
              </div>
              :
              <div className='mt-4'>
                <svg onClick={handleProfilePictureUpload} className="w-[240px] h-[240px] text-gray-400 -translate-x-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
              </div>
            }
          </Link>
          <input type="file" id="profilePicture" className='hidden' onChange={handleFileChange} />

        </div>
        {email == user.email && <button className='mt-10 button-style w-32' onClick={handleDeleteAccount}>{phrase(dictionary, "deleteAccount", language)}</button>}
      </div>

    </div>
  );
}

export default ProfileComponent;
