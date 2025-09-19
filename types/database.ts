export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number | null;
  bio: string | null;
  privacy_strategy: 'mysterious' | 'balanced' | 'open';
  created_at: string;
}

export type LayerCategory = 'movement' | 'creative' | 'fitness' | 'intellectual' | 'nature' | 'performer';

export type LayerType = 
  | 'runner' | 'cyclist' | 'yogi'
  | 'artist' | 'musician' | 'writer'
  | 'gym' | 'crossfit' | 'climbing'
  | 'reader' | 'gamer' | 'philosopher'
  | 'hiker' | 'surfer' | 'gardener'
  | 'theater' | 'comedy' | 'singer';

export interface UserLayer {
  id: string;
  profile_id: string;
  layer_category: LayerCategory;
  layer_type: LayerType;
  tagline: string | null;
  photos: string[];
  is_primary: boolean;
  created_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  layer_shown: string;
  decision: 'left' | 'right' | 'super';
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_layer: string;
  revealed_layers: Record<string, any>;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Profile>;
      };
      user_layers: {
        Row: UserLayer;
        Insert: Omit<UserLayer, 'id' | 'created_at'>;
        Update: Partial<UserLayer>;
      };
      swipes: {
        Row: Swipe;
        Insert: Omit<Swipe, 'id' | 'created_at'>;
        Update: Partial<Swipe>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at'>;
        Update: Partial<Match>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Message>;
      };
    };
  };
}