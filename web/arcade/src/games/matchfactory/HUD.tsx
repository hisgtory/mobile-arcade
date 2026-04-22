import { styled } from '../../styles/stitches.config';
import { TILE_IMAGES, type Order } from '@arcade/lib-matchfactory';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  padding: '12px 16px',
  backgroundColor: '$surface',
  borderBottom: '1px solid $gray100',
  gap: 8,
});

const TopRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatBlock = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
});

const StatLabel = styled('span', {
  fontSize: 11,
  fontWeight: 500,
  color: '$textMuted',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const StatValue = styled('span', {
  fontSize: 18,
  fontWeight: 700,
  color: '$text',
});

const OrdersRow = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  flexWrap: 'wrap',
});

const OrderItem = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  variants: {
    fulfilled: {
      true: { backgroundColor: '#D1FAE5', color: '#065F46' },
      false: { backgroundColor: '$gray100', color: '$text' },
    },
  },
});

const OrderIcon = styled('img', {
  width: 20,
  height: 20,
  imageRendering: 'pixelated',
});

interface HUDProps {
  stage: number;
  score: number;
  movesLeft: number;
  combo: number;
  orders: Order[];
}

export function HUD({ stage, score, movesLeft, combo, orders }: HUDProps) {
  return (
    <Container>
      <TopRow>
        <StatBlock>
          <StatLabel>Stage</StatLabel>
          <StatValue>{stage}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>Score</StatLabel>
          <StatValue>{score.toLocaleString()}</StatValue>
        </StatBlock>
        <StatBlock>
          <StatLabel>Moves</StatLabel>
          <StatValue css={{ color: movesLeft <= 3 ? '$rose500' : '$text' }}>
            {movesLeft}
          </StatValue>
        </StatBlock>
        {combo > 1 && (
          <StatBlock>
            <StatLabel>Combo</StatLabel>
            <StatValue css={{ color: '$main500' }}>x{combo}</StatValue>
          </StatBlock>
        )}
      </TopRow>
      <OrdersRow>
        {orders.map((order, i) => {
          const done = order.collected >= order.target;
          const imageKey = TILE_IMAGES[order.type % TILE_IMAGES.length];
          return (
            <OrderItem key={i} fulfilled={done}>
              <OrderIcon src={`/assets/tiles/${imageKey}.png`} alt={imageKey} />
              {done ? '✓' : `${order.collected}/${order.target}`}
            </OrderItem>
          );
        })}
      </OrdersRow>
    </Container>
  );
}
