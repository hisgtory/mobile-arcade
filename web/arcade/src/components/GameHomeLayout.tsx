import { styled } from '../styles/stitches.config';

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

const Title = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  letterSpacing: -1,
});

const Subtitle = styled('p', {
  fontSize: 16,
});

const PlayButton = styled('button', {
  marginTop: 32,
  color: '#fff',
  border: 'none',
  padding: '16px 48px',
  borderRadius: 16,
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
});

interface GameHomeLayoutProps {
  title: string;
  subtitle: string;
  titleColor?: string;
  subtitleColor?: string;
  buttonColor?: string;
  onPlay: () => void;
}

export function GameHomeLayout({
  title,
  subtitle,
  titleColor = '#111827',
  subtitleColor = '#6B7280',
  buttonColor = '#2563EB',
  onPlay,
}: GameHomeLayoutProps) {
  return (
    <Container>
      <Title css={{ color: titleColor }}>{title}</Title>
      <Subtitle css={{ color: subtitleColor }}>{subtitle}</Subtitle>
      <PlayButton
        css={{ backgroundColor: buttonColor }}
        onClick={onPlay}
      >
        Play
      </PlayButton>
    </Container>
  );
}
