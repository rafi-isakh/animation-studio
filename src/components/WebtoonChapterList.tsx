'use client'
import { useState } from 'react';
import Link from "next/link";
import { Webtoon, WebtoonChapter } from '@/components/Types';
import '@/styles/Webtoons.module.css';
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';


const WebtoonChapterList = async ({ webtoon, slug, coverArt }: { webtoon: Webtoon, slug: string, coverArt: string }) => {
  const [showMoreChapters, setShowMoreChapters] = useState(false);
  // const coverArt = await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)
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
            <div className="flex flex-row justify-start gap-3 p-3">
              <Image 
                src={coverArt} 
                alt={chapter.directory} 
                className="w-10 h-10 self-center" 
                width={100}
                height={100}
                />
            
              <p className="text-xl text-center self-center"> {index + 1} </p>
              <p className="text-sm text-center self-center"> 
                {chapter.directory} { language === 'en' ? ' episodes ' : language === 'ko' ? '화' : '' } 
              </p>
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

export default WebtoonChapterList;