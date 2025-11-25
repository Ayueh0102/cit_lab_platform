'use client';

import { Box } from '@mantine/core';

export function AuroraBackground() {
  const particles = [
    { left: '5%', top: '25%', size: 140, duration: 28, delay: 0 },
    { left: '20%', top: '60%', size: 120, duration: 24, delay: 4 },
    { left: '45%', top: '15%', size: 100, duration: 22, delay: 2 },
    { left: '65%', top: '70%', size: 130, duration: 30, delay: 1 },
    { left: '80%', top: '30%', size: 110, duration: 26, delay: 3 },
    { left: '35%', top: '80%', size: 150, duration: 32, delay: 5 },
    { left: '70%', top: '10%', size: 90, duration: 18, delay: 6 },
    { left: '15%', top: '85%', size: 100, duration: 21, delay: 7 },
  ];

  return (
    <Box className="aurora-container">
      <div className="aurora-layer-1" />
      <div className="aurora-layer-2" />
      <div className="aurora-layer-3" />
      <div className="aurora-glow" />
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

