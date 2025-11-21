
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
  followingIds: string[]; // Array of user IDs this user follows
  worksAt?: string;
  website?: string;
  portfolio?: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  type: 'image' | 'video';
  price?: number;
  category: string;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number;
  comments: Comment[];
  shares?: number;
  timestamp: number;
  tags: string[];
  isEdited?: boolean;
  visibility: 'Public' | 'Friends' | 'Private';
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  imageUrl?: string;
  videoUrl?: string; // Added for video stories
  duration?: number; // Duration in milliseconds
  isViewed: boolean;
  timestamp: number;
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
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION';
  user: User;
  text: string;
  time: string;
  read: boolean;
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
  privacy: 'Public' | 'Private';
  description: string;
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
}

export interface LiveStream {
  id: string;
  title: string;
  hostUser: User;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
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
  LIVE = 'LIVE'
}
