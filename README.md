# Layer - Dating App

A dating app that reveals personality layers progressively, solving the "Phoebe Problem" from Friends.

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the following schema:

```sql
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
```

### 2. Environment Variables

1. Get your Supabase URL and Anon Key from Project Settings > API
2. Update the `.env` file with your credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the App

```bash
# Install dependencies (if not already done)
npm install

# Start the app
npm start

# Or for specific platforms:
npm run ios     # iOS
npm run android # Android
```

## Testing the App

### With Expo Go

1. Install Expo Go on your phone from App Store or Google Play
2. Scan the QR code shown in the terminal
3. The app will load on your device

### Testing Flow

1. **Sign Up**: Enter email to receive magic link
2. **Onboarding**: 
   - Enter name, age, bio
   - Select 3-5 personality layers
   - Choose privacy strategy
3. **Swipe**: Browse profiles, swipe right to like
4. **Match**: When both users swipe right, it's a match!
5. **Chat**: Send messages to reveal more layers
6. **Profile**: Manage your layers and settings

### Creating Test Users

To test matching, you'll need at least 2 accounts:
1. Sign up with different email addresses
2. Complete onboarding with overlapping layer categories
3. Each account can then swipe on the other

## Features

- ✅ Email authentication with magic links
- ✅ Multi-step onboarding
- ✅ Swipeable card interface
- ✅ Real-time matching
- ✅ Chat with progressive layer reveals
- ✅ Profile management
- ✅ Privacy strategies

## Layer System

Users select from 6 categories:
- **Movement**: Runner, Cyclist, Yogi
- **Creative**: Artist, Musician, Writer
- **Fitness**: Gym, CrossFit, Climbing
- **Intellectual**: Reader, Gamer, Philosopher
- **Nature**: Hiker, Surfer, Gardener
- **Performer**: Theater, Comedy, Singer

Layers are revealed progressively:
- Initially: Only matched layer visible
- After 1 message: +1 layer revealed
- After 20 messages: +1 layer revealed
- After 50 messages: +1 layer revealed
- After 100 messages: All layers visible

## Troubleshooting

### App won't start
- Make sure all dependencies are installed: `npm install`
- Clear cache: `npx expo start -c`

### Authentication issues
- Check Supabase credentials in `.env`
- Verify email settings in Supabase dashboard

### Database errors
- Ensure all tables are created with the correct schema
- Check RLS policies are enabled
- Verify Supabase project is not paused

## Next Steps

- Add photo upload functionality
- Implement push notifications
- Add video chat
- Create premium features
- Deploy to app stores