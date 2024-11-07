'use client'
import Lottie, { LottieComponentProps } from "lottie-react";
import { twMerge } from "tailwind-merge";

interface LottieLoaderProps {
  animationData: any;
  width?: string;
  pulseEffect?: boolean;
  scaleOnHover?: boolean;
  fadeOnHover?: boolean;
  centered?: boolean;
  className?: string;
  lottieProps?: Partial<LottieComponentProps>;
}

export default function LottieLoader({
  animationData,
  width = "w-24",
  pulseEffect = true,
  scaleOnHover = true,
  fadeOnHover = true,
  centered = true,
  className = "",
  lottieProps = {}
}: LottieLoaderProps) {
  const containerClasses = twMerge(
    centered && "absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
    className
  );

  const wrapperClasses = twMerge(
    width,
    pulseEffect && "animate-pulse"
  );

  const lottieClasses = twMerge(
    "w-full h-full scale-110 transition-all duration-300",
    scaleOnHover && "hover:scale-125",
    fadeOnHover && "opacity-90 hover:opacity-75"
  );

  const parsedAnimation = typeof animationData === 'string' 
  ? JSON.parse(animationData) 
  : animationData;

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}> 
        <div className="transition-all duration-1000 ease-in-out">
          <Lottie
            animationData={parsedAnimation}
            className={lottieClasses}
            loop={true}
            autoplay={true}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice'
            }}
            {...lottieProps}
          />
        </div>
      </div>
    </div>
  );
}