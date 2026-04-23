import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '../../styles/stitches.config';
import { GameCanvas } from '../../components/GameCanvas';
import { HUD } from './HUD';
import { useGame, type GameResult } from './useGame';
import { registerRoutes } from '../../router';
import { HeroClasses, HeroDef } from '@arcade/lib-heroarena';
import { ClearScreen } from './ClearScreen';

const PlayLayout = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#0a0a10',
  overflow: 'hidden',
  position: 'relative',
});

const HomeContainer = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#05050a',
  padding: 20,
  color: '#fff',
});

const Title = styled('h1', {
  fontSize: '4rem',
  textTransform: 'uppercase',
  letterSpacing: 4,
  marginBottom: 10,
  color: '#00f0ff',
  textShadow: '0 0 20px #00f0ff',
});

const Subtitle = styled('h2', {
  fontSize: '1.5rem',
  color: '#8892b0',
  marginBottom: 40,
  fontWeight: 400,
});

const HeroContainer = styled('div', {
  display: 'flex',
  gap: 20,
  marginBottom: 40,
  maxWidth: 1000,
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const HeroCard = styled('div', {
  background: 'rgba(16, 16, 26, 0.85)',
  border: '2px solid #2a2a40',
  borderRadius: 8,
  padding: 20,
  width: 280,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
});

const HeroName = styled('div', {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: 5,
});

const HeroRole = styled('div', {
  fontSize: '0.9rem',
  color: '#8892b0',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 15,
});

const HeroDesc = styled('div', {
  fontSize: '0.9rem',
  lineHeight: 1.4,
  marginBottom: 15,
  height: 60,
});

function HeroArenaHome() {
  const navigate = useNavigate();

  const handleSelectHero = (heroId: string) => {
    navigate(`/games/heroarena/v1/play?hero=${heroId}`);
  };

  return (
    <HomeContainer>
      <Title>NEXUS ARENA</Title>
      <Subtitle>Select Your Hero</Subtitle>
      <HeroContainer>
        {Object.values(HeroClasses).map((hero) => (
          <HeroCard 
            key={hero.id} 
            onClick={() => handleSelectHero(hero.id)}
            css={{
              '&:hover': {
                borderColor: hero.color,
                boxShadow: `0 10px 20px ${hero.color}33`,
              }
            }}
          >
            <HeroName style={{ color: hero.color }}>{hero.name}</HeroName>
            <HeroRole>{hero.role}</HeroRole>
            <HeroDesc>{hero.desc}</HeroDesc>
          </HeroCard>
        ))}
      </HeroContainer>
      <p style={{ color: '#666' }}>WASD to Move | Mouse to Aim | LMB to Shoot | SHIFT for Ability</p>
    </HomeContainer>
  );
}

function HeroArenaPlay() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const heroId = params.get('hero') || 'TITAN';
  const hero = HeroClasses[heroId.toUpperCase()] || HeroClasses.TITAN;
  
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleGameOver = useCallback((r: GameResult) => {
    setGameResult(r);
  }, []);

  if (gameResult) {
    return (
      <ClearScreen 
        result={gameResult} 
        onRetry={() => { setGameResult(null); setRetryCount(k => k + 1); }}
        onHome={() => navigate('/games/heroarena/v1')}
      />
    );
  }

  return <HeroArenaPlaying key={retryCount} hero={hero} onGameOver={handleGameOver} />;
}

function HeroArenaPlaying({ hero, onGameOver }: { hero: HeroDef, onGameOver: (r: GameResult) => void }) {
  const { containerRef, score, zoneControl, playerStatus } = useGame({ hero, onGameOver });
  
  return (
    <PlayLayout>
      <HUD score={score} zoneControl={zoneControl} hero={hero} playerStatus={playerStatus} />
      <GameCanvas ref={containerRef} />
    </PlayLayout>
  );
}

registerRoutes('/games/heroarena/v1', [
  { path: '', element: <HeroArenaHome /> },
  { path: 'play', element: <HeroArenaPlay /> },
]);
