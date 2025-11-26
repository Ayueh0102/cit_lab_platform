'use client';

import { Box } from '@mantine/core';

/**
 * 輕量化極光背景 v2
 * - 保留原設計的色彩佈局（藍、青、橘黃）
 * - 移除消耗資源的 blur filter
 * - 使用 GPU 加速屬性（will-change, transform3d）
 * - 輕微動態效果
 */
export function AuroraBackground() {
  return (
    <Box className="aurora-container-lite">
      {/* Layer 1: 藍色系主層 - 左上角 */}
      <div className="aurora-layer-blue" />
      {/* Layer 2: 青色系層 - 右側 */}
      <div className="aurora-layer-cyan" />
      {/* Layer 3: 暖橘黃色層 - 左下角 */}
      <div className="aurora-layer-warm" />
      {/* Layer 4: 淡紫粉色層 - 右下角 */}
      <div className="aurora-layer-purple" />
      {/* 柔和光暈覆蓋層 */}
      <div className="aurora-overlay" />
    </Box>
  );
}

