'use client'
import { useEffect, useState } from 'react';
import Link from "next/link";
import { Webtoon, WebtoonChapter } from '@/components/Types';
import '@/styles/Webtoons.module.css';
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { LockOpen } from 'lucide-react';


const WebtoonChapterListSubcomponent = ({ webtoon, slug, coverArt, sortToggle }: { webtoon: Webtoon, slug: string, coverArt: string, sortToggle: boolean }) => {
  const [showMoreChapters, setShowMoreChapters] = useState(false);
  const { language, dictionary } = useLanguage();

  const sortedChapters = sortToggle ? webtoon.chapters.sort((a, b) => b.id - a.id) : webtoon.chapters.sort((a, b) => a.id - b.id);
  useEffect(() => {
    for (let i = 0; i < 2; i++) { 
      webtoon.chapters[i].free_premium = false;
    }
    for (let i = 2; i < webtoon.chapters.length; i++) {
      webtoon.chapters[i].free_premium = true;
    }
  }, [webtoon.chapters]);


  return (
    <div className="w-full">
      <div className="overflow-y-auto rounded-md">
        {sortedChapters.map((chapter: WebtoonChapter, index: number) => (
          <Link
            href={`/webtoons/${slug}/${chapter.directory}`}
            key={`chapter-${chapter.id}`}
            className={`cursor-pointer block py-2 border-b border-gray-200 last:border-b-0 ${index >= 10 && !showMoreChapters ? 'hidden' : ''
              }`}
          >
            <div className="flex flex-row justify-between">
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
                  {language === 'en' ? `Episode ${parseInt(chapter.directory)}` :
                    language === 'ko' ? `${parseInt(chapter.directory)}화` :
                      `Episode ${parseInt(chapter.directory)} `}
                </p>
              </div>

              <div className="text-sm text-center self-center">
                {/* <LockOpen size={16} className="text-gray-200" /> */}
                <span className="text-gray-600 text-[10px] bg-gray-200 rounded-md px-2">
                  {/* Free */}
                  {phrase(dictionary, "readingForFree", language)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* <button
        className="mt-4 w-full hover:bg-gray-400 text-black rounded-xl p-2 text-sm"
        onClick={() => setShowMoreChapters(!showMoreChapters)}
      >
        더보기
      </button> */}
    </div>
  );
};

export default WebtoonChapterListSubcomponent;