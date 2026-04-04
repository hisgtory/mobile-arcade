import { useNavigate } from 'react-router-dom';
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

const Title = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '$text',
  letterSpacing: -1,
  margin: 0,
});

const Subtitle = styled('p', {
  fontSize: 16,
  color: '$textMuted',
  margin: 0,
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
  playPath: string;
  color: string;
}

export function GameHomeLayout({ title, subtitle, playPath, color }: GameHomeLayoutProps) {
  const navigate = useNavigate();
  globalStyles();
  return (
    <Container>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>
      <PlayButton
        css={{ backgroundColor: color }}
        onClick={() => navigate(playPath)}
      >
        Play
      </PlayButton>
    </Container>
  );
}
