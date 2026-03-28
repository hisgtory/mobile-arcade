import { forwardRef } from 'react';
import { styled } from '../styles/stitches.config';

const Container = styled('div', {
  flex: 1,
  width: '100%',
  minHeight: 0,
  padding: 0,
  margin: 0,
  overflow: 'hidden',
  '& canvas': {
    display: 'block',
    width: '100%',
    height: '100%',
  },
});

export const GameCanvas = forwardRef<HTMLDivElement>((_, ref) => {
  return <Container ref={ref} />;
});
