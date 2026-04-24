import React from 'react';
import { styled } from '../../styles/stitches.config';
import type { BoardState, Square, Move, PieceType, Piece } from '@arcade/lib-chess';

const BoardContainer = styled('div', {
  width: '100%',
  aspectRatio: '1/1',
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gridTemplateRows: 'repeat(8, 1fr)',
  border: '4px solid #312e2b',
  borderRadius: 4,
  overflow: 'hidden',
  userSelect: 'none',
  touchAction: 'none',
});

const SquareUI = styled('div', {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'min(8vw, 40px)',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  
  variants: {
    color: {
      light: { backgroundColor: '#f0d9b5' },
      dark: { backgroundColor: '#b58863' },
    },
    isSelected: {
      true: { backgroundColor: '#f7ec74 !important' },
    },
    isLastMove: {
      true: { backgroundColor: 'rgba(247, 236, 116, 0.6)' },
    }
  }
});

const LegalDot = styled('div', {
  width: '25%',
  height: '25%',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.15)',
  pointerEvents: 'none',
  variants: {
    isCapture: {
      true: {
        width: '80%',
        height: '80%',
        borderRadius: '50%',
        border: '4px solid rgba(0, 0, 0, 0.1)',
        backgroundColor: 'transparent',
      }
    }
  }
});

const PieceUI = styled('div', {
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", "Noto Sans Symbols2", system-ui, sans-serif',
});

const PromotionOverlay = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
});

const PromotionMenu = styled('div', {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 12,
  display: 'flex',
  gap: 8,
  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
});

const PromotionItem = styled('button', {
  width: 60,
  height: 60,
  fontSize: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #E5E7EB',
  borderRadius: 8,
  backgroundColor: '#fff',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#F3F4F6',
    borderColor: '#2563EB',
  }
});

const PIECE_GLYPH: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

interface BoardProps {
  state: BoardState;
  selectedSquare: Square | null;
  legalMoves: Move[];
  promotionMove: Move | null;
  onSquareClick: (square: Square) => void;
  onSelectPromotion: (type: PieceType) => void;
  onCancelPromotion: () => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  selectedSquare,
  legalMoves,
  promotionMove,
  onSquareClick,
  onSelectPromotion,
  onCancelPromotion,
}) => {
  const squares = Array.from({ length: 64 }, (_, i) => i);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
      <BoardContainer>
        {squares.map((index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const isLight = (row + col) % 2 === 0;
          const piece = state.board[index];
          const isSelected = selectedSquare === index;
          const legalMove = legalMoves.find(m => m.to === index);
          const isLastMove = state.lastMove?.from === index || state.lastMove?.to === index;

          return (
            <SquareUI
              key={index}
              color={isLight ? 'light' : 'dark'}
              isSelected={isSelected}
              isLastMove={isLastMove}
              onClick={() => onSquareClick(index)}
            >
              {piece && (
                <PieceUI style={{ 
                  color: piece.color === 'w' ? '#fff' : '#000',
                  textShadow: piece.color === 'w' ? '0 0 2px #000' : '0 0 2px #fff'
                }}>
                  {PIECE_GLYPH[`${piece.color}${piece.type}`]}
                </PieceUI>
              )}
              {legalMove && (
                <LegalDot isCapture={!!legalMove.captured || !!legalMove.isEnPassant} />
              )}
            </SquareUI>
          );
        })}
      </BoardContainer>

      {promotionMove && (
        <PromotionOverlay onClick={onCancelPromotion}>
          <PromotionMenu onClick={(e) => e.stopPropagation()}>
            {(['q', 'r', 'b', 'n'] as PieceType[]).map((type) => (
              <PromotionItem key={type} onClick={() => onSelectPromotion(type)}>
                {PIECE_GLYPH[`w${type}`]}
              </PromotionItem>
            ))}
          </PromotionMenu>
        </PromotionOverlay>
      )}
    </div>
  );
};
