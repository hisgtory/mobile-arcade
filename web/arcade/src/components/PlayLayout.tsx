import { styled } from '../styles/stitches.config';

export const PlayLayout = styled('div', {
export const PlayLayout: ReturnType<typeof styled> = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

export const isRN = typeof window !== 'undefined' && typeof window.ReactNativeWebView !== 'undefined';
