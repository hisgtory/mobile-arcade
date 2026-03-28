import { useRef, useEffect, useState } from 'react';
import { createGame, destroyGame, type Difficulty } from '@arcade/lib-tictactoe';
import { stageComplete } from '../../utils/bridge';

export interface RoundResult {
  winner: 'X' | 'O' | 'draw';
  playerScore: number;
  aiScore: number;
  roundsPlayed: number;
}

interface UseGameOptions {
  difficulty?: Difficulty;
}

export function useGame({ difficulty = 'medium' }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, { difficulty });

    game.events.on('score-update', (data: { playerScore: number; aiScore: number; roundsPlayed: number }) => {
      setPlayerScore(data.playerScore);
      setAiScore(data.aiScore);
      setRoundsPlayed(data.roundsPlayed);
    });

    game.events.on('round-end', (data: RoundResult) => {
      // Send bridge message for RN
      stageComplete({
        stage: data.roundsPlayed,
        score: data.playerScore,
        cleared: data.winner === 'X',
      });
    });

    return () => {
      destroyGame(game);
    };
  }, [difficulty]);

  return { containerRef, playerScore, aiScore, roundsPlayed };
}
