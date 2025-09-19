import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { Match, Profile, Message } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

interface MatchWithProfile extends Match {
  otherUser: Profile;
  lastMessage?: Message;
}

export default function MatchesScreen() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadMatches();
      subscribeToMatches();
    }
  }, [profile]);

  const loadMatches = async () => {
    if (!profile) return;

    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          user1:user1_id(*)
        `)
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`);

      if (matchData) {
        const matchesWithProfiles: MatchWithProfile[] = [];
        
        for (const match of matchData) {
          const otherUserId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
          
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (otherUser) {
            matchesWithProfiles.push({
              ...match,
              otherUser,
              lastMessage: lastMessage || undefined,
            });
          }
        }

        setMatches(matchesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMatches = () => {
    if (!profile) return;

    const subscription = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${profile.id}`,
        },
        () => {
          loadMatches();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${profile.id}`,
        },
        () => {
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const renderMatch = ({ item }: { item: MatchWithProfile }) => {
    const revealedCount = Object.keys(item.revealed_layers?.[profile?.id || ''] || {}).length;
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}`)}
        className="flex-row items-center p-4 bg-white border-b border-gray-200"
      >
        <View className="w-16 h-16 rounded-full bg-gray-300 mr-3 justify-center items-center">
          <Ionicons name="person" size={30} color="#9ca3af" />
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.otherUser.display_name}
            </Text>
            {revealedCount > 0 && (
              <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-purple-700">
                  {revealedCount} layers revealed
                </Text>
              </View>
            )}
          </View>
          
          {item.lastMessage ? (
            <Text className="text-gray-600" numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
          ) : (
            <Text className="text-gray-400 italic">Start a conversation</Text>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
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
      <View className="px-4 py-3 border-b border-gray-200 bg-white">
        <Text className="text-2xl font-bold text-gray-900">Matches</Text>
      </View>

      {matches.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="heart-outline" size={60} color="#9ca3af" />
          <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
            No matches yet
          </Text>
          <Text className="text-gray-600 text-center">
            Keep swiping to find your perfect match!
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}