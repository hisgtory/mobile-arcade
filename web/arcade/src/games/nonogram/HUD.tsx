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

interface HUDProps {
  stage: number;
  moves: number;
  progress: number;
  puzzleName?: string;
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

const ProgressBar = styled('div', {
  flex: 1,
  maxWidth: 80,
  height: 6,
  borderRadius: 3,
  backgroundColor: '$gray100',
  overflow: 'hidden',
});

const ProgressFill = styled('div', {
  height: '100%',
  borderRadius: 3,
  backgroundColor: '$primary',
  transition: 'width 0.3s ease',
});

export function HUD({ stage, moves, progress, puzzleName, onRestart }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage</StatLabel>
        <StatValue>{stage}</StatValue>
      </StatBlock>
      {puzzleName && (
        <StatBlock>
          <StatLabel>Puzzle</StatLabel>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{puzzleName}</span>
        </StatBlock>
      )}
      <StatBlock>
        <StatLabel>Moves</StatLabel>
        <StatValue>{moves}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Progress</StatLabel>
        <ProgressBar>
          <ProgressFill css={{ width: `${progress}%` }} />
        </ProgressBar>
      </StatBlock>
      <ActionBtn onClick={onRestart}>Restart</ActionBtn>
    </Container>
  );
}
