"use client"
import { Webnovel } from '@/components/Types';
import WebnovelSearchComponent from '@/components/WebnovelSearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { phrase } from '@/utils/phrases';
import { useRouter } from 'next/navigation'
import SearchComponent from '@/components/SearchComponent';

const Search = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const router = useRouter();
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const query = searchParams.query;
  const remember = searchParams.remember;
  const { dictionary, language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [keyPressed, setKeyPressed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchRemember, setSearchRemember] = useState(false);

  if (typeof query === 'string') {
  } else if (Array.isArray(query)) {
    throw new Error("there should be only one query param")
  } else {
  }

  useEffect(() => {
    fetch(`/api/search?query=${query}&remember=${remember}`) // searches and saves query if user is logged in
      .then(r => r.json())
      .then(r => setWebnovels(r));
  }, [query]);

  return (
    <div className='w-full md:max-w-screen-lg mx-auto'>

      <SearchComponent mode="page" />

      {(webnovels.length) ? (
        <div className='grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-0'>
          {webnovels.map((webnovel, index) => (
            <WebnovelSearchComponent
              key={index}
              webnovel={webnovel}
              ranking={false}
              index={index}
              chunkIndex={0}
            />
          ))}
        </div>
      ) : (
        <div className='flex items-center justify-center h-[50vh]'>
          <div className='text-black dark:text-white text-lg'>
            <p className='text-center'>{phrase(dictionary, "noSearchResults", language)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;