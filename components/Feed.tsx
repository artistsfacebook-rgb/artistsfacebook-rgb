
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Post, Story, Reel, Comment, User } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, Video, Hash, XCircle, Edit2, Trash2, Save, Globe, Users, Lock, Plus, UserPlus, UserCheck, Upload, Send } from 'lucide-react';
import CreatePost from './CreatePost';
import { getArtCritique } from '../services/geminiService';
import StoryViewer from './StoryViewer';
import ReelsViewer from './ReelsViewer';
import { getPosts, savePosts, getStories, saveStories, getReels, saveReels } from '../services/storage';

interface FeedProps {
  user: User;
  onToggleFollow: (userId: string) => void;
}

const INITIAL_STORIES: Story[] = [
  { id: 's1', userId: 'u0', user: { id: 'u0', name: 'You', avatar: 'https://picsum.photos/100/100?random=99', handle: '', type: 'Artist', location: '', followingIds: [] }, imageUrl: 'https://picsum.photos/100/100?random=99', isViewed: false, timestamp: Date.now() }, 
];

const MOCK_REELS: Reel[] = [
  { 
      id: 'r1', 
      userId: 'u1', 
      user: { id: 'u1', name: 'Aarav', avatar: 'https://picsum.photos/100/100?random=1', handle: '', type: 'Artist', location: '', followingIds: [] }, 
      thumbnailUrl: 'https://picsum.photos/300/500?random=201', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', 
      views: '12K',
      description: 'Time-lapse of my latest mural in Mumbai! 🎨',
      likes: '1.2K',
      comments: '45',
      shares: '120',
      audioTrack: 'Original Audio - Aarav'
  },
  { 
      id: 'r2', 
      userId: 'u2', 
      user: { id: 'u2', name: 'Priya', avatar: 'https://picsum.photos/100/100?random=2', handle: '', type: 'Artist', location: '', followingIds: [] }, 
      thumbnailUrl: 'https://picsum.photos/300/500?random=202', 
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', 
      views: '45K',
      description: 'Trying out the new charcoal pencils. What do you think?',
      likes: '5K',
      comments: '302',
      shares: '500',
      audioTrack: 'Lo-Fi Beats - Chill'
  },
];

const Feed: React.FC<FeedProps> = ({ user, onToggleFollow }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const storyInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);

  const [critiqueLoading, setCritiqueLoading] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Viewer States
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);

  // Editing States
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<'Public' | 'Friends' | 'Private'>('Public');

  // Commenting States
  const [activeCommentBoxId, setActiveCommentBoxId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Load initial data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbPosts, dbStories, dbReels] = await Promise.all([
          getPosts(),
          getStories(),
          getReels()
        ]);

        setPosts(dbPosts.length > 0 ? dbPosts : []);
        
        // Filter stories to show only those from the last 24 hours
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const validStories = dbStories.filter(s => s.userId === 'u0' || s.timestamp > twentyFourHoursAgo);
        
        // Ensure placeholder always exists
        const hasPlaceholder = validStories.some(s => s.id === 's1' || (s.userId === 'u0' && s.imageUrl === INITIAL_STORIES[0].imageUrl));
        if (!hasPlaceholder) {
             validStories.unshift({ 
               ...INITIAL_STORIES[0], 
               imageUrl: user.avatar,
               user: { ...INITIAL_STORIES[0].user, avatar: user.avatar }
             });
        }

        setStories(validStories.length > 0 ? validStories : INITIAL_STORIES);
        setReels(dbReels.length > 0 ? dbReels : MOCK_REELS);
      } catch (err) {
        console.error("Error loading feed data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user.avatar]);

  // Persistence Effects
  useEffect(() => {
    if (!loading) savePosts(posts).catch(console.error);
  }, [posts, loading]);

  useEffect(() => {
    if (!loading) saveStories(stories).catch(console.error);
  }, [stories, loading]);

  useEffect(() => {
    if (!loading) saveReels(reels).catch(console.error);
  }, [reels, loading]);

  const handlePostCreate = (content: string, image: string | undefined, video: string | undefined, tags: string[], visibility: 'Public' | 'Friends' | 'Private') => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      userId: user.id,
      user: { ...user },
      content,
      imageUrl: image,
      videoUrl: video,
      likes: 0,
      comments: [],
      shares: 0,
      timestamp: Date.now(),
      tags: tags,
      visibility: visibility
    };
    setPosts([newPost, ...posts]);
  };

  const handleStoryCreateClick = () => {
      storyInputRef.current?.click();
  };

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const isVideo = file.type.startsWith('video/');

            const newStory: Story = {
                id: `s${Date.now()}`,
                userId: user.id,
                user: { ...user },
                imageUrl: isVideo ? undefined : result,
                videoUrl: isVideo ? result : undefined,
                isViewed: false,
                timestamp: Date.now(),
                duration: 5000
            };

            const updatedStories = [...stories];
            // Insert after placeholder (index 0)
            updatedStories.splice(1, 0, newStory);
            setStories(updatedStories);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleReelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              const newReel: Reel = {
                  id: `r${Date.now()}`,
                  userId: user.id,
                  user: { ...user },
                  videoUrl: result,
                  thumbnailUrl: user.avatar, // Use avatar as generic thumb for simplicity in this demo
                  description: 'New Reel',
                  views: '0',
                  likes: '0',
                  comments: '0',
                  shares: '0',
                  audioTrack: 'Original Audio'
              };
              setReels([newReel, ...reels]);
          };
          reader.readAsDataURL(file);
      } else {
          alert("Please upload a video file for Reels.");
      }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleAICritique = async (post: Post) => {
    setCritiqueLoading(post.id);
    const critique = await getArtCritique(post.content, post.user.name);
    
    const aiComment: Comment = {
      id: `c${Date.now()}`,
      userId: 'ai',
      user: { id: 'ai', name: 'Gemini Art Critic', handle: '@gemini_ai', avatar: 'https://picsum.photos/100/100?random=88', type: 'Collector', location: 'Virtual', followingIds: [] },
      text: critique,
      timestamp: Date.now()
    };

    setPosts(currentPosts => currentPosts.map(p => 
      p.id === post.id ? { ...p, comments: [...p.comments, aiComment] } : p
    ));
    setCritiqueLoading(null);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      userId: user.id,
      user: user,
      text: commentText,
      timestamp: Date.now()
    };

    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    setCommentText('');
  };

  const toggleCommentBox = (postId: string) => {
    if (activeCommentBoxId === postId) {
      setActiveCommentBoxId(null);
    } else {
      setActiveCommentBoxId(postId);
    }
  };

  const openStories = (index: number) => {
      if (index === 0) {
          handleStoryCreateClick();
          return;
      } 
      setSelectedStoryIndex(index);
  };

  const toggleDropdown = (postId: string) => {
    setActiveDropdownId(activeDropdownId === postId ? null : postId);
  };

  const startEditing = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditVisibility(post.visibility || 'Public');
    setActiveDropdownId(null);
  };

  const saveEdit = () => {
    if (editingPostId) {
        setPosts(posts.map(p => p.id === editingPostId ? { ...p, content: editContent, isEdited: true, visibility: editVisibility } : p));
        setEditingPostId(null);
        setEditContent('');
    }
  };

  const cancelEdit = () => {
      setEditingPostId(null);
      setEditContent('');
  };

  const deletePost = (postId: string) => {
      if(confirm("Are you sure you want to delete this post?")) {
          setPosts(posts.filter(p => p.id !== postId));
          setActiveDropdownId(null);
      }
  };

  const savePost = (postId: string) => {
    try {
      const existingSaved = localStorage.getItem('saved_posts');
      let savedPosts: string[] = [];
      try {
        savedPosts = existingSaved ? JSON.parse(existingSaved) : [];
      } catch { savedPosts = []; }
      
      if (!savedPosts.includes(postId)) {
          savedPosts.push(postId);
          localStorage.setItem('saved_posts', JSON.stringify(savedPosts));
          alert("Post saved successfully!");
      } else {
          alert("You have already saved this post.");
      }
    } catch (e) {
      console.error("Error saving post:", e);
      alert("An error occurred while saving.");
    }
    setActiveDropdownId(null);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = selectedTag 
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts;

  if (loading) {
      return <div className="text-center py-10">Loading feed...</div>;
  }

  return (
    <div className="max-w-[600px] mx-auto space-y-6">
      
      <input 
          type="file" 
          ref={storyInputRef} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleStoryFileChange} 
      />
      
      <input
          type="file"
          ref={reelInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleReelUpload}
      />

      {selectedStoryIndex !== null && (
        <StoryViewer 
            stories={stories} 
            initialIndex={selectedStoryIndex} 
            onClose={() => setSelectedStoryIndex(null)} 
        />
      )}
      
      {selectedReelIndex !== null && (
        <ReelsViewer
            reels={reels}
            initialIndex={selectedReelIndex}
            onClose={() => setSelectedReelIndex(null)}
        />
      )}

      {/* Stories Tray */}
      <div className="relative w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex space-x-2">
          {stories.map((story, idx) => (
            <div 
                key={story.id} 
                onClick={() => openStories(idx)}
                className="relative flex-shrink-0 w-[110px] h-[180px] rounded-xl overflow-hidden cursor-pointer group transform transition-transform hover:scale-[1.02]"
            >
              {idx === 0 ? (
                <div className="w-full h-full bg-white dark:bg-[#242526] flex flex-col border border-gray-200 dark:border-slate-700">
                   <div className="h-[70%] overflow-hidden relative">
                      <img src={user.avatar} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform" alt="" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                   </div>
                   <div className="relative flex-1 flex justify-center items-end pb-2 bg-white dark:bg-[#242526]">
                      <div className="absolute -top-4 bg-blue-500 rounded-full p-1 border-4 border-white dark:border-[#242526] transition-transform group-hover:scale-110">
                         <Plus size={20} className="text-white" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white mt-3">Create story</span>
                   </div>
                </div>
              ) : (
                <>
                  {story.videoUrl ? (
                      <video src={story.videoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                      <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
                  <div className={`absolute top-3 left-3 w-9 h-9 rounded-full border-4 ${story.isViewed ? 'border-gray-400' : 'border-blue-500'} overflow-hidden`}>
                    <img src={story.user.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="absolute bottom-3 left-3 text-white text-xs font-semibold truncate w-20">{story.userId === user.id ? 'Your Story' : story.user.name}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreatePost user={user} onPostCreate={handlePostCreate} />

      {/* Reels Section */}
      <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
           <h3 className="font-bold text-gray-500 dark:text-slate-300 flex items-center gap-2">
             <Video className="text-pink-500" size={20} /> Reels and short videos
           </h3>
           <button 
             onClick={() => reelInputRef.current?.click()}
             className="text-blue-500 text-sm flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded"
           >
               <Plus size={14} /> Create Reel
           </button>
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
           {reels.map((reel, idx) => (
             <div 
                key={reel.id} 
                onClick={() => setSelectedReelIndex(idx)}
                className="relative flex-shrink-0 w-[120px] h-[200px] rounded-lg overflow-hidden cursor-pointer bg-gray-900"
             >
                <video src={reel.videoUrl} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-bold flex items-center gap-1">
                   <Video size={12} /> {reel.views}
                </div>
             </div>
           ))}
           {reels.length === 0 && (
               <div className="w-full text-center py-8 text-gray-400 text-sm">No reels yet. Be the first to create one!</div>
           )}
        </div>
      </div>
      
      {allTags.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {selectedTag && (
             <button 
              onClick={() => setSelectedTag(null)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-semibold whitespace-nowrap transition-colors"
            >
               <XCircle size={14} />
               <span>Clear Filter</span>
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                selectedTag === tag 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white dark:bg-[#242526] text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
           <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center text-gray-500 dark:text-slate-400">
              <Hash size={48} className="mx-auto mb-4 opacity-20" />
              <p>No posts found {selectedTag ? `with tag #${selectedTag}` : 'yet'}.</p>
              {selectedTag && <button onClick={() => setSelectedTag(null)} className="text-blue-500 text-sm mt-2 hover:underline">Clear filter</button>}
           </div>
        ) : (
          filteredPosts.map(post => (
            <article key={post.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-visible relative">
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="cursor-pointer rounded-full overflow-hidden w-10 h-10 border border-gray-200 dark:border-slate-700">
                      <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm hover:underline cursor-pointer">{post.user.name}</h3>
                        {post.userId !== user.id && (
                           <button 
                              onClick={() => onToggleFollow(post.userId)}
                              className={`text-xs px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
                                user.followingIds?.includes(post.userId) 
                                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300' 
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                           >
                              {user.followingIds?.includes(post.userId) ? (
                                <>Following</>
                              ) : (
                                <><UserPlus size={10} /> Follow</>
                              )}
                           </button>
                        )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-slate-400">
                      <span>{new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="mx-1">·</span>
                      <span className="flex items-center gap-1" title={post.visibility || 'Public'}>
                         {(post.visibility === 'Public' || !post.visibility) && <Globe size={10} />}
                         {post.visibility === 'Friends' && <Users size={10} />}
                         {post.visibility === 'Private' && <Lock size={10} />}
                      </span>
                      {post.isEdited && <span className="ml-2 italic text-gray-400 dark:text-slate-500">(Edited)</span>}
                    </div>
                  </div>
                </div>
                <div className="relative">
                    <button 
                        onClick={() => toggleDropdown(post.id)}
                        className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                    {activeDropdownId === post.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-slate-700 overflow-hidden">
                            {post.userId === user.id && (
                                <button 
                                    onClick={() => startEditing(post)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Edit2 size={16} /> Edit Post
                                </button>
                            )}
                             {post.userId === user.id && (
                                <button 
                                    onClick={() => deletePost(post.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete Post
                                </button>
                            )}
                            <button 
                                onClick={() => savePost(post.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Save size={16} /> Save Post
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <div className="px-4 pb-2">
                {editingPostId === post.id ? (
                    <div className="mb-2 space-y-2">
                        <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-800 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-slate-400">Visibility:</span>
                                <select 
                                    value={editVisibility}
                                    onChange={(e) => setEditVisibility(e.target.value as any)}
                                    className="bg-gray-100 dark:bg-slate-800 text-sm p-1.5 rounded border border-gray-300 dark:border-slate-700 focus:outline-none"
                                >
                                    <option value="Public">Public</option>
                                    <option value="Friends">Friends</option>
                                    <option value="Private">Private</option>
                                </select>
                             </div>
                             <div className="flex justify-end gap-2">
                                <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"><Save size={14} /> Save</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-800 dark:text-slate-200 mb-2 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-blue-500 hover:underline text-sm cursor-pointer">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
              </div>

              {post.imageUrl && (
                <div className="w-full bg-gray-100 dark:bg-black">
                  <img src={post.imageUrl} alt="Post content" className="w-full max-h-[500px] object-contain" />
                </div>
              )}
              {post.videoUrl && (
                <div className="w-full bg-black">
                    <video src={post.videoUrl} controls className="w-full max-h-[500px]" />
                </div>
              )}

              <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700 mx-4">
                <div className="flex items-center gap-1">
                    <div className="bg-blue-500 p-1 rounded-full"><Heart size={10} className="text-white fill-current" /></div>
                    <span>{post.likes}</span>
                </div>
                <div className="flex gap-3">
                    <span>{post.comments.length} comments</span>
                    <span>{post.shares} shares</span>
                </div>
              </div>

              <div className="px-2 py-1 flex justify-between items-center">
                <button 
                    onClick={() => handleLike(post.id)}
                    className="flex-1 flex items-center justify-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-slate-300"
                >
                  <Heart size={20} />
                  <span className="font-semibold text-sm">Like</span>
                </button>
                <button 
                  onClick={() => toggleCommentBox(post.id)}
                  className="flex-1 flex items-center justify-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-slate-300"
                >
                  <MessageCircle size={20} />
                  <span className="font-semibold text-sm">Comment</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-slate-300">
                  <Share2 size={20} />
                  <span className="font-semibold text-sm">Share</span>
                </button>
              </div>
              
              {/* Comment Input Section */}
              {activeCommentBoxId === post.id && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                  <img src={user.avatar} alt="You" className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700" />
                  <div className="flex-1 relative">
                     <input 
                       type="text" 
                       value={commentText}
                       onChange={(e) => setCommentText(e.target.value)}
                       placeholder="Write a comment..." 
                       className="w-full bg-gray-100 dark:bg-slate-800 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                       onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                       autoFocus
                     />
                     <button 
                       onClick={() => handleAddComment(post.id)}
                       disabled={!commentText.trim()}
                       className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 disabled:text-gray-400 p-1"
                     >
                       <Send size={16} />
                     </button>
                  </div>
                </div>
              )}

              {post.user.type === 'Artist' && (
                 <div className="px-4 pb-2 pt-1">
                     <button 
                        onClick={() => handleAICritique(post)}
                        disabled={critiqueLoading === post.id}
                        className="w-full flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                     >
                        <Sparkles size={14} />
                        {critiqueLoading === post.id ? 'Analyzing Art...' : 'Get AI Critique'}
                     </button>
                 </div>
              )}

              {post.comments.length > 0 && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
                      {post.comments.map(comment => (
                          <div key={comment.id} className="flex gap-2 mt-2 text-sm">
                              <img src={comment.user.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                              <div className="bg-gray-200 dark:bg-slate-700 rounded-2xl px-3 py-2 max-w-[90%]">
                                  <span className="font-bold block text-xs text-gray-900 dark:text-slate-200">{comment.user.name}</span>
                                  <p className="text-gray-800 dark:text-slate-300">{comment.text}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
