import { Fonts } from '@/core/theme/font';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { normalize } from '@/utils/layout';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  type?: 'regular' | 'medium' | 'bold';
  children?: React.ReactNode;
  size?: number; 
}

const CustomText: React.FC<CustomTextProps> = ({
  type = "regular",
  size, 
  style,
  children,
  ...props
}) => {
  const { colors } = useAppTheme();

  return (
    <Text 
      style={[
        styles.base,
        { 
            color: colors.text,
            fontSize: size ? normalize(size) : normalize(14) 
        },
        type === 'regular' && styles.regular,
        type === 'medium' && styles.medium,
        type === 'bold' && styles.bold,
        style
      ]}
      allowFontScaling={false}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
  },
  regular: {
    fontFamily: Fonts.regular,
  },
  medium: {
    fontFamily: Fonts.medium,
  },
  bold: {
    fontFamily: Fonts.bold,
  },
});

export default CustomText;
