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

const ProgressBar = styled('div', {
  flex: 1,
  maxWidth: 120,
  height: 8,
  backgroundColor: '$gray100',
  borderRadius: 4,
  overflow: 'hidden',
});

const ProgressFill = styled('div', {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.3s ease',
});

interface HUDProps {
  stage: number;
  score: number;
  progress: number;
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

export function HUD({ stage, score, progress, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Progress</StatLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ProgressBar>
            <ProgressFill style={{ width: `${progress}%`, backgroundColor: '#22C55E' }} />
          </ProgressBar>
          <StatValue style={{ fontSize: 16 }}>{progress}%</StatValue>
        </div>
      </StatBlock>
      <StatBlock>
        <StatLabel>Score</StatLabel>
        <StatValue>{score.toLocaleString()}</StatValue>
      </StatBlock>
      <ActionBtn onClick={onRestart}>Restart</ActionBtn>
    </Container>
  );
}
