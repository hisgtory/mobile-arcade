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
  fontSize: 20,
  fontWeight: 700,
  color: '$text',
});

const MistakesDots = styled('div', {
  display: 'flex',
  gap: 4,
});

const Dot = styled('span', {
  width: 8,
  height: 8,
  borderRadius: '50%',
  variants: {
    active: {
      true: { backgroundColor: '#DC2626' },
      false: { backgroundColor: '$gray200' },
    },
  },
});

interface HUDProps {
  stage: number;
  difficulty: string;
  mistakes: number;
  maxMistakes: number;
  elapsedMs: number;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function HUD({ stage, difficulty, mistakes, maxMistakes, elapsedMs }: HUDProps) {
  return (
    <Container>
      <StatBlock>
        <StatLabel>Stage {stage}</StatLabel>
        <StatValue css={{ fontSize: 14, textTransform: 'capitalize' }}>{difficulty}</StatValue>
      </StatBlock>
      <StatBlock>
        <StatLabel>Mistakes</StatLabel>
        <MistakesDots>
          {Array.from({ length: maxMistakes }, (_, i) => (
            <Dot key={i} active={i < mistakes} />
          ))}
        </MistakesDots>
      </StatBlock>
      <StatBlock>
        <StatLabel>Time</StatLabel>
        <StatValue>{formatTime(elapsedMs)}</StatValue>
      </StatBlock>
    </Container>
  );
}
