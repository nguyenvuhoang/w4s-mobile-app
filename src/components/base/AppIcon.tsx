import { FontAwesome, FontAwesome6, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LOCAL_ICONS } from '@/utils/Icons';
import { getValidIconName } from '@/utils/iconMapper';

export type IconType = 'FontAwesome' | 'FontAwesome6' | 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons';

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  type?: IconType;
  forceVector?: boolean;
}

const AppIcon: React.FC<AppIconProps> = ({ 
  name, 
  size = 24, 
  color, 
  style, 
  type = 'FontAwesome6',
  forceVector = false 
}) => {
  // Sanitize size to prevent NaN or Infinity from crashing react-native-svg XML parser
  const safeSize = (typeof size === 'number' && !isNaN(size) && isFinite(size)) ? size : 24;

  // 1. Kiểm tra Icon Local
  if (!forceVector && LOCAL_ICONS[name]) {
    const iconData = LOCAL_ICONS[name];

    // Nếu là SVG XML string (đã chuyển sang code)
    if (typeof iconData === 'string') {
      return (
        <SvgXml
          xml={iconData}
          width={safeSize}
          height={safeSize}
          color={color}
          style={style}
        />
      );
    }

    // Nếu vẫn là require (PNG/JPG)
    return (
      <Image
        source={iconData}
        style={[
          {
            width: safeSize,
            height: safeSize,
          },
          style,
        ]}
        tintColor={color}
        contentFit="contain"
      />
    );
  }

  // 2. Chuẩn hóa tên icon (Dùng mapper của dự án)
  const validName = type === 'FontAwesome6' ? getValidIconName(name) : name;

  // 3. Chọn thư viện Icon
  const IconComponent = (() => {
    switch (type) {
      case 'FontAwesome': return FontAwesome;
      case 'Ionicons': return Ionicons;
      case 'MaterialIcons': return MaterialIcons;
      case 'MaterialCommunityIcons': return MaterialCommunityIcons;
      default: return FontAwesome6;
    }
  })();

  if (!IconComponent) return null;

  // 4. Render Vector Icon
  const iconElement = (
    <IconComponent
      name={validName as any}
      size={safeSize}
      color={color}
    />
  );

  if (style) {
    return <View style={style}>{iconElement}</View>;
  }

  return iconElement;
};

export default AppIcon;
export { AppIconProps };
