
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Post, Story, PortfolioItem, Reel, Comment } from '../types';
import { openDB } from 'idb';

const DB_NAME = 'ArtistsFacebookDB_v3';
const STORES = {
  USERS: 'users',
  POSTS: 'posts',
  STORIES: 'stories',
  PORTFOLIO: 'portfolio',
  REELS: 'reels'
};

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.USERS)) db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.POSTS)) db.createObjectStore(STORES.POSTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.STORIES)) db.createObjectStore(STORES.STORIES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.PORTFOLIO)) db.createObjectStore(STORES.PORTFOLIO, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.REELS)) db.createObjectStore(STORES.REELS, { keyPath: 'id' });
    },
  });
};

// --- User Operations ---
export const saveUser = async (user: User): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      const { portfolio, ...userData } = user;
      const { error } = await supabase.from('users').upsert(userData);
      if (error) throw error;
    } else {
      const db = await initDB();
      await db.put(STORES.USERS, user);
    }
  } catch (error) {
    console.error('Error saving user:', error);
    // Fallback logic
    if (isSupabaseConfigured) {
        try {
            const db = await initDB();
            await db.put(STORES.USERS, user);
        } catch (fbError) {
            console.error("Fallback save failed:", fbError);
        }
    }
  }
};

export const getUser = async (id: string): Promise<User | undefined> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (!error && data) return data as User;
    }
    
    const db = await initDB();
    return await db.get(STORES.USERS, id);
  } catch (error) {
    console.warn('Error fetching user:', error);
    if (isSupabaseConfigured) {
         try {
            const db = await initDB();
            return await db.get(STORES.USERS, id);
         } catch (e) { return undefined; }
    }
    return undefined;
  }
};

// --- Post Operations ---
export const savePosts = async (posts: Post[]): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      // For Supabase, we save each post individually.
      // Ideally, we should check which posts are new/updated, but for now we act on the array passed.
      // WARNING: In a real app, we wouldn't dump the whole array. We'll just save the new one.
      // Here we just return because individual create/update logic should be handled in Feed.tsx calling specific API methods.
      // But to keep compatibility with existing calls:
      for (const post of posts) {
         const { user, comments, ...postData } = post;
         // 1. Save Post
         await supabase.from('posts').upsert(postData);
         
         // 2. Save Comments (if any new ones)
         if (comments && comments.length > 0) {
             for (const comment of comments) {
                 await supabase.from('comments').upsert({
                     id: comment.id,
                     "postId": post.id,
                     "userId": comment.userId,
                     text: comment.text,
                     timestamp: comment.timestamp
                 });
             }
         }
      }
    } else {
      const db = await initDB();
      const tx = db.transaction(STORES.POSTS, 'readwrite');
      await Promise.all(posts.map(post => tx.store.put(post)));
      await tx.done;
    }
  } catch (error) {
    console.error('Error saving posts:', error);
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    if (isSupabaseConfigured) {
      // Fetch Posts with User details and Comments (and Comment User details)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!userId(*),
          comments(*, user:users!userId(*))
        `)
        .order('timestamp', { ascending: false });

      if (!error && data) {
          // Transform if necessary (Supabase returns null for missing relations, we need matching types)
          return data as Post[];
      }
    }
    
    const db = await initDB();
    const posts = await db.getAll(STORES.POSTS);
    return posts.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// --- Story Operations ---
export const saveStories = async (stories: Story[]): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      for(const story of stories) {
          const { user, ...storyData } = story;
          await supabase.from('stories').upsert(storyData);
      }
    } else {
      const db = await initDB();
      const tx = db.transaction(STORES.STORIES, 'readwrite');
      await Promise.all(stories.map(story => tx.store.put(story)));
      await tx.done;
    }
  } catch (error) {
    console.error('Error saving stories:', error);
  }
};

export const getStories = async (): Promise<Story[]> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('stories')
        .select('*, user:users!userId(*)')
        .order('timestamp', { ascending: false });
        
      if (!error && data) return data as Story[];
    }

    const db = await initDB();
    const stories = await db.getAll(STORES.STORIES);
    return stories.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

// --- Reel Operations ---
export const saveReels = async (reels: Reel[]): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      for (const reel of reels) {
          const { user, ...reelData } = reel;
          await supabase.from('reels').upsert(reelData);
      }
    } else {
      const db = await initDB();
      const tx = db.transaction(STORES.REELS, 'readwrite');
      await Promise.all(reels.map(reel => tx.store.put(reel)));
      await tx.done;
    }
  } catch (error) {
    console.error('Error saving reels:', error);
  }
};

export const getReels = async (): Promise<Reel[]> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reels')
        .select('*, user:users!userId(*)')
      if (!error && data) return data as Reel[];
    }

    const db = await initDB();
    return await db.getAll(STORES.REELS);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return [];
  }
};

// --- Portfolio Operations ---
export const savePortfolioItems = async (items: PortfolioItem[]): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('portfolio').upsert(items);
      if (error) throw error;
    } else {
      const db = await initDB();
      const tx = db.transaction(STORES.PORTFOLIO, 'readwrite');
      await Promise.all(items.map(item => tx.store.put(item)));
      await tx.done;
    }
  } catch (error) {
    console.error('Error saving portfolio:', error);
  }
};

export const getPortfolioItems = async (): Promise<PortfolioItem[]> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('portfolio').select('*');
      if (!error && data) return data as PortfolioItem[];
    }

    const db = await initDB();
    return await db.getAll(STORES.PORTFOLIO);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return [];
  }
};
