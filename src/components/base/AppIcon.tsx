import { FontAwesome, FontAwesome6, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
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
  // 1. Kiểm tra Icon Local
  if (!forceVector && LOCAL_ICONS[name]) {
    return (
      <Image
        source={LOCAL_ICONS[name]}
        style={[
          {
            width: size,
            height: size,
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
      size={size}
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
