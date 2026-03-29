import { useRef, useEffect } from 'react';
import { styled } from '../styles/stitches.config';

export interface StageInfo {
  id: number;
  cleared: boolean;
  stars?: number;
}

interface StageMapProps {
  stages: StageInfo[];
  currentStage: number;
  onStageSelect: (stage: number) => void;
}

const ScrollContainer = styled('div', {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
});

const Track = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '20px 32px 40px',
  minHeight: '100%',
});

const NodeRow = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

const NodeCircle = styled('button', {
  width: 52,
  height: 52,
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 700,
  transition: 'transform 0.15s',
  flexShrink: 0,

  variants: {
    state: {
      locked: {
        backgroundColor: '$gray200',
        color: '$gray400',
        cursor: 'default',
        opacity: 0.5,
      },
      current: {
        backgroundColor: '$primary',
        color: '$white',
        cursor: 'pointer',
        boxShadow: '0 0 0 4px rgba(250, 108, 65, 0.3)',
        transform: 'scale(1.15)',
      },
      cleared: {
        backgroundColor: '$emerald500',
        color: '$white',
        cursor: 'pointer',
      },
    },
  },
});

const NodeLabel = styled('span', {
  fontSize: 13,
  color: '$textMuted',
  fontWeight: 600,
});

export function StageMap({ stages, currentStage, onStageSelect }: StageMapProps) {
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(t);
  }, [currentStage]);

  const sorted = [...stages].sort((a, b) => b.id - a.id);

  return (
    <ScrollContainer>
      <Track>
        {sorted.map((stage) => {
          const state =
            stage.id > currentStage
              ? 'locked'
              : stage.id === currentStage
                ? 'current'
                : 'cleared';
          const isRight = stage.id % 2 === 0;

          return (
            <NodeRow
              key={stage.id}
              ref={state === 'current' ? currentRef : undefined}
              css={{
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                paddingLeft: isRight ? 0 : 16,
                paddingRight: isRight ? 16 : 0,
              }}
            >
              {isRight && <NodeLabel>Stage {stage.id}</NodeLabel>}
              <NodeCircle
                state={state}
                onClick={() => state !== 'locked' && onStageSelect(stage.id)}
                disabled={state === 'locked'}
              >
                {state === 'cleared' ? '✓' : stage.id}
              </NodeCircle>
              {!isRight && <NodeLabel>Stage {stage.id}</NodeLabel>}
            </NodeRow>
          );
        })}
      </Track>
    </ScrollContainer>
  );
}
