import { type ReactNode } from 'react';
import { styled } from '../styles/stitches.config';
import { navigateToArcade } from '../utils/bridge';

const Container = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '$bg',
  overflow: 'hidden',
});

const Header = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '32px 16px 12px',
  position: 'relative',
  flexShrink: 0,
});

const Title = styled('h1', {
  fontSize: 32,
  fontWeight: 800,
  color: '$text',
  letterSpacing: -1,
});

const MarketButton = styled('button', {
  position: 'absolute',
  right: 16,
  top: 32,
  background: '$surface',
  border: '1px solid $gray200',
  fontSize: 20,
  cursor: 'pointer',
  padding: '6px 8px',
  borderRadius: 12,
  lineHeight: 1,
  opacity: 0.6,
  '&:active': { opacity: 1 },
});

const Content = styled('div', {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

interface GameHomeLayoutProps {
  title: string;
  icon?: string;
  children: ReactNode;
}

export function GameHomeLayout({ title, icon, children }: GameHomeLayoutProps) {
  return (
    <Container>
      <Header>
        <Title>{icon ? `${icon} ${title}` : title}</Title>
        <MarketButton onClick={navigateToArcade} aria-label="Arcade Home">
          🏪
        </MarketButton>
      </Header>
      <Content>{children}</Content>
    </Container>
  );
}
