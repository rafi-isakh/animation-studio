'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Video } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import Link from "next/link";

export default function CreateMediaDefaultContetns() {
  const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  


  useEffect(() => {
    fetch('/api/get_toonyz_posts')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch posts');
        }
        return res.json();
      })
      .then(data => {
        setInitialPosts(data);
        setInitialLoading(false);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again later.');
        setInitialLoading(false);
      });
  }, []);

  // Function to shuffle the array
  const shuffleArray = (array: ToonyzPost[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  // Shuffle the posts
  const shuffledPosts = shuffleArray([...initialPosts]);

  // Select random items for each section
  const randomImages = shuffledPosts.filter(post => post.image).slice(0, 3);
  const randomVideos = shuffledPosts.filter(post => post.video).slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-r dark:from-black dark:to-transparent from-transparent to-blue-100/50 backdrop-blur-md  p-6 md:p-8">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 uppercase text-gray-700 dark:text-gray-300">
          Bring Stories
          <br />
          to Life
        </h1>
        {/* <h2 className="text-3xl md:text-5xl font-medium mb-6">A visual thought partner for ideation & imagination</h2> */}
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
        Select text, and let AI generate stunning images, videos, and slideshows.
        </p>
        <Button className="rounded-full bg-white text-black hover:bg-gray-200 px-8 py-6 font-medium text-base">
          Watch Tutorial
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* Boards Card */}
        <Link href="/toonyz_posts" className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-6 md:p-8 col-span-1 md:col-span-3 relative min-h-[300px]">
          <div >
            <div className="w-full">
              <h3 className="text-2xl font-bold mb-1">Posts</h3>
              <p className="text-md">Discover posts from Toonyz users.</p>
            </div>
            <div className="absolute bottom-0 right-0 flex gap-2 h-[180px] overflow-hidden">
              {randomImages.map((post, index) => (
                <Image
                  key={post.id}
                  src={getImageUrl(post.image)}
                  alt={post.title}
                  width={150}
                  height={200}
                  className={`overflow-hidden relative rounded-r-xl ${index !== 0 ? '-ml-10' : ''}`}
                  style={{ zIndex: randomImages.length - index }}
                />
              ))}
            </div>
          </div>
        </Link>

        {/* Share & Remix Card */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 p-6 md:p-8 col-span-1 md:col-span-3 h-[230px]">
          <h3 className="text-2xl font-bold mb-1">Make Video</h3>
          <p className="text-md mb-6">Share your infinite imagination</p>
          <div className="flex justify-end gap-2 h-[180px] overflow-hidden">
            {randomVideos.map((post, index) => (
              <div
                key={post.id}
                className={`overflow-hidden relative ${index !== 0 ? '-ml-4' : ''}`}
                style={{ zIndex: randomVideos.length - index }}
              >
                <video
                  src={getVideoUrl(post.video)}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="rounded-full object-cover w-40 h-40 border-2 border-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Keyframe Card */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-teal-600 to-teal-400 p-6 md:p-8 col-span-1 md:col-span-3 min-h-[200px]">
          <h3 className="text-3xl font-bold mb-1">Create your own</h3>
          <p className="text-xl mb-6">Make videos by giving start/end frames</p>
        </div>
      </div>
    </div >
  )
}

