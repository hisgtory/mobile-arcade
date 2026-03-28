import { styled } from '../../styles/stitches.config';

const Root = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  paddingTop: 'max(10px, env(safe-area-inset-top))',
  backgroundColor: '$white',
  borderBottom: '1px solid #E5E7EB',
});

const CoinText = styled('span', {
  fontSize: 15,
  fontWeight: 700,
  color: '#FA6C41',
  fontFamily: '$body',
});

const StageText = styled('span', {
  fontSize: 15,
  fontWeight: 700,
  color: '#1F2937',
  fontFamily: '$body',
});

const TimeText = styled('span', {
  fontSize: 15,
  color: '#6B7280',
  fontFamily: '$body',
});

const ProgressText = styled('span', {
  fontSize: 15,
  fontWeight: 700,
  color: '#1F2937',
  fontFamily: '$body',
});

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface HUDProps {
  stage: number;
  elapsedMs: number;
  remainingTiles: number;
  totalTiles: number;
  score: number;
}

export function HUD({ stage, elapsedMs, remainingTiles, totalTiles, score }: HUDProps) {
  const cleared = totalTiles > 0 ? totalTiles - remainingTiles : 0;

  return (
    <Root>
      <CoinText>{score}</CoinText>
      <StageText>Stage {stage}</StageText>
      <TimeText>{formatTime(elapsedMs)}</TimeText>
      <ProgressText>{cleared}/{totalTiles}</ProgressText>
    </Root>
  );
}
