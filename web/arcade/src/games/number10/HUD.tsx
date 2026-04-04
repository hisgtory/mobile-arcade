import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 32,
});

const StatBlock = styled('div', {
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
  fontSize: 22,
  fontWeight: 700,
  color: '$text',
});

interface HUDProps {
  score: number;
  remaining: number;
}

export function HUD({ score, remaining }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <Label>Cleared</Label>
        <Value>{score}</Value>
      </StatBlock>
      <StatBlock>
        <Label>Left</Label>
        <Value>{remaining}</Value>
      </StatBlock>
    </Container>
  );
}
