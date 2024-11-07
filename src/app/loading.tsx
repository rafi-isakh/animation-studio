'use client'
import LottieLoader from '@/components/LottieLoader';
import dynamic from 'next/dynamic';

// Import the animation dynamically
const animationData = require('@/assets/N_logo_loader.json');

export default function Loading() {
  return (
    <LottieLoader 
      animationData={animationData} 
    />
  );
}