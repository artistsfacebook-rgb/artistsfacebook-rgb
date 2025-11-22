
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { seedDatabase } from '../services/seeder';
import { Settings, Database, X, UploadCloud, UserPlus, LogIn, Copy, Check, Facebook, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const Login: React.FC = () => {
  const { signIn, signUp, signInWithProvider, guestLogin, isLoading } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showSeeder, setShowSeeder] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else if (mode === 'SIGNUP') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        else alert("Account created! You can now login.");
      } else if (mode === 'FORGOT') {
        if (isSupabaseConfigured) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setSuccessMsg("Password reset link sent to your email.");
        } else {
            setSuccessMsg("Simulated: Password reset link sent.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setErrorMsg('');
    try {
      const { error } = await signInWithProvider(provider);
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to login with ${provider}`);
    }
  };

  const handleSeed = async () => {
      setIsSeeding(true);
      await seedDatabase();
      setIsSeeding(false);
  };

  const handleCopySQL = async () => {
      try {
          const sql = `-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- USERS TABLE
create table if not exists public.users (
  id text primary key,
  name text,
  handle text,
  avatar text,
  "coverPhoto" text,
  type text,
  location text,
  bio text,
  followers numeric default 0,
  following numeric default 0,
  "followingIds" text[] default '{}',
  
  -- New Friend System Fields
  friends text[] default '{}',
  "friendRequests" text[] default '{}',
  "sentRequests" text[] default '{}',
  "blockedUsers" text[] default '{}',
  
  -- Verification & Privacy
  "isVerified" boolean default false,
  "privacySettings" jsonb default '{"profileVisibility": "Public", "showOnlineStatus": true, "allowTagging": true}',
  "notificationSettings" jsonb default '{"emailNotifications": true, "pushNotifications": true, "types": {"likes": true, "comments": true, "follows": true, "mentions": true, "liveEvents": true, "friendRequests": true, "groups": true}}',

  "isOnline" boolean default false,
  "worksAt" text,
  website text
);
alter table public.users enable row level security;
create policy "Public users are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid()::text = id);
create policy "Users can update own profile." on public.users for update using (auth.uid()::text = id);

-- REPORTS TABLE
create table if not exists public.reports (
  id text primary key,
  "reporterId" text references public.users(id),
  "targetId" text,
  "targetType" text,
  reason text,
  status text default 'PENDING',
  timestamp numeric
);
alter table public.reports enable row level security;
create policy "Users can create reports" on public.reports for insert with check (auth.uid()::text = "reporterId");

-- POSTS TABLE
create table if not exists public.posts (
  id text primary key,
  "userId" text references public.users(id),
  content text,
  "imageUrl" text,
  "videoUrl" text,
  likes numeric default 0,
  shares numeric default 0,
  timestamp numeric,
  tags text[],
  visibility text default 'Public',
  "isEdited" boolean default false,
  "groupId" text,
  "pageId" text,
  "eventId" text,
  "pollQuestion" text,
  "pollOptions" jsonb,
  "originalPostId" text
);
alter table public.posts enable row level security;
create policy "Public posts are viewable by everyone." on public.posts for select using (true);
create policy "Users can insert their own posts." on public.posts for insert with check (auth.uid()::text = "userId");
create policy "Users can update own posts." on public.posts for update using (auth.uid()::text = "userId");

-- REELS TABLE
create table if not exists public.reels (
  id text primary key,
  "userId" text references public.users(id),
  "videoUrl" text,
  "thumbnailUrl" text,
  description text,
  likes text default '0',
  views text default '0',
  comments text default '0',
  shares text default '0',
  "audioTrack" text
);
alter table public.reels enable row level security;
create policy "Public reels are viewable by everyone." on public.reels for select using (true);
create policy "Users can insert their own reels." on public.reels for insert with check (auth.uid()::text = "userId");

-- STORIES TABLE
create table if not exists public.stories (
  id text primary key,
  "userId" text references public.users(id),
  "imageUrl" text,
  "videoUrl" text,
  "isViewed" boolean default false,
  timestamp numeric,
  duration numeric,
  viewers text[] default '{}',
  privacy text default 'Public',
  filter text,
  "textOverlay" jsonb
);
alter table public.stories enable row level security;
create policy "Public stories are viewable by everyone." on public.stories for select using (true);
create policy "Users can insert their own stories." on public.stories for insert with check (auth.uid()::text = "userId");

-- PORTFOLIO TABLE
create table if not exists public.portfolio (
  id text primary key,
  "userId" text references public.users(id),
  title text,
  description text,
  "mediaUrl" text,
  type text,
  price numeric,
  category text
);
alter table public.portfolio enable row level security;
create policy "Public portfolio is viewable by everyone." on public.portfolio for select using (true);
create policy "Users can insert/update portfolio." on public.portfolio for insert with check (true); 

-- COMMENTS TABLE
create table if not exists public.comments (
  id text primary key,
  "postId" text references public.posts(id),
  "userId" text references public.users(id),
  text text,
  timestamp numeric,
  "parentId" text
);
alter table public.comments enable row level security;
create policy "Public comments are viewable by everyone." on public.comments for select using (true);
create policy "Users can insert their own comments." on public.comments for insert with check (auth.uid()::text = "userId");

-- POST REACTIONS TABLE
create table if not exists public.post_reactions (
  id text primary key,
  "postId" text references public.posts(id),
  "userId" text references public.users(id),
  type text
);
alter table public.post_reactions enable row level security;
create policy "Everyone can view reactions" on public.post_reactions for select using (true);
create policy "Users can react" on public.post_reactions for insert with check (auth.uid()::text = "userId");
create policy "Users can remove reaction" on public.post_reactions for delete using (auth.uid()::text = "userId");

-- NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id text primary key,
  "userId" text references public.users(id),
  "actorId" text references public.users(id),
  "actorName" text,
  "actorAvatar" text,
  type text,
  text text,
  time numeric,
  read boolean default false
);
alter table public.notifications enable row level security;
create policy "Users can see their own notifications." on public.notifications for select using (auth.uid()::text = "userId");
create policy "Users can insert notifications for others." on public.notifications for insert with check (true);

-- LIVE STREAMS TABLE
create table if not exists public.live_streams (
  id text primary key,
  "hostId" text references public.users(id),
  title text,
  status text default 'LIVE', -- LIVE, ENDED
  viewers numeric default 0,
  "startedAt" numeric,
  "endedAt" numeric,
  "thumbnailUrl" text,
  privacy text default 'Public',
  "recordingUrl" text
);
alter table public.live_streams enable row level security;
create policy "Everyone can view live streams" on public.live_streams for select using (true);
create policy "Users can create streams" on public.live_streams for insert with check (auth.uid()::text = "hostId");
create policy "Hosts can update their streams" on public.live_streams for update using (auth.uid()::text = "hostId");

-- LIVE COMMENTS TABLE
create table if not exists public.live_comments (
  id text primary key,
  "streamId" text references public.live_streams(id),
  "userId" text references public.users(id),
  text text,
  timestamp numeric
);
alter table public.live_comments enable row level security;
create policy "Everyone can view comments" on public.live_comments for select using (true);
create policy "Users can comment" on public.live_comments for insert with check (auth.uid()::text = "userId");

-- GROUPS TABLE
create table if not exists public.groups (
  id text primary key,
  name text,
  description text,
  "coverImage" text,
  "memberCount" numeric default 1,
  privacy text default 'Public',
  "creatorId" text references public.users(id),
  admins text[] default '{}',
  members text[] default '{}',
  "joinRequests" text[] default '{}'
);
alter table public.groups enable row level security;
create policy "Everyone can view public groups" on public.groups for select using (true);
create policy "Users can create/update groups" on public.groups for all using (true);

-- PAGES TABLE
create table if not exists public.pages (
  id text primary key,
  name text,
  category text,
  avatar text,
  "coverImage" text,
  followers numeric default 0,
  description text
);
alter table public.pages enable row level security;
create policy "Everyone can view pages" on public.pages for select using (true);
create policy "Users can create pages" on public.pages for insert with check (true);

-- EVENTS TABLE
create table if not exists public.events (
  id text primary key,
  title text,
  date text,
  location text,
  image text,
  "interestedCount" numeric default 0,
  type text,
  host text,
  "groupId" text references public.groups(id),
  "going" text[] default '{}',
  "interested" text[] default '{}'
);
alter table public.events enable row level security;
create policy "Everyone can view events" on public.events for select using (true);
create policy "Users can create events" on public.events for insert with check (true);

-- CHATS TABLE
create table if not exists public.chats (
  id text primary key,
  type text,
  name text,
  image text,
  "participantIds" text[],
  "updatedAt" numeric
);
alter table public.chats enable row level security;
create policy "Users can view their chats" on public.chats for select using (auth.uid()::text = any("participantIds"));
create policy "Users can create chats" on public.chats for insert with check (true);
create policy "Users can update chats" on public.chats for update using (auth.uid()::text = any("participantIds"));

-- MESSAGES TABLE
create table if not exists public.messages (
  id text primary key,
  "chatId" text references public.chats(id),
  "senderId" text references public.users(id),
  content text,
  "mediaUrl" text,
  "mediaType" text,
  timestamp numeric,
  "readBy" text[]
);
alter table public.messages enable row level security;
create policy "Users can view messages in their chats" on public.messages for select using (
  exists (select 1 from public.chats where id = messages."chatId" and auth.uid()::text = any("participantIds"))
);
create policy "Users can insert messages" on public.messages for insert with check (auth.uid()::text = "senderId");

-- AD CAMPAIGNS TABLE
create table if not exists public.ad_campaigns (
  id text primary key,
  "userId" text references public.users(id),
  name text,
  budget numeric,
  status text,
  "startDate" numeric,
  "endDate" numeric
);
alter table public.ad_campaigns enable row level security;
create policy "Users can manage own campaigns" on public.ad_campaigns for all using (auth.uid()::text = "userId");

-- ADS TABLE
create table if not exists public.ads (
  id text primary key,
  "campaignId" text references public.ad_campaigns(id),
  "userId" text references public.users(id),
  title text,
  content text,
  "mediaUrl" text,
  "mediaType" text,
  "ctaLink" text,
  "ctaText" text,
  impressions numeric default 0,
  clicks numeric default 0,
  spend numeric default 0
);
alter table public.ads enable row level security;
create policy "Users can manage own ads" on public.ads for all using (auth.uid()::text = "userId");
create policy "Everyone can see ads" on public.ads for select using (true);
`;
          await navigator.clipboard.writeText(sql);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          alert("SQL Schema copied! Paste this in your Supabase SQL Editor.");
      } catch (err) {
          console.error("Failed to copy", err);
      }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row items-center justify-center p-4 md:p-20 gap-10 md:gap-20 relative">
      
      {/* Dev Tools Toggle */}
      <button 
        onClick={() => setShowSeeder(!showSeeder)}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <Database size={16} />
        {isSupabaseConfigured ? <span className="text-green-600">Cloud Active</span> : 'Guest Mode'}
      </button>

      {/* Seeder Modal */}
      {showSeeder && isSupabaseConfigured && (
         <div className="absolute top-16 right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200 w-64 z-50 animate-in fade-in zoom-in duration-200">
             <h4 className="font-bold mb-2 text-sm">Developer Tools</h4>
             <button onClick={handleCopySQL} className="w-full mb-2 bg-gray-100 text-gray-700 font-bold py-2 rounded text-xs hover:bg-gray-200 flex items-center justify-center gap-2">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />} 
                {copied ? 'Copied!' : 'Copy SQL Schema'}
             </button>
             <button onClick={handleSeed} disabled={isSeeding} className="w-full bg-purple-600 text-white font-bold py-2 rounded text-xs hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50">
                <UploadCloud size={14} /> {isSeeding ? 'Seeding...' : 'Seed Mock Data'}
             </button>
         </div>
      )}

      {/* Branding */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg">
        <h1 className="text-5xl md:text-6xl font-bold text-blue-600 mb-4">Artists Facebook</h1>
        <p className="text-2xl md:text-3xl text-gray-700 leading-snug">
          Connect with artists, book studios, and showcase your masterpieces.
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex border-b border-gray-200 mb-6">
           <button className={`flex-1 pb-3 text-center font-bold ${mode === 'LOGIN' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => { setMode('LOGIN'); setErrorMsg(''); }}>Log In</button>
           <button className={`flex-1 pb-3 text-center font-bold ${mode === 'SIGNUP' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`} onClick={() => { setMode('SIGNUP'); setErrorMsg(''); }}>Sign Up</button>
        </div>

        {errorMsg && <div className="bg-red-100 text-red-600 text-sm p-3 rounded mb-4 text-center flex items-center justify-center gap-2"><AlertCircle size={16} />{errorMsg}</div>}
        {successMsg && <div className="bg-green-100 text-green-600 text-sm p-3 rounded mb-4 text-center flex items-center justify-center gap-2"><Check size={16} />{successMsg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'SIGNUP' && (
             <div className="relative">
                 <UserPlus className="absolute left-3 top-3 text-gray-400" size={20} />
                 <input type="text" placeholder="Full Name" className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
             </div>
          )}
          
          <input type="email" placeholder="Email Address" className="p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
          
          {mode !== 'FORGOT' && (
              <input type="password" placeholder="Password" className="p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
          
          <button type="submit" disabled={loading} className="bg-blue-600 text-white text-lg font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
            {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Log In' : mode === 'SIGNUP' ? 'Create Account' : 'Reset Password')}
          </button>
        </form>
        
        {mode === 'LOGIN' && (
             <button onClick={() => setMode('FORGOT')} className="text-blue-500 hover:underline text-sm mt-4 text-center">Forgot Password?</button>
        )}
        {mode === 'FORGOT' && (
             <button onClick={() => setMode('LOGIN')} className="text-gray-500 hover:underline text-sm mt-4 text-center">Back to Login</button>
        )}

        {mode !== 'FORGOT' && (
          <>
            <div className="flex flex-col gap-3 mt-4">
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 w-full border border-gray-300 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Continue with Google
                </button>
                <button onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center gap-2 w-full bg-[#1877F2] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1864D9] transition-colors">
                    <Facebook className="w-5 h-5 fill-white" />
                    Continue with Facebook
                </button>
            </div>

            <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button onClick={guestLogin} className="bg-[#42b72a] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#36a420] transition-colors">Continue as Guest</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
