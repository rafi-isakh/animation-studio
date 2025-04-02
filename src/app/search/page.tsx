"use client"
import { Webnovel, SortBy } from '@/components/Types';
import WebnovelSearchComponent from '@/components/WebnovelSearchComponent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { phrase } from '@/utils/phrases';
import { useRouter, useSearchParams } from 'next/navigation'
import SearchComponent from '@/components/SearchComponent';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@/contexts/providers';
import { temporarilyUnpublished } from '@/utils/webnovelUtils';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import WebnovelPictureCardWrapper from '@/components/UI/WebnovelPictureCardWrapper';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';
import {
  GenresTabs,
  AllGenres,
  RomanceGenres,
  FantasyGenres,
  SciFiGenres,
  BLGenres,
  DramaGenres,
  RomanceFantasyGenres,
  LoveComedyGenres
} from '@/components/UI/GenresTabs';
import SearchPageWebnovelsList from '@/components/UI/SearchPageWebnovelsList';

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
        setWebnovels(data.filter((wenbnovel: Webnovel) => !temporarilyUnpublished.includes(wenbnovel.id)));
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





  const scrollRef = useRef<HTMLDivElement>(null);
  // let { webnovels } = useWebnovels();
  const filteredAllWebnovels = allWebnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

  const tabsConfig = [
    {
      label: "All Genres",
      genre: "allgenres",
      Component: () => (
        <AllGenres>
          {/* <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '10px', mobile: '24px' }} /> */}
          <WebnovelsAllCardWrapper
            title={''}
            webnovels={filteredAllWebnovels}
            scrollRef={scrollRef}
            renderItem={(item: Webnovel, index: number) => (
              <WebnovelPictureCardWrapper
                webnovel={item}
                index={index + 1}
                ranking={false}
                details={false}
                up={false}
                isOriginal={false}
              />
            )}
          />
        </AllGenres>
      ),
      color: "#F9B294"
    },
    {
      label: "Romance",
      genre: "romance",
      Component: () => (
        <RomanceGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F2727F"
    },
    {
      label: "Fantasy",
      genre: "fantasy",
      Component: () => (
        <FantasyGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F89E8D"
    },
    {
      label: "Sci-Fi",
      genre: "sf",
      Component: () => (
        <SciFiGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F78A86"
    },
    {
      label: "BL",
      genre: "bl",
      Component: () => (
        <BLGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F2727F"
    },
    {
      label: "Drama",
      genre: "drama",
      Component: () => (
        <DramaGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#0C34F0"
    },
    {
      label: "Romance Fantasy",
      genre: "romanceFantasy",
      Component: () => (
        <RomanceFantasyGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F0BA18"
    },
    {
      label: "Love Comedy",
      genre: "loveComedy",
      Component: () => (
        <LoveComedyGenres webnovels={filteredAllWebnovels} />
      ),
      color: "#F0183C"
    },
  ];


  const CustomSkeleton = ({
    width = '100%',
    height,
    variant = 'rounded',
    animation = 'wave',
    className
  }: {
    width: number | string,
    height: number,
    variant?: 'text' | 'rectangular' | 'rounded' | 'circular',
    animation?: 'pulse' | 'wave' | false,
    className?: string
  }) => {
    const { theme } = useTheme();

    return (
      <Skeleton variant={variant} animation={animation} width={width} height={height}
        className={className}
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




  const SearchResultSkeleton = ({ width = 300, height = 24 }) => (
    <div className="flex flex-row gap-3 w-full">
      <CustomSkeleton variant='rounded' animation="wave" width={120} height={90} className="md:w-[300px] md:h-[150px] w-[120px] h-[90px]" />
      <div className='flex flex-col items-start justify-center gap-2 flex-1'>
        <CustomSkeleton variant='rounded' animation="wave" width="100%" height={height} />
        <CustomSkeleton variant='rounded' animation="wave" width="100%" height={height} />
        <CustomSkeleton variant='rounded' animation="wave" width="80%" height={height} />
      </div>
    </div>
  );

  const SkeletonRow = ({ count = 2, width = 300, height = 24 }) => (
    <div className='w-full md:flex md:flex-row '>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="w-full md:w-1/2  py-2 px-4">
          <SearchResultSkeleton width={width} height={height} />
        </div>
      ))}
    </div>
  );


  return (
    <div className='w-full md:max-w-screen-lg mx-auto overflow-hidden no-scrollbar'>
      <SearchComponent mode="page" />
      {loading ? (
        <div className='w-full flex-shrink-0 mx-auto'>
          <SkeletonRow count={2} width={300} height={24} />
        </div>
      ) : query ? (
        // Show search results if there's a query
        <div ref={contentRef} className='grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-0 w-full'>
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
            // This will show either the "No results" message or a loading skeleton
            showNoResults ? (
              <div className='col-span-2 text-center py-8 w-full'>
                <p>{phrase(dictionary, "noSearchResults", language)}</p>
              </div>
            ) : (
              <div className='col-span-2 w-full flex-shrink-0  mx-auto'>
                <SkeletonRow count={2} width={300} height={24} />
              </div>
            )
          )}
        </div>
      ) : (
        // Show default view 
        <div className='space-y-8 md:px-2 px-4'>
          <SearchPageWebnovelList
            searchParams={searchParamsObject}
            webnovels={allWebnovels}
            sortBy={sortBy}
          />
          <div className='relative w-full mx-auto'>
            <GenresTabs tabs={tabsConfig} type="tabs" orientation="horizontal" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;

