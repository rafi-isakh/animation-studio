"use client"
import { Webnovel } from '@/components/Types';
import WebnovelSearchComponent from '@/components/WebnovelSearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { phrase } from '@/utils/phrases';
import { useRouter } from 'next/navigation'

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
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [lastIndex, setLastIndex] = useState(0);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = e.target.value.trim(); 
    setSearchQuery(cleanedValue);
}

const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
        setKeyPressed(false)
    }
}

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !keyPressed && query !== '') {
        e.preventDefault();
        setKeyPressed(true);
        handleSearch(searchQuery);
        
    }
};

const handleSearch = (query: string) => {
    const cleanedQuery = query.trim();
    setIsMobileMenuOpen(false);
    if (searchRemember) {
        setRecentQueries(prev => [cleanedQuery, ...prev])
        setLastIndex(prev => prev + 1)
    }
    router.push(`/search?query=${query}&remember=${searchRemember}`);
}


  return (
    <div className='w-full md:max-w-screen-lg mx-auto'>
 
        <div className="relative w-full md:px-0 px-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none md:px-0 px-4">
            <svg
              className="w-4 h-4 text-black dark:text-black"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>

          <input
            type="text"
            id="search-navbar"
            value={searchQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={query ? query.toString() : searchQuery || phrase(dictionary, "searchPlaceholder", language)}
            className="w-full p-2 pl-10 text-sm border-0 
                        text-black border-b-4 border-b-black 
                        focus:outline-none focus:ring-0
                        focus:border-b-pink-600"
          />
        </div>

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