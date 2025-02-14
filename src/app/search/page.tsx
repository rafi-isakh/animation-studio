"use client"
import { Webnovel, SortBy } from '@/components/Types';
import WebnovelSearchComponent from '@/components/WebnovelSearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { phrase } from '@/utils/phrases';
import { useRouter } from 'next/navigation'
import SearchComponent from '@/components/SearchComponent';
import WebnovelsList from '@/components/WebnovelsList';
import WebnovelsByRank from '@/components/WebnovelsByRank';

const Search = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const router = useRouter();
  const { dictionary, language } = useLanguage();
  const query = searchParams.query;
  const remember = searchParams.remember;

  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const [allWebnovels, setAllWebnovels] = useState<Webnovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  // Fetch all webnovels on component mount
  useEffect(() => {
    const fetchAllWebnovels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/get_webnovels_metadata');
        if (!response.ok) {
          throw new Error('Failed to fetch webnovels');
        }
        const data = await response.json();
        setAllWebnovels(data);
      } catch (error) {
        console.error('Error fetching webnovels:', error);
        setAllWebnovels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWebnovels();
  }, []);

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


      {loading ? (
        <div className='flex items-center justify-center h-64'>
          <p>Loading...</p>
        </div>
      ) : query ? (
        // Show search results if there's a query
        <div className='grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-0'>
          {webnovels.length > 0 ? (
            webnovels.map((webnovel, index) => (
              <WebnovelSearchComponent
                key={index}
                webnovel={webnovel}
                ranking={false}
                index={index}
                chunkIndex={0}
              />
            ))
          ) : (
            <div className='col-span-2 text-center py-8'>
              <p>{phrase(dictionary, "noSearchResults", language)}</p>
            </div>
          )}
        </div>
      ) : (
        // Show default view when no search query is present
        <div className='space-y-8'>
          
          <WebnovelsList
            searchParams={searchParams}
            webnovels={allWebnovels}
            sortBy={sortBy}
          />
          <WebnovelsByRank
            searchParams={searchParams}
            webnovels={allWebnovels}
            sortBy={sortBy}
          />

        </div>
      )}
    </div>
  );
};

export default Search;

