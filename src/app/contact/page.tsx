'use client';
import Footer from "@/components/Footer";
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/Contact.module.css'
import Lenis from 'lenis'
import { useTransform, useScroll, motion, MotionValue } from 'framer-motion';
import { FloatingMenu } from '@/components/FloatingMenuComponent';

const images = [
  "Contact_1.png",
  "Contact_2.png",
  "Contact_3.png",
  "Contact_4.png",
  "Contact_5.png",
  "Contact_6.png",
  "Contact_7.png",
  "Contact_8.png",
  "Contact_9.png",
  "Contact_10.png",
  "Contact_11.png",
  "Contact_12.png",
]

const Column = ({images, y}: {images: string[], y: MotionValue<number> }) => {
    return (
      <motion.div 
        className={styles.column}
        style={{y}}
        >
        {
          images.map((src, i) => {
            return <div key={i} className={styles.imageContainer}>
              <Image 
                src={`/contact/${src}`}
                alt='image'
                fill
              />
            </div>
          })
        }
      </motion.div>
    )
}

export default function Contact() {
    const gallery = useRef(null);
    const [dimension, setDimension] = useState({width:0, height:0});
    const lenisRef = useRef<Lenis | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const rafRef = useRef<number>();

    const { scrollYProgress } = useScroll({
        target: gallery,
        offset: ['start end', 'end start']
    })
    
    const { height } = dimension;
    const y = useTransform(scrollYProgress, [0, 1], [0, height * 2])
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 3.3])
    const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25])
    const y4 = useTransform(scrollYProgress, [0, 1], [0, height * 3])
    
    // Handle window resize and mobile detection
    useEffect(() => {
        const checkMobile = () => {
            const isMobileView = window.innerWidth <= 430;
            setIsMobile(isMobileView);
            
            // Cleanup existing Lenis instance if switching to mobile
            if (isMobileView && lenisRef.current) {
                lenisRef.current.destroy();
                lenisRef.current = null;
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current);
                }
            }
        };
        
        const handleResize = () => {
            setDimension({width: window.innerWidth, height: window.innerHeight});
            checkMobile();
        };

        handleResize();
        
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Handle Lenis initialization and cleanup
    useEffect(() => {
        // Only initialize Lenis if not mobile
        if (!isMobile) {
            lenisRef.current = new Lenis({
                duration: 3,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 0,
                infinite: false,
            });

            const raf = (time: number) => {
                lenisRef.current?.raf(time);
                rafRef.current = requestAnimationFrame(raf);
            };

            rafRef.current = requestAnimationFrame(raf);
        }　else {
            lenisRef.current = null;
        }

        // Cleanup function
        return () => {
            if (lenisRef.current) {
                lenisRef.current.destroy();
                lenisRef.current = null;
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isMobile]);

      
    return (
        <>
        <main className={`${styles.main} ${isMobile ? styles.mobileMain : ''}`}>
            <div ref={gallery} className={`${styles.gallery} ${isMobile ? styles.mobileGallery : ''}`}>
                <Column images={[images[0], images[1], images[2]]} y={y}/>
                <Column images={[images[3], images[4], images[5]]} y={y2}/>
                <Column images={[images[6], images[7], images[8]]} y={y3}/>
                <Column images={[images[9], images[10], images[11]]} y={y4}/>
            </div>
        </main>

        <div className="flex flex-col relative max-w-screen-xl group px-4 justify-center items-center mx-auto md:mb-6 mb-6">
           
           <div className="flex flex-col justify-start items-start mt-10 gap-4">
             <h1 className="text-5xl font-semibold items-start text-left py-10">Contact Us</h1>

                <p className="text-sm text-gray-600">Contact e-mail {' '}
                <span className="text-black dark:text-white font-semibold">hello@stelland.io</span> 
                 {' '}for general help, questions, or feedback. we are always here to help you.
                </p>
             
                <p className="text-sm text-gray-600">If you have a question about Toonyz, please contact our customer support team at 
                <span className="text-black dark:text-white font-semibold">{' '}dami@stelland.io</span> 
                </p>
               
                <p className="text-sm text-gray-600">We are always welcome to hear from you. </p>
                <p className="text-sm text-gray-600">Please contact us at
                <span className="text-black dark:text-white font-semibold">{' '}jongminbaek@stelland.io</span> 
                {' '}for IP, copyright, or other issues.
                </p> 
              
                <FloatingMenu >
                <h1 className="text-2xl font-semibold items-start text-left pt-10">Meet Toonyz</h1>

                <p className="text-sm text-gray-600 leading-8">

                Toonyz is the  <span className="text-black dark:text-white font-semibold">{' '}#globalstoryplatform.</span> <br/>
                Thanks to our translation solution powered by a state-of-the-art LLM engine, <br/>
                we are free from language barriers and ready to embark on a global journey. <br/>
                Join us and start your adventure today!


                </p>
                </FloatingMenu> 
                <div className="flex flex-col gap-1 mt-10">
                    <Image
                        src="/N_Logo.png"
                        alt="Toonyz Logo"
                        width={0}
                        height={0}
                        sizes="100vh"
                        style={{
                            height: '20px',
                            width: '20px',
                            // justifyContent: 'center',
                            // alignSelf: 'center',
                            borderRadius: '25%',
                            border: '1px solid #eee'
                        }}
                    />
                    <p className="text-center text-[10px]"> Your Favorite Story Universe, Between Us, Toonyz </p>
                </div>
           
           </div>
        </div>
        <Footer />
        </>
    )
}   
