'use client'

import { useTheme } from "@/contexts/providers";
import { Skeleton } from "@mui/material";

const CustomSkeleton = ({
    width = '100%',
    height,
    variant = 'rounded',
    animation = 'wave',
    className
  }: {
    width: number | string,
    height: number,
    variant?: 'text' | 'rectangular' | 'rounded' | 'circular',
    animation?: 'pulse' | 'wave' | false,
    className?: string
  }) => {
    const { theme } = useTheme();

    return (
      <Skeleton variant={variant} animation={animation} width={width} height={height}
        sx={{
          bgcolor: theme === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)',
          '&::after': {
            background: theme === 'dark' ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)',
          }
        }}
      />
    )
  }

  export default CustomSkeleton;