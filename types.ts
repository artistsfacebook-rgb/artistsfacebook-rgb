
export interface User {
  id: string;
  name: string;
  avatar: string;
  coverPhoto?: string;
  handle: string;
  type: 'Artist' | 'Studio' | 'Collector';
  location: string;
  bio?: string;
  isOnline?: boolean;
  followers?: number;
  following?: number;
  followingIds: string[]; 
  
  // New Friend System
  friends: string[]; 
  friendRequests: string[]; 
  sentRequests: string[]; 
  
  // Privacy & Security
  blockedUsers: string[]; // IDs of users blocked by this user
  isVerified?: boolean;
  privacySettings?: {
      profileVisibility: 'Public' | 'Friends' | 'Private';
      showOnlineStatus: boolean;
      allowTagging: boolean;
  };

  // Notification Settings
  notificationSettings?: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      types: {
          likes: boolean;
          comments: boolean;
          follows: boolean;
          mentions: boolean;
          liveEvents: boolean;
          friendRequests: boolean;
          groups: boolean;
      }
  };

  worksAt?: string;
  website?: string;
  portfolio?: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  mediaUrl: string;
  type: 'image' | 'video';
  price?: number;
  category: string;
}

export interface Comment {
  id: string;
  postId?: string;
  userId: string;
  user: User;
  text: string;
  timestamp: number;
  parentId?: string; 
  replies?: Comment[];
}

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface Reaction {
    id: string;
    userId: string;
    type: ReactionType;
}

export interface PollOption {
    id: string;
    text: string;
    votes: string[]; 
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number; 
  reactions?: Reaction[]; 
  comments: Comment[];
  shares?: number;
  timestamp: number;
  tags: string[];
  isEdited?: boolean;
  visibility: 'Public' | 'Friends' | 'Private';
  
  originalPostId?: string;
  originalPost?: Post;

  pollQuestion?: string;
  pollOptions?: PollOption[];
  
  groupId?: string;
  pageId?: string;
  eventId?: string;
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  isViewed: boolean;
  timestamp: number;
  
  viewers?: string[]; 
  privacy?: 'Public' | 'Friends';
  filter?: string; 
  textOverlay?: {
      text: string;
      color: string;
      yPosition: number;
  };
  musicTrack?: string;
}

export interface Reel {
  id: string;
  userId: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  likes: string;
  comments: string;
  shares: string;
  views: string;
  audioTrack: string;
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'LIVE' | 'FRIEND_REQ' | 'FRIEND_ACCEPT' | 'GROUP_INVITE' | 'MESSAGE';
  userId: string; 
  actorId: string; 
  actorName: string;
  actorAvatar: string;
  text: string;
  time: number;
  read: boolean;
  link?: string;
}

export interface Studio {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  pricePerHour: number;
  equipment: string[];
  available: boolean;
}

export interface Product {
  id: string;
  artistId: string;
  artist: User;
  title: string;
  image: string;
  price: number;
  description: string;
}

export interface Group {
  id: string;
  name: string;
  coverImage: string;
  memberCount: number;
  privacy: 'Public' | 'Private' | 'Secret';
  description: string;
  creatorId: string;
  admins: string[];
  members: string[];
  joinRequests: string[]; 
}

export interface GroupFile {
  id: string;
  groupId: string;
  userId: string;
  user?: User;
  name: string;
  url: string;
  type: string;
  size: number;
  timestamp: number;
}

export interface Page {
  id: string;
  name: string;
  category: string;
  avatar: string;
  coverImage: string;
  followers: number;
  description: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  interestedCount: number;
  type: 'Online' | 'In-Person';
  host: string;
  groupId?: string;
}

export interface LiveStream {
  id: string;
  title: string;
  hostUser: User;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
  videoUrl?: string;
  recordingUrl?: string;
  startedAt?: number;
  endedAt?: number;
  privacy: 'Public' | 'Private';
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name?: string; 
  image?: string; 
  participantIds: string[];
  participants?: User[]; 
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string; 
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  timestamp: number;
  readBy: string[]; 
  reactions?: Record<string, string>; 
  replyToId?: string;
  isSender?: boolean; 
  status?: 'sent' | 'delivered' | 'read'; 
}

export interface AdCampaign {
  id: string;
  userId: string;
  name: string;
  budget: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate: number;
  endDate?: number;
}

export interface Ad {
  id: string;
  campaignId: string;
  userId: string;
  title: string;
  content: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  ctaLink: string;
  ctaText: string; 
  impressions: number;
  clicks: number;
  spend: number;
  user?: User; 
}

export interface Report {
    id: string;
    reporterId: string;
    targetId: string; // User ID, Post ID, etc.
    targetType: 'USER' | 'POST' | 'GROUP' | 'COMMENT';
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    timestamp: number;
}

export enum ViewState {
  FEED = 'FEED',
  STUDIOS = 'STUDIOS',
  MARKETPLACE = 'MARKETPLACE',
  PROFILE = 'PROFILE',
  WATCH = 'WATCH',
  GROUPS = 'GROUPS',
  PAGES = 'PAGES',
  EVENTS = 'EVENTS',
  LIVE = 'LIVE',
  MESSENGER = 'MESSENGER',
  ADS_MANAGER = 'ADS_MANAGER',
  SEARCH = 'SEARCH',
  PRIVACY = 'PRIVACY',
  SAVED = 'SAVED',
  ADMIN = 'ADMIN'
}
