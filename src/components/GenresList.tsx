"use client"
import styles from '@/styles/GenresList.module.css'
import gsap from 'gsap';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { useTheme } from '@/contexts/providers'

const genresList = [
  {
    title: "Romance",
    color: "#F9B294",     //   color: "#F06318"
    genre: "romance",
  },
  {
    title: "Fantasy",
    color: "#F89E8D",     //   color: "#DCF018"
    genre: "fantasy",
  },
  {
    title: "Sci-Fi",
    color: "#F78A86",     //   color: "#18F0E8"
    genre: "sf",
  },
  {
    title: "BL",
    color: "#F2727F",     //   color: "#8C0CF0"
    genre: "bl",
  },
  {
    title: "Romantic Comedy",
    color: "#F0183C",
    genre: "romanticComedy",
  },
  {
    title: "Romance Fantasy",
    color: "#F0BA18",
    genre: "romanceFantasy",
  },
  {
    title: "Drama",
    color: "#0C34F0",
    genre: "drama",
  },
  {
    title: "Love Comedy",
    color: "#0CBCF0",
    genre: "loveComedy"
  },

  // #F9B294
  // #F2727F
  // #6D5C7E
  // #325D7E

]


export default function GenresList() {
  const { dictionary, language } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className='relative w-full mx-auto'>
      <ul className={`flex flex-row gap-2 items-center`}>
        {
          genresList.map((genre, index) => {
            return <li
              key={index}
              style={{ 
                '--hover-color': genre.color
              } as React.CSSProperties}
              className={`flex flex-row justify-between items-center rounded-full px-2 py-1 
                        ${theme === 'dark' ? 'bg-[#211F21]' : 'bg-[#eee]'}
                        transition-colors duration-300
                        hover:bg-[var(--hover-color)]
                        `}
            >
              <p className={` bg-transparent font-bold text-sm`}>{phrase(dictionary, genre.genre, language)}</p>
              <Image
                src={`/thumbnails/${genre.title.toLowerCase()}.png`}
                alt="thumbnail"
                width={30} height={30}
                className='rounded-xl'
              />
            </li>
          })
        }
      </ul>
    </div>
  )
}