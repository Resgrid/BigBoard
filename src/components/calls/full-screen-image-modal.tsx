import { XIcon } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from '@/components/ui/image';
import { Modal, ModalBackdrop, ModalContent } from '@/components/ui/modal';

interface FullScreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSource: any;
  imageName?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({ isOpen, onClose, imageSource, imageName }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset animation values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [isOpen, scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);

  const clampTranslation = (translation: number, dimension: number, scaleFactor: number) => {
    'worklet';
    const scaledDimension = dimension * scaleFactor;
    const maxTranslation = Math.max(0, (scaledDimension - dimension) / 2);
    return Math.max(-maxTranslation, Math.min(maxTranslation, translation));
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(1, Math.min(5, newScale)); // Limit scale between 1 and 5
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // Clamp translations based on new scale
      const clampedX = clampTranslation(translateX.value, screenWidth, scale.value);
      const clampedY = clampTranslation(translateY.value, screenHeight, scale.value);

      translateX.value = withTiming(clampedX);
      translateY.value = withTiming(clampedY);
      savedTranslateX.value = clampedX;
      savedTranslateY.value = clampedY;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateX = savedTranslateX.value + event.translationX;
      const newTranslateY = savedTranslateY.value + event.translationY;

      translateX.value = clampTranslation(newTranslateX, screenWidth, scale.value);
      translateY.value = clampTranslation(newTranslateY, screenHeight, scale.value);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(() => {
        if (scale.value > 1) {
          // Reset to original size
          scale.value = withTiming(1);
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedScale.value = 1;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          // Zoom in to 2x
          scale.value = withTiming(2);
          savedScale.value = 2;
        }
      })();
    });

  const composedGesture = Gesture.Simultaneous(Gesture.Simultaneous(pinchGesture, panGesture), doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
    };
  });

  const closeButtonOpacity = useAnimatedStyle(() => {
    // Hide close button when zoomed in significantly
    const opacity = interpolate(scale.value, [1, 2], [1, 0.3], 'clamp');
    return {
      opacity,
    };
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" {...({} as any)}>
      <ModalBackdrop onPress={onClose} className="bg-black/90" />
      <ModalContent className="flex size-full items-center justify-center border-0 bg-transparent p-0 shadow-none">
        <StatusBar hidden />

        {/* Close button */}
        <Animated.View
          style={[
            closeButtonOpacity,
            {
              position: 'absolute',
              top: insets.top + 16,
              right: 16,
              zIndex: 10,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} className="rounded-full bg-black/50 p-3" testID="close-button">
            <XIcon size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Image container */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              animatedStyle,
              {
                width: screenWidth,
                height: screenHeight,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Image
              source={imageSource}
              style={{
                width: screenWidth,
                height: screenHeight * 0.8, // Leave some space for safe areas
                maxWidth: screenWidth,
                maxHeight: screenHeight * 0.8,
              }}
              contentFit="contain"
              alt={imageName || t('callImages.image_alt')}
              testID="full-screen-image"
            />
          </Animated.View>
        </GestureDetector>
      </ModalContent>
    </Modal>
  );
};

export default FullScreenImageModal;
