export interface AppMeta {
  slug: string;
  title: string;
  subtitle: string;
  iconBg: string;
  iconEmoji: string;
  category: string;
  tagline: string;
  description: string[];
  appStoreUrl?: string;
  playStoreUrl?: string;
  comingSoon?: boolean;
}

export const APPS: AppMeta[] = [
  {
    slug: 'juicy-fruits',
    title: 'Juicy Fruits',
    subtitle: 'Fruit Match 3',
    iconBg: 'linear-gradient(135deg, #FFD6BA 0%, #FF6B6B 100%)',
    iconEmoji: '🍓',
    category: 'Puzzle',
    tagline: '신선하고 통통 튀는 과일 매치 퍼즐.',
    description: [
      '같은 과일 3개를 모아 매치하세요.',
      '슬롯이 가득 차기 전에 보드를 비우면 클리어!',
      'Undo, Shuffle, Expand 아이템을 활용해 더 멀리 진행하세요.',
      '120개 이상의 스테이지가 점차 어려워집니다.',
    ],
  },
];

export const COMING_SOON_SLOTS = 7;
