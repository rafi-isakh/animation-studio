
'use client';
import Footer from "@/components/Footer";
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/Contact.module.css'
import Lenis from 'lenis'
import { useTransform, useScroll, motion, MotionValue } from 'framer-motion';

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
  
    const { scrollYProgress } = useScroll({
      target: gallery,
      offset: ['start end', 'end start']
    })
    const { height } = dimension;
    const y = useTransform(scrollYProgress, [0, 1], [0, height * 2])
    const y2 = useTransform(scrollYProgress, [0, 1], [0, height * 3.3])
    const y3 = useTransform(scrollYProgress, [0, 1], [0, height * 1.25])
    const y4 = useTransform(scrollYProgress, [0, 1], [0, height * 3])
  
    useEffect(() => {
      const lenis = new Lenis()
  
      const raf = (time: number) => {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      const resize = () => {
        setDimension({width: window.innerWidth, height: window.innerHeight})
      }
  
      window.addEventListener("resize", resize)
      requestAnimationFrame(raf);
      resize();
  
      return () => {
        window.removeEventListener("resize", resize);
      }
    }, [])
  


    return (
        <>
        <main className={styles.main}>
            <div ref={gallery} className={styles.gallery}>
                <Column images={[images[0], images[1], images[2]]} y={y}/>
                <Column images={[images[3], images[4], images[5]]} y={y2}/>
                <Column images={[images[6], images[7], images[8]]} y={y3}/>
                <Column images={[images[9], images[10], images[11]]} y={y4}/>
            </div>
            {/* <div className={styles.spacer}></div> */}
        </main>

        <div className="flex flex-col relative max-w-screen-xl group px-4 justify-center items-center mx-auto md:mb-6 mb-6">
           
           <div className="flex flex-col justify-start items-start mt-10 gap-4">
             <h1 className="text-5xl font-semibold items-start text-left py-10">Contact Us</h1>

                <p className="text-sm text-gray-600">Contact e-mail {' '}
                <span className="text-black font-semibold">hello@stella.com</span> 
                 {' '}for general help, questions, or feedback. we are always here to help you.
                </p>
             
                <p className="text-sm text-gray-600">If you have a question about Toonyz, please contact our customer support team at 
                <span className="text-black font-semibold">{' '}dami@stella.com</span> 
                </p>
               
                <p className="text-sm text-gray-600">We are always welcome to hear from you. </p>
                <p className="text-sm text-gray-600">Please contact us at
                <span className="text-black font-semibold">{' '}jongminbaek@stelland.io</span> 
                {' '}for IP, copyright, or other issues.
                </p> 
              
           
                <h1 className="text-2xl font-semibold items-start text-left pt-10">Meet Toonyz</h1>

                <p className="text-sm text-gray-600 leading-8">

                Toonyz is the #globalstoryplatform. <br/>
                Thanks to our translation solution powered by a state-of-the-art LLM engine, <br/>
                we are free from language barriers and ready to embark on a global journey. <br/>
                Join us and start your adventure today!


                </p>

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