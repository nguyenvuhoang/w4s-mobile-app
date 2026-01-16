// FloatingButtonProvider.tsx - Để dễ dàng show/hide floating button global

import FloatingButton from '@/components/floating/FloatingButton';
import React, { createContext, useContext, useState } from 'react';

interface FloatingButtonContextType {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
}

const FloatingButtonContext = createContext<FloatingButtonContextType>({
  show: () => {},
  hide: () => {},
  isVisible: true,
});

export const useFloatingButton = () => useContext(FloatingButtonContext);

interface FloatingButtonProviderProps {
  children: React.ReactNode;
  imageSource: any;
  onPress?: () => void;
  size?: number;
  snapToEdge?: boolean;
}

export const FloatingButtonProvider: React.FC<FloatingButtonProviderProps> = ({
  children,
  imageSource,
  onPress,
  size = 60,
  snapToEdge = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return (
    <FloatingButtonContext.Provider value={{ show, hide, isVisible }}>
      {children}
      {isVisible && (
        <FloatingButton
          imageSource={imageSource}
          size={size}
          onPress={onPress}
          snapToEdge={snapToEdge}
        />
      )}
    </FloatingButtonContext.Provider>
  );
};