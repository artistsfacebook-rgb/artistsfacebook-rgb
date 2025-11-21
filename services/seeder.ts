import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Post, Reel } from '../types';

const SEED_USERS: User[] = [
    { id: 'u1', name: 'Aarav Patel', handle: '@aarav', avatar: 'https://picsum.photos/100/100?random=1', type: 'Artist', location: 'Mumbai', bio: 'Lover of abstracts', followers: 100, following: 5, followingIds: [] },
    { id: 'u2', name: 'Priya Singh', handle: '@priya', avatar: 'https://picsum.photos/100/100?random=2', type: 'Artist', location: 'Delhi', bio: 'Digital Illustrator', followers: 250, following: 10, followingIds: [] }
];

const SEED_POSTS: Post[] = [
    { id: 'p1', userId: 'u1', user: SEED_USERS[0], content: 'Just finished this mural!', imageUrl: 'https://picsum.photos/500/400?random=10', likes: 45, comments: [], shares: 2, timestamp: Date.now(), tags: ['art', 'mural'], visibility: 'Public' }
];

const SEED_REELS: Reel[] = [
    { id: 'r1', userId: 'u1', user: SEED_USERS[0], thumbnailUrl: 'https://picsum.photos/300/500?random=201', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', views: '12K', description: 'Time-lapse 🎨', likes: '1.2K', comments: '45', shares: '120', audioTrack: 'Original Audio' }
];

export const seedDatabase = async () => {
    if (!isSupabaseConfigured) {
        alert("Please connect to Supabase first!");
        return;
    }

    try {
        console.log("Starting Seeding...");
        let tableMissing = false;
        
        // 1. Seed Users
        for (const user of SEED_USERS) {
            const { error } = await supabase.from('users').upsert({
                id: user.id,
                name: user.name,
                handle: user.handle,
                avatar: user.avatar,
                type: user.type,
                location: user.location,
                bio: user.bio,
                followers: user.followers,
                following: user.following,
                "followingIds": user.followingIds
            });
            if (error) {
                console.error(`Error seeding user ${user.name}:`, JSON.stringify(error, null, 2));
                if (error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                    tableMissing = true;
                }
            }
        }

        // 2. Seed Posts
        for (const post of SEED_POSTS) {
            const { error } = await supabase.from('posts').upsert({
                id: post.id,
                "userId": post.userId,
                content: post.content,
                "imageUrl": post.imageUrl,
                likes: post.likes,
                shares: post.shares,
                timestamp: post.timestamp,
                tags: post.tags,
                visibility: post.visibility
            });
             if (error) console.error(`Error seeding post ${post.id}:`, JSON.stringify(error, null, 2));
        }

        // 3. Seed Reels
        for (const reel of SEED_REELS) {
            const { error } = await supabase.from('reels').upsert({
                id: reel.id,
                "userId": reel.userId,
                "videoUrl": reel.videoUrl,
                "thumbnailUrl": reel.thumbnailUrl,
                description: reel.description,
                likes: reel.likes,
                views: reel.views,
                "audioTrack": reel.audioTrack
            });
             if (error) console.error(`Error seeding reel ${reel.id}:`, JSON.stringify(error, null, 2));
        }

        if (tableMissing) {
            alert("SEEDING FAILED: Tables not found.\n\nYour Supabase database is empty. You must run the SQL Schema script to create the tables 'users', 'posts', etc.\n\nClick 'Copy SQL Schema' in the Login Developer Tools and run it in your Supabase SQL Editor.");
        } else {
            alert("Database seeded! Check console for any specific errors.");
        }

    } catch (e) {
        console.error("Seeding failed:", e);
        alert("Seeding failed. Check console.");
    }
};