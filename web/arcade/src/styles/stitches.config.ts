import { createStitches } from '@stitches/react';

const stitches: ReturnType<typeof createStitches> = createStitches({
  theme: {
    colors: {
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray800: '#1F2937',
      main500: '#FA6C41',
      rose500: '#F43F5E',
      emerald500: '#10B981',
      white: '#FFFFFF',

      bg: '#F9FAFB',
      surface: '#FFFFFF',
      primary: '#FA6C41',
      text: '#1F2937',
      textMuted: '#6B7280',
    },
    fonts: {
      body: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },
  },
});

export const styled: typeof stitches.styled = stitches.styled;
export const css: typeof stitches.css = stitches.css;
export const globalCss: typeof stitches.globalCss = stitches.globalCss;
export const getCssText: typeof stitches.getCssText = stitches.getCssText;
export const theme: typeof stitches.theme = stitches.theme;
