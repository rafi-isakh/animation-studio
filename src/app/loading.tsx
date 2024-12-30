'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Import the LottieLoader dynamically
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
  ssr: false,
});

// Import the animation data
import animationData from '@/assets/N_logo_loader.json';

export default function Loading() {

  return (
    <>
      <div className="loader-container">
        <LottieLoader animationData={animationData} />
      </div>
    </>
  );
}
