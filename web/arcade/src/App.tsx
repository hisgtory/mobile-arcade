import { Navigate, Route, Routes } from 'react-router-dom';
import { globalStyles } from './styles/global';
import { getRegisteredRoutes } from './router';

import './games/blockcrush/routes';
import './games/blockpuzzle/routes';
import './games/blockrush/routes';
import './games/chess/routes';
import './games/crunch3/routes';
import './games/found3/routes';
import './games/found3-react/routes';
import './games/getcolor/routes';
import './games/hexaaway/routes';
import './games/minesweeper/routes';
import './games/nexus-brawl/routes';
import './games/nonogram/routes';
import './games/number10/routes';
import './games/sudoku/routes';
import './games/tictactoe/routes';
import './games/watersort/routes';
import './games/woodoku/routes';
import './games/heroarena/routes';

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
