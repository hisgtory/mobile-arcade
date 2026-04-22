import { Routes, Route } from 'react-router-dom';
import { globalStyles } from './styles/global';
import { PlayLayout } from './components/PlayLayout';
import { getRegisteredRoutes } from './router';

// Game route registrations (side-effect imports)
// import './games/found3/routes';
// import './games/crunch3/routes';
// import './games/blockrush/routes';
// import './games/watersort/routes';
// import './games/tictactoe/routes';
// import './games/minesweeper/routes';
// import './games/number10/routes';
// import './games/sudoku/routes';
// import './games/blockpuzzle/routes';
// import './games/found3-react/routes';
// import './games/blockcrush/routes';
// import './games/woodoku/routes';
import './games/getcolor/routes';
// import './games/chess/routes';
import './games/tidymaster/routes';
import './games/hexaaway/routes';

// ─── App ───────────────────────────────────────────────

export function App() {
  globalStyles();
  return (
    <Routes>
      {/* Home / Root */}
      <Route path="/" element={
        <PlayLayout css={{ justifyContent: 'center', alignItems: 'center' }}>
          <h1>Arcade Home</h1>
          <p>Select a game to play!</p>
        </PlayLayout>
      } />

      {/* Registered game routes (Found3, TidyMaster, etc.) */}
      {getRegisteredRoutes().map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}
