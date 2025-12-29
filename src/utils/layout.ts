import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const width = SCREEN_WIDTH;
export const height = SCREEN_HEIGHT;

// 2. Định nghĩa thiết bị
export const isSmallDevice = SCREEN_WIDTH < 375; // iPhone SE, 5s
export const isTablet = SCREEN_WIDTH >= 768;     // iPad Mini trở lên

// 3. Hàm tính % chiều rộng/cao
export const wp = (percentage: number) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(value);
};

export const hp = (percentage: number) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(value);
};

// 4. Hàm normalize font/icon size 
export const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android cần trừ hao 1-2px để khớp với iOS
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

export const hasNotch = () => {
  return Platform.OS === 'ios' && 
    !Platform.isPad && 
    !Platform.isTV &&
    (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812);
}
