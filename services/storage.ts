
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Post, Story, PortfolioItem, Reel, Comment, Notification, LiveStream, ReactionType, Reaction, Group, Page, Chat, Message, AdCampaign, Ad, Report, Event } from '../types';
import { openDB } from 'idb';

const DB_NAME = 'ArtistsFacebookDB_v4';
const STORES = {
  USERS: 'users',
  POSTS: 'posts',
  STORIES: 'stories',
  PORTFOLIO: 'portfolio',
  REELS: 'reels',
  NOTIFICATIONS: 'notifications',
  LIVE_STREAMS: 'live_streams',
  GROUPS: 'groups',
  PAGES: 'pages',
  CHATS: 'chats',
  MESSAGES: 'messages',
  CAMPAIGNS: 'ad_campaigns',
  ADS: 'ads',
  REPORTS: 'reports',
  EVENTS: 'events'
};

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      Object.values(STORES).forEach(store => {
         if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      });
    },
  });
};

// --- PRIVACY & SECURITY ---

export const blockUser = async (currentUserId: string, targetUserId: string) => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('blockedUsers').eq('id', currentUserId).single();
        if (data) {
            const blocked = [...(data.blockedUsers || []), targetUserId];
            await supabase.from('users').update({ blockedUsers: blocked }).eq('id', currentUserId);
        }
    } else {
        const db = await initDB();
        const user = await db.get(STORES.USERS, currentUserId);
        if (user) {
            user.blockedUsers = [...(user.blockedUsers || []), targetUserId];
            await db.put(STORES.USERS, user);
        }
    }
};

export const unblockUser = async (currentUserId: string, targetUserId: string) => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('blockedUsers').eq('id', currentUserId).single();
        if (data) {
            const blocked = (data.blockedUsers || []).filter((id: string) => id !== targetUserId);
            await supabase.from('users').update({ blockedUsers: blocked }).eq('id', currentUserId);
        }
    } else {
        const db = await initDB();
        const user = await db.get(STORES.USERS, currentUserId);
        if (user) {
            user.blockedUsers = (user.blockedUsers || []).filter((id: string) => id !== targetUserId);
            await db.put(STORES.USERS, user);
        }
    }
};

export const reportContent = async (reporterId: string, targetId: string, targetType: Report['targetType'], reason: string) => {
    const report: Report = {
        id: `rep_${Date.now()}`,
        reporterId,
        targetId,
        targetType,
        reason,
        status: 'PENDING',
        timestamp: Date.now()
    };

    if (isSupabaseConfigured) {
        await supabase.from('reports').insert(report);
    } else {
        const db = await initDB();
        await db.put(STORES.REPORTS, report);
    }
};

// --- SEARCH SYSTEM ---
export const searchGlobal = async (query: string) => {
    if (!query.trim()) return { users: [], groups: [], pages: [], events: [], posts: [] };
    const q = `%${query}%`;

    if (isSupabaseConfigured) {
        const [users, groups, pages, events, posts] = await Promise.all([
            supabase.from('users').select('*').ilike('name', q).limit(5),
            supabase.from('groups').select('*').ilike('name', q).limit(5),
            supabase.from('pages').select('*').ilike('name', q).limit(5),
            supabase.from('events').select('*').ilike('title', q).limit(5),
            supabase.from('posts').select('*, user:users!userId(*)').ilike('content', q).limit(5)
        ]);
        return {
            users: (users.data as User[]) || [],
            groups: (groups.data as Group[]) || [],
            pages: (pages.data as Page[]) || [],
            events: (events.data as any[]) || [],
            posts: (posts.data as Post[]) || []
        };
    } else {
        // IDB Fallback
        const db = await initDB();
        const [users, groups, pages, posts] = await Promise.all([
            db.getAll(STORES.USERS),
            db.getAll(STORES.GROUPS),
            db.getAll(STORES.PAGES),
            db.getAll(STORES.POSTS)
        ]);
        
        const lowerQ = query.toLowerCase();
        return {
            users: users.filter((u: User) => u.name.toLowerCase().includes(lowerQ)).slice(0, 5),
            groups: groups.filter((g: Group) => g.name.toLowerCase().includes(lowerQ)).slice(0, 5),
            pages: pages.filter((p: Page) => p.name.toLowerCase().includes(lowerQ)).slice(0, 5),
            events: [], // Events store not strictly defined in initDB for brevity, assuming similar
            posts: posts.filter((p: Post) => p.content?.toLowerCase().includes(lowerQ)).slice(0, 5).map((p: Post) => {
                 // Simple hydration mock
                 const u = users.find((u: User) => u.id === p.userId);
                 return { ...p, user: u };
            })
        };
    }
};

// --- NOTIFICATION SYSTEM ---
export const createNotification = async (recipientId: string, actor: User, type: Notification['type'], text: string, link?: string) => { 
    // Check settings first (simplified logic)
    if (recipientId === actor.id) return; // Don't notify self

    const notif: Notification = {
        id: `n${Date.now()}_${Math.random()}`,
        userId: recipientId,
        actorId: actor.id,
        actorName: actor.name,
        actorAvatar: actor.avatar,
        type,
        text,
        time: Date.now(),
        read: false,
        link
    };

    if (isSupabaseConfigured) {
        await supabase.from('notifications').insert(notif);
    } else {
        const db = await initDB();
        await db.put(STORES.NOTIFICATIONS, notif);
    }
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('notifications').select('*').eq('userId', userId).order('time', { ascending: false }).limit(20);
        return (data as Notification[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.NOTIFICATIONS);
    return all.filter((n: Notification) => n.userId === userId).sort((a: Notification, b: Notification) => b.time - a.time).slice(0, 20);
};

export const markAllNotificationsAsRead = async (userId: string) => {
    if (isSupabaseConfigured) {
        await supabase.from('notifications').update({ read: true }).eq('userId', userId);
    } else {
        const db = await initDB();
        const all = await db.getAll(STORES.NOTIFICATIONS);
        const userNotifs = all.filter((n: Notification) => n.userId === userId);
        for (const n of userNotifs) {
            n.read = true;
            await db.put(STORES.NOTIFICATIONS, n);
        }
    }
};

export const notifyFollowers = async (actor: User, type: string, text: string) => {
    // In a real app, we'd query the 'followers' table. 
    // For now, we simulate by notifying users who track 'followingIds' or friends
    // This is a placeholder for the complex Fanout on Write
};

// --- USER OPERATIONS ---
export const saveUser = async (user: User): Promise<void> => {
    if (isSupabaseConfigured) {
        await supabase.from('users').upsert(user);
    } else {
        const db = await initDB();
        await db.put(STORES.USERS, user);
    }
};

export const getUser = async (id: string): Promise<User | undefined> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('*').eq('id', id).single();
        return (data as User) || undefined;
    }
    const db = await initDB();
    return await db.get(STORES.USERS, id);
};

export const getAllUsers = async (): Promise<User[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('*');
        return (data as User[]) || [];
    }
    const db = await initDB();
    return await db.getAll(STORES.USERS);
};

export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
    if (userIds.length === 0) return [];
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('users').select('*').in('id', userIds);
        return (data as User[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.USERS);
    return all.filter((u: User) => userIds.includes(u.id));
};


// --- POST OPERATIONS ---
export const savePosts = async (posts: Post[]): Promise<void> => {
    if (isSupabaseConfigured) {
        for (const p of posts) await supabase.from('posts').upsert(p);
    } else {
        const db = await initDB();
        for (const p of posts) await db.put(STORES.POSTS, p);
    }
};

export const getPosts = async (page = 1, limit = 10, groupId?: string, pageId?: string, eventId?: string): Promise<Post[]> => {
    if (isSupabaseConfigured) {
        let query = supabase.from('posts').select('*, user:users!userId(*)').order('timestamp', { ascending: false }).range((page - 1) * limit, page * limit - 1);
        if (groupId) query = query.eq('groupId', groupId);
        if (pageId) query = query.eq('pageId', pageId);
        if (eventId) query = query.eq('eventId', eventId);
        
        const { data } = await query;
        return (data as Post[]) || [];
    }
    const db = await initDB();
    const allPosts = await db.getAll(STORES.POSTS);
    const allUsers = await db.getAll(STORES.USERS);
    const userMap = new Map(allUsers.map((u: User) => [u.id, u]));

    let filtered = allPosts.sort((a: Post, b: Post) => b.timestamp - a.timestamp);
    if (groupId) filtered = filtered.filter((p: Post) => p.groupId === groupId);
    if (pageId) filtered = filtered.filter((p: Post) => p.pageId === pageId);
    if (eventId) filtered = filtered.filter((p: Post) => p.eventId === eventId);

    const paged = filtered.slice((page - 1) * limit, page * limit);
    return paged.map((p: Post) => ({
        ...p,
        user: userMap.get(p.userId) || p.user
    }));
};

export const addReaction = async (postId: string, userId: string, type: ReactionType) => {
    if (isSupabaseConfigured) {
        // Remove existing reaction if exists (toggle/change)
        await supabase.from('post_reactions').delete().match({ postId, userId });
        await supabase.from('post_reactions').insert({ id: `${postId}_${userId}`, postId, userId, type });
        // RPC would be better to update count
        const { count } = await supabase.from('post_reactions').select('*', { count: 'exact', head: true }).eq('postId', postId);
        await supabase.from('posts').update({ likes: count || 0 }).eq('id', postId);
    }
    // IDB simplified: update post directly in component, this is async persist
};

export const addComment = async (postId: string, userId: string, text: string, parentId?: string) => {
    const comment: Comment = {
        id: `c${Date.now()}`,
        userId,
        user: {} as User, // Backend doesn't store full user object usually, just ID
        text,
        timestamp: Date.now(),
        parentId
    };
    if (isSupabaseConfigured) {
        await supabase.from('comments').insert({ ...comment, user: undefined }); // Don't send user obj
    }
};

export const sharePost = async (originalPost: Post, userId: string, content: string) => {
    // Logic handled in component mainly for creating the new post object
};


// --- FRIEND SYSTEM ---
export const sendFriendRequest = async (currentUser: User, targetUserId: string) => {
    // Update target user's friendRequests
    if (isSupabaseConfigured) {
        const target = await getUser(targetUserId);
        if (target) {
            const newReqs = [...(target.friendRequests || []), currentUser.id];
            await supabase.from('users').update({ friendRequests: newReqs }).eq('id', targetUserId);
            await createNotification(targetUserId, currentUser, 'FRIEND_REQ', 'sent you a friend request.');
        }
        // Update current user sentRequests
        const newSent = [...(currentUser.sentRequests || []), targetUserId];
        await supabase.from('users').update({ sentRequests: newSent }).eq('id', currentUser.id);
    }
};

export const acceptFriendRequest = async (currentUser: User, targetUserId: string) => {
    if (isSupabaseConfigured) {
        // Add to friends list for both
        const target = await getUser(targetUserId);
        if (target) {
            const targetFriends = [...(target.friends || []), currentUser.id];
            const targetSent = (target.sentRequests || []).filter(id => id !== currentUser.id);
            await supabase.from('users').update({ friends: targetFriends, sentRequests: targetSent }).eq('id', targetUserId);
            await createNotification(targetUserId, currentUser, 'FRIEND_ACCEPT', 'accepted your friend request.');
        }

        const myFriends = [...(currentUser.friends || []), targetUserId];
        const myReqs = (currentUser.friendRequests || []).filter(id => id !== targetUserId);
        await supabase.from('users').update({ friends: myFriends, friendRequests: myReqs }).eq('id', currentUser.id);
    }
};

export const rejectFriendRequest = async (currentUser: User, targetUserId: string) => {
     if (isSupabaseConfigured) {
        const myReqs = (currentUser.friendRequests || []).filter(id => id !== targetUserId);
        await supabase.from('users').update({ friendRequests: myReqs }).eq('id', currentUser.id);
        
        // Remove from target's sent
        const target = await getUser(targetUserId);
        if (target) {
            const targetSent = (target.sentRequests || []).filter(id => id !== currentUser.id);
            await supabase.from('users').update({ sentRequests: targetSent }).eq('id', targetUserId);
        }
     }
};

// --- CHAT OPERATIONS ---
export const createChat = async (participantIds: string[], type: 'individual' | 'group' = 'individual', name?: string): Promise<Chat> => {
    const chat: Chat = {
        id: `chat_${Date.now()}`,
        type,
        name,
        participantIds,
        updatedAt: Date.now()
    };
    if (isSupabaseConfigured) {
        await supabase.from('chats').insert(chat);
        return chat;
    }
    const db = await initDB();
    await db.put(STORES.CHATS, chat);
    return chat;
};

export const getChats = async (userId: string): Promise<Chat[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('chats').select('*').contains('participantIds', [userId]).order('updatedAt', { ascending: false });
        return (data as Chat[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.CHATS);
    return all.filter((c: Chat) => c.participantIds.includes(userId)).sort((a: Chat, b: Chat) => b.updatedAt - a.updatedAt);
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('messages').select('*').eq('chatId', chatId).order('timestamp', { ascending: true });
        return (data as Message[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.MESSAGES);
    return all.filter((m: Message) => m.chatId === chatId).sort((a: Message, b: Message) => a.timestamp - b.timestamp);
};

export const sendMessage = async (chatId: string, senderId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'file'): Promise<Message> => {
    const msg: Message = {
        id: `msg_${Date.now()}`,
        chatId,
        senderId,
        content,
        mediaUrl,
        mediaType,
        timestamp: Date.now(),
        readBy: [senderId],
        status: 'sent'
    };
    
    if (isSupabaseConfigured) {
        await supabase.from('messages').insert(msg);
        await supabase.from('chats').update({ updatedAt: Date.now() }).eq('id', chatId);
    } else {
        const db = await initDB();
        await db.put(STORES.MESSAGES, msg);
        const chat = await db.get(STORES.CHATS, chatId);
        if (chat) {
            chat.updatedAt = Date.now();
            await db.put(STORES.CHATS, chat);
        }
    }
    return msg;
};

export const markMessageAsRead = async (messageId: string, userId: string) => {
    // Not implemented fully for brevity
};


// --- OTHER OPERATIONS (Groups, Stories, Reels, etc.) ---
export const getGroups = async (): Promise<Group[]> => { 
    if (isSupabaseConfigured) { const {data} = await supabase.from('groups').select('*'); return (data as Group[]) || []; }
    const db = await initDB(); return await db.getAll(STORES.GROUPS);
};
export const saveGroup = async (group: Group) => { 
    if (isSupabaseConfigured) await supabase.from('groups').insert(group);
    else { const db = await initDB(); await db.put(STORES.GROUPS, group); }
};
export const joinGroup = async (groupId: string, userId: string) => { 
    if (isSupabaseConfigured) {
        const group = await supabase.from('groups').select('members').eq('id', groupId).single();
        if(group.data) {
            const members = [...group.data.members, userId];
            await supabase.from('groups').update({members}).eq('id', groupId);
        }
    }
};
export const leaveGroup = async (groupId: string, userId: string) => {
    if (isSupabaseConfigured) {
         const group = await supabase.from('groups').select('members').eq('id', groupId).single();
        if(group.data) {
            const members = group.data.members.filter((id: string) => id !== userId);
            await supabase.from('groups').update({members}).eq('id', groupId);
        }
    }
};
export const approveJoinRequest = async (groupId: string, userId: string) => {
    // Logic to move from joinRequests to members
};

export const saveStories = async (stories: Story[]) => { 
    if (isSupabaseConfigured) { for(const s of stories) await supabase.from('stories').upsert(s); }
    else { const db = await initDB(); for(const s of stories) await db.put(STORES.STORIES, s); }
};
export const markStoryAsViewed = async (storyId: string, userId: string) => {
    // Append userId to viewers array
};
export const getStories = async (): Promise<Story[]> => { 
    if (isSupabaseConfigured) { const {data} = await supabase.from('stories').select('*, user:users(*)'); return (data as Story[]) || []; }
    const db = await initDB(); return await db.getAll(STORES.STORIES);
};

export const getReels = async (): Promise<Reel[]> => { 
    if (isSupabaseConfigured) { const {data} = await supabase.from('reels').select('*, user:users!userId(*)'); return (data as Reel[]) || []; }
    const db = await initDB(); return await db.getAll(STORES.REELS); 
};
export const saveReels = async (reels: Reel[]) => { 
    if (isSupabaseConfigured) { for(const r of reels) await supabase.from('reels').upsert(r); }
    else { const db = await initDB(); for(const r of reels) await db.put(STORES.REELS, r); }
};

export const getPortfolioItems = async (userId?: string) => { 
    if (isSupabaseConfigured) { 
        let q = supabase.from('portfolio').select('*');
        if(userId) q = q.eq('userId', userId);
        const {data} = await q;
        return (data as PortfolioItem[]) || []; 
    }
    const db = await initDB(); 
    return await db.getAll(STORES.PORTFOLIO); 
};
export const savePortfolioItems = async (items: PortfolioItem[]) => { 
    if (isSupabaseConfigured) { for(const i of items) await supabase.from('portfolio').upsert(i); }
    else { const db = await initDB(); for(const i of items) await db.put(STORES.PORTFOLIO, i); }
};

export const createLiveStream = async (stream: LiveStream) => { 
    if (isSupabaseConfigured) await supabase.from('live_streams').insert(stream);
};
export const endLiveStream = async (streamId: string) => { 
    if (isSupabaseConfigured) await supabase.from('live_streams').update({ status: 'ENDED', endedAt: Date.now() }).eq('id', streamId);
};
export const getActiveStreams = async () => { 
    if (isSupabaseConfigured) { 
        const {data} = await supabase.from('live_streams').select('*, hostUser:users!hostId(*)').eq('status', 'LIVE');
        return (data as LiveStream[]) || []; 
    }
    return [];
};
export const getPastStreams = async () => { 
    if (isSupabaseConfigured) { 
        const {data} = await supabase.from('live_streams').select('*, hostUser:users!hostId(*)').eq('status', 'ENDED').order('endedAt', {ascending: false}).limit(10);
        return (data as LiveStream[]) || []; 
    }
    return [];
};
export const sendLiveMessage = async (streamId: string, userId: string, text: string) => { 
    if (isSupabaseConfigured) await supabase.from('live_comments').insert({ id: `lc_${Date.now()}`, streamId, userId, text, timestamp: Date.now() });
};

// --- PAGES OPERATIONS ---
export const createPage = async (page: Page) => {
    if (isSupabaseConfigured) await supabase.from('pages').insert(page);
    else { const db = await initDB(); await db.put(STORES.PAGES, page); }
}
export const getPages = async (): Promise<Page[]> => {
    if (isSupabaseConfigured) { const {data} = await supabase.from('pages').select('*'); return (data as Page[]) || []; }
    const db = await initDB(); return await db.getAll(STORES.PAGES);
}
export const followPage = async (pageId: string, userId: string) => {
    // Increment followers count logic
}

// --- EVENTS OPERATIONS ---
export const getEvents = async (): Promise<Event[]> => {
    if (isSupabaseConfigured) { const {data} = await supabase.from('events').select('*'); return (data as Event[]) || []; }
    const db = await initDB(); return await db.getAll(STORES.EVENTS);
}
export const createEvent = async (event: Event) => {
    if (isSupabaseConfigured) await supabase.from('events').insert(event);
    else { const db = await initDB(); await db.put(STORES.EVENTS, event); }
}
export const rsvpEvent = async (eventId: string, userId: string, status: 'going' | 'interested') => {
    // In a real app, we'd have an 'event_attendees' table. 
    // For now, we just update the count or log it
    if (isSupabaseConfigured) {
        // Mock increment
        // await supabase.rpc('increment_event_interest', { event_id: eventId });
    }
}

// --- ADS SYSTEM ---
export const createCampaign = async (campaign: AdCampaign) => {
    if (isSupabaseConfigured) {
        await supabase.from('ad_campaigns').upsert(campaign);
    } else {
        const db = await initDB();
        await db.put(STORES.CAMPAIGNS, campaign);
    }
};

export const getCampaigns = async (userId: string): Promise<AdCampaign[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('ad_campaigns').select('*').eq('userId', userId);
        return (data as AdCampaign[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.CAMPAIGNS);
    return all.filter((c: AdCampaign) => c.userId === userId);
};

export const createAd = async (ad: Ad) => {
    if (isSupabaseConfigured) {
        await supabase.from('ads').upsert(ad);
    } else {
        const db = await initDB();
        await db.put(STORES.ADS, ad);
    }
};

export const getAdsForAdvertiser = async (userId: string): Promise<Ad[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('ads').select('*').eq('userId', userId);
        return (data as Ad[]) || [];
    }
    const db = await initDB();
    const all = await db.getAll(STORES.ADS);
    return all.filter((a: Ad) => a.userId === userId);
};

export const getRandomAds = async (limit: number = 1): Promise<Ad[]> => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('ads').select('*, user:users!userId(*)').limit(5);
        const ads = (data as Ad[]) || [];
        return ads.sort(() => 0.5 - Math.random()).slice(0, limit);
    }
    const db = await initDB();
    const all = await db.getAll(STORES.ADS);
    const hydrated = await Promise.all(all.map(async (ad: Ad) => {
        const user = await db.get(STORES.USERS, ad.userId);
        return { ...ad, user };
    }));
    return hydrated.sort(() => 0.5 - Math.random()).slice(0, limit);
};

export const trackAdImpression = async (adId: string) => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('ads').select('impressions').eq('id', adId).single();
        if (data) {
            await supabase.from('ads').update({ impressions: Number(data.impressions) + 1 }).eq('id', adId);
        }
    } else {
        const db = await initDB();
        const ad = await db.get(STORES.ADS, adId);
        if (ad) {
            ad.impressions = (ad.impressions || 0) + 1;
            await db.put(STORES.ADS, ad);
        }
    }
};

export const trackAdClick = async (adId: string) => {
    if (isSupabaseConfigured) {
        const { data } = await supabase.from('ads').select('clicks').eq('id', adId).single();
        if (data) {
            await supabase.from('ads').update({ clicks: Number(data.clicks) + 1 }).eq('id', adId);
        }
    } else {
        const db = await initDB();
        const ad = await db.get(STORES.ADS, adId);
        if (ad) {
            ad.clicks = (ad.clicks || 0) + 1;
            await db.put(STORES.ADS, ad);
        }
    }
};
