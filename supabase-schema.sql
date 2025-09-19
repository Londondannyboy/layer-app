-- Layer App Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  display_name TEXT NOT NULL,
  age INTEGER,
  bio TEXT,
  privacy_strategy TEXT DEFAULT 'balanced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Layers (3-5 personality dimensions per user)
CREATE TABLE user_layers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  layer_category TEXT NOT NULL,
  layer_type TEXT NOT NULL,
  tagline TEXT,
  photos TEXT[],
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swipes
CREATE TABLE swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID REFERENCES profiles(id),
  swiped_id UUID REFERENCES profiles(id),
  layer_shown TEXT NOT NULL,
  decision TEXT CHECK (decision IN ('left', 'right', 'super')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

-- Matches
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  matched_layer TEXT NOT NULL,
  revealed_layers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own layers" ON user_layers FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can see own swipes" ON swipes FOR SELECT USING (swiper_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create swipes" ON swipes FOR INSERT WITH CHECK (swiper_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can see own matches" ON matches FOR SELECT USING (user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can see match messages" ON messages FOR SELECT USING (match_id IN (SELECT id FROM matches WHERE user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Allow users to see other profiles for matching
CREATE POLICY "Users can see other profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can see other layers" ON user_layers FOR SELECT USING (true);