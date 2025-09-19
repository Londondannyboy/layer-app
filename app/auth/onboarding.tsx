import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../lib/onboarding-store';
import { LayerCategory, LayerType } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

const LAYER_OPTIONS = {
  movement: [
    { type: 'runner', label: 'Runner', tagline: 'Marathon enthusiast' },
    { type: 'cyclist', label: 'Cyclist', tagline: 'Weekend rider' },
    { type: 'yogi', label: 'Yogi', tagline: 'Mindful movement' },
  ],
  creative: [
    { type: 'artist', label: 'Artist', tagline: 'Visual creator' },
    { type: 'musician', label: 'Musician', tagline: 'Music lover' },
    { type: 'writer', label: 'Writer', tagline: 'Storyteller' },
  ],
  fitness: [
    { type: 'gym', label: 'Gym', tagline: 'Fitness focused' },
    { type: 'crossfit', label: 'CrossFit', tagline: 'High intensity' },
    { type: 'climbing', label: 'Climbing', tagline: 'Rock climber' },
  ],
  intellectual: [
    { type: 'reader', label: 'Reader', tagline: 'Book lover' },
    { type: 'gamer', label: 'Gamer', tagline: 'Gaming enthusiast' },
    { type: 'philosopher', label: 'Philosopher', tagline: 'Deep thinker' },
  ],
  nature: [
    { type: 'hiker', label: 'Hiker', tagline: 'Trail explorer' },
    { type: 'surfer', label: 'Surfer', tagline: 'Wave rider' },
    { type: 'gardener', label: 'Gardener', tagline: 'Plant parent' },
  ],
  performer: [
    { type: 'theater', label: 'Theater', tagline: 'Stage performer' },
    { type: 'comedy', label: 'Comedy', tagline: 'Stand-up comic' },
    { type: 'singer', label: 'Singer', tagline: 'Vocalist' },
  ],
};

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const {
    currentStep,
    displayName,
    age,
    bio,
    selectedLayers,
    privacyStrategy,
    setDisplayName,
    setAge,
    setBio,
    addLayer,
    removeLayer,
    setPrivacyStrategy,
    nextStep,
    previousStep,
  } = useOnboardingStore();

  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: displayName,
          age: age,
          bio: bio,
          privacy_strategy: privacyStrategy,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create user layers
      const layerInserts = selectedLayers.map((layer, index) => ({
        profile_id: profile.id,
        layer_category: layer.category,
        layer_type: layer.type,
        tagline: layer.tagline,
        photos: layer.photos,
        is_primary: index === 0,
      }));

      const { error: layersError } = await supabase
        .from('user_layers')
        .insert(layerInserts);

      if (layersError) throw layersError;

      await refreshProfile();
      router.replace('/tabs');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="flex-1 px-6 pt-8">
            <Text className="text-3xl font-bold text-gray-900 mb-4">Welcome to Layer</Text>
            <Text className="text-lg text-gray-600 mb-8">
              Unlike other dating apps, we reveal personality layers progressively. You'll start by seeing just one aspect of a potential match, then discover more as you engage.
            </Text>
            <Text className="text-lg text-gray-600 mb-8">
              Think of it as solving the "Phoebe Problem" - you'll know if that hot fireman also paints, or if the sensitive teacher has abs!
            </Text>
            <TouchableOpacity
              onPress={nextStep}
              className="bg-purple-600 py-3 px-6 rounded-lg"
            >
              <Text className="text-white text-center font-semibold text-base">Get Started</Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View className="flex-1 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Basic Information</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Display Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Age</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Your age"
                value={age?.toString() || ''}
                onChangeText={(text) => setAge(parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Bio</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="Tell us about yourself"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            </View>

            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={previousStep}
                className="flex-1 border border-purple-600 py-3 px-6 rounded-lg"
              >
                <Text className="text-purple-600 text-center font-semibold text-base">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextStep}
                disabled={!displayName || !age}
                className={`flex-1 py-3 px-6 rounded-lg ${
                  !displayName || !age ? 'bg-gray-300' : 'bg-purple-600'
                }`}
              >
                <Text className="text-white text-center font-semibold text-base">Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <ScrollView className="flex-1 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Choose Your Layers</Text>
            <Text className="text-gray-600 mb-6">Select 3-5 aspects that define you</Text>
            
            {Object.entries(LAYER_OPTIONS).map(([category, options]) => (
              <View key={category} className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                  {category}
                </Text>
                <View className="space-y-2">
                  {options.map((option) => {
                    const isSelected = selectedLayers.some(
                      (l) => l.category === category && l.type === option.type
                    );
                    return (
                      <TouchableOpacity
                        key={option.type}
                        onPress={() => {
                          if (isSelected) {
                            const index = selectedLayers.findIndex(
                              (l) => l.category === category && l.type === option.type
                            );
                            removeLayer(index);
                          } else if (selectedLayers.length < 5) {
                            addLayer({
                              category: category as LayerCategory,
                              type: option.type as LayerType,
                              tagline: option.tagline,
                              photos: [],
                            });
                          }
                        }}
                        className={`border rounded-lg px-4 py-3 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Text className="text-gray-900 font-medium">{option.label}</Text>
                        <Text className="text-gray-600 text-sm">{option.tagline}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View className="flex-row space-x-4 mb-8">
              <TouchableOpacity
                onPress={previousStep}
                className="flex-1 border border-purple-600 py-3 px-6 rounded-lg"
              >
                <Text className="text-purple-600 text-center font-semibold text-base">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextStep}
                disabled={selectedLayers.length < 3}
                className={`flex-1 py-3 px-6 rounded-lg ${
                  selectedLayers.length < 3 ? 'bg-gray-300' : 'bg-purple-600'
                }`}
              >
                <Text className="text-white text-center font-semibold text-base">Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <View className="flex-1 px-6 pt-8">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Privacy Strategy</Text>
            <Text className="text-gray-600 mb-8">How quickly should your layers be revealed?</Text>
            
            {[
              { value: 'mysterious', label: 'Mysterious', desc: 'Reveal layers slowly' },
              { value: 'balanced', label: 'Balanced', desc: 'Standard reveal pace' },
              { value: 'open', label: 'Open', desc: 'Reveal layers quickly' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPrivacyStrategy(option.value as any)}
                className={`border rounded-lg px-4 py-4 mb-3 ${
                  privacyStrategy === option.value
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <Text className="text-gray-900 font-medium text-base">{option.label}</Text>
                <Text className="text-gray-600 text-sm">{option.desc}</Text>
              </TouchableOpacity>
            ))}

            <View className="flex-1" />
            
            <View className="flex-row space-x-4 mb-8">
              <TouchableOpacity
                onPress={previousStep}
                className="flex-1 border border-purple-600 py-3 px-6 rounded-lg"
              >
                <Text className="text-purple-600 text-center font-semibold text-base">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleComplete}
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg ${
                  loading ? 'bg-gray-300' : 'bg-purple-600'
                }`}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {loading ? 'Creating Profile...' : 'Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderStep()}
    </SafeAreaView>
  );
}