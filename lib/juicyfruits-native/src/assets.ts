import { Platform } from 'react-native';

/**
 * 전역 자산 맵핑
 * 모든 이미지 및 사운드 리소스를 여기서 관리합니다.
 */
export const TILE_ASSETS: Record<string, any> = {
  // Fruits
  apple: require('../../../juicyfruits/rn/assets/tiles/apple.png'),
  banana: require('../../../juicyfruits/rn/assets/tiles/banana.png'),
  cherry: require('../../../juicyfruits/rn/assets/tiles/cherry_new.png'),
  grape: require('../../../juicyfruits/rn/assets/tiles/grape.png'),
  kiwi: require('../../../juicyfruits/rn/assets/tiles/kiwi.png'),
  lemon: require('../../../juicyfruits/rn/assets/tiles/lemon.png'),
  orange: require('../../../juicyfruits/rn/assets/tiles/orange.png'),
  peach: require('../../../juicyfruits/rn/assets/tiles/peach.png'),
  pear: require('../../../juicyfruits/rn/assets/tiles/pear.png'),
  pineapple: require('../../../juicyfruits/rn/assets/tiles/pineapple.png'),
  strawberry: require('../../../juicyfruits/rn/assets/tiles/strawberry.png'),
  watermelon: require('../../../juicyfruits/rn/assets/tiles/watermelon.png'),
  mangosteen: require('../../../juicyfruits/rn/assets/tiles/mangosteen.png'),
  pomegranate: require('../../../juicyfruits/rn/assets/tiles/pomegranate.png'),

  // UI & System
  background: require('../../../juicyfruits/rn/assets/background.png'),
  item_undo: require('../../../juicyfruits/rn/assets/items/undo_normal.png'),
  item_undo_pressed: require('../../../juicyfruits/rn/assets/items/undo_pressed.png'),
  item_shuffle: require('../../../juicyfruits/rn/assets/items/shuffle_normal.png'), 
  item_shuffle_pressed: require('../../../juicyfruits/rn/assets/items/expand_pressed.png'), 
  ui_settings: require('../../../juicyfruits/rn/assets/ui/icon_settings.png'),
  ui_play: require('../../../juicyfruits/rn/assets/ui/btn_play.png'),
  ui_home: require('../../../juicyfruits/rn/assets/ui/btn_home.png'),
  ui_restart: require('../../../juicyfruits/rn/assets/ui/btn_restart.png'),
  ui_exit: require('../../../juicyfruits/rn/assets/ui/btn_exit.png'),
  ui_status: require('../../../juicyfruits/rn/assets/ui/status_bar.png'),
  ui_magnet: require('../../../juicyfruits/rn/assets/items/shuffle_pressed.png'), 

  // Audio
  bgm_1: require('../../../juicyfruits/rn/assets/audio/bgm_1.mp3'),
  bgm_2: require('../../../juicyfruits/rn/assets/audio/bgm_2.mp3'),
  bgm_3: require('../../../juicyfruits/rn/assets/audio/bgm_3.mp3'),
  bgm_4: require('../../../juicyfruits/rn/assets/audio/bgm_4.mp3'),
  bgm_5: require('../../../juicyfruits/rn/assets/audio/bgm_5.mp3'),
  bgm_6: require('../../../juicyfruits/rn/assets/audio/bgm_6.mp3'),
};
