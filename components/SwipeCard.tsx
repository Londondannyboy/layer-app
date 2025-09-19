import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Profile, UserLayer } from '../types/database';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;

interface SwipeCardProps {
  profile: Profile & { layer: UserLayer; hiddenLayersCount: number };
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  isActive: boolean;
}

export default function SwipeCard({ profile, onSwipe, isActive }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipe = (direction: 'left' | 'right' | 'super') => {
    onSwipe(direction);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      if (isActive) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    },
    onEnd: () => {
      if (!isActive) return;

      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSuperLike = translateY.value < -SWIPE_THRESHOLD;

      if (shouldSuperLike) {
        translateY.value = withSpring(-screenHeight);
        runOnJS(handleSwipe)('super');
      } else if (shouldSwipeRight) {
        translateX.value = withSpring(screenWidth);
        runOnJS(handleSwipe)('right');
      } else if (shouldSwipeLeft) {
        translateX.value = withSpring(-screenWidth);
        runOnJS(handleSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-30, 0, 30],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const nopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const superLikeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: screenWidth - 40,
            height: screenHeight * 0.65,
            alignSelf: 'center',
          },
          cardStyle,
        ]}
      >
        <View className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden">
          {profile.layer.photos.length > 0 ? (
            <Image
              source={{ uri: profile.layer.photos[0] }}
              className="w-full h-2/3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-2/3 bg-gray-200 justify-center items-center">
              <Ionicons name="image-outline" size={60} color="#9ca3af" />
            </View>
          )}

          <View className="flex-1 p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-bold text-gray-900">
                {profile.display_name}, {profile.age}
              </Text>
              <View className="bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-700 font-medium capitalize">
                  {profile.layer.layer_type}
                </Text>
              </View>
            </View>

            <Text className="text-gray-600 mb-3">{profile.layer.tagline}</Text>

            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={16} color="#9333ea" />
              <Text className="text-purple-600 ml-2 font-medium">
                {profile.hiddenLayersCount} hidden layers
              </Text>
            </View>
          </View>

          <Animated.View
            style={[likeStyle]}
            className="absolute top-20 right-8 bg-green-500 px-4 py-2 rounded-lg transform rotate-12"
          >
            <Text className="text-white font-bold text-2xl">LIKE</Text>
          </Animated.View>

          <Animated.View
            style={[nopeStyle]}
            className="absolute top-20 left-8 bg-red-500 px-4 py-2 rounded-lg transform -rotate-12"
          >
            <Text className="text-white font-bold text-2xl">NOPE</Text>
          </Animated.View>

          <Animated.View
            style={[superLikeStyle]}
            className="absolute top-20 self-center bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-bold text-2xl">SUPER</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}