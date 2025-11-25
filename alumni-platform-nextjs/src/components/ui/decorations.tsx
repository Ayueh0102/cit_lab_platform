'use client';

import { Box, BoxProps } from '@mantine/core';

// 1. 光譜波形裝飾 (Spectral Waves)
// 模擬光波的流動線條
export function SpectralWaves({ style, className, ...props }: BoxProps) {
  const combinedClassName = ['spectral-waves', className].filter(Boolean).join(' ');

  return (
    <Box 
      className={combinedClassName}
      style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.5,
        ...style 
      }} 
      {...props}
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="spectral-wave spectral-wave-primary"
      >
        <defs>
          <linearGradient id="spectral-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 107, 107, 0.3)" />
            <stop offset="33%" stopColor="rgba(78, 205, 196, 0.3)" />
            <stop offset="66%" stopColor="rgba(79, 172, 254, 0.3)" />
            <stop offset="100%" stopColor="rgba(161, 140, 209, 0.3)" />
          </linearGradient>
        </defs>
        <path 
          fill="url(#spectral-gradient)" 
          fillOpacity="1" 
          d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>

      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="spectral-wave spectral-wave-secondary"
      >
        <defs>
          <linearGradient id="spectral-gradient-secondary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="50%" stopColor="rgba(0, 242, 254, 0.25)" />
            <stop offset="100%" stopColor="rgba(161, 140, 209, 0.25)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#spectral-gradient-secondary)"
          fillOpacity="1"
          d="M0,224L48,213.3C96,203,192,181,288,165.3C384,149,480,139,576,149.3C672,160,768,192,864,186.7C960,181,1056,139,1152,106.7C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        ></path>
      </svg>
      <div className="spectral-wave-glow" />
    </Box>
  );
}

// 2. CIE 1931 色度圖輪廓 (CIE Plot Outline)
// 作為背景浮水印
export function CIEPlotDecoration({ style, ...props }: BoxProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        right: '-5%',
        bottom: '-10%',
        width: '260px',
        height: '260px',
        opacity: 0.25,
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'rotate(-15deg)',
        filter: 'drop-shadow(0 15px 35px rgba(255, 107, 107, 0.25))',
        animation: 'cie-pulse 18s ease-in-out infinite',
        ...style
      }}
      {...props}
    >
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M15,85 Q20,5 50,5 Q80,5 85,85 Z" stroke="url(#cie-gradient)" fill="url(#cie-fill)" strokeWidth="1" />
        <defs>
          <linearGradient id="cie-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ECDC4" />
            <stop offset="50%" stopColor="#556270" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
          <radialGradient id="cie-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* 格線 */}
        <path d="M15,85 H85" stroke="rgba(0,0,0,0.1)" strokeDasharray="2 2" />
        <path d="M15,85 V15" stroke="rgba(0,0,0,0.1)" strokeDasharray="2 2" />
      </svg>
    </Box>
  );
}

// 3. 稜鏡分光幾何 (Prism Geometry)
// 用於卡片裝飾
export function PrismDecoration({ style, ...props }: BoxProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        width: '150px',
        height: '150px',
        pointerEvents: 'none',
        opacity: 0.95,
        filter: 'drop-shadow(0 12px 25px rgba(79, 172, 254, 0.3))',
        // 移除整體旋轉，改為內部元素動畫
        // animation: 'prism-spin 24s linear infinite',
        ...style
      }}
      {...props}
    >
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="prism-face" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(79,172,254,0.4)" />
          </linearGradient>
        </defs>
        
        {/* 稜鏡三角形 - 輕微浮動 */}
        <g style={{ animation: 'prism-float 6s ease-in-out infinite' }}>
          <path d="M50,20 L80,80 L20,80 Z" fill="url(#prism-face)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
        </g>

        {/* 入射光 - 穩定但微動 */}
        <line 
          x1="0" y1="45" x2="35" y2="60" 
          stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeOpacity="0.8" 
          style={{ animation: 'beam-enter 4s ease-in-out infinite' }}
        />

        {/* 折射光譜 - 角度擺動 */}
        <g style={{ transformOrigin: '35px 60px', animation: 'beam-refract 8s ease-in-out infinite' }}>
          {/* 紅光 - 偏折最小 */}
          <line x1="35" y1="60" x2="95" y2="35" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          {/* 綠光 - 偏折中等 */}
          <line x1="35" y1="60" x2="95" y2="50" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          {/* 藍光 - 偏折最大 */}
          <line x1="35" y1="60" x2="95" y2="65" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
        </g>

        {/* 光點裝飾 */}
        <circle cx="35" cy="60" r="2" fill="white" style={{ filter: 'blur(1px)', opacity: 0.8 }} />
      </svg>
    </Box>
  );
}

// 4. 浮動色球 (Floating Orbs)
// 模擬 VR/AR 中的光點
export function FloatingOrbs({ color = '#4facfe', size = 100, ...props }: BoxProps & { color?: string; size?: number }) {
  return (
    <Box
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
        opacity: 0.2,
        filter: 'blur(20px)',
        animation: 'float 8s infinite ease-in-out',
        pointerEvents: 'none',
      }}
      {...props}
    />
  );
}

// 5. 色彩儀器網格 (Color Checker Grid)
export function ColorCheckerGrid({ style, ...props }: BoxProps) {
    return (
        <Box
            style={{
                position: 'absolute',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2px',
                width: '60px',
                height: '40px',
                opacity: 0.6,
                ...style
            }}
            {...props}
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div 
                    key={i} 
                    style={{ 
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                        borderRadius: '2px'
                    }} 
                />
            ))}
        </Box>
    )
}
