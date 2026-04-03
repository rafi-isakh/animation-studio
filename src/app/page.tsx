'use client'

import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { Cinzel, Cormorant_Garamond } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
})

// ── Cover art infinite scroll columns ──────────────────────────────────────

const THUMBNAILS = [
  '/samples/thumbnails/내 딸이 검술 천재.webp',
  '/samples/thumbnails/리더-읽는 자.webp',
  '/samples/thumbnails/손님.jpg',
  '/samples/thumbnails/전생의 프로가 꿀 빠는 법.webp',
  '/samples/thumbnails/맛있는 스캔들.jpg',
  '/samples/thumbnails/마성의 신입사원.jpg',
  '/samples/thumbnails/이세계의 정령사가 되었다.webp',
  '/samples/thumbnails/레벨업하는 무신님.webp',
  '/samples/thumbnails/주인공들이 동물센터로 쳐들어왔다.jpg',
  '/samples/thumbnails/언니의인생을연기중입니다.jpg',
]

const COLS: number[][] = [
  [0, 3, 6, 9, 1, 4, 7],
  [2, 5, 8, 0, 3, 6, 9],
  [1, 4, 7, 2, 5, 8, 0],
  [6, 9, 2, 5, 1, 4, 7],
]
const DURATIONS = [28, 22, 32, 25]
const ITEM_H = 192

function ScrollColumn({ indices, duration, reversed }: { indices: number[]; duration: number; reversed?: boolean }) {
  const totalH = indices.length * (ITEM_H + 8)
  return (
    <div className="relative overflow-hidden flex-1" style={{ height: '100vh' }}>
      <motion.div
        className="flex flex-col gap-2 will-change-transform"
        animate={{ y: reversed ? [-totalH, 0] : [0, -totalH] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {[...indices, ...indices].map((idx, i) => (
          <div key={i} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ height: ITEM_H }}>
            <Image
              src={THUMBNAILS[idx]}
              alt=""
              width={180}
              height={ITEM_H}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Fade-in on scroll ───────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Source Structuring',
    desc: 'Automatically extracts and organizes characters, props, backgrounds, and scene units from your original content — text or image.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    accent: '#DB2777',
    glow: 'rgba(219,39,119,0.2)',
    formats: ['Characters', 'Props', 'Scenes', 'Backgrounds'],
  },
  {
    title: 'Scene Script Pipeline',
    desc: 'Generates complete scene scripts per unit — story breakdown, shot configuration, dialogue, and AI-ready image and video prompts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    accent: '#7C3AED',
    glow: 'rgba(124,58,237,0.2)',
    formats: ['Story', 'Shot Config', 'Dialogue', 'Prompts'],
  },
  {
    title: 'Draft Animation Output',
    desc: 'Produces character sheets, prop references, generated backgrounds, and frame images — assembled into a short animation draft.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
    accent: '#0EA5E9',
    glow: 'rgba(14,165,233,0.2)',
    formats: ['Character Sheets', 'Backgrounds', 'Frame Images', 'Video Draft'],
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Import Original',
    desc: 'Upload your webnovel chapters as text, or import webtoon and manga pages as images. Both formats are supported.',
  },
  {
    n: '02',
    title: 'Structure Source Data',
    desc: 'The platform identifies and organizes characters, props, backgrounds, and separates the content into panel and scene units.',
  },
  {
    n: '03',
    title: 'Generate Scene Scripts',
    desc: 'Each scene unit gets a full script: story beat, shot configuration, dialogue, and AI-ready image and video prompts.',
  },
  {
    n: '04',
    title: 'Create Production Assets',
    desc: 'Character sheets, prop references, style guides, and anime-style backgrounds are generated for every scene.',
  },
  {
    n: '05',
    title: 'Output Animation Draft',
    desc: 'Frame images are assembled into a short animation draft — a structured starting point ready for the next production stage.',
  },
]

const AUDIENCES = [
  {
    label: 'Artists',
    desc: 'Webtoon and manga creators who need a fast path from their panels to a structured animation draft — without starting from scratch.',
    icon: '✦',
  },
  {
    label: 'Authors',
    desc: 'Web novel writers who want to visualize their story as an animated short and accelerate the pitch or production process.',
    icon: '✦',
  },
  {
    label: 'Publishers & Studios',
    desc: 'Teams adapting IP into animated content who need a rapid pre-production pipeline from source material to production-ready drafts.',
    icon: '✦',
  },
]

// ── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="bg-[#080808] text-[#E2DED8] overflow-x-hidden">
      <style>{`
        @keyframes grain {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-2%,-2%)}
          30%{transform:translate(-1%,1%)}
          50%{transform:translate(-2%,1%)}
          70%{transform:translate(-1%,2%)}
          90%{transform:translate(-2%,-1%)}
        }
        @keyframes glow-pulse {
          0%,100%{opacity:.35;transform:scale(1)}
          50%{opacity:.6;transform:scale(1.06)}
        }
        @keyframes marquee {
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        .marquee-track { animation: marquee 36s linear infinite; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.96) 0%, transparent 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/favicon.svg" alt="Rivell" width={26} height={26} className="rounded" />
            <span className={`${cinzel.className} text-[14px] font-bold tracking-[0.14em] text-white`}>Rivell</span>
            <span className="text-[11px] font-medium tracking-[0.18em] text-[#DB2777] border border-[#DB277740] px-1.5 py-0.5 rounded uppercase">Studio</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] text-[#7A7672]">
            <a href="#features" className="text-[#9A9490] font-medium tracking-[0.06em] hover:text-white transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="text-[#9A9490] font-medium tracking-[0.06em] hover:text-white transition-colors duration-200">How it works</a>
            <a href="#for-who" className="text-[#9A9490] font-medium tracking-[0.06em] hover:text-white transition-colors duration-200">Who it&apos;s for</a>
          </nav>

          <Link
            href="/mithril"
            className="text-[14px] font-semibold px-4 py-2 rounded-lg bg-[#DB2777] hover:bg-[#BE185D] text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(219,39,119,0.4)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Scrolling cover art columns */}
        {mounted && (
          <div className="absolute inset-0 flex gap-2 px-2" style={{ opacity: 0.28 }}>
            {COLS.map((col, i) => (
              <ScrollColumn key={i} indices={col} duration={DURATIONS[i]} reversed={i % 2 === 1} />
            ))}
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#08080890] to-[#08080850]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-[#080808]" />

        {/* Pink ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(219,39,119,0.14) 0%, transparent 68%)',
            animation: 'glow-pulse 7s ease-in-out infinite',
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            animation: 'grain 0.4s steps(1) infinite',
          }}
        />

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-[#DB2777] border border-[#DB277728] rounded-full px-4 py-1.5 mb-8 bg-[#DB27770D]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#DB2777] animate-pulse" />
            Pre-Production Workflow
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`${cormorant.className} leading-[0.92] font-light text-white mb-6`}
            style={{ fontSize: 'clamp(56px, 10vw, 108px)' }}
          >
            Original to draft,<br />
            <em style={{ color: '#DB2777', fontStyle: 'italic' }}>in hours.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="text-[17px] md:text-[19px] text-[#8A8480] max-w-xl mx-auto mb-10 leading-relaxed font-light"
          >
            An internal workflow that converts webnovels, webtoons, and manga into structured short animation drafts — ready for the next stage of production.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.52 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/mithril"
              className="group flex items-center gap-2.5 px-7 py-3.5 bg-[#DB2777] hover:bg-[#BE185D] text-white rounded-xl text-[14px] font-semibold transition-all duration-200 hover:shadow-[0_0_32px_rgba(219,39,119,0.45)] hover:-translate-y-0.5"
            >
              Get Started
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-7 py-3.5 border border-white/10 hover:border-white/20 text-[#9A9490] hover:text-white rounded-xl text-[14px] font-medium transition-all duration-200 hover:bg-white/[0.04]"
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-[#DB277740] to-transparent"
          />
        </motion.div>
      </section>


      {/* ── Features ── */}
      <section id="features" className="py-32 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-16 max-w-2xl">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#DB2777] mb-4">What it does</p>
            <h2 className={`${cormorant.className} font-light text-white leading-tight`} style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
              A complete pipeline,<br />
              <em>from source to draft.</em>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div
                  className="group relative rounded-2xl border border-white/[0.07] p-7 h-full overflow-hidden transition-all duration-300 hover:border-white/[0.13]"
                  style={{ background: '#0F0E0E' }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${f.glow} 0%, transparent 70%)` }}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-6"
                      style={{ background: `${f.accent}18`, color: f.accent }}
                    >
                      {f.icon}
                    </div>

                    <h3 className="text-[17px] font-semibold text-white mb-3 leading-snug">{f.title}</h3>
                    <p className="text-[15px] text-[#7E7B78] leading-relaxed mb-6">{f.desc}</p>

                    {/* Format pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {f.formats.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full font-medium"
                          style={{ background: `${f.accent}12`, color: f.accent }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cover art marquee (visual break) ── */}
      <div className="py-8 overflow-hidden">
        <div className="flex gap-3 marquee-track w-max">
          {[...Array(4)].flatMap((_, r) =>
            THUMBNAILS.map((src, i) => (
              <div key={`${r}-${i}`} className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 110, height: 148 }}>
                <Image
                  src={src}
                  alt=""
                  width={110}
                  height={148}
                  className="object-cover w-full h-full opacity-40 hover:opacity-70 transition-opacity duration-300"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-32 px-6 md:px-10 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-20 text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#DB2777] mb-4">The Process</p>
            <h2 className={`${cormorant.className} font-light text-white leading-tight`} style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
              Simple steps to<br />
              <em>your animated story.</em>
            </h2>
          </FadeIn>

          <div className="max-w-2xl mx-auto md:mx-0">
            {STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1}>
                <div className="flex gap-6 pb-10 last:pb-0">
                  {/* Step indicator + connector */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#DB277730] bg-[#DB27770D] flex-shrink-0"
                    >
                      <span className={`${cinzel.className} text-[11px] font-bold text-[#DB2777]`}>{step.n}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 mt-2" style={{ background: 'linear-gradient(to bottom, #DB277728, transparent)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5 pb-2">
                    <h3 className="text-[17px] font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-[15px] text-[#8A8480] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section id="for-who" className="py-32 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="mb-16 text-center">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#DB2777] mb-4">Who it&apos;s for</p>
            <h2 className={`${cormorant.className} font-light text-white leading-tight`} style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
              Built for every<br />
              <em>kind of storyteller.</em>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUDIENCES.map((a, i) => (
              <FadeIn key={a.label} delay={i * 0.1}>
                <div
                  className="rounded-2xl border border-white/[0.07] p-8 h-full transition-all duration-300 hover:border-white/[0.12]"
                  style={{ background: '#0F0E0E' }}
                >
                  <span className="text-[#DB2777] text-lg mb-5 block">✦</span>
                  <h3 className={`${cormorant.className} text-[28px] font-semibold text-white mb-3`}>{a.label}</h3>
                  <p className="text-[15px] text-[#8A8480] leading-relaxed">{a.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 md:px-10">
        <FadeIn>
          <div
            className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/[0.07] p-14 md:p-24 text-center"
            style={{ background: 'linear-gradient(135deg, #160A10 0%, #0E0A16 50%, #080808 100%)' }}
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(219,39,119,0.18) 0%, transparent 60%)' }}
            />

            {/* Flanking cover arts */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 hidden md:block opacity-20 -rotate-6 rounded-xl overflow-hidden">
              <Image src={THUMBNAILS[4]} alt="" width={130} height={176} className="object-cover" />
            </div>
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden md:block opacity-20 rotate-6 rounded-xl overflow-hidden">
              <Image src={THUMBNAILS[8]} alt="" width={130} height={176} className="object-cover" />
            </div>

            <div className="relative z-10">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#DB2777] mb-5">Get Started Today</p>
              <h2
                className={`${cormorant.className} font-light text-white leading-tight mb-6`}
                style={{ fontSize: 'clamp(40px, 7vw, 72px)' }}
              >
                Start your<br />
                <em>first draft.</em>
              </h2>
              <p className="text-[#6A6663] text-[16px] mb-10 max-w-sm mx-auto leading-relaxed">
                Turn your original into a structured short animation draft — faster than any traditional pre-production pipeline.
              </p>
              <Link
                href="/mithril"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#DB2777] hover:bg-[#BE185D] text-white rounded-xl text-[14px] font-semibold transition-all duration-200 hover:shadow-[0_0_40px_rgba(219,39,119,0.5)] hover:-translate-y-0.5"
              >
                Get Started
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <Image src="/favicon.svg" alt="Rivell" width={20} height={20} className="rounded opacity-50" />
            <span className={`${cinzel.className} text-[11px] font-bold tracking-[0.18em] text-[#3A3835]`}>
              RIVELL ANIMATION STUDIO
            </span>
          </div>
          <p className="text-[11px] text-[#302E2C] tracking-wide">
            © 2026 Rivell · Web Novel Short-Form Animation Platform
          </p>
          <div className="flex items-center gap-5 text-[12px] text-[#3A3835]">
            <Link href="/mithril" className="hover:text-[#9A9490] transition-colors">Studio</Link>
            <Link href="/projects" className="hover:text-[#9A9490] transition-colors">Projects</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}