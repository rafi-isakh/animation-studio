"use client"
import React, { useReducer, useEffect, useState, useRef } from 'react'
import { filter_by_genre, sortByFn } from '@/utils/webnovelUtils';
import { Webnovel, SortBy } from '@/components/Types';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { useTheme } from '@/contexts/providers'
import Link from 'next/link';
import { Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import WebnovelPictureCardWrapper from '@/components/UI/WebnovelPictureCardWrapper';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';

export declare type TabsProps = {
  tabs: {
    label: string;
    genre: string;
    Component: (() => JSX.Element) | (({ children }: { children?: React.ReactNode }) => JSX.Element);
    color?: string;
  }[]
  orientation?: 'horizontal' | 'vertical'
  type?: 'tabs' | 'pills'
  className?: string
  color?: string
}

type State = {
  selected: number
}

type Action = { type: 'selected'; payload: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'selected':
      return {
        selected: action.payload
      }
    default:
      return state
  }
}

export const GenresTabs = ({
  tabs = [],
  className = '',
  type = 'tabs',
  orientation = 'horizontal',
  color,
  children
}: TabsProps & { children?: React.ReactNode }) => {
  const { dictionary, language } = useLanguage();
  const { theme } = useTheme();
  const [{ selected }, dispatch] = useReducer(reducer, {
    selected: 0
  })
  const Panel = tabs && tabs.find((_, index) => index === selected)

  return (
    <div
      className={
        orientation === 'vertical'
          ? `${className}`
          : className
      }
    >
      <ul
        className={` flex gap-2 
          ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}
          `}
        role="tablist"
        aria-orientation={orientation}
      >
        {tabs.map((tab, index) => (
          <Link href="#" className="nav-item" role="presentation" key={tab.label}>
            <Button
              id={`btn-${index}`}
              sx={{
                color: theme === 'dark' ? '#fff' : '#000',
                '--hover-color': tab.color
              } as React.CSSProperties}
              className={`${selected === index ? 'nav-link active' : 'nav-link'}     
                flex flex-row justify-between items-center rounded-full px-2 py-1 
                ${theme === 'dark' ? 'bg-[#211F21]' : 'bg-[#eee]'}
                transition-colors duration-300 gap-x-2
                hover:bg-[var(--hover-color)]
                `}
              variant="text"
              role="tab"
              aria-selected={selected === index}
              aria-controls={`tabpanel-${index}`}
              tabIndex={selected === index ? 0 : -1}
              onClick={() => dispatch({ type: 'selected', payload: index })}
            >
              <span className={`bg-transparent font-bold text-sm`}>
                {phrase(dictionary, tab.genre, language)}
                {/* {tab.label} */}
              </span>
              <Image
                src={`/thumbnails/${tab.genre}.png`}
                alt="thumbnail"
                width={30} height={30}
                className='rounded-xl'
              />
            </Button>
          </Link>
        ))}
      </ul>

      <div className="tab-content">
        <div
          role="tabpanel"
          aria-labelledby={`btn-${selected}`}
          id={`tabpanel-${selected}`}
        >
          {Panel && <Panel.Component />}
        </div>
      </div>
    </div>
  )
}

// Create components for each tab content
export const AllGenres = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='relative w-full flex'>
      {children}
    </div>
  )
}


export const RomanceGenres = ({ webnovels }: { webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'romance'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'romance', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div >
  )
};

export const FantasyGenres = ({  webnovels }: {  webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'fantasy'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'fantasy', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};


export const SciFiGenres = ({ webnovels }: {  webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'sf'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'sf', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};


export const BLGenres = ({ webnovels }: {  webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'bl'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'bl', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};


export const DramaGenres = ({  webnovels }: {  webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'drama'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'drama', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};


export const RomanceFantasyGenres = ({ webnovels }: { webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'romanceFantasy'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'romanceFantasy', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};

export const LoveComedyGenres = ({ webnovels }: { webnovels: Webnovel[] }) => {
  const { theme } = useTheme();
  const { dictionary, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get('genre');
  const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortBy>('views');

  useEffect(() => {
    const _webnovelsToShow = webnovels
      .filter(item => filter_by_genre(item, 'loveComedy'))
      .sort((a, b) => sortByFn(a, b, sortBy));

    setWebnovelsToShow(_webnovelsToShow);
  }, [webnovels, sortBy]);

  return (
    <div className='relative w-full flex flex-col py-2' >
      <div className='flex flex-row gap-2'>
        {webnovelsToShow.length > 0 ? (
          <WebnovelsAllCardWrapper
            scrollRef={scrollRef}
            title={phrase(dictionary, 'loveComedy', language)}
            webnovels={webnovelsToShow}
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
        ) : (
          <div className="text-center py-4">
            {phrase(dictionary, 'noWebnovelsFound', language)}
          </div>
        )}
      </div>
    </div>
  )
};

