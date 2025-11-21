
import React, { useState, useEffect, useRef } from 'react';
import { User, PortfolioItem, Story } from '../types';
import { MapPin, Briefcase, Link as LinkIcon, UserPlus, Camera, Edit, Grid, Image, Video, Plus, X, Save, Tag, Filter, Upload, UserCheck } from 'lucide-react';
import { savePortfolioItems, getPortfolioItems, getStories, saveStories } from '../services/storage';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onToggleFollow: (userId: string) => void;
}

const INITIAL_STORIES_FALLBACK: Story[] = [
  { id: 's1', userId: 'u0', user: { id: 'u0', name: 'You', avatar: 'https://picsum.photos/100/100?random=99', handle: '', type: 'Artist', location: '', followingIds: [] }, imageUrl: 'https://picsum.photos/100/100?random=99', isViewed: false, timestamp: Date.now() }
];

// Helper to compress images
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Increased max width since we have better storage now
        const MAX_WIDTH = 1200; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
            resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

const MOCK_PORTFOLIO_ITEMS: PortfolioItem[] = [
    { id: 'pf1', title: 'Sunset over Ganges', description: 'Oil on canvas, capturing the evening hues.', mediaUrl: 'https://picsum.photos/400/400?random=50', type: 'image', price: 15000, category: 'Paintings' },
    { id: 'pf2', title: 'Urban Chaos', description: 'Digital illustration of Mumbai traffic.', mediaUrl: 'https://picsum.photos/400/600?random=51', type: 'image', price: 5000, category: 'Digital Art' },
    { id: 'pf3', title: 'Clay Pot Series', description: 'Handcrafted clay pots with traditional motifs.', mediaUrl: 'https://picsum.photos/600/400?random=52', type: 'image', price: 2500, category: 'Sculpture' },
    { id: 'pf4', title: 'Neon Dreams', description: '3D render of a cyberpunk street.', mediaUrl: 'https://picsum.photos/400/400?random=53', type: 'image', price: 8000, category: 'Digital Art' },
];

// Mock Users for Suggestions
const SUGGESTED_USERS: User[] = [
  { id: 'u1', name: 'Aarav Patel', handle: '@aarav_art', avatar: 'https://picsum.photos/100/100?random=1', type: 'Artist', location: 'Mumbai', followingIds: [] },
  { id: 'u2', name: 'Priya Singh', handle: '@priya_colors', avatar: 'https://picsum.photos/100/100?random=2', type: 'Artist', location: 'Delhi', followingIds: [] },
  { id: 'u3', name: 'SoundWave Studio', handle: '@soundwave', avatar: 'https://picsum.photos/100/100?random=3', type: 'Studio', location: 'Bangalore', followingIds: [] },
  { id: 'u4', name: 'Neha Gupta', handle: '@neha_g', avatar: 'https://picsum.photos/100/100?random=4', type: 'Artist', location: 'Pune', followingIds: [] },
  { id: 'u5', name: 'Art Collective', handle: '@art_coll', avatar: 'https://picsum.photos/100/100?random=5', type: 'Collector', location: 'Chennai', followingIds: [] },
];

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onToggleFollow }) => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'ABOUT' | 'FRIENDS' | 'PHOTOS' | 'PORTFOLIO'>('POSTS');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  
  // Editing States
  const [editedBio, setEditedBio] = useState(user.bio || '');
  const [editedLocation, setEditedLocation] = useState(user.location || '');
  const [editedAvatar, setEditedAvatar] = useState(user.avatar);
  const [editedCover, setEditedCover] = useState(user.coverPhoto || '');

  // Story Input Ref
  const storyInputRef = useRef<HTMLInputElement>(null);

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  
  // New Item State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Paintings');
  const [newItemMedia, setNewItemMedia] = useState<string | undefined>(undefined);

  // Sync state with user prop when it changes
  useEffect(() => {
      setEditedBio(user.bio || '');
      setEditedLocation(user.location || '');
      setEditedAvatar(user.avatar);
      setEditedCover(user.coverPhoto || '');
  }, [user]);

  // Load portfolio from IndexedDB
  useEffect(() => {
      const loadPortfolio = async () => {
          try {
              const items = await getPortfolioItems();
              setPortfolioItems(items.length > 0 ? items : MOCK_PORTFOLIO_ITEMS);
          } catch (e) {
              console.error("Failed to load portfolio", e);
          }
      };
      loadPortfolio();
  }, []);

  // Save portfolio to IndexedDB when changed
  useEffect(() => {
      if (portfolioItems.length > 0) {
          savePortfolioItems(portfolioItems).catch(console.error);
      }
  }, [portfolioItems]);

  const categories = ['All', ...Array.from(new Set(portfolioItems.map(item => item.category)))];

  const filteredPortfolio = selectedCategory === 'All' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  // Filter Users for Friends Tab
  const myConnections = SUGGESTED_USERS.filter(u => user.followingIds?.includes(u.id));
  const suggestedArtists = SUGGESTED_USERS.filter(u => !user.followingIds?.includes(u.id) && u.id !== user.id);

  const handleSaveProfile = () => {
    const updatedUser = {
        ...user,
        bio: editedBio,
        location: editedLocation,
        avatar: editedAvatar,
        coverPhoto: editedCover
    };
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Reset state to original values
    setEditedBio(user.bio || '');
    setEditedLocation(user.location || '');
    setEditedAvatar(user.avatar);
    setEditedCover(user.coverPhoto || '');
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressed = await compressImage(file);
              setEditedAvatar(compressed);
          } catch (err) {
              console.error("Error processing image", err);
              alert("Could not process image.");
          }
      }
      // Reset input
      e.target.value = '';
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
             const compressed = await compressImage(file);
             setEditedCover(compressed);
          } catch (err) {
             console.error("Error processing image", err);
             alert("Could not process image.");
          }
      }
      // Reset input
      e.target.value = '';
  };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const isVideo = file.type.startsWith('video/');
            let result: string;
            
            if (isVideo) {
                const reader = new FileReader();
                result = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            } else {
                result = await compressImage(file);
            }

            let currentStories = await getStories();
            if (!currentStories || currentStories.length === 0) {
                currentStories = INITIAL_STORIES_FALLBACK;
            }

            const newStory: Story = {
                id: `s${Date.now()}`,
                userId: user.id, 
                user: user,
                imageUrl: isVideo ? undefined : result,
                videoUrl: isVideo ? result : undefined,
                isViewed: false,
                timestamp: Date.now(),
                duration: 5000
            };

            // Insert at index 1
            if (currentStories.length > 0) {
                currentStories.splice(1, 0, newStory);
            } else {
                currentStories.push(newStory);
            }

            await saveStories(currentStories);
            alert("Story added successfully!");
            
        } catch (err) {
            console.error("Error adding story", err);
            alert("Failed to add story.");
        }
    }
  };

  const handlePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
            const compressed = await compressImage(file);
            setNewItemMedia(compressed);
          } catch (err) {
             console.error("Error processing image", err);
             alert("Could not process image.");
          }
      }
  };

  const handleAddItem = () => {
      if (newItemTitle && newItemMedia) {
          const newItem: PortfolioItem = {
              id: `pf${Date.now()}`,
              title: newItemTitle,
              description: newItemDesc,
              mediaUrl: newItemMedia,
              type: 'image',
              price: newItemPrice ? parseFloat(newItemPrice) : undefined,
              category: newItemCategory
          };
          setPortfolioItems([newItem, ...portfolioItems]);
          setShowAddPortfolio(false);
          // Reset form
          setNewItemTitle('');
          setNewItemDesc('');
          setNewItemPrice('');
          setNewItemMedia(undefined);
      }
  };

  return (
    <div className="bg-white dark:bg-[#18191a] min-h-screen pb-10">
      <input 
          type="file" 
          ref={storyInputRef} 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleStoryUpload} 
      />

      {/* Cover & Profile Header */}
      <div className="bg-white dark:bg-[#242526] shadow-sm pb-4 mb-4">
          <div className="max-w-5xl mx-auto">
              <div className="relative h-[200px] md:h-[350px] rounded-b-xl overflow-hidden bg-gray-300 dark:bg-slate-800 group">
                  <img src={user.coverPhoto || 'https://picsum.photos/1200/400?random=999'} alt="Cover" className="w-full h-full object-cover" />
                  <button onClick={() => setIsEditing(true)} className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 text-black dark:text-white px-3 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <Camera size={16} /> Edit Cover Photo
                  </button>
              </div>

              <div className="px-4 md:px-8 relative flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-8 mb-4">
                  <div className="relative">
                    <div 
                        onClick={() => setViewingAvatar(true)}
                        className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-[#242526] overflow-hidden bg-gray-200 cursor-pointer hover:brightness-90 transition-all"
                        title="View Profile Picture"
                    >
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }} 
                        className="absolute bottom-2 right-2 bg-gray-200 dark:bg-slate-700 p-2 rounded-full cursor-pointer border-2 border-white dark:border-[#242526] hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        <Camera size={16} className="text-black dark:text-white" />
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left md:ml-4 mt-4 md:mt-0 md:mb-4">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h1>
                      <div className="flex flex-wrap justify-center md:justify-start gap-x-4 text-gray-500 dark:text-slate-400 font-semibold mt-1">
                        <span>{user.followers || 0} Followers</span>
                        <span>•</span>
                        <span>{user.following || 0} Following</span>
                      </div>
                      
                      <div className="flex justify-center md:justify-start -space-x-2 mt-2">
                          {myConnections.slice(0, 5).map(u => (
                              <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#242526]" alt="Friend" />
                          ))}
                      </div>
                  </div>

                  <div className="flex space-x-2 mt-4 md:mt-0 md:mb-6">
                      <button 
                        onClick={() => storyInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                          <Plus size={18} /> Add to Story
                      </button>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-black dark:text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                      >
                          <Edit size={18} /> Edit Profile
                      </button>
                  </div>
              </div>

              <div className="w-[95%] mx-auto h-px bg-gray-300 dark:bg-slate-700 mb-1"></div>

              <div className="px-4 md:px-8 max-w-5xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar">
                  {['POSTS', 'ABOUT', 'FRIENDS', 'PHOTOS', 'PORTFOLIO'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === tab 
                            ? 'text-blue-500 border-b-2 border-blue-500 rounded-b-none' 
                            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Left Column (Intro & Photos) */}
          <div className="space-y-4">
              <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800">
                  <h2 className="font-bold text-xl mb-3 text-gray-900 dark:text-slate-100">Intro</h2>
                  <p className="text-center text-gray-700 dark:text-slate-300 mb-4">{user.bio || "Digital Artist | Exploring colors & chaos ✨"}</p>
                  
                  <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                          <Briefcase size={18} className="text-gray-400" />
                          <span>Artist at <strong>Freelance</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-gray-400" />
                          <span>Lives in <strong>{user.location}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                          <LinkIcon size={18} className="text-gray-400" />
                          <a href="#" className="text-blue-500 hover:underline">portfolio.com</a>
                      </div>
                  </div>

                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-black dark:text-white py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                      Edit Details
                  </button>
              </div>

              <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800">
                   <div className="flex justify-between items-center mb-3">
                       <h2 className="font-bold text-xl text-gray-900 dark:text-slate-100">Photos</h2>
                       <button className="text-blue-500 text-sm">See all</button>
                   </div>
                   <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                       {[1,2,3,4,5,6,7,8,9].map(i => (
                           <img key={i} src={`https://picsum.photos/150/150?random=${i + 100}`} className="w-full aspect-square object-cover" alt="" />
                       ))}
                   </div>
              </div>
          </div>

          {/* Main Content Column */}
          <div className="md:col-span-2">
              {activeTab === 'POSTS' && (
                 <div className="space-y-4">
                   <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800 flex flex-col gap-2 text-center py-8">
                       <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center text-gray-400">
                         <Grid size={32} />
                       </div>
                       <h3 className="font-bold text-gray-900 dark:text-white text-lg">No posts yet</h3>
                       <p className="text-gray-500 dark:text-slate-400">Create a post to share your art with the world!</p>
                   </div>
                 </div>
              )}

              {activeTab === 'FRIENDS' && (
                <div className="space-y-6">
                    {/* My Connections */}
                    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800">
                        <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-slate-100">Your Connections ({myConnections.length})</h2>
                        {myConnections.length === 0 ? (
                            <p className="text-gray-500 dark:text-slate-400 text-sm">You haven't followed anyone yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {myConnections.map(u => (
                                    <div key={u.id} className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                        <img src={u.avatar} className="w-12 h-12 rounded-full object-cover mr-3" alt={u.name} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{u.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.type} • {u.location}</p>
                                        </div>
                                        <button 
                                            onClick={() => onToggleFollow(u.id)}
                                            className="ml-2 px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Unfollow
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Suggested Artists */}
                    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800">
                        <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-slate-100">Suggested for You</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {suggestedArtists.map(u => (
                                <div key={u.id} className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                    <img src={u.avatar} className="w-12 h-12 rounded-full object-cover mr-3" alt={u.name} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{u.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.type} • {u.location}</p>
                                    </div>
                                    <button 
                                        onClick={() => onToggleFollow(u.id)}
                                        className="ml-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                    >
                                        <UserPlus size={14} /> Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'PORTFOLIO' && (
                   <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 border border-transparent dark:border-slate-800 min-h-[500px]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                          <div>
                              <h2 className="font-bold text-2xl text-gray-900 dark:text-slate-100">Artist Portfolio</h2>
                              <p className="text-sm text-gray-500">Showcase your best work and products.</p>
                          </div>
                          <button 
                            onClick={() => setShowAddPortfolio(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                          >
                              <Plus size={16} /> Add Item
                          </button>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                          <div className="flex items-center gap-2 text-gray-500 mr-2">
                              <Filter size={16} />
                              <span className="text-sm font-medium">Filter:</span>
                          </div>
                          {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                                    selectedCategory === cat 
                                    ? 'bg-blue-500 text-white border-blue-500' 
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-transparent hover:bg-gray-200'
                                }`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div 
                            onClick={() => setShowAddPortfolio(true)}
                            className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-gray-500">
                                  <Plus size={24} />
                              </div>
                              <span className="font-semibold text-gray-500 dark:text-slate-400">Add New Work</span>
                          </div>

                          {filteredPortfolio.map((item) => (
                              <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow border border-gray-200 dark:border-slate-700">
                                  <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                                      <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      {item.price && (
                                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                                              ₹{item.price.toLocaleString()}
                                          </div>
                                      )}
                                      <div className="absolute top-2 left-2 bg-white/90 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                          {item.category}
                                      </div>
                                  </div>
                                  <div className="p-3">
                                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
                                      <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-1 h-10">{item.description}</p>
                                      <button className="w-full mt-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-sm font-semibold rounded text-gray-700 dark:text-slate-300 transition-colors">
                                          View Details
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                   </div>
              )}
          </div>

      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#242526] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={handleCancelEdit} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Profile Picture</h3>
                            <label className="text-blue-500 text-sm hover:underline font-medium cursor-pointer flex items-center gap-1">
                                <Upload size={14} /> Upload New
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div className="flex justify-center">
                             <div className="relative group cursor-pointer">
                                <img src={editedAvatar} className="w-32 h-32 rounded-full border-4 border-gray-200 dark:border-slate-700 object-cover" alt="Profile" />
                                <label className="absolute bottom-0 right-0 bg-gray-200 dark:bg-slate-700 p-2 rounded-full border-2 border-white dark:border-[#242526] cursor-pointer hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                                    <Camera size={16} className="text-black dark:text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                </label>
                             </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Cover Photo</h3>
                            <label className="text-blue-500 text-sm hover:underline font-medium cursor-pointer flex items-center gap-1">
                                <Upload size={14} /> Upload New
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                            </label>
                        </div>
                        <div className="h-36 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-800 relative group">
                             <img src={editedCover} className="w-full h-full object-cover" alt="Cover" />
                             <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                 <Camera size={24} className="text-white drop-shadow-lg" />
                                 <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                             </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Bio</h3>
                            <span className="text-gray-500 text-xs">101 characters remaining</span>
                        </div>
                        <textarea 
                            className="w-full bg-gray-100 dark:bg-slate-800 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700"
                            value={editedBio}
                            onChange={(e) => setEditedBio(e.target.value)}
                            placeholder="Describe yourself..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Customize Your Intro</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                                <MapPin size={24} className="text-gray-400" />
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 uppercase font-bold">Location</label>
                                    <input 
                                        type="text" 
                                        value={editedLocation} 
                                        onChange={(e) => setEditedLocation(e.target.value)}
                                        className="bg-transparent border-b border-gray-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none w-full py-1 font-medium dark:text-white"
                                        placeholder="Add location"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3">
                    <button 
                        onClick={handleCancelEdit}
                        className="flex-1 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveProfile} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {showAddPortfolio && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Portfolio Item</h2>
                      <button onClick={() => setShowAddPortfolio(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div className="flex justify-center mb-4">
                          <label className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative overflow-hidden">
                              <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioFileChange} />
                              {newItemMedia ? (
                                  <img src={newItemMedia} alt="Preview" className="w-full h-full object-contain" />
                              ) : (
                                  <>
                                      <Image size={40} className="text-gray-400 mb-2" />
                                      <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">Click to upload image</span>
                                  </>
                              )}
                          </label>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Title</label>
                          <input 
                              type="text" 
                              className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none"
                              placeholder="Artwork Title"
                              value={newItemTitle}
                              onChange={(e) => setNewItemTitle(e.target.value)}
                          />
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Category</label>
                              <div className="relative">
                                  <Tag size={16} className="absolute left-3 top-3 text-gray-400" />
                                  <select 
                                      className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-lg p-2.5 pl-10 text-gray-900 dark:text-white focus:outline-none appearance-none"
                                      value={newItemCategory}
                                      onChange={(e) => setNewItemCategory(e.target.value)}
                                  >
                                      <option>Paintings</option>
                                      <option>Digital Art</option>
                                      <option>Sculpture</option>
                                      <option>Photography</option>
                                      <option>Sketches</option>
                                      <option>Mixed Media</option>
                                  </select>
                              </div>
                          </div>
                          <div className="flex-1">
                              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Price (₹)</label>
                              <input 
                                  type="number" 
                                  className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none"
                                  placeholder="0.00"
                                  value={newItemPrice}
                                  onChange={(e) => setNewItemPrice(e.target.value)}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Description</label>
                          <textarea 
                              rows={3}
                              className="w-full bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none"
                              placeholder="Tell us about this piece..."
                              value={newItemDesc}
                              onChange={(e) => setNewItemDesc(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex gap-3">
                      <button 
                          onClick={() => setShowAddPortfolio(false)}
                          className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleAddItem}
                          disabled={!newItemTitle || !newItemMedia}
                          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Add Item
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Avatar Preview Modal */}
      {viewingAvatar && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center animate-in fade-in duration-200 p-4" onClick={() => setViewingAvatar(false)}>
            <button onClick={() => setViewingAvatar(false)} className="absolute top-5 right-5 text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors hover:bg-white/20">
                <X size={32} />
            </button>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}
    </div>
  );
};

export default Profile;
