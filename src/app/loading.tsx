'use client';
import dynamic from 'next/dynamic';

// Import the LottieLoader dynamically
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
  ssr: false,
});

// Import the animation data
import animationData from '@/assets/N_logo_with_heart.json';

export default function Loading() {

  return (
    <>
      <div className="loader-container">
        <LottieLoader width="w-40" animationData={animationData} />
      </div>
    </>
  );
}
