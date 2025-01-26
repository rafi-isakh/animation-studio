'use client'
import { useEffect, useState } from 'react';
import Link from "next/link";
import { Webtoon, WebtoonChapter } from '@/components/Types';
import '@/styles/Webtoons.module.css';
import { Button, Modal, Box, dividerClasses, Tooltip } from "@mui/material";
import Image from 'next/image';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { LockOpen, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useModalStyle } from '@/styles/ModalStyles';
import { MdStars } from "react-icons/md";
import { useUser } from '@/contexts/UserContext';

const WebtoonChapterListSubcomponent = ({
  webtoon, slug, coverArt, sortToggle, onUpdate }: {
    webtoon: Webtoon,
    slug: string,
    coverArt: string,
    sortToggle: boolean,
    onUpdate: (updatedContent: Webtoon) => void
  }) => {
  const [showMoreChapters, setShowMoreChapters] = useState(false);
  const [showLessChapters, setShowLessChapters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<WebtoonChapter | null>(null);
  const { language, dictionary } = useLanguage();
  const { stars } = useUser();

  const sortedChapters = sortToggle ? webtoon.chapters.sort((a, b) => b.id - a.id) : webtoon.chapters.sort((a, b) => a.id - b.id);
  console.log(webtoon.chapters.map(chapter => chapter.free))

  const handleChapterClick = (chapter: WebtoonChapter, e: React.MouseEvent) => {
    if (chapter.free) {
      return true;
    } else {
      e.preventDefault();
      setSelectedChapter(chapter);
      onOpenPurchaseModal();
      return false;
    }
  };

  const onOpenPurchaseModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="w-full">
        <div className="overflow-y-auto rounded-md">
          {sortedChapters.map((chapter: WebtoonChapter, index: number) => (
            <Link
              href={`/webtoons/${slug}/${chapter.directory}`}
              key={`chapter-${chapter.id}`}
              onClick={(e) => handleChapterClick(chapter, e)}
              className={`cursor-pointer block py-2 border-b border-gray-200 last:border-b-0 
              ${index >= 10 && !showMoreChapters ? 'hidden' : ''}
              ${!chapter.free ? 'opacity-50' : ''}`}
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

                  {/* <p className="text-xl text-center self-center"> {index + 1} </p> */}
                  <p className="text-sm text-center self-center">
                    {language === 'en' ? `Episode ${parseInt(chapter.directory)}` :
                      language === 'ko' ? `${parseInt(chapter.directory)}화` :
                        `Episode ${parseInt(chapter.directory)} `}
                  </p>
                </div>

                <div className="text-sm text-center self-center">
                  <div className="text-gray-600 text-[10px] bg-gray-200 rounded-md px-1">
                    {/* Free */}
                    {chapter.free ? phrase(dictionary, "readingForFree", language)
                      : <div className="flex flex-row gap-1 items-center"> <MdStars className="text-sm text-[#D92979]" /> 30</div>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {webtoon?.chapters && webtoon?.chapters.length > 8 && (
          <button
            className="mt-4 w-full text-black dark:text-white rounded-xl p-2 text-sm flex flex-row gap-2 items-center justify-center"
            onClick={() => setShowMoreChapters(!showMoreChapters)}
          >
            {/* 더보기 */}
            {showMoreChapters ? phrase(dictionary, "less", language) : phrase(dictionary, "more", language)}
            {showMoreChapters ? <ChevronUpIcon size={16} className="text-black dark:text-white" /> : <ChevronDownIcon size={16} className="text-black dark:text-white" />}
          </button>
        )}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box sx={useModalStyle}>
          <div className='flex flex-col space-y-4 items-center justify-cente'>
            <p className='text-lg font-bold text-black dark:text-black'>
              {/* 구매하기 */}
              {phrase(dictionary, "purchase", language)}
            </p>
            <p>
              {webtoon.title} {language === 'en' ? `Episode ${parseInt(selectedChapter?.directory || '0')}` :
                language === 'ko' ? `${parseInt(selectedChapter?.directory || '0')}화` :
                  `Episode ${parseInt(selectedChapter?.directory || '0')} `}
            </p>
            <p>
              보유한 투니즈 별 {stars}개
            </p>

            <hr className='w-full' />
            <div className="flex flex-row gap-2 ">
              <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                <Button
                >
                  {phrase(dictionary, "purchase", language)}
                </Button>
              </Tooltip>
              <Tooltip title={phrase(dictionary, "preparing", language)} followCursor>
                <Link href={`#`}>
                  <Button
                    color='gray'
                    variant='outlined'
                    className='w-32 dark:text-white bg-[#DB2777] text-white'
                  >
                    {/* 별 충전 */}
                    {phrase(dictionary, "stars", language)}
                  </Button>
                </Link>
              </Tooltip>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default WebtoonChapterListSubcomponent;