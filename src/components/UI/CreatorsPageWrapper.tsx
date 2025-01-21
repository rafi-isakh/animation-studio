'use client'
import { useRef, useState, useEffect } from "react";
import { useScroll, motion, useSpring, useTransform, useInView } from "framer-motion";
import { Button } from '@mui/material'
import { useMediaQuery } from 'react-responsive'
import '@/styles/fonts.css'
import { Earth, HandHeart, SquarePen } from "lucide-react";
import Image from "next/image";
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Billboard from '@/components/UI/Billboard';
import Accordion from '@/components/UI/Accordion';
import { getVideoUrl } from '@/utils/urls';
import Link from 'next/link';

const features = [
  {
    id: 1,
    icon: <Earth size={20} />,
    title: "Global distribution",
    description: "Reach a more meaningful audience by sharing your story with us, and your work will gain global recognition.",
  },
  {
    id: 2,
    icon: <HandHeart size={20} />,
    title: "Transparent Revenue Share",
    description: "We offer a transparent revenue share model, ensuring that you receive a fair share of the profits from your work.",
  },
  {
    id: 3,
    icon: <SquarePen size={20} />,
    title: "Earn Money By Sharing",
    description: "Creators can monetize their stories, and we can help you reach a global audience.",
  },
]

const processes = [
  {
    id: 1,
    image: "/images/creators_signup.svg",
    title: "Sign Up",
    description: "Create your free account and join our community of writers.",
  },
  {
    id: 2,
    image: "/images/creators_apply.svg",
    title: "Create Your Story",
    description: "Use our intuitive tools to draft, edit, and finalize your story.",
  },
  {
    id: 3,
    image: "/images/creators_publish.svg",
    title: "Publish",
    description: "Publish your story to the global audience and meet new readers.",
  },
  {
    id: 4,
    image: "/images/creators_earn.svg",
    title: "Earn",
    description: "Earn money from your story and share it with the world.",
  },
]

function FadeUp({ children, delay = 0, duration = .5 }: { children: React.ReactNode, delay?: number, duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  let [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInView && !isVisible) {
      setIsVisible(true);
    }
  }, [isInView, isVisible]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: {
          opacity: 0,
          y: 100
        },
        visible: {
          opacity: 1,
          y: 0
        },
      }}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: duration, delay, type: "spring" }}
    >
      {children}
    </motion.div>
  );
}


export function Footer() {
  const { dictionary, language } = useLanguage()

  return (
    <div className='h-[30vh] bg-white'>
      <div className='max-w-screen-xl mx-auto flex flex-col items-center justify-center'>

        <span className="text-[12px] text-gray-500 text-center py-5">
          Your Favorite Story Universe, Between Us, Toonyz
        </span>
        <div className='flex flex-col items-center justify-center w-full'>
          <hr className='w-screen border-t border-gray-300 my-4' />
          <div className='bg-white px-4 absolute'>
            <Image
              src="/images/N_logo.svg"
              alt="logo"
              width={20}
              height={20}
              quality={100}
              className="w-20 md:w-[20px] md:h-[20px] self-center md:mt-0 mt-1"
            />
          </div>
        </div>

        <div className='flex flex-col text-[12px] self-center gap-4 pt-4'>
          <ul className='flex flex-row gap-4 text-gray-500 cursor-pointer'>
            <li>
              <Link href='/terms'> {phrase(dictionary, "terms", language)} </Link>
            </li>
            <li>
              <Link href='/terms/privacy'> {phrase(dictionary, "privacy", language)} </Link>
            </li>
            <li>
              <Link href='/terms/youth'> {phrase(dictionary, "youth_terms", language)} </Link>
            </li>
            <li>
              <Link href='/contact'> {phrase(dictionary, "contact", language)} </Link>
            </li>
            <li>
              <Link href='https://stelland.io'> © Stella& Inc. </Link>
            </li>

          </ul>
          <p className='self-center text-gray-500'>
            {language == 'en' ? 'Copyright 2025 ⓒ Toonyz All rights reserved' : 'ⓒ 주식회사 스텔라앤 코리아'}
          </p>
        </div>
      </div>
    </div>
  )
}

export const CreatorsPageWrapper = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const video_file_src = getVideoUrl('toonyz_creators.mp4');
  const { dictionary, language } = useLanguage();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "0.2 start"],
  });

  const smoothScrollYProgress = useSpring(scrollYProgress);
  const scale = useTransform(
    smoothScrollYProgress,
    [0, 1],
    isMobile ? [1, 0.9] : [1, 0.5]
  );

  const borderRadius = useTransform(scrollYProgress, [0, 1], [0, 20]);

  const faqData = [
    { title: "Q1", subtitle: "A1" },
    { title: "Q2", subtitle: "A2" },
  ];

  return (
    <>
      <motion.div ref={ref} style={{ scale }} className="">
        <motion.section
          className="test"
          style={{
            backgroundColor: "#C7B9FF",
            width: "100%",
            height: isMobile ? "400px" : "500px",
            minHeight: "262px",
            paddingTop: "0px",
            borderRadius,
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-white md:text-6xl text-3xl font-bold text-center md:mt-40 mt-20 syne-600">
              Share Your Story
              <br />
              Inspire Global Audiences
            </h1>
            <p className="text-white text-md font-bold text-center syne-400">
              Join our webnovel community, where your stories <br />
              come to life and your passion for writing turns into earnings.
            </p>
            <Button className='px-3 py-1 bg-black text-white'>
              Apply Now
            </Button>
          </div>
        </motion.section>
      </motion.div>

      <div className='md:max-w-screen-lg w-full mx-auto h-screen space-y-40 '>

        <FadeUp delay={0.1}>
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold text-center syne-600 my-10 ">
              Features That Make <br />
              Your Stories Go Further
            </h1>

            <div className="flex flex-col md:flex-row gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col gap-2 flex-1 md:p-0 p-4">
                  <div className="flex flex-col md:flex-row gap-2">
                    <span className="rounded-full bg-[#C7B9FF] text-black p-5 flex-grow-0 flex-nowrap w-fit">
                      {feature.icon}
                    </span>
                    <h2 className="text-2xl font-bold syne-600 md:self-center self-start break-words">
                      {feature.title}
                    </h2>
                  </div>
                  <p>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* How Toonyz Help Creators Succeed */}
        <FadeUp delay={0.5} duration={0.5}>
          <div className="flex flex-col justify-center items-center">
            <div className="flex flex-col justify-center items-center space-y-4 mb-10">
              <h1 className="text-3xl font-bold text-center syne-600 ">
                How Toonyz Help <br />
                Creators Succeed
              </h1>
              <p className="text-md font-bold text-center syne-400">
                Your Success in 4 Simple Steps
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              {processes.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 flex-1 md:p-0 p-4">
                  <div className="flex flex-col gap-2 items-center">
                    <span className=" w-[100px] h-[100px]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={100}
                        height={100}
                        className="w-full h-full object-fit"
                      />
                    </span>
                    <h2 className="text-2xl font-bold syne-600 md:self-center self-start break-words">
                      {item.title}
                    </h2>
                  </div>
                  <p>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Video part */}
        <FadeUp delay={0.5} duration={0.8}>
          <div className="max-w-screen-lg mx-auto flex flex-col justify-center items-center">
            <div className="flex md:flex-row flex-col justify-between items-center  my-10">
              <h1 className="text-3xl font-bold md:text-start text-center syne-700">
                Become a Toonyz story creator
              </h1>
              <p className="text-sm md:text-right text-center syne-400 w-2/3">
                Ready to start your writing journey? <br />
                Join today and turn your stories into a source of income!
              </p>
            </div>
          </div>
          <div className="w-full md:h-[500px] h-auto rounded-lg md:overflow-hidden">
            <Billboard
              videoSrc={video_file_src}
              posterSrc="/images/creators_video_poster.png"
              headerPhrase=""
              subheaderPhrase=""
              className="rounded-lg md:h-[500px] h-auto" />
          </div>
        </FadeUp>

        {Array.from(Array(4).keys()).map((i) => (
          <FadeUp key={i} delay={i * 0.1}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut vitae enim rem repudiandae? Blanditiis, ratione amet incidunt animi necessitatibus, eligendi odit eum unde aliquid inventore et molestiae repellendus praesentium atque!
            </p>
          </FadeUp>
        ))}


        {/* FAQ part */}
        <FadeUp delay={0.6} duration={0.8}>
          <h1 className="text-3xl font-bold text-center syne-600 my-10">
            Frequently Asked Questions
          </h1>
          <Accordion
            data={faqData}
            className="md:max-w-screen-sm w-full mx-auto"
            titleClassName=""
            subtitleClassName=""
          />
        </FadeUp>

        {/* footer part */}
        <Footer />
      </div>
    </>
  );
};
