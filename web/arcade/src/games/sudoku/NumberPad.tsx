import { styled } from '../../styles/stitches.config';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px 12px',
  backgroundColor: '$surface',
  borderTop: '1px solid $gray100',
  gap: 6,
  flexWrap: 'wrap',
});

const NumBtn = styled('button', {
  width: 36,
  height: 44,
  fontSize: 20,
  fontWeight: 700,
  color: '$text',
  backgroundColor: '$gray50',
  border: '1px solid $gray200',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
  position: 'relative',
  '&:active': { backgroundColor: '$gray200' },
  variants: {
    disabled: {
      true: { opacity: 0.3, pointerEvents: 'none' },
    },
  },
});

const RemainCount = styled('span', {
  fontSize: 9,
  fontWeight: 500,
  color: '$textMuted',
  lineHeight: 1,
});

const ActionRow = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  paddingTop: 4,
});

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
  variants: {
    active: {
      true: {
        backgroundColor: '#2563EB',
        color: '#fff',
        borderColor: '#2563EB',
      },
    },
  },
});

interface NumberPadProps {
  numberCounts: Record<number, number>;
  notesMode: boolean;
  onNumber: (n: number) => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
  onRestart: () => void;
}

export function NumberPad({
  numberCounts,
  notesMode,
  onNumber,
  onErase,
  onToggleNotes,
  onHint,
  onRestart,
}: NumberPadProps) {
  return (
    <Container>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const remaining = numberCounts[n] ?? 0;
        return (
          <NumBtn
            key={n}
            disabled={remaining <= 0}
            onClick={() => onNumber(n)}
          >
            {n}
            <RemainCount>{remaining > 0 ? remaining : ''}</RemainCount>
          </NumBtn>
        );
      })}
      <ActionRow>
        <ActionBtn onClick={onErase}>✏️ Erase</ActionBtn>
        <ActionBtn active={notesMode} onClick={onToggleNotes}>
          📝 Notes
        </ActionBtn>
        <ActionBtn onClick={onHint}>💡 Hint</ActionBtn>
        <ActionBtn onClick={onRestart}>🔄</ActionBtn>
      </ActionRow>
    </Container>
  );
}
