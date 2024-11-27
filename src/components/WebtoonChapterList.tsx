'use client'
import { useState } from 'react';
import Link from "next/link";
import { Webtoon, WebtoonChapter } from '@/components/Types';
import styles from '@/styles/Webtoons.module.css';

const WebtoonChapterList = ({ webtoon, slug }: { webtoon: Webtoon, slug: string }) => {
  const [showMoreChapters, setShowMoreChapters] = useState(false);

  return (
    <div>
      <div className="h-[300px] overflow-y-auto border border-gray-300 rounded-md p-2">
        {webtoon.chapters.map((chapter: WebtoonChapter, index: number) => (
          <Link
            href={`/webtoons/${slug}/${chapter.directory}`}
            key={`chapter-${chapter.id}`}
            className={`block py-2 border-b border-gray-200 last:border-b-0 ${
              index >= 3 && !showMoreChapters ? 'hidden' : ''
            }`}
          >
            {chapter.directory}
          </Link>
        ))}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-gray-700 hover:bg-blue-600 text-white rounded"
        onClick={() => setShowMoreChapters(!showMoreChapters)}
      >
        {showMoreChapters ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
};

export default WebtoonChapterList;