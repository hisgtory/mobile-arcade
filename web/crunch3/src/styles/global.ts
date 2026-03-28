import { globalCss } from './stitches.config';

export const globalStyles = globalCss({
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  'html, body': {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    fontFamily: '$body',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  '#root': {
    width: '100%',
    height: '100%',
  },
});
