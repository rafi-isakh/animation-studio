"use client"
import styles from '../styles/GenresList.module.css'
import gsap from 'gsap';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';

const projects = [
      // #F9B294
      // #F2727F
      // #6D5C7E
      // #325D7E
    {
      title: "Romance",
      //   color: "#F06318"
      color: "#F9B294",
      genre: "romance",
      new: true,

    },
    {
      title: "Fantasy",
    //   color: "#DCF018"
      color: "#F89E8D",
      genre: "fantasy",
      up: true
    },
    {
      title: "Sci-Fi",
    //   color: "#18F0E8"
      color: "#F78A86",
      genre: "sf",
      up: true,
    },
    {
      title: "BL",
    //   color: "#8C0CF0"
      color: "#F2727F",
      genre: "bl",
      up: true,
    },
    {
      title: "Romantic Comedy",
      color: "#F0183C",
      genre: "romanticComedy",
      up: true,
    },
    {
      title: "Romance Fantasy",
      color: "#F0BA18",
      genre: "romanceFantasy",
      new: true,
    
    },
    {
      title: "Drama",
      color: "#0C34F0",
      genre: "drama",
      new: true,
    },
    {
      title: "Love Comedy",
      color: "#0CBCF0",
      genre: "loveComedy"
    },
]

export default function GenresList() {
  const { dictionary, language } = useLanguage();

  const manageMouseEnter = (e: any, index: number) => {
    gsap.to(e.target, {top: "-2vw", backgroundColor: projects[index].color, duration: 0.3})
  }

  const manageMouseLeave = (e: any, index: number) => {
    gsap.to(e.target, {top: "0", backgroundColor: "white", duration: 0.3, delay: 0.1})
  }

  return (
    // <div className={styles.container}>
    <div className='relative max-w-screen-xl mx-auto px-4 mt-16 mb-20'>
        <div className={styles.projectContainer}>
            {
              projects.map((project, index) => {
                return <div
                         className='flex flex-row justify-between items-center'
                         onMouseEnter={(e) => {manageMouseEnter(e, index)}} 
                         onMouseLeave={(e) => {manageMouseLeave(e, index)}} 
                         key={index}>
                        <p>{phrase(dictionary, project.genre, language)}
                            {project.new && (
                                <span className="absolute bottom-0 left-0 text-[10px] text-white bg-pink-500 px-1 py-1">
                                    NEW
                                </span>
                            )}

                            {project.up && (
                                <span className="absolute bottom-0 left-0 text-[10px] text-white bg-purple-500 px-1 py-1">
                                    UP
                                </span>
                            )}
                         
                        </p>
                       
                        <Image 
                         src={`/thumbnails/${project.title.toLowerCase()}.png`} 
                         alt="thumbnail"
                         width={100} height={100} />


                     </div>
              })
            }
        </div>
    </div>
  )
}