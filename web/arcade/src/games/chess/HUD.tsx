import { styled } from '../../styles/stitches.config';
import type { Color, GameStatus } from '@arcade/lib-chess';

const Container = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 16,
});

const Block = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  flex: 1,
});

const Label = styled('span', {
  fontSize: 10,
  fontWeight: 500,
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const Value = styled('span', {
  fontSize: 18,
  fontWeight: 700,
});

const StatusText = styled('span', {
  fontSize: 13,
  fontWeight: 600,
  color: '$text',
  textAlign: 'center',
});

interface HUDProps {
  turn: Color;
  status: GameStatus;
  playerWins: number;
  aiWins: number;
  draws: number;
  whiteMaterial: number;
  blackMaterial: number;
}

function statusLabel(status: GameStatus, turn: Color): { text: string; color: string } {
  if (status === 'checkmate') return { text: 'Checkmate', color: '#EF4444' };
  if (status === 'stalemate') return { text: 'Stalemate - Draw', color: '#EAB308' };
  if (status === 'draw_repetition') return { text: '3-fold Repetition - Draw', color: '#EAB308' };
  if (status === 'draw_50move') return { text: '50-Move Rule - Draw', color: '#EAB308' };
  if (status === 'draw_material') return { text: 'Insufficient Material - Draw', color: '#EAB308' };
  if (status === 'timeout') return { text: 'Time Out', color: '#EF4444' };
  if (status === 'draw_timeout') return { text: 'Time Out - Draw', color: '#EAB308' };
  if (status === 'resignation') return { text: 'Resigned', color: '#EF4444' };
  if (status === 'draw_agreement') return { text: 'Draw by Agreement', color: '#EAB308' };
  if (status === 'aborted') return { text: 'Game Aborted', color: '#9CA3AF' };
  if (status === 'check') return { text: 'Check!', color: '#F97316' };
  return { text: turn === 'w' ? 'Your turn' : 'AI thinking…', color: '#6B7280' };
}

export function HUD({
  turn,
  status,
  playerWins,
  aiWins,
  draws,
  whiteMaterial,
  blackMaterial,
}: HUDProps) {
  const { text, color } = statusLabel(status, turn);
  const balance = whiteMaterial - blackMaterial;
  const balanceText = balance === 0 ? 'even' : balance > 0 ? `+${balance}` : `${balance}`;
  return (
    <Container>
      <Block>
        <Label>You ♙</Label>
        <Value css={{ color: '#111827' }}>{playerWins}</Value>
      </Block>
      <Block css={{ flex: 1.6 }}>
        <StatusText css={{ color }}>{text}</StatusText>
        <Label css={{ marginTop: 2 }}>
          {draws > 0 ? `Material ${balanceText} · Draws ${draws}` : `Material ${balanceText}`}
        </Label>
      </Block>
      <Block>
        <Label>AI ♟</Label>
        <Value css={{ color: '#111827' }}>{aiWins}</Value>
      </Block>
    </Container>
  );
}
