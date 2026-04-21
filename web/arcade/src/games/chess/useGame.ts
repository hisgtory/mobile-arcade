import { useRef, useEffect, useState } from 'react';
import {
  createGame,
  destroyGame,
  type Color,
  type Difficulty,
  type GameStatus,
} from '@arcade/lib-chess';
import { stageComplete, haptic } from '../../utils/bridge';

export interface RoundResult {
  winner: 'player' | 'ai' | 'draw';
  playerWins: number;
  aiWins: number;
  draws: number;
}

interface ScoreUpdate {
  turn: Color;
  status: GameStatus;
  playerWins: number;
  aiWins: number;
  draws: number;
  whiteMaterial: number;
  blackMaterial: number;
}

interface UseGameOptions {
  difficulty?: Difficulty;
}

export function useGame({ difficulty = 'medium' }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState<Color>('w');
  const [status, setStatus] = useState<GameStatus>('playing');
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [whiteMaterial, setWhiteMaterial] = useState(39);
  const [blackMaterial, setBlackMaterial] = useState(39);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { difficulty });

    game.events.on('piece-tapped', () => haptic('chess-piece-tapped'));
    game.events.on('piece-captured', () => haptic('chess-capture'));
    game.events.on('check', () => haptic('chess-check'));
    game.events.on('checkmate', () => haptic('chess-checkmate'));

    game.events.on('score-update', (data: ScoreUpdate) => {
      setTurn(data.turn);
      setStatus(data.status);
      setPlayerWins(data.playerWins);
      setAiWins(data.aiWins);
      setDraws(data.draws);
      setWhiteMaterial(data.whiteMaterial);
      setBlackMaterial(data.blackMaterial);
    });

    game.events.on('round-end', (data: RoundResult) => {
      stageComplete({
        stage: 0,
        score: data.playerWins,
        cleared: data.winner === 'player',
      });
    });

    return () => {
      destroyGame(game);
    };
  }, [difficulty]);

  return {
    containerRef,
    turn,
    status,
    playerWins,
    aiWins,
    draws,
    whiteMaterial,
    blackMaterial,
  };
}
