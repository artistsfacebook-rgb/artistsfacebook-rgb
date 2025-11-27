
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Post, Story, Reel, Comment, User, LiveStream, ReactionType, PollOption, Ad } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, Video, Hash, XCircle, Edit2, Trash2, Save, Globe, Users, Lock, Plus, UserPlus, Send, Radio, Repeat, ExternalLink, Flag, UserX, AlertCircle, CornerDownRight, ArrowUp, Check, X } from 'lucide-react';
import CreatePost from './CreatePost';
import StoryEditor from './StoryEditor';
import { getArtCritique } from '../services/geminiService';
import StoryViewer from './StoryViewer';
import ReelsViewer from './ReelsViewer';
import LiveStreamComponent from './LiveStream';
import { getPosts, savePosts, getStories, saveStories, getReels, saveReels, getActiveStreams, addReaction, addComment, sharePost, getRandomAds, trackAdImpression, trackAdClick, blockUser, reportContent, getUser } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface FeedProps {
  user: User;
  onToggleFollow: (userId: string) => void;
  groupId?: string; 
  pageId?: string;
  eventId?: string;
}

type CommentWithChildren = Comment & { children: CommentWithChildren[] };

interface CommentNodeProps {
  comment: CommentWithChildren;
  onReply: (commentId: string, userName: string) => void;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, onReply }) => (
  <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
      <img src={comment.user?.avatar || 'https://picsum.photos/50/50?random=def'} className="w-8 h-8 rounded-full mt-1" />
      <div className="flex-1">
          <div className="bg-[#F0F2F5] dark:bg-gray-700 p-2 rounded-2xl rounded-tl-none inline-block px-3">
              <span className="font-bold text-xs block text-[#1C1E21] dark:text-white">{comment.user?.name || 'User'}</span>
              <span className="text-sm text-[#1C1E21] dark:text-gray-300">{comment.text}</span>
          </div>
          <div className="flex gap-3 text-xs text-[#606770] mt-1 ml-2 mb-2">
              <button className="font-bold hover:underline">Like</button>
              <button onClick={() => onReply(comment.id, comment.user?.name)} className="font-bold hover:underline">Reply</button>
              <span>{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          {/* Nested Replies */}
          {comment.children.length > 0 && (
              <div className="ml-4 space-y-2 border-l-2 border-[#F0F2F5] dark:border-gray-700 pl-2">
                  {comment.children.map(child => <CommentNode key={child.id} comment={child} onReply={onReply} />)}
              </div>
          )}
      </div>
  </div>
);

const Feed: React.FC<FeedProps> = ({ user, onToggleFollow, groupId, pageId, eventId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [feedAds, setFeedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  // Interaction States
  const [showLiveViewer, setShowLiveViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [activeCommentBoxId, setActiveCommentBoxId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{commentId: string, userName: string} | null>(null);
  const [commentText, setCommentText] = useState('');

  // Create Post Modal State
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Editing State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Observer for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              setPage(prev => prev + 1);
          }
      });
      if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Ad Observer
  const adRef = useCallback((node: HTMLDivElement, adId: string) => {
      if (!node) return;
      const obs = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
              trackAdImpression(adId);
              obs.disconnect();
          }
      }, { threshold: 0.5 });
      obs.observe(node);
  }, []);

  const loadPosts = async (reset = false) => {
      setLoading(reset);
      const newPosts = await getPosts(reset ? 1 : page, 10, groupId, pageId, eventId);
      const filtered = newPosts.filter(p => !user.blockedUsers?.includes(p.userId));
      
      if (reset) {
          setPosts(filtered);
          setNewPostsAvailable(false);
      } else {
          if (filtered.length === 0) setHasMore(false);
          else setPosts(prev => [...prev, ...filtered]);
      }
      setLoading(false);
  };

  useEffect(() => {
      const loadInitial = async () => {
          await loadPosts(true);
          const [dbStories, dbStreams, newAds] = await Promise.all([
              getStories(),
              getActiveStreams(),
              getRandomAds(3)
          ]);
          setStories(formatStories(dbStories, user));
          setActiveStreams(dbStreams);
          setFeedAds(newAds);
      };
      loadInitial();

      // Real-time Feed Architecture
      if (isSupabaseConfigured) {
          const channel = supabase.channel('public_feed')
              // 1. Listen for New Posts
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
                  if (payload.new.userId !== user.id) { 
                      setNewPostsAvailable(true);
                  }
              })
              // 2. Listen for Real-time Comments
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
                  const newComment = payload.new as Comment;
                  const commentUser = await getUser(newComment.userId);
                  
                  setPosts(currentPosts => currentPosts.map(p => {
                      if (p.id === newComment.postId) {
                          if (newComment.userId === user.id) return p;
                          
                          const fullComment = { 
                              ...newComment, 
                              user: commentUser || { name: 'User', avatar: 'https://picsum.photos/50/50' } as User,
                              children: [] 
                          };
                          return { ...p, comments: [...p.comments, fullComment] };
                      }
                      return p;
                  }));
              })
              // 3. Listen for Real-time Reactions (Likes)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_reactions' }, (payload) => {
                  if (payload.new.userId === user.id) return; 
                  setPosts(current => current.map(p => {
                      if (p.id === payload.new.postId) {
                          const currentReactions = p.reactions || [];
                          // Add the new reaction to local state
                          return { 
                              ...p, 
                              likes: p.likes + 1,
                              reactions: [...currentReactions, { id: payload.new.id, userId: payload.new.userId, type: payload.new.type }]
                          };
                      }
                      return p;
                  }));
              })
              .subscribe();
          return () => { supabase.removeChannel(channel); };
      }
  }, [user.id, groupId, pageId, eventId]); 

  useEffect(() => {
      if (page === 1) return;
      loadPosts(false);
      if (page % 2 === 0) {
          getRandomAds(1).then(moreAds => setFeedAds(prev => [...prev, ...moreAds]));
      }
  }, [page]);

  const formatStories = (dbStories: Story[], currentUser: User) => {
      const placeholder = { 
         id: 'create_placeholder', userId: currentUser.id, 
         user: currentUser, imageUrl: currentUser.avatar, 
         isViewed: false, timestamp: Date.now() 
      };
      const validStories = dbStories.filter(s => {
           return s.timestamp > (Date.now() - 86400000) && s.id !== 'create_placeholder';
      });
      return [placeholder, ...validStories];
  };

  const handlePostCreate = (content: string, image: string | undefined, video: string | undefined, tags: string[], visibility: any, poll?: any) => {
    const newPost: Post = {
      id: `p${Date.now()}`, userId: user.id, user, content,
      imageUrl: image, videoUrl: video, likes: 0, comments: [], shares: 0, timestamp: Date.now(), tags, visibility,
      pollQuestion: poll?.question, pollOptions: poll?.options,
      groupId: groupId, pageId: pageId, eventId: eventId
    };
    setPosts([newPost, ...posts]);
    savePosts([newPost]);
    setShowCreatePostModal(false);
  };

  // --- EDIT POST LOGIC ---
  const handleEditClick = (post: Post) => {
      setEditingPostId(post.id);
      setEditContent(post.content);
      setActiveMenuPostId(null);
  };

  const handleSaveEdit = async () => {
      if (!editingPostId) return;
      
      const updatedPosts = posts.map(p => {
          if (p.id === editingPostId) {
              return { ...p, content: editContent, isEdited: true };
          }
          return p;
      });
      
      setPosts(updatedPosts);
      
      // Persist to storage
      const postToSave = updatedPosts.find(p => p.id === editingPostId);
      if (postToSave) await savePosts([postToSave]);
      
      setEditingPostId(null);
      setEditContent('');
  };

  const handleCancelEdit = () => {
      setEditingPostId(null);
      setEditContent('');
  };
  // ----------------------

  const handleReaction = async (postId: string, type: ReactionType) => {
      setPosts(posts.map(p => {
          if (p.id === postId) {
              const existing = p.reactions?.find(r => r.userId === user.id);
              let newReactions = p.reactions || [];
              if (existing) {
                   if (existing.type === type) {
                       newReactions = newReactions.filter(r => r.userId !== user.id);
                   } else {
                       newReactions = newReactions.map(r => r.userId === user.id ? { ...r, type } : r);
                   }
              } else {
                  newReactions = [...newReactions, { id: `temp_${Date.now()}`, userId: user.id, type }];
              }
              return { ...p, reactions: newReactions, likes: newReactions.length };
          }
          return p;
      }));
      setActiveReactionId(null);
      await addReaction(postId, user.id, type);
  };

  const handleVote = async (postId: string, optionId: string) => {
      setPosts(posts.map(p => {
          if (p.id === postId && p.pollOptions) {
              const updatedOptions = p.pollOptions.map(opt => {
                  const votes = opt.votes || [];
                  if (opt.id === optionId) {
                      if (!votes.includes(user.id)) return { ...opt, votes: [...votes, user.id] };
                  } else {
                      return { ...opt, votes: votes.filter(id => id !== user.id) }; // Single choice
                  }
                  return opt;
              });
              return { ...p, pollOptions: updatedOptions };
          }
          return p;
      }));
  };

  const handleShare = async (post: Post) => {
      if (confirm("Share this post to your feed?")) {
          const sharedPost: Post = {
              id: `share_${Date.now()}`,
              userId: user.id,
              user: user,
              content: `Shared ${post.user.name}'s post`,
              originalPostId: post.originalPostId || post.id,
              originalPost: post.originalPost || post,
              timestamp: Date.now(),
              likes: 0, comments: [], shares: 0, tags: [], visibility: 'Public'
          };
          setPosts([sharedPost, ...posts]);
          await sharePost(post, user.id, `Shared post`);
      }
  };

  const handleStorySave = async (data: any) => {
      const newStory: Story = {
          id: `s${Date.now()}`,
          userId: user.id, user,
          imageUrl: !data.isVideo ? data.file : undefined,
          videoUrl: data.isVideo ? data.file : undefined,
          isViewed: false, timestamp: Date.now(), duration: 5000,
          privacy: data.privacy, filter: data.filter, textOverlay: data.text
      };
      const newStories = [...stories];
      newStories.splice(1, 0, newStory);
      setStories(newStories);
      await saveStories([newStory]);
      setStoryFile(null);
  };

  const handleAddComment = async (postId: string) => {
      if(!commentText.trim()) return;
      const newComment: Comment = {
          id: `c${Date.now()}`, userId: user.id, user, text: commentText, timestamp: Date.now(),
          parentId: replyingTo?.commentId 
      };
      
      setPosts(posts.map(p => {
          if (p.id === postId) {
              return { ...p, comments: [...p.comments, newComment] };
          }
          return p;
      }));
      
      await addComment(postId, user.id, commentText, replyingTo?.commentId);
      setCommentText('');
      setReplyingTo(null);
  };

  const handleAdClick = async (ad: Ad) => {
      await trackAdClick(ad.id);
      window.open(ad.ctaLink, '_blank');
  };

  const handleBlockUser = async (targetUserId: string) => {
      if (confirm("Block this user? You won't see their posts anymore.")) {
          await blockUser(user.id, targetUserId);
          setPosts(posts.filter(p => p.userId !== targetUserId));
          setActiveMenuPostId(null);
      }
  };

  const handleReportPost = async (postId: string) => {
      if (confirm("Report this content as inappropriate?")) {
          await reportContent(user.id, postId, 'POST', 'Inappropriate content');
          alert("Thank you. We will review this post.");
          setActiveMenuPostId(null);
      }
  };

  const handleSavePost = (postId: string) => {
      try {
        const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]');
        if (!Array.isArray(saved)) {
             localStorage.setItem('saved_posts', JSON.stringify([postId]));
             alert("Post saved!");
             return;
        }
        if (!saved.includes(postId)) {
            localStorage.setItem('saved_posts', JSON.stringify([...saved, postId]));
            alert("Post saved to your collection.");
        } else {
            alert("You have already saved this post.");
        }
      } catch (e) {
        localStorage.setItem('saved_posts', JSON.stringify([postId]));
      }
      setActiveMenuPostId(null);
  };

  const organizeComments = (comments: Comment[]): CommentWithChildren[] => {
      const map = new Map<string, CommentWithChildren>();
      comments.forEach(c => map.set(c.id, { ...c, children: [] } as CommentWithChildren));
      const roots: CommentWithChildren[] = [];
      comments.forEach(c => {
          const node = map.get(c.id);
          if (node) {
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
          }
      });
      return roots.sort((a, b) => a.timestamp - b.timestamp); 
  };

  return (
    <div className="max-w-[600px] mx-auto space-y-6 pb-20 relative" onClick={() => setActiveMenuPostId(null)}>
      
      {/* New Posts Pill */}
      {newPostsAvailable && (
          <button 
            onClick={() => loadPosts(true)}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#1877F2] text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce hover:bg-[#166fe5]"
          >
              <ArrowUp size={16} /> New Posts Available
          </button>
      )}

      {/* Only show Stories and Live if NOT in a specific context feed */}
      {!groupId && !pageId && !eventId && (
          <>
              <input ref={storyInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={e => setStoryFile(e.target.files?.[0] || null)} />
              {storyFile && <StoryEditor file={storyFile} onSave={handleStorySave} onCancel={() => setStoryFile(null)} />}
              {selectedStoryIndex !== null && <StoryViewer stories={stories} initialIndex={selectedStoryIndex} onClose={() => setSelectedStoryIndex(null)} />}
              {showLiveViewer && <div className="fixed inset-0 z-[100] bg-black"><button onClick={() => setShowLiveViewer(false)} className="absolute top-5 right-5 z-50 text-white"><XCircle size={32} /></button><LiveStreamComponent /></div>}

              {activeStreams.length > 0 && (
                  <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2 mb-2">
                      {activeStreams.map(stream => (
                          <div key={stream.id} onClick={() => setShowLiveViewer(true)} className="relative flex-shrink-0 w-[150px] h-[200px] rounded-xl overflow-hidden cursor-pointer border-2 border-red-500 animate-pulse-slow">
                               <video src={stream.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                               <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">LIVE</div>
                               <div className="absolute bottom-2 left-2 text-white text-xs font-bold drop-shadow-md">{stream.title}</div>
                          </div>
                      ))}
                  </div>
              )}

              <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
                 {stories.map((story, idx) => (
                    <div key={story.id} onClick={() => idx === 0 ? storyInputRef.current?.click() : setSelectedStoryIndex(idx)} className="relative flex-shrink-0 w-[110px] h-[180px] rounded-xl overflow-hidden cursor-pointer group bg-black border border-[#DADDE1] dark:border-slate-700">
                       {idx === 0 ? (
                           <div className="w-full h-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                               <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center mb-2 border-4 border-white">
                                   <Plus className="text-white" size={20} />
                               </div>
                               <span className="text-xs font-bold text-[#1C1E21] dark:text-white">Create Story</span>
                           </div>
                       ) : (
                           <>
                               <img src={story.imageUrl || story.user.avatar} className={`w-full h-full object-cover opacity-90 ${story.filter}`} alt="" />
                               <div className="absolute bottom-2 left-2 text-white text-xs font-bold truncate w-20 shadow-sm">{story.user.name}</div>
                               <div className={`absolute top-2 left-2 w-8 h-8 rounded-full border-2 ${story.isViewed ? 'border-gray-500' : 'border-[#1877F2]'} overflow-hidden`}>
                                   <img src={story.user.avatar} className="w-full h-full object-cover" />
                               </div>
                           </>
                       )}
                    </div>
                 ))}
              </div>
          </>
      )}

      {(groupId || pageId) ? (
          <div className="bg-white dark:bg-[#242526] p-4 rounded-xl mb-4 text-center font-bold dark:text-white shadow-sm border border-[#DADDE1]">
              {groupId ? 'Group Discussion' : 'Page Feed'}
          </div>
      ) : (
          <>
             {/* Desktop: Inline Create Post */}
             <div className="hidden md:block">
                 <CreatePost user={user} onPostCreate={handlePostCreate} />
             </div>
             
             {/* Mobile: Button to Open Modal */}
             <div className="md:hidden bg-white dark:bg-[#242526] p-4 rounded-xl mb-4 shadow-sm border border-[#DADDE1] dark:border-slate-700 flex items-center gap-3">
                 <img src={user.avatar} className="w-10 h-10 rounded-full" />
                 <button 
                    onClick={() => setShowCreatePostModal(true)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                     What's on your mind?
                 </button>
                 <div className="text-green-500"><MessageCircle /></div>
             </div>
          </>
      )}

      {/* Create Post Modal (Mobile mainly) */}
      {showCreatePostModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-center w-full dark:text-white">Create Post</h3>
                      <button onClick={() => setShowCreatePostModal(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full absolute right-4 top-3">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-4">
                      <CreatePost user={user} onPostCreate={handlePostCreate} />
                  </div>
              </div>
          </div>
      )}

      {/* Feed */}
      {posts.map((post, index) => {
          const isRef = index === posts.length - 1;
          const userReaction = post.reactions?.find(r => r.userId === user.id)?.type;
          const isEditing = editingPostId === post.id;
          
          // CRITICAL: Use the *current* user object for your own posts to prevent staleness
          const displayUser = post.userId === user.id ? user : post.user;
          const isFollowing = user.followingIds?.includes(post.userId);
          
          const showAd = index > 0 && index % 5 === 0;
          const adIndex = Math.floor(index / 5) - 1;
          const ad = feedAds[adIndex % feedAds.length];
          
          const commentTree = organizeComments(post.comments);

          return (
            <React.Fragment key={post.id}>
                {showAd && ad && (
                    <div ref={(node) => node && adRef(node, ad.id)} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm mb-6 overflow-hidden border border-[#DADDE1] dark:border-slate-700">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={ad.user?.avatar || 'https://picsum.photos/50/50?random=ad'} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <div className="font-bold text-sm text-[#1C1E21] dark:text-white">{ad.user?.name || 'Sponsored'}</div>
                                    <div className="text-xs text-[#606770] flex items-center gap-1">Sponsored <Globe size={10}/></div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 pb-2 text-[#1C1E21] dark:text-white font-medium">{ad.title}</div>
                        <img src={ad.mediaUrl} className="w-full object-cover max-h-[400px]" />
                        <div className="bg-[#F0F2F5] dark:bg-slate-800 p-3 flex justify-between items-center">
                            <div className="text-sm text-[#606770] dark:text-slate-300 line-clamp-1">{ad.content}</div>
                            <button onClick={() => handleAdClick(ad)} className="bg-[#E4E6EB] dark:bg-slate-600 hover:bg-[#D8DADF] px-4 py-2 rounded font-bold text-sm text-[#1C1E21] flex items-center gap-1 whitespace-nowrap">
                                {ad.ctaText} <ExternalLink size={14}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* Post Article with Z-Index Fix */}
                <article 
                    ref={isRef ? lastPostElementRef : null} 
                    className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-visible relative animate-in fade-in slide-in-from-bottom-4 duration-500 border border-[#DADDE1] dark:border-slate-700"
                    style={{ zIndex: activeMenuPostId === post.id ? 50 : 1 }}
                >
                <div className="p-4 flex justify-between items-start">
                    <div className="flex gap-3">
                        <img src={displayUser.avatar || 'https://picsum.photos/100/100?grayscale'} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                            <div className="font-bold text-sm text-[#1C1E21] dark:text-white flex items-center gap-1">
                                {displayUser.name} 
                                {displayUser.isVerified && <div className="bg-[#1877F2] text-white rounded-full p-0.5"><Globe size={8} /></div>}
                                {post.userId !== user.id && !isFollowing && (
                                    <button 
                                        onClick={() => onToggleFollow(post.userId)} 
                                        className="ml-2 text-[#1877F2] text-xs font-bold hover:underline flex items-center gap-0.5"
                                    >
                                        • Follow
                                    </button>
                                )}
                                {post.originalPost && <span className="font-normal text-[#606770]">shared a post</span>}
                            </div>
                            <div className="text-xs text-[#606770] flex items-center gap-1">
                                {new Date(post.timestamp).toLocaleDateString()} • {post.isEdited ? 'Edited' : ''}
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }} className="text-[#606770] p-2 hover:bg-[#F0F2F5] rounded-full"><MoreHorizontal /></button>
                        {activeMenuPostId === post.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-[#DADDE1] dark:border-slate-700 z-[100] overflow-hidden">
                                <button onClick={() => handleSavePost(post.id)} className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-[#1C1E21] dark:text-white"><Save size={16}/> Save Post</button>
                                {post.userId === user.id && (
                                    <button onClick={() => handleEditClick(post)} className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-[#1C1E21] dark:text-white"><Edit2 size={16}/> Edit Post</button>
                                )}
                                {post.userId !== user.id && (
                                    <>
                                        <button onClick={() => handleReportPost(post.id)} className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-orange-600"><Flag size={16}/> Report</button>
                                        <button onClick={() => handleBlockUser(post.userId)} className="w-full text-left px-4 py-2 hover:bg-[#F0F2F5] dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-red-600"><UserX size={16}/> Block User</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Mode or View Mode */}
                {isEditing ? (
                    <div className="px-4 pb-4">
                        <textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border border-[#DADDE1] dark:border-slate-600 rounded-lg bg-[#F0F2F5] dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1877F2] min-h-[100px]"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm font-bold text-[#606770] bg-[#E4E6EB] rounded-lg hover:bg-[#D8DADF]">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm font-bold text-white bg-[#1877F2] rounded-lg hover:bg-[#166fe5] flex items-center gap-1">
                                <Check size={14} /> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 pb-2 text-[#1C1E21] dark:text-white whitespace-pre-wrap">{post.content}</div>
                )}

                {post.pollOptions && !isEditing && (
                    <div className="px-4 pb-4 space-y-2">
                        {post.pollOptions.map(opt => {
                            const totalVotes = post.pollOptions!.reduce((acc, o) => acc + (o.votes?.length || 0), 0);
                            const percent = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
                            const hasVoted = opt.votes?.includes(user.id);
                            return (
                                <div key={opt.id} onClick={() => handleVote(post.id, opt.id)} className="relative h-10 bg-[#F0F2F5] dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer border border-[#DADDE1] dark:border-gray-600">
                                    <div className="absolute top-0 left-0 h-full bg-blue-100 dark:bg-blue-900/50 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                    <div className="absolute inset-0 flex items-center justify-between px-3 text-sm font-medium z-10 text-[#1C1E21] dark:text-white">
                                        <span>{opt.text} {hasVoted && <span className="text-[#1877F2] ml-2">✓</span>}</span>
                                        <span>{percent}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {post.originalPost && (
                    <div className="mx-4 mb-4 border border-[#DADDE1] dark:border-gray-700 rounded-lg p-3">
                        <div className="flex gap-2 items-center mb-2">
                            <img src={post.originalPost.user.avatar} className="w-6 h-6 rounded-full" />
                            <span className="font-bold text-sm text-[#1C1E21] dark:text-white">{post.originalPost.user.name}</span>
                        </div>
                        <p className="text-sm text-[#1C1E21] dark:text-gray-300">{post.originalPost.content}</p>
                        {post.originalPost.imageUrl && <img src={post.originalPost.imageUrl} className="mt-2 rounded-lg max-h-48 object-cover" />}
                    </div>
                )}

                {post.imageUrl && <img src={post.imageUrl} className="w-full max-h-[600px] object-cover bg-[#F0F2F5]" alt="" />}
                {post.videoUrl && <video src={post.videoUrl} controls className="w-full max-h-[600px] bg-black" />}

                <div className="px-4 py-2 flex justify-between text-xs text-[#606770] border-b border-[#DADDE1] dark:border-gray-700">
                    <div className="flex items-center gap-1">
                        {post.likes > 0 && <div className="bg-[#1877F2] p-1 rounded-full text-white"><Heart size={10} fill="white" /></div>}
                        <span className="font-medium">{post.likes}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="hover:underline cursor-pointer">{post.comments.length} comments</span>
                        <span className="hover:underline cursor-pointer">{post.shares} shares</span>
                    </div>
                </div>

                <div className="px-2 py-1 flex justify-between relative">
                    <div className="flex-1 relative" onMouseEnter={() => setActiveReactionId(post.id)} onMouseLeave={() => setActiveReactionId(null)}>
                        {activeReactionId === post.id && (
                            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 shadow-xl rounded-full p-1 flex gap-1 animate-in zoom-in duration-200 border border-[#DADDE1] dark:border-gray-700 z-20">
                                {['👍','❤️','😆','😮','😢','😡'].map((emoji, i) => (
                                    <button key={i} onClick={() => handleReaction(post.id, ['LIKE','LOVE','HAHA','WOW','SAD','ANGRY'][i] as any)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={() => handleReaction(post.id, userReaction ? userReaction : 'LIKE')}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#F0F2F5] dark:hover:bg-gray-800 ${userReaction ? 'text-[#1877F2]' : 'text-[#606770] dark:text-gray-300'}`}
                        >
                            <Heart className={userReaction === 'LOVE' ? 'fill-red-500 text-red-500' : userReaction ? 'fill-[#1877F2] text-[#1877F2]' : ''} size={20} />
                            <span className="font-semibold text-sm">{userReaction || 'Like'}</span>
                        </button>
                    </div>
                    
                    <button onClick={() => setActiveCommentBoxId(activeCommentBoxId === post.id ? null : post.id)} className="flex-1 flex items-center justify-center gap-2 py-2 text-[#606770] dark:text-gray-300 hover:bg-[#F0F2F5] dark:hover:bg-gray-800 rounded-lg">
                        <MessageCircle size={20} /> <span className="font-semibold text-sm">Comment</span>
                    </button>

                    <button onClick={() => handleShare(post)} className="flex-1 flex items-center justify-center gap-2 py-2 text-[#606770] dark:text-gray-300 hover:bg-[#F0F2F5] dark:hover:bg-gray-800 rounded-lg">
                        <Share2 size={20} /> <span className="font-semibold text-sm">Share</span>
                    </button>
                </div>

                {(activeCommentBoxId === post.id || post.comments.length > 0) && (
                    <div className="px-4 pb-4 pt-2 bg-white dark:bg-gray-800/50">
                        {activeCommentBoxId === post.id && (
                            <div className="flex gap-2 mb-4 mt-2">
                                <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 relative">
                                    {replyingTo && (
                                        <div className="text-xs text-[#606770] mb-1 flex justify-between items-center ml-1">
                                            <span>Replying to <b>{replyingTo.userName}</b></span>
                                            <button onClick={() => setReplyingTo(null)}><XCircle size={12}/></button>
                                        </div>
                                    )}
                                    <input 
                                        autoFocus
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                                        className="w-full bg-[#F0F2F5] dark:bg-gray-700 rounded-full py-2 px-4 text-sm focus:outline-none text-[#1C1E21] dark:text-white border border-transparent focus:border-[#1877F2]" 
                                        placeholder="Write a comment..." 
                                    />
                                    <button onClick={() => handleAddComment(post.id)} className="absolute right-2 top-2 text-[#1877F2] p-1 hover:bg-gray-200 rounded-full"><Send size={16}/></button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                            {commentTree.map(c => (
                                <CommentNode 
                                    key={c.id} 
                                    comment={c} 
                                    onReply={(id, name) => { setReplyingTo({commentId: id, userName: name}); setActiveCommentBoxId(post.id); }} 
                                />
                            ))}
                        </div>
                    </div>
                )}
                </article>
            </React.Fragment>
          );
      })}
      {loading && <div className="text-center p-4"><div className="animate-spin w-6 h-6 border-2 border-[#1877F2] border-t-transparent rounded-full mx-auto"></div></div>}
      {!hasMore && !loading && <div className="text-center p-4 text-[#606770]">No more posts</div>}
    </div>
  );
};

export default Feed;
