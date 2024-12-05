'use client'
import { useState } from 'react';
import Link from "next/link";
import { Webtoon, WebtoonChapter } from '@/components/Types';
import '@/styles/Webtoons.module.css';
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { LockOpen } from 'lucide-react';


const WebtoonChapterListSubcomponent = async ({ webtoon, slug, coverArt }: { webtoon: Webtoon, slug: string, coverArt: string }) => {
  const [showMoreChapters, setShowMoreChapters] = useState(false);
  const { language, dictionary } = useLanguage();

  return (
    <div className="w-full">
      <div className="overflow-y-auto border border-gray-300 rounded-md p-2">
        {webtoon.chapters.map((chapter: WebtoonChapter, index: number) => (
          <Link
            href={`/webtoons/${slug}/${chapter.directory}`}
            key={`chapter-${chapter.id}`}
            className={`cursor-pointer block py-2 border-b border-gray-200 last:border-b-0 ${
              index >= 10 && !showMoreChapters ? 'hidden' : ''
            }`}
          >
            <div className="flex flex-row justify-between gap-3 p-3">
                <div className="flex flex-row gap-3">
                  <Image 
                    src={coverArt} 
                    alt={chapter.directory} 
                    className="object-cover " 
                    width={50}
                    height={50}
                    />
                
                  <p className="text-xl text-center self-center"> {index + 1} </p>
                  <p className="text-sm text-center self-center"> 
                    {language === 'en' ? `episodes ${parseInt(chapter.directory)}` : 
                     language === 'ko' ? `${parseInt(chapter.directory)}화` : 
                     `episodes ${parseInt(chapter.directory)} `}
                  </p>
                </div>

              <div className="text-sm text-center self-center">
                  {/* <LockOpen size={16} className="text-gray-200" /> */}
                  <span className="text-gray-600 text-[10px]">
                    {/* Free */}
                    {phrase(dictionary, "readingForFree", language)}
                  </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* <button
        className="mt-4 px-4 py-2 bg-whit text-black rounded"
        onClick={toggleChapters}
      >
        {showMoreChapters ? 'Show Less' : 'Read More'}
      </button> */}
    </div>
  );
};

export default WebtoonChapterListSubcomponent;