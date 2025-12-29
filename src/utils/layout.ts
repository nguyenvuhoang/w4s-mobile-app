import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


const GUIDELINE_BASE_WIDTH = 375;

export const width = SCREEN_WIDTH;
export const height = SCREEN_HEIGHT;

const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
export const isTablet = aspectRatio < 1.6; 

export const isSmallDevice = SCREEN_WIDTH < 375; 

const scale = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;


const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};


export const normalize = (size: number, factor = 0.5) => {
  const newSize = moderateScale(size, factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const wp = (percentage: number) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(value);
};

export const hp = (percentage: number) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(value);
};

export const hasNotch = () => {
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTV &&
    (SCREEN_HEIGHT >= 780 || SCREEN_WIDTH >= 780)
  );
};

export const getStatusBarHeight = () => {
  return Platform.select({
    ios: hasNotch() ? 47 : 20,
    android: StatusBar.currentHeight || 0,
    default: 0,
  });
};

export const getBottomSpace = () => {
  return hasNotch() ? 34 : 0;
};
