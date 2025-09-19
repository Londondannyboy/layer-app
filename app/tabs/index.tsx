import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeCard from '../../components/SwipeCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { Profile, UserLayer } from '../../types/database';

interface SwipeableProfile extends Profile {
  layer: UserLayer;
  hiddenLayersCount: number;
}

export default function DiscoverScreen() {
  const { profile: currentUserProfile } = useAuth();
  const [candidates, setCandidates] = useState<SwipeableProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, [currentUserProfile]);

  const loadCandidates = async () => {
    if (!currentUserProfile) return;

    try {
      // Get user's layers
      const { data: userLayers } = await supabase
        .from('user_layers')
        .select('layer_category')
        .eq('profile_id', currentUserProfile.id);

      const userCategories = userLayers?.map(l => l.layer_category) || [];

      // Get already swiped profiles
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', currentUserProfile.id);

      const swipedIds = swipes?.map(s => s.swiped_id) || [];

      // Find candidates with matching layers
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          user_layers (*)
        `)
        .neq('id', currentUserProfile.id)
        .not('id', 'in', `(${swipedIds.join(',')})`);

      if (profiles) {
        const swipeableProfiles: SwipeableProfile[] = [];
        
        for (const profile of profiles) {
          const layers = profile.user_layers as UserLayer[];
          const matchingLayer = layers.find(l => 
            userCategories.includes(l.layer_category) && l.is_primary
          ) || layers[0];

          if (matchingLayer) {
            swipeableProfiles.push({
              ...profile,
              layer: matchingLayer,
              hiddenLayersCount: layers.length - 1,
            });
          }
        }

        setCandidates(swipeableProfiles);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'super') => {
    if (!currentUserProfile || !candidates[currentIndex]) return;

    const swipedProfile = candidates[currentIndex];
    
    try {
      // Record swipe
      await supabase.from('swipes').insert({
        swiper_id: currentUserProfile.id,
        swiped_id: swipedProfile.id,
        layer_shown: swipedProfile.layer.layer_type,
        decision: direction,
      });

      // Check for match if right or super
      if (direction === 'right' || direction === 'super') {
        const { data: theirSwipe } = await supabase
          .from('swipes')
          .select()
          .eq('swiper_id', swipedProfile.id)
          .eq('swiped_id', currentUserProfile.id)
          .in('decision', ['right', 'super'])
          .single();

        if (theirSwipe) {
          // Create match!
          await supabase.from('matches').insert({
            user1_id: currentUserProfile.id,
            user2_id: swipedProfile.id,
            matched_layer: swipedProfile.layer.layer_category,
            revealed_layers: {
              [currentUserProfile.id]: [swipedProfile.layer.layer_type],
              [swipedProfile.id]: [],
            },
          });

          Alert.alert('It\'s a Match! 🎉', `You matched with ${swipedProfile.display_name}!`);
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }

    // Move to next candidate
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9333ea" />
        </View>
      </SafeAreaView>
    );
  }

  if (candidates.length === 0 || currentIndex >= candidates.length) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">No more profiles</Text>
          <Text className="text-gray-600 text-center">
            Check back later for more potential matches!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-2xl font-bold text-purple-600">Layer</Text>
        </View>

        <View className="flex-1 justify-center">
          {candidates.slice(currentIndex, currentIndex + 3).map((candidate, index) => (
            <SwipeCard
              key={candidate.id}
              profile={candidate}
              onSwipe={handleSwipe}
              isActive={index === 0}
            />
          ))}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}