import { styled } from '../styles/stitches.config';

const Root = styled('div', {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 32,
  backgroundColor: '$bg',
  padding: 24,
});

const Title = styled('h1', {
  fontSize: 48,
  fontWeight: 800,
  color: '$primary',
  letterSpacing: -1,
  fontFamily: '$body',
});

const Subtitle = styled('p', {
  fontSize: 16,
  color: '$textMuted',
});

const StageLabel = styled('p', {
  fontSize: 14,
  color: '$gray400',
});

const PlayButton = styled('button', {
  padding: '16px 64px',
  fontSize: 20,
  fontWeight: 700,
  color: '$white',
  backgroundColor: '$primary',
  border: 'none',
  borderRadius: 16,
  cursor: 'pointer',
  fontFamily: '$body',
  transition: 'transform 0.1s, opacity 0.1s',
  '&:active': {
    transform: 'scale(0.95)',
    opacity: 0.9,
  },
});

const Credit = styled('p', {
  position: 'absolute',
  bottom: 16,
  fontSize: 11,
  color: '$gray400',
  textAlign: 'center',
});

interface TitleScreenProps {
  stage: number;
  onPlay: () => void;
}

export function TitleScreen({ stage, onPlay }: TitleScreenProps) {
  return (
    <Root>
      <Title>Found 3</Title>
      <Subtitle>Match 3 tiles to clear the board</Subtitle>
      <StageLabel>Stage {stage}</StageLabel>
      <PlayButton onClick={onPlay}>Play</PlayButton>
      <Credit>Pixel food icons by Alex Kovacsart (CC BY 4.0)</Credit>
    </Root>
  );
}
