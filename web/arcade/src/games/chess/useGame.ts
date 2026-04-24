import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  createInitialBoard, 
  getLegalMoves, 
  applyMove, 
  createAI,
  type Color, 
  type Difficulty, 
  type GameStatus, 
  type BoardState,
  type Move,
  type Square,
  type PieceType
} from '@arcade/lib-chess';
import { stageComplete, haptic } from '../../utils/bridge';

export interface RoundResult {
  winner: 'player' | 'ai' | 'draw';
  playerWins: number;
  aiWins: number;
  draws: number;
}

interface UseGameOptions {
  difficulty?: Difficulty;
}

export function useGame({ difficulty = 'medium' }: UseGameOptions) {
  const [state, setState] = useState<BoardState>(createInitialBoard());
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [promotionMove, setPromotionMove] = useState<Move | null>(null);
  
  const aiRef = useRef(createAI(difficulty));
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback(() => {
    setState(createInitialBoard());
    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotionMove(null);
  }, []);

  const executeMove = useCallback((move: Move) => {
    setState(prev => {
      const isCapture = !!move.captured || !!move.isEnPassant;
      const nextState = applyMove(prev, move);
      
      haptic('chess-piece-moved');
      if (isCapture) haptic('chess-capture');
      if (nextState.status === 'check') haptic('chess-check');
      if (nextState.status === 'checkmate') haptic('chess-checkmate');
      
      return nextState;
    });
    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotionMove(null);
  }, []);

  const handleSquareClick = useCallback((square: Square) => {
    if (state.turn !== 'w' || state.status === 'checkmate' || state.status === 'stalemate') return;

    // If a move is selected
    const move = legalMoves.find(m => m.to === square);
    if (move) {
      if (move.promotion) {
        setPromotionMove(move);
        return;
      }
      executeMove(move);
      return;
    }

    // Select piece
    const piece = state.board[square];
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      setLegalMoves(getLegalMoves(state, square));
      haptic('chess-piece-tapped');
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [state, legalMoves, executeMove]);

  const handlePromotion = useCallback((type: PieceType) => {
    if (promotionMove) {
      executeMove({ ...promotionMove, promotion: type });
    }
  }, [promotionMove, executeMove]);

  // AI Turn
  useEffect(() => {
    if (state.turn === 'b' && state.status !== 'checkmate' && state.status !== 'stalemate') {
      aiTimerRef.current = setTimeout(() => {
        const move = aiRef.current.selectMove(state);
        if (move) {
          executeMove(move);
        }
      }, 600);
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [state, executeMove]);

  // Game End Logic
  useEffect(() => {
    if (state.status === 'checkmate' || state.status === 'stalemate') {
      const winner = state.status === 'checkmate' ? (state.winner === 'w' ? 'player' : 'ai') : 'draw';
      
      if (winner === 'player') setPlayerWins(prev => prev + 1);
      else if (winner === 'ai') setAiWins(prev => prev + 1);
      else setDraws(prev => prev + 1);

      stageComplete({
        stage: 0,
        score: playerWins + (winner === 'player' ? 1 : 0),
        cleared: winner === 'player',
      });
    }
  }, [state.status, state.winner]);

  // Compute material
  const computeMaterial = useCallback(() => {
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let w = 0;
    let b = 0;
    state.board.forEach(p => {
      if (p) {
        if (p.color === 'w') w += values[p.type];
        else b += values[p.type];
      }
    });
    return { whiteMaterial: w, blackMaterial: b };
  }, [state.board]);

  const { whiteMaterial, blackMaterial } = computeMaterial();

  return {
    state,
    turn: state.turn,
    status: state.status,
    playerWins,
    aiWins,
    draws,
    whiteMaterial,
    blackMaterial,
    selectedSquare,
    legalMoves,
    promotionMove,
    handleSquareClick,
    handlePromotion,
    resetGame,
    cancelPromotion: () => setPromotionMove(null),
  };
}
