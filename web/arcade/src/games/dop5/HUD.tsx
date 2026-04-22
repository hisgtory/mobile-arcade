import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 24,
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

const ProgressBarOuter = styled('div', {
  width: 80,
  height: 8,
  borderRadius: 4,
  backgroundColor: '$gray200',
  overflow: 'hidden',
});

const ProgressBarInner = styled('div', {
  height: '100%',
  borderRadius: 4,
  backgroundColor: '$primary',
  transition: 'width 0.2s ease',
});

interface HUDProps {
  stage: number;
  score: number;
  erasePercent: number;
  onRestart?: () => void;
}

const ActionBtn = styled('button', {
  fontSize: 13,
  fontWeight: 600,
  color: '$primary',
  backgroundColor: 'transparent',
  border: '1px solid $gray200',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  '&:active': { opacity: 0.7 },
});

export function HUD({ stage, score, erasePercent, onRestart }: HUDProps) {
  const pct = Math.round(erasePercent * 100);
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Progress</StatLabel>
        <ProgressBarOuter>
          <ProgressBarInner style={{ width: `${pct}%` }} />
        </ProgressBarOuter>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <ActionBtn onClick={onRestart}>Restart</ActionBtn>
    </Container>
  );
}
