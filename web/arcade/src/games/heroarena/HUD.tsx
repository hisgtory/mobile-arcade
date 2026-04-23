import { styled } from '../../styles/stitches.config';
import { HeroDef } from '@arcade/lib-heroarena';

const Container = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 20,
  zIndex: 10,
});

const TopHUD = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  gap: 40,
});

const TeamScore = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 15,
  backgroundColor: 'rgba(16, 16, 26, 0.85)',
  padding: '10px 20px',
  borderRadius: 30,
  border: '1px solid rgba(255, 255, 255, 0.1)',
});

const ScoreNum = styled('span', {
  fontSize: '2rem',
  fontWeight: 'bold',
  width: 40,
  textAlign: 'center',
  variants: {
    team: {
      blue: { color: '#00f0ff' },
      red: { color: '#ff2a2a' },
    },
  },
});

const ScoreBarContainer = styled('div', {
  width: 150,
  height: 10,
  backgroundColor: '#222',
  borderRadius: 5,
  overflow: 'hidden',
});

const ScoreBar = styled('div', {
  height: '100%',
  transition: 'width 0.3s',
  variants: {
    team: {
      blue: { backgroundColor: '#00f0ff' },
      red: { backgroundColor: '#ff2a2a' },
    },
  },
});

const MatchStatus = styled('div', {
  backgroundColor: 'rgba(16, 16, 26, 0.85)',
  padding: '10px 25px',
  borderRadius: 30,
  fontSize: '1.2rem',
  fontWeight: 'bold',
  textAlign: 'center',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#fff',
  minWidth: 200,
});

const BottomHUD = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
});

const PlayerStatus = styled('div', {
  backgroundColor: 'rgba(16, 16, 26, 0.85)',
  padding: 20,
  borderRadius: 10,
  width: 300,
  border: '1px solid rgba(255, 255, 255, 0.1)',
});

const PlayerName = styled('div', {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: 5,
});

const HPContainer = styled('div', {
  width: '100%',
  height: 25,
  backgroundColor: '#333',
  borderRadius: 4,
  marginTop: 10,
  position: 'relative',
  overflow: 'hidden',
  border: '2px solid #111',
});

const HPBar = styled('div', {
  height: '100%',
  transition: 'width 0.1s',
  backgroundColor: '#fff',
});

const HPText = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  textShadow: '1px 1px 2px #000',
  fontSize: '0.9rem',
  color: '#fff',
});

interface HUDProps {
  score: { blue: number; red: number };
  zoneControl: number;
  hero: HeroDef;
  playerStatus: {
    hp: number;
    maxHp: number;
    ultCharge: number;
    dead: boolean;
    respawnTimer: number;
  };
}

export function HUD({ score, zoneControl, hero, playerStatus }: HUDProps) {
  const hpPct = Math.max(0, (playerStatus.hp / playerStatus.maxHp) * 100);

  let statusText = "CENTRAL ZONE";
  if (zoneControl > 0) statusText = `BLUE CAPTURING ${Math.floor(zoneControl)}%`;
  if (zoneControl < 0) statusText = `RED CAPTURING ${Math.floor(Math.abs(zoneControl))}%`;
  if (zoneControl === 100) statusText = "BLUE CONTROLS";
  if (zoneControl === -100) statusText = "RED CONTROLS";

  return (
    <Container>
      <TopHUD>
        <TeamScore>
          <ScoreNum team="blue">{Math.floor(score.blue)}</ScoreNum>
          <ScoreBarContainer>
            <ScoreBar team="blue" style={{ width: `${score.blue}%` }} />
          </ScoreBarContainer>
        </TeamScore>
        <MatchStatus style={{ 
          color: zoneControl > 0 ? '#00f0ff' : zoneControl < 0 ? '#ff2a2a' : '#fff' 
        }}>
          {statusText}
        </MatchStatus>
        <TeamScore>
          <ScoreBarContainer>
            <ScoreBar team="red" style={{ width: `${score.red}%` }} />
          </ScoreBarContainer>
          <ScoreNum team="red">{Math.floor(score.red)}</ScoreNum>
        </TeamScore>
      </TopHUD>

      <BottomHUD>
        <PlayerStatus>
          <PlayerName style={{ color: hero.color }}>{hero.name}</PlayerName>
          <HPContainer>
            <HPBar style={{ width: `${hpPct}%`, backgroundColor: hpPct > 30 ? hero.color : '#ff2a2a' }} />
            <HPText>{Math.ceil(playerStatus.hp)} / {playerStatus.maxHp}</HPText>
          </HPContainer>
        </PlayerStatus>
      </BottomHUD>
    </Container>
  );
}
