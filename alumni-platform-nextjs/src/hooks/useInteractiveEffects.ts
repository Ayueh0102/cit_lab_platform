'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 數字跳動動畫 — 從 0 跳到目標值
 * 用 easeOutCubic 曲線，結尾自然減速
 */
export function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === 0 || target === prevTarget.current) return;
    prevTarget.current = target;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

/**
 * 卡片 3D 微傾斜 — 滑鼠移動時產生透視效果
 * 只用 transform (GPU friendly)
 */
export function useCardTilt(intensity = 6) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform =
      `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateY(-4px)`;
  }, [intensity]);

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)';
    el.style.transform = '';
    // 清除 transition，避免影響後續 mousemove
    const tid = setTimeout(() => {
      if (el) el.style.transition = '';
    }, 400);
    return () => clearTimeout(tid);
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/**
 * 游標追蹤光暈 — 滑鼠移動時卡片上出現柔和光暈
 * 透過 CSS custom property 控制位置
 */
export function useCursorGlow() {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  }, []);

  return { onMouseMove };
}

/**
 * 觸發一次性 CSS 動畫 class
 * 用於鈴鐺搖晃、Badge 彈跳等
 */
export function useAnimationTrigger(className: string, duration = 600) {
  const ref = useRef<HTMLElement>(null);

  const trigger = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove(className);
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), duration);
  }, [className, duration]);

  return { ref, trigger };
}
