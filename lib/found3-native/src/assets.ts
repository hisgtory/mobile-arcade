/**
 * Static asset mapping for React Native.
 * require() must be called with a literal string.
 */
export const TILE_ASSETS: Record<string, any> = {
  apple: require('../../../found3/rn/assets/tiles/apple.png'),
  banana: require('../../../found3/rn/assets/tiles/banana.png'),
  cherry: require('../../../found3/rn/assets/tiles/cherry_new.png'),
  grape: require('../../../found3/rn/assets/tiles/grape.png'),
  kiwi: require('../../../found3/rn/assets/tiles/kiwi.png'),
  lemon: require('../../../found3/rn/assets/tiles/lemon.png'),
  orange: require('../../../found3/rn/assets/tiles/orange.png'),
  peach: require('../../../found3/rn/assets/tiles/peach.png'),
  pear: require('../../../found3/rn/assets/tiles/pear.png'),
  pineapple: require('../../../found3/rn/assets/tiles/pineapple.png'),
  strawberry: require('../../../found3/rn/assets/tiles/strawberry.png'),
  watermelon: require('../../../found3/rn/assets/tiles/watermelon.png'),
  mangosteen: require('../../../found3/rn/assets/tiles/mangosteen.png'),
  pomegranate: require('../../../found3/rn/assets/tiles/pomegranate.png'),
  background: require('../../../found3/rn/assets/background.png'),
  
  // UNDO 세트
  item_undo: require('../../../found3/rn/assets/items/undo_normal.png'),
  item_undo_pressed: require('../../../found3/rn/assets/items/undo_pressed.png'),
  
  // SHUFFLE 세트
  item_shuffle: require('../../../found3/rn/assets/items/shuffle_normal.png'), 
  item_shuffle_pressed: require('../../../found3/rn/assets/items/expand_pressed.png'), 
  
  // EXPAND 세트
  item_expand: require('../../../found3/rn/assets/items/expand_normal.png'), 
  item_expand_pressed: require('../../../found3/rn/assets/items/extra.png'), 
  
  ui_settings: require('../../../found3/rn/assets/ui/icon_settings.png'),
  ui_play: require('../../../found3/rn/assets/ui/btn_play.png'),
  ui_home: require('../../../found3/rn/assets/ui/btn_home.png'),
  ui_restart: require('../../../found3/rn/assets/ui/btn_restart.png'),
  ui_exit: require('../../../found3/rn/assets/ui/btn_exit.png'),
  ui_status: require('../../../found3/rn/assets/ui/status_bar.png'),
  ui_magnet: require('../../../found3/rn/assets/items/shuffle_pressed.png'), 

  // BGM 세트
  bgm_1: require('../../../found3/rn/assets/audio/bgm_1.mp3'),
  bgm_2: require('../../../found3/rn/assets/audio/bgm_2.mp3'),
  bgm_3: require('../../../found3/rn/assets/audio/bgm_3.mp3'),
  bgm_4: require('../../../found3/rn/assets/audio/bgm_4.mp3'),
  bgm_5: require('../../../found3/rn/assets/audio/bgm_5.mp3'),
};
