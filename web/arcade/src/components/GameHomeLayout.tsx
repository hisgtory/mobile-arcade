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
  overflowY: 'auto',
});

const Title = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '$text',
  letterSpacing: -1,
  margin: 0,
});

const Description = styled('p', {
  fontSize: 16,
  color: '$textMuted',
  marginBottom: 16,
  margin: 0,
});

interface GameHomeLayoutProps {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function GameHomeLayout({ icon, title, description, children }: GameHomeLayoutProps) {
  globalStyles();
  return (
    <Container>
      <Title><span role="img" aria-label={title}>{icon}</span> {title}</Title>
      <Description>{description}</Description>
      {children}
    </Container>
  );
}
