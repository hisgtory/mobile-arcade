import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 32,
});

const ScoreBlock = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
});

const Label = styled('span', {
  fontSize: 11,
  fontWeight: 500,
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const Value = styled('span', {
  fontSize: 24,
  fontWeight: 700,
});

const Divider = styled('span', {
  fontSize: 20,
  fontWeight: 300,
  color: '$textMuted',
});

interface HUDProps {
  playerScore: number;
  aiScore: number;
}

export function HUD({ playerScore, aiScore }: HUDProps) {
  return (
    <Container>
      <ScoreBlock>
        <Label>You (X)</Label>
        <Value css={{ color: '#EF4444' }}>{playerScore}</Value>
      </ScoreBlock>
      <Divider>:</Divider>
      <ScoreBlock>
        <Label>AI (O)</Label>
        <Value css={{ color: '#3B82F6' }}>{aiScore}</Value>
      </ScoreBlock>
    </Container>
  );
}
