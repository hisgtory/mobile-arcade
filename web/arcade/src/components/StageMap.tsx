import { useNavigate } from 'react-router-dom';
import { styled } from '../styles/stitches.config';

const Grid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 12,
  padding: '0 20px',
  maxWidth: 320,
  width: '100%',
});

const StageButton = styled('button', {
  width: 52,
  height: 52,
  borderRadius: 12,
  border: '2px solid $gray200',
  backgroundColor: '$white',
  fontSize: 18,
  fontWeight: 700,
  color: '$text',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s',
  '&:active': {
    backgroundColor: '$gray100',
  },
});

interface StageMapProps {
  stageCount: number;
  basePath: string; // e.g. '/games/nonogram/v1'
}

export function StageMap({ stageCount, basePath }: StageMapProps) {
  const navigate = useNavigate();
  const stages = Array.from({ length: stageCount }, (_, i) => i + 1);

  return (
    <Grid>
      {stages.map((s) => (
        <StageButton key={s} onClick={() => navigate(`${basePath}/stage/${s}`)}>
          {s}
        </StageButton>
      ))}
    </Grid>
  );
}
