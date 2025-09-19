import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { Message, Match, Profile, UserLayer } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessage extends Message {
  isOwn: boolean;
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [match, setMatch] = useState<Match | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (profile && matchId) {
      loadMatch();
      loadMessages();
      subscribeToMessages();
    }
  }, [profile, matchId]);

  const loadMatch = async () => {
    if (!profile || !matchId) return;

    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchData) {
        setMatch(matchData);
        
        const otherUserId = matchData.user1_id === profile.id 
          ? matchData.user2_id 
          : matchData.user1_id;
        
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
        
        if (userData) {
          setOtherUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading match:', error);
    }
  };

  const loadMessages = async () => {
    if (!profile || !matchId) return;

    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (data) {
        const formattedMessages: ChatMessage[] = data.map(msg => ({
          ...msg,
          isOwn: msg.sender_id === profile.id,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!matchId) return;

    const subscription = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new && profile) {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, {
              ...newMsg,
              isOwn: newMsg.sender_id === profile.id,
            }]);
            checkForLayerReveal(prev => prev.length + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const checkForLayerReveal = async (messageCount: number) => {
    if (!match || !profile || !otherUser) return;

    const revealThresholds = [1, 20, 50, 100];
    if (revealThresholds.includes(messageCount)) {
      // Logic for revealing layers would go here
      Alert.alert(
        'New Layer Revealed! 🎉',
        `You've discovered a new layer of ${otherUser.display_name}'s personality!`
      );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile || !matchId) return;

    setSending(true);
    try {
      await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: profile.id,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    return (
      <View
        className={`flex-row mb-3 ${item.isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <View
          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
            item.isOwn
              ? 'bg-purple-600'
              : 'bg-gray-200'
          }`}
        >
          <Text className={item.isOwn ? 'text-white' : 'text-gray-900'}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9333ea" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {otherUser?.display_name || 'Chat'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TextInput
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending || !newMessage.trim()}
            className={`w-10 h-10 rounded-full justify-center items-center ${
              sending || !newMessage.trim() ? 'bg-gray-300' : 'bg-purple-600'
            }`}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}