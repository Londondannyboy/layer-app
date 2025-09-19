import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth-context';

export default function IndexScreen() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (!profile) {
        router.replace('/auth/onboarding');
      } else {
        router.replace('/tabs');
      }
    }
  }, [user, profile, loading]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#9333ea" />
    </View>
  );
}