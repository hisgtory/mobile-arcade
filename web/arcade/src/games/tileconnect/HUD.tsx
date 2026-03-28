import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 20,
});

const StatBlock = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
});

const StatLabel = styled('span', {
  fontSize: 11,
  fontWeight: 500,
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 22,
  fontWeight: 700,
  color: '$text',
});

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface HUDProps {
  stage: number;
  score: number;
  remaining: number;
  total: number;
  elapsedMs: number;
  combo: number;
}

export function HUD({ stage, score, remaining, total, elapsedMs, combo }: HUDProps) {
  const cleared = total > 0 ? total - remaining : 0;
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Tiles</StatLabel>
        <StatValue>{cleared}/{total}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <StatValue>{formatTime(elapsedMs)}</StatValue>
      </StatBlock>
      {combo > 1 && (
        <StatBlock>
          <StatLabel>Combo</StatLabel>
          <StatValue css={{ color: '$main500' }}>x{combo}</StatValue>
        </StatBlock>
      )}
    </Container>
  );
}
