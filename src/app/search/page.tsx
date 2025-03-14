"use client"
import { Webnovel, SortBy } from '@/components/Types';
import WebnovelSearchComponent from '@/components/WebnovelSearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { phrase } from '@/utils/phrases';
import { useRouter, useSearchParams } from 'next/navigation'
import SearchComponent from '@/components/SearchComponent';
import WebnovelsList from '@/components/WebnovelsList';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@/contexts/providers';
// import WebnovelCard from '@/components/UI/WebnovelCard';

const Search = () => {
  const router = useRouter();
  const { dictionary, language } = useLanguage();
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const remember = searchParams.get('remember');
  const searchParamsObject = Object.fromEntries(searchParams.entries());
  const { theme } = useTheme();
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const [allWebnovels, setAllWebnovels] = useState<Webnovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('views');
  const [skeletonHeight, setSkeletonHeight] = useState<number | null>(null);
  const [skeletonWidth, setSkeletonWidth] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showNoResults, setShowNoResults] = useState(false);
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
    console.log('loading', loading)
  }, [loading])

  useEffect(() => {
    setLoading(true);
    const asyncSearch = async () => {
      if (query) {
        const response = await fetch(`/api/search?query=${query}&remember=${remember}`) // searches and saves query if user is logged in
        const data = await response.json();
        setWebnovels(data);
      }
      setLoading(false);
    }
    asyncSearch();
  }, [query]);

  useEffect(() => {
    if (webnovels.length === 0) {
      setShowNoResults(true);
    } else {
      setShowNoResults(false);
    }
  }, [webnovels]);


  const CustomSkeleton = ({
    width = '100%',
    height,
    variant = 'rounded',
    animation = 'wave'
  }: {
    width: number | string,
    height: number,
    variant?: 'text' | 'rectangular' | 'rounded' | 'circular',
    animation?: 'pulse' | 'wave' | false
  }) => {
    const { theme } = useTheme();

    return (
      <Skeleton variant={variant} animation={animation} width={width} height={height}
        sx={{
          bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
          '&::after': {
            background: theme === 'dark' ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)',
          }
        }}
      />
    )
  }


  return (
    <div className='w-full md:max-w-screen-lg mx-auto overflow-hidden no-scrollbar'>
      <SearchComponent mode="page" />
      {loading ? (
        <div className="flex flex-row gap-2 md:px-2 px-4">
          <CustomSkeleton variant='rounded' animation="wave" width={100} height={90} />
          <div className='flex flex-col items-center justify-center gap-2 w-full'>
            <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
            <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
            <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
          </div>
        </div>
      ) : query ? (
        // Show search results if there's a query
        <div ref={contentRef} className='grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-0'>
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
          ) : webnovels.length === 0 ? (
            showNoResults ? (
              <div className='col-span-2 text-center py-8'>
                <p>{phrase(dictionary, "noSearchResults", language)}</p>
              </div>
            ) : (
              <div className='relative flex flex-col items-center justify-center gap-2 w-full'>

                <div className="flex flex-row gap-2 md:px-2 px-4">
                  <CustomSkeleton variant='rounded' animation="wave" width={100} height={90} />
                  <div className='flex flex-col items-center justify-center gap-2 w-full'>
                    <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
                    <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
                    <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
                  </div>
                </div>
              </div>
            )
          ) : (
            // Show loading skeleton while loading/processing
            <div className="flex flex-row gap-2 md:px-2 px-4">
              <CustomSkeleton variant='rounded' animation="wave" width={100} height={90} />
              <div className='flex flex-col items-center justify-center gap-2 w-full'>
                <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
                <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
                <CustomSkeleton variant='rounded' animation="wave" width={skeletonWidth || "100%"} height={skeletonHeight || 18} />
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show default view 
        <div className='space-y-8 md:px-2 px-4'>
          <WebnovelsList
            searchParams={searchParamsObject}
            webnovels={allWebnovels}
            sortBy={sortBy}
          />
        </div>
      )}
    </div>
  );
};

export default Search;

