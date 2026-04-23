import { useRef, useEffect, useState, useCallback } from 'react';
import { createGame, destroyGame, HeroClasses, HeroDef, Team } from '@arcade/lib-heroarena';

export interface GameResult {
  winner: string;
  blueScore: number;
  redScore: number;
}

interface UseGameOptions {
  hero: HeroDef;
  onGameOver?: (result: GameResult) => void;
}

export function useGame({ hero, onGameOver }: UseGameOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState({ blue: 0, red: 0 });
  const [zoneControl, setZoneControl] = useState(0);
  const [playerStatus, setPlayerStatus] = useState({
    hp: 0,
    maxHp: 100,
    ultCharge: 0,
    dead: false,
    respawnTimer: 0
  });

  const gameRef = useRef<ReturnType<typeof createGame> | null>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    if (!containerRef.current) return;

    const game = createGame(containerRef.current, {
      hero,
    });
    gameRef.current = game;

    game.on((event) => {
      switch (event.type) {
        case 'score-update':
          setScore({ ...event.data });
          break;
        case 'zone-update':
          setZoneControl(event.data.control);
          break;
        case 'player-update':
          setPlayerStatus({ ...event.data });
          break;
        case 'game-over':
          onGameOverRef.current?.({
            winner: event.data.winner,
            blueScore: event.data.blueScore,
            redScore: event.data.redScore
          });
          break;
      }
    });

    return () => {
      gameRef.current = null;
      destroyGame(game);
    };
  }, [hero]);

  return { containerRef, score, zoneControl, playerStatus };
}
