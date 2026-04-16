import AppIcon from '@/components/base/AppIcon';
import React, { useEffect } from 'react';
import { Dimensions, Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AdvertisementModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const AdvertisementModal: React.FC<AdvertisementModalProps> = ({ visible, imageUrl, onClose }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, {
        duration: 500,
      });
    } else {
      scale.value = withTiming(0, {
        duration: 500,
        easing: Easing.in(Easing.exp),
      });
      opacity.value = withTiming(0, {
        duration: 500,
      });
    }
  }, [visible, scale, opacity]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent 
    >
      <View style={styles.centeredView}>
        <Animated.View style={[styles.modalView, animatedStyle]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AppIcon name="xmark" size={30} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});

export default AdvertisementModal;
