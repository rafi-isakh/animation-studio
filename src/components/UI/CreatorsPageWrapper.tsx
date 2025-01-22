'use client'
import { useRef, useState, useEffect } from "react";
import { useScroll, motion, useSpring, useTransform, useInView } from "framer-motion";
import { Button } from '@mui/material'
import { useMediaQuery } from 'react-responsive'
import '@/styles/CustomFonts.css'
import { Earth, HandHeart, SquarePen, ChevronRight } from "lucide-react";
import Image from "next/image";
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import Billboard from '@/components/UI/Billboard';
import Accordion from '@/components/UI/Accordion';
import { getVideoUrl } from '@/utils/urls';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import '@/styles/Creators.css'

const features = [
  {
    id: 1,
    icon: <Earth size={20} />,
    title: "Global distribution",
    title_ko: "글로벌 배포",
    description: "Reach a more meaningful audience by sharing your story with us, and your work will gain global recognition.",
    description_ko: "투니즈는 창작자님의 스토리를 전 세계의 독자가 만날 수 있도록 도와드립니다. 투니즈와 함께 글로벌 작가로 성장해 보세요.",
  },
  {
    id: 2,
    icon: <HandHeart size={20} />,
    title: "Transparent Revenue Share",
    title_ko: "공정한 수익 공유",
    description: "We offer a transparent revenue share model, ensuring that you receive a fair share of the profits from your work.",
    description_ko: "투니즈를 통해 창작자님의 수익은 더욱 공정하고 투명하게 페이 됩니다. 투니즈는 창작자님의 창작한 작품을 통해 얻은 수익을 투명하게 공유해 드립니다.",
  },
  {
    id: 3,
    icon: <SquarePen size={20} />,
    title: "Earn Money By Sharing",
    title_ko: "수익 창출 활동",
    description: "Creators can monetize their stories, and we can help you reach a global audience.",
    description_ko: "투니즈는 글로벌 플랫폼입니다. 창작자님의 소중한 작품을 투니즈에 올려주세요. 저희 플랫폼은 창작자님의 작품을 전 세계 주요 시장에 공유하고 수익을 공유해 드립니다.",
  },
]

const processes = [
  {
    id: 1,
    image: "/images/creators_signup.svg",
    title: "Sign Up",
    title_ko: "가입하기",
    description: "Create your free account and join our community of writers.",
    description_ko: "무료 계정을 만들고 투니즈 무료연재를 시작하세요.",
  },
  {
    id: 2,
    image: "/images/creators_apply.svg",
    title: "Create Your Story",
    title_ko: "스토리 작성하기",
    description: "Use our intuitive tools to draft, edit, and finalize your story.",
    description_ko: "투니즈의 글쓰기 도구를 사용하여 스토리를 작성하고 편리하게 수정하고 완성하세요.",
  },
  {
    id: 3,
    image: "/images/creators_publish.svg",
    title: "Publish",
    title_ko: "연재하기",
    description: "Publish your story to the global audience and meet new readers.",
    description_ko: "창작자님의 스토리를 전 세계 주요 시장에 공유하고 새로운 독자를 만나세요.",
  },
  {
    id: 4,
    image: "/images/creators_earn.svg",
    title: "Earn",
    title_ko: "수익 창출",
    description: "Earn money from your story and share it with the world.",
    description_ko: "창작자님의 스토리를 전 세계 주요 시장에 공유하고 수익을 창출하세요.",
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


export function ToonyzPlatform() {
  const { dictionary, language } = useLanguage()

  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="flex md:flex-row flex-col justify-between items-center">
        <div className="flex flex-col order-2 md:order-1 md:w-1/2 w-full">
          <h1 className="md:text-3xl text-xl font-bold text-center syne-600 md:pt-0 pt-10  break-keep">
            Toonyz <br /> {language == 'en' ? '#GlobalStoryPlatform' : '글로벌 스토리 플랫폼'}
          </h1>
          <div className="text-sm text-center py-4 break-keep">
            {language == 'en' ?
              <p>Your story can go the furthest with Toonyz</p>
              : <p>여러분의 이야기가 세계로 가장 빠르게 <br />
                나아갈 수 있는 방법, <br />
                투니즈 크리에이터가 되어 보세요.
              </p>
            }
          </div>

          <div className="text-sm text-center break-keep py-2">
            {language == 'en' ?
              <p>● Requirements <br />
                - No restrictions <br />
                - Both established and new authors can apply</p>
              : <p>● 지원 자격 <br />
                - 제한없음 <br />
                - 기성작가, 신인작가 누구나</p>}
          </div>
          <div className="text-sm text-center break-keep py-2">
            {language == 'en' ?
              <p>● Schedule <br />
                - No restrictions <br />
                - You can apply anytime</p>
              : <p>● 일정 <br />
                - 제한없음 <br />
                - 언제든지 신청 가능</p>}
          </div>
          <div className="text-sm text-center break-keep py-2">
            {language == 'en' ?
              <p>● How to Apply <br />
                - Sign up on the Toonyz homepage <br />
                - Click the new story button after logging in</p>
              : <p>● 지원 방법 <br />
                - 투니즈 홈페이지 가입하기 <br />
                - 로그인 후 새 작품 쓰기 버튼 클릭 <br />
              </p>}
          </div>

          <div className={`flex ${language == 'en' ? 'self-center' : 'self-center'} mt-5`}>
            <Button
              sx={{
                backgroundColor: '#000',
                borderRadius: '10px',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#000',
                },
              }}
              className={`px-4 py-1 bg-black text-white flex items-center gap-2`}>
              <Link href='/signin'>
                {language == 'en' ? <p className="flex items-center gap-2">Apply Now <ChevronRight size={14} /></p>
                  : <p className="flex items-center gap-2">지금 가입 하기 <ChevronRight size={14} /></p>}
              </Link>
            </Button>
          </div>


        </div>
        <div className="order-1 md:order-2 relative flex justify-center items-center w-fit overflow-hidden">

          <FadeUp delay={0.9} duration={0.5}>
            <div className="relative left-0 top-0">
              <Image
                id="creators_left_bg"
                className="creators_left_bg left-0 m-auto w-72 transition-all duration-300 dark:invert"
                src={'/images/creators_left_bg.svg'}
                alt="Toonyz"
                width={300}
                height={300}
                priority
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.7} duration={0.5}>
            <Image
              className="right-0 m-auto w-72 "
              src={'/images/creators_mockup.svg'}
              alt="Toonyz app frame"
              width={300}
              height={300}
              priority
            />
          </FadeUp>

          <FadeUp delay={1.1} duration={0.5}>
            <div className="relative left-0 top-0">
              <Image
                id="creators_right_bg"
                className="creators_right_bg left-0 m-auto w-72 transition-all duration-300 dark:invert"
                src={'/images/creators_right_bg.svg'}
                alt="Toonyz"
                width={300}
                height={300}
                priority
              />
            </div>
          </FadeUp>

          {/* <img
          className="hidden rounded-2xl xl:flex"
          src={HeroImage}
          alt="A woman happily using Kobodrop"
        /> */}
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  const { dictionary, language } = useLanguage()

  return (
    <div className='h-[30vh] bg-white dark:bg-black '>
      <div className='w-full mx-auto flex flex-col items-center justify-center'>
        <span className="text-[12px] text-gray-500 text-center py-5">
          Your Favorite Story Universe, Between Us, Toonyz
        </span>
        <div className='flex flex-col items-center justify-center w-full'>
          <hr className='w-screen border-t border-gray-300 my-4' />
          <div className='bg-white dark:bg-black px-4 absolute'>
            <Image
              src="/images/N_logo.svg"
              alt="logo"
              width={20}
              height={20}
              quality={100}
              className="w-[20px] h-[20px] self-center md:mt-0 mt-1"
            />
          </div>
        </div>

        <div className='flex flex-col text-[12px] self-center gap-4 pt-4'>
          <ul className='flex md:flex-row flex-col justify-center items-center gap-4 text-gray-500 cursor-pointer'>
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
          <p className='self-center text-gray-500 mb-10'>
            {language == 'en' ? 'Copyright 2025 ⓒ Toonyz All rights reserved' : 'ⓒ 주식회사 스텔라앤 코리아'}
          </p>
        </div>
      </div>
    </div>
  )
}

export const BillboardWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.7", "end 0.3"]
  });
  const smoothScrollYProgress = useSpring(scrollYProgress);
  const scale = useTransform(
    smoothScrollYProgress,
    [0, 1],
    isMobile ? [1, 0.9] : [1, 0.5]
  );
  return (
    <motion.div ref={ref} style={{ scale }} className={className}>
      {children}
    </motion.div>
  )
}

export const CreatorsPageWrapper = () => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const video_file_src = getVideoUrl('toonyz_creators.mp4');
  const { dictionary, language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
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
    {
      title: "Q1. Does Toonyz provide copyright protection services?",
      title_ko: "Q1. Toonyz는 저작권 보호 서비스를 제공하나요?",
      subtitle: "Toonyz does not provide copyright protection services. However, we offer a platform where creators can share their stories and earn money. While we facilitate sharing and monetization, we do not guarantee copyright protection.",
      subtitle_ko: "Toonyz 플랫폼 내에 창작자님이 투고하신 글에 대한 저작권 보호를 하고 있습니다. 작가님께서 스토리를 공유하고 수익을 창출할 수 있는 글로벌 플랫폼을 제공합니다. 창작자님의 작품이 공유 및 수익 창출을 적극적으로 지원하고 도와드립니다. Toonyz는 저작권 보호에 대한 법률 자문 서비스는 제공하지 않습니다. "
    },
    {
      title: "Q2. How do I earn money from my story?",
      title_ko: "Q2. 내 스토리로 어떻게 돈을 벌 수 있나요?",
      subtitle: "You can earn money by sharing your story with a global audience. Our platform connects you with meaningful audiences worldwide and shares revenue with you.",
      subtitle_ko: "창작자님의 스토리를 전 세계 주요 시장에 공유하여 수익을 창출할 수 있습니다. 저희 플랫폼은 창작자님의 작품을 전 세계 주요 시장에 공유하고 수익을 공유해 드립니다."
    },
    {
      title: "Q3. How does Toonyz protect my work from plagiarism?",
      title_ko: "Q3. 내 작품을 도용하는 것을 어떻게 방지하나요?",
      subtitle: "While we cannot guarantee full copyright protection, we strive to safeguard your work from plagiarism. We use AI tools to detect potential plagiarism and provide a platform for you to share your stories and earn revenue.",
      subtitle_ko: "Toonyz는 완전한 저작권 보호를 보장하지 않지만, 도용을 방지하기 위해 노력합니다. 저희는 AI 도구를 사용하여 잠재적인 도용을 탐지하고 창작자님의 작품을 공유하고 수익을 창출할 수 있는 플랫폼을 제공합니다."
    },
    {
      title: "Q4. Can I get feedback on my writing?",
      title_ko: "Q4. 내 글에 대한 피드백을 받을 수 있나요?",
      subtitle: "For general inquiries, you can email us at hello@stelland.io with any questions or feedback. For IP or copyright-related questions, please contact lisa@stelland.io, and we will do our best to assist you.",
      subtitle_ko: "일반적인 문의는 hello@stelland.io로 이메일을 보내주세요. IP 또는 저작권 관련 문의는 lisa@stelland.io로 연락해 주세요. 저희는 최선을 다해 도와드리겠습니다."
    },
    {
      title: "Q5. How do I get paid?",
      title_ko: "Q5. 어떻게 수익을 받나요?",
      subtitle: "You can get paid in your bank account from our company. We will send you the payment after the revenue is shared with you.",
      subtitle_ko: "창작자님의 수익을 받으시려면 저희 회사에서 확인 후 수익을 보내드립니다. 수익이 공유된 후 창작자님의 은행 계좌로 보내드립니다. 자세한 내용은 저희 회사에 문의해 주세요."
    },
  ];

  return (
    <>
      <motion.div
        ref={ref}
        style={{
          scale,
        }}
        className="">
        <motion.section
          className="test"
          style={{
            // backgroundColor: "#C7B9FF",
            backgroundImage: isMobile
              ? `url('/images/creators_hero_image_mobile.png')`
              : `url('/images/creators_hero_image.png')`,
            backgroundSize: 'cover',
            backgroundPosition: isMobile ? 'center' : 'center',
            width: "100%",
            height: isMobile ? "auto" : "690px",
            minHeight: "390px",
            marginTop: isMobile ? "30px" : "0px",
            borderRadius,
          }}
        >
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="md:max-w-screen-lg w-full text-black md:text-6xl text-3xl font-bold text-center md:mt-[480px] sm:mt-[200px] mt-[460px] syne-600">
              {language == 'en' ?
                <p className="md:text-2xl text-xl text-center md:p-0 -mt-2">
                  Inspire Global Audiences
                </p>
                : <p className="md:text-2xl text-md font-bold text-center korean break-keep md:p-0 nanum-gothic-extrabold">
                  {/* 투니즈 공식 크리에이터를 모집합니다 <br /> */}
                  투니즈 창작자님 상시 모집!
                </p>
              }

            </div>
            <div className="md:max-w-screen-lg flex flex-col gap-1 w-full text-black text-md font-bold text-center syne-400">
              {language == 'en' ?
                <p className="md:text-sm text-[10px] text-center md:p-0 md:py-2 mx-auto">
                  Join our webnovel community, where your stories <br />
                  come to life and your passion for writing turns into earnings.</p>
                : <p className="md:text-sm text-sm font-bold text-center korean md:p-0 md:py-2 py-1 mx-auto nanum-gothic">
                  글로벌 독자를 이끌 주인공이 되어 보세요 <br />
                  {/* 투니즈 공식 작가님을 상시 모집하고 있습니다. <br /> */}
                  지금 바로 신청해보세요.
                </p>
              }
              <div className={`flex ${language == 'en' ? 'self-center' : 'self-center'}`}>
                <Button
                  sx={{
                    backgroundColor: '#000',
                    borderRadius: '10px',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#000',
                    },
                  }}
                  className={`px-4 py-1 bg-black text-white flex items-center gap-2`}>
                  <Link href='/signin'>
                    {language == 'en' ? <p className="flex items-center gap-2">Apply Now <ChevronRight size={14} /></p>
                      : <p className="flex items-center gap-2">지금 가입 하기 <ChevronRight size={14} /></p>}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>

      <div className='w-full mx-auto h-screen space-y-60'>
        <FadeUp delay={0.1}>
          <div className="md:max-w-screen-lg w-full mx-auto flex flex-col justify-center items-center">
            <div className="text-3xl font-bold text-center syne-600">
              {language == 'en'
                ? <p className="md:text-2xl text-xl text-center my-10">
                  Features That Make <br />
                  Your Stories Go Further
                </p>
                : <p className="text-2xl font-bold text-center korean my-10 word-break">
                  투니즈는 창작자님의 <br />
                  스토리를 더 멀리 이끌어 드립니다</p>
              }
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col gap-4 flex-1 md:p-0 p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <span className="rounded-full bg-[#C7B9FF] text-black p-5 flex-grow-0 flex-nowrap w-fit">
                      {feature.icon}
                    </span>
                    <h2 className="text-2xl font-bold syne-600 md:self-center self-start break-keep">
                      {language == 'en' ? feature.title : feature.title_ko}
                    </h2>
                  </div>
                  <p>
                    {language == 'en' ? feature.description : feature.description_ko}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* How Toonyz Help Creators Succeed */}
        <FadeUp delay={0.5} duration={0.5}>
          <div className="md:max-w-screen-lg w-full mx-auto flex flex-col justify-center items-center mb-20">
            <div className="flex flex-col justify-center items-center space-y-4 mb-10">
              <div className="text-3xl font-bold text-center syne-600 ">
                {language == 'en' ? <>How Toonyz Help <br />
                  Creators Succeed</>
                  : <p className="text-2xl font-bold text-center korean break-keep">
                    투니즈는 창작자님의 <br />
                    성공을 도와드립니다
                  </p>}
              </div>
              <div className="text-md font-bold text-center syne-400">
                {language == 'en' ? <>Your Success in 4 Simple Steps</>
                  : <p className="text-md font-pretendard text-center korean break-keep" >
                    투니즈의 특별한 4가지 프로세스
                  </p>
                }
              </div>
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
                    <h2 className="text-2xl font-bold syne-600 md:self-center self-center break-keep ">
                      {index + 1}.  {language == 'en' ? item.title : item.title_ko}
                    </h2>
                  </div>
                  <p className="text-md text-center korean">
                    {language == 'en' ? item.description : item.description_ko}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>


        {/* toonyz creators application details */}
        <FadeUp delay={0.7} duration={0.8}>
          <ToonyzPlatform />
        </FadeUp>




        {/* Video part */}
        <FadeUp delay={0.5} duration={0.8}>
          <div className="md:max-w-screen-lg w-full mx-auto flex flex-col items-center">
            <div className="flex md:flex-row flex-col justify-between items-center w-full gap-4">
              <h1 className="text-3xl font-bold md:text-start text-center syne-700 md:w-1/2">
                {language == 'en' ? "Become a Toonyz story creator" : <p className="text-3xl font-bold text-start korean">투니즈 크리에이터</p>}
              </h1>
              <p className="text-sm md:text-right text-center syne-400 md:w-1/2 pb-5">
                {language == 'en' ? <> Ready to start your writing journey? <br />
                  Join today and turn your stories into a source of income!</>
                  : <> 창작자님의 스토리를 공유하세요. <br />
                    오늘 가입하고 스토리를 통해 수익을 창출하세요! </>
                }
              </p>
            </div>
          </div>

          <BillboardWrapper className='w-full md:h-[680px] h-[300px] rounded-lg overflow-hidden mx-auto'>
            <Billboard
              videoSrc={video_file_src}
              posterSrc="/images/creators_video_poster.png"
              headerPhrase=""
              subheaderPhrase=""
              className="rounded-lg w-full h-full object-cover object-center"
              containerClassName="w-full h-full"
            />
          </BillboardWrapper>

        </FadeUp>

        {/* {Array.from(Array(4).keys()).map((i) => (
          <FadeUp key={i} delay={i * 0.1}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut vitae enim rem repudiandae? Blanditiis, ratione amet incidunt animi necessitatibus, eligendi odit eum unde aliquid inventore et molestiae repellendus praesentium atque!
            </p>
          </FadeUp>
        ))} */}

        {/* FAQ part */}
        <div
          className="bg-amber-50 w-full pb-10"
        >
          <FadeUp delay={0.6} duration={0.8}>
            <div className="flex flex-col justify-center items-center mt-10 text-black dark:text-black">
              <h1 className="text-3xl font-bold text-center syne-600">
                {language == 'en'
                  ? <p className="text-3xl text-center font-pretendard my-10">Frequently Asked Questions</p>
                  : <p className="text-3xl font-bold text-center font-pretendard my-10">자주 묻는 질문</p>}
              </h1>
              <Accordion
                data={faqData.map(item => ({
                  title: language === 'ko' ? item.title_ko || item.title : item.title,
                  subtitle: language === 'ko' ? item.subtitle_ko || item.subtitle : item.subtitle
                }))}
                className="md:max-w-screen-sm w-full mx-auto"
                titleClassName=""
                subtitleClassName=""
              />
            </div>
          </FadeUp>
        </div>
        <Footer />
      </div>
    </>
  );
};
