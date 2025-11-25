'use client';

import { Box } from '@mantine/core';

export function AuroraBackground() {
  // 增加粒子數量和多樣性
  const particles = [
    { left: '5%', top: '25%', size: 160, duration: 20, delay: 0 },
    { left: '20%', top: '60%', size: 140, duration: 18, delay: 2 },
    { left: '45%', top: '15%', size: 120, duration: 16, delay: 1 },
    { left: '65%', top: '70%', size: 150, duration: 22, delay: 3 },
    { left: '80%', top: '30%', size: 130, duration: 19, delay: 4 },
    { left: '35%', top: '80%', size: 170, duration: 24, delay: 5 },
    { left: '70%', top: '10%', size: 100, duration: 15, delay: 6 },
    { left: '15%', top: '85%', size: 110, duration: 17, delay: 7 },
    { left: '90%', top: '50%', size: 90, duration: 14, delay: 8 },
    { left: '50%', top: '45%', size: 180, duration: 25, delay: 9 },
    { left: '10%', top: '40%', size: 85, duration: 13, delay: 10 },
    { left: '75%', top: '85%', size: 95, duration: 16, delay: 11 },
  ];

  return (
    <Box className="aurora-container">
      {/* Main liquid layers */}
      <div className="aurora-layer-1" />
      <div className="aurora-layer-2" />
      <div className="aurora-layer-3" />
      {/* New wave layer for extra dynamics */}
      <div className="aurora-layer-4" />
      {/* Rotating glow */}
      <div className="aurora-glow" />
      {/* Shimmer effect */}
      <div className="aurora-shimmer" />
      {/* Floating particles */}
      <div className="aurora-particles">
        {particles.map((particle, index) => (
          <span
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
    </Box>
  );
}

