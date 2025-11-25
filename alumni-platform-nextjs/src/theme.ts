'use client';

import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  // 主色調 - 使用更有活力的藍紫色
  primaryColor: 'indigo',
  
  // 字體設定 - 增加現代感
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(26), lineHeight: '1.3' },
      h3: { fontSize: rem(22), lineHeight: '1.4' },
      h4: { fontSize: rem(18), lineHeight: '1.45' },
    },
  },

  // 圓角設定 - 更圓潤現代
  radius: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',    // 預設圓角加大
    lg: '1.5rem',
    xl: '2rem',
  },

  // 陰影設定 - 更柔和的擴散陰影
  shadows: {
    xs: '0 4px 6px rgba(0, 0, 0, 0.02)',
    sm: '0 6px 12px rgba(0, 0, 0, 0.04)',
    md: '0 12px 24px rgba(0, 0, 0, 0.06)',
    lg: '0 20px 40px rgba(0, 0, 0, 0.08)',
    xl: '0 30px 60px rgba(0, 0, 0, 0.12)',
  },

  // 自定義顏色 - 光譜色系
  colors: {
    // 暖陽 (Red/Orange 變體)
    'spectrum-warm': [
      '#fff0e6', '#ffdec9', '#ffba94', '#ff945e', '#ff7430', 
      '#ff5f14', '#ff5506', '#e34500', '#cb3b00', '#b22f00'
    ],
    // 翠綠 (Green/Teal 變體)
    'spectrum-fresh': [
      '#e3faf8', '#d1f2ef', '#a8e6e0', '#7bd9ce', '#55cebf', 
      '#3dc7b5', '#2ec4b1', '#1ead9b', '#129a8a', '#008678'
    ],
    // 智慧 (Blue/Indigo 變體)
    'spectrum-light': [
      '#eef3ff', '#dce4f5', '#b9c7e2', '#94a8cf', '#748dc0', 
      '#5f7cb6', '#5474b2', '#44639f', '#39588f', '#2d4b82'
    ],
  },

  // 組件預設樣式
  components: {
    Button: {
      defaultProps: {
        radius: 'xl', // 按鈕全圓角
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }
      }
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: false, // 去除邊框，改用陰影
        padding: 'lg',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      }
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // 微透明輸入框
          border: '1px solid rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
          '&:focus': {
            borderColor: 'var(--mantine-color-primary-5)',
            boxShadow: '0 0 0 4px rgba(var(--mantine-color-primary-rgb), 0.1)',
          }
        }
      }
    },
  },
});
