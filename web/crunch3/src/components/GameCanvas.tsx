import { forwardRef } from 'react';
import { styled } from '../styles/stitches.config';

const Container = styled('div', {
  flex: 1,
  width: '100%',
  maxWidth: 420,
  margin: '0 auto',
  overflow: 'hidden',
  '& canvas': {
    width: '100% !important',
    height: '100% !important',
  },
});

export const GameCanvas = forwardRef<HTMLDivElement>((_props, ref) => {
  return <Container ref={ref} />;
});

GameCanvas.displayName = 'GameCanvas';
