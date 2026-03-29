import { useNavigate } from 'react-router-dom';
import { GameCanvas } from '../../components/GameCanvas';
import { PlayLayout } from '../../components/PlayLayout';
import { registerRoutes } from '../../router';
import { HUD as TicTacToeHUD } from './HUD';
import { useGame as useTicTacToeGame } from './useGame';

function TicTacToeTitleRoute() {
  const navigate = useNavigate();
  return (
    <PlayLayout css={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>Tic Tac Toe</h1>
      <p style={{ fontSize: 16, color: '#6B7280' }}>Beat the AI in classic XO!</p>
      <button
        onClick={() => navigate('/games/tictactoe/v1/play')}
        style={{ marginTop: 32, backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 16, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}
      >
        Play
      </button>
    </PlayLayout>
  );
}

function TicTacToePlayRoute() {
  const { containerRef, playerScore, aiScore } = useTicTacToeGame({ difficulty: 'medium' });
  return (
    <PlayLayout>
      <TicTacToeHUD playerScore={playerScore} aiScore={aiScore} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/tictactoe/v1', [
  { path: '', element: <TicTacToeTitleRoute /> },
  { path: 'play', element: <TicTacToePlayRoute /> },
]);
