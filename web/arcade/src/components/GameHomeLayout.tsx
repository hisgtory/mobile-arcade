import type { ReactNode } from 'react';
import { styled } from '../styles/stitches.config';
import { globalStyles } from '../styles/global';

const Container = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const Icon = styled('span', {
  fontSize: 64,
  lineHeight: 1,
});

const Title = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '$text',
  letterSpacing: -1,
  margin: 0,
});

interface GameHomeLayoutProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export function GameHomeLayout({ title, icon, children }: GameHomeLayoutProps) {
  globalStyles();
  return (
    <Container>
      {icon && <Icon>{icon}</Icon>}
      <Title>{title}</Title>
      {children}
    </Container>
  );
}
