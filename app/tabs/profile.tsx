import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { UserLayer } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [layers, setLayers] = useState<UserLayer[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio || '');
      loadLayers();
    }
  }, [profile]);

  const loadLayers = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('user_layers')
        .select('*')
        .eq('profile_id', profile.id)
        .order('is_primary', { ascending: false });

      if (data) {
        setLayers(data);
      }
    } catch (error) {
      console.error('Error loading layers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const setPrimaryLayer = async (layerId: string) => {
    if (!profile) return;

    try {
      // Remove primary from all layers
      await supabase
        .from('user_layers')
        .update({ is_primary: false })
        .eq('profile_id', profile.id);

      // Set new primary
      await supabase
        .from('user_layers')
        .update({ is_primary: true })
        .eq('id', layerId);

      loadLayers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update primary layer');
    }
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <TouchableOpacity
            onPress={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
          >
            <Text className="text-purple-600 font-medium">
              {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white mt-2 px-4 py-4">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Display Name</Text>
            {editing ? (
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={displayName}
                onChangeText={setDisplayName}
              />
            ) : (
              <Text className="text-gray-900 text-base">{displayName}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Age</Text>
            <Text className="text-gray-900 text-base">{profile?.age || 'Not set'}</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Bio</Text>
            {editing ? (
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text className="text-gray-900 text-base">{bio || 'No bio yet'}</Text>
            )}
          </View>
        </View>

        <View className="mt-4 bg-white">
          <View className="px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Your Layers</Text>
            <Text className="text-sm text-gray-600">Tap to set as primary layer</Text>
          </View>

          {layers.map((layer) => (
            <TouchableOpacity
              key={layer.id}
              onPress={() => setPrimaryLayer(layer.id)}
              className={`px-4 py-3 border-b border-gray-200 flex-row items-center justify-between ${
                layer.is_primary ? 'bg-purple-50' : 'bg-white'
              }`}
            >
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-medium text-gray-900 capitalize">
                    {layer.layer_type}
                  </Text>
                  {layer.is_primary && (
                    <View className="ml-2 bg-purple-600 px-2 py-0.5 rounded">
                      <Text className="text-xs text-white">Primary</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-600">{layer.tagline}</Text>
                <Text className="text-xs text-gray-500 capitalize">
                  Category: {layer.layer_category}
                </Text>
              </View>
              <Ionicons
                name={layer.is_primary ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={layer.is_primary ? '#9333ea' : '#9ca3af'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-4 bg-white">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Privacy Strategy',
                `Your current strategy: ${profile?.privacy_strategy || 'balanced'}\n\nThis controls how quickly your layers are revealed to matches.`
              );
            }}
            className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-base text-gray-900">Privacy Strategy</Text>
              <Text className="text-sm text-gray-600 capitalize">
                {profile?.privacy_strategy || 'balanced'}
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="mx-4 mt-6 mb-8 bg-red-500 py-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}