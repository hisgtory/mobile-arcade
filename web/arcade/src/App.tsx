import { Routes, Route, Navigate } from 'react-router-dom';
import { globalStyles } from './styles/global';

// Game route registrations (side-effect imports)
import './games/found3/routes';
import './games/crunch3/routes';
import './games/blockrush/routes';
import './games/watersort/routes';
import './games/tictactoe/routes';
import './games/minesweeper/routes';
import './games/number10/routes';
import './games/sudoku/routes';
import './games/blockpuzzle/routes';
import './games/found3-react/routes';
import './games/blockcrush/routes';

import { getRegisteredRoutes } from './router';

export function App() {
  globalStyles();
  return (
    <Routes>
      {getRegisteredRoutes().map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/" element={<Navigate to="/games/found3/v1" replace />} />
    </Routes>
  );
}
