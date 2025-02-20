'use client'
import Link from "next/link"
import Accordion from "@/components/UI/Accordion"
import { useLanguage } from "@/contexts/LanguageContext"

const readByGenreData = [
  {
    title: "Read By Genres",
    subtitles: [
      "Fantasy",
      "Romance",
      "Action",
      "Mystery",
      "Sci-Fi",
      "Horror",
      "Comedy"
    ]
  },
]

export default function Sitemap() {
  const { dictionary, language } = useLanguage()
  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-12">Site Map</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {/* About Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About Toonyz</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/creators" className="text-gray-500 hover:underline">
                  Be a Toonyz Creators
                </Link>
              </li>
              <li>
                <Link href="/terms/privacy" className="text-gray-500 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/terms/youth" className="text-gray-500 hover:underline">
                  Youth Protection Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:underline">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Webnovels Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Webnovels & Community</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/?version=premium" className="text-gray-500 hover:underline">
                  Read Webnovels
                </Link>
              </li>
              <li>
                <Accordion
                  data={readByGenreData.map(genre => ({
                    title: genre.title,
                    subtitle: genre.subtitles.map((sub, index) => (
                      <span key={index}>
                        {sub}
                        {index < genre.subtitles.length - 1 && <br />}
                      </span>
                    ))
                  }))}
                  className="md:max-w-screen-sm w-full mx-auto"
                  titleClassName="!p-0 !text-gray-500"
                  subtitleClassName=""
                />
              </li>
              <li>
                <Link href="/search" className="text-gray-500 hover:underline">
                  Find a Webnovel
                </Link>
              </li>
              <li>
                <Link href="/?version=free" className="text-gray-500 hover:underline">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/feeds" className="text-gray-500 hover:underline">
                  Feeds
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/my_profile" className="text-gray-500 hover:underline">
                  Manage Your Account
                </Link>
              </li>
              <li>
                <Link href="/my_profile" className="text-gray-500 hover:underline">
                  Your Profile
                </Link>
              </li>
              <li>
                <Link href="/stars" className="text-gray-500 hover:underline">
                  Stars Shop
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">For Business</h2>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-500 hover:underline">
                  Business Solutions
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:underline">
                  Business Support
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:underline">
                  IP Licensing
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Services</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/toonyzcut" className="text-gray-500 hover:underline">
                  Toonyz Cut
                </Link>
              </li>
              <li>
                <Link href="/toonyz_posts" className="text-gray-500 hover:underline">
                  Toonyz Post
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:underline">
                  Toonyz Echo
                </Link>
              </li>
              <li>
                <Link href="/studio/novel" className="text-gray-500 hover:underline">
                  Writing Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Values Section */}
          {/* <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Values</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/environment" className="text-gray-500 hover:underline">
                  Environment
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-500 hover:underline">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/supplier-responsibility" className="text-gray-500 hover:underline">
                  Supplier Responsibility
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-gray-500 hover:underline">
                  Accessibility
                </Link>
              </li>
            </ul> 
          </div> */}
        </div>
      </div>
    </div>
  )
}

