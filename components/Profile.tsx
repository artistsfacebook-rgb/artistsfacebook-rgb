
import React, { useState, useEffect, useRef } from 'react';
import { User, PortfolioItem, Story } from '../types';
import { MapPin, Briefcase, Link as LinkIcon, UserPlus, Camera, Edit, Grid, Image, Video, Plus, X, Save, Tag, Filter, Upload, UserCheck, Wand2, Lock, Globe, BadgeCheck, Shield, Eye, Bell, UserMinus, Check, MoreHorizontal, Mail } from 'lucide-react';
import { savePortfolioItems, getPortfolioItems, getStories, saveStories, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getUser, getAllUsers } from '../services/storage';
import { generateAIProfilePicture } from '../services/geminiService';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onToggleFollow: (userId: string) => void; // Legacy for feed actions
}

const INITIAL_STORIES_FALLBACK: Story[] = [
  { id: 's1', userId: 'u0', user: { id: 'u0', name: 'You', avatar: 'https://picsum.photos/100/100?random=99', handle: '', type: 'Artist', location: '', followingIds: [], friends: [], friendRequests: [], sentRequests: [], blockedUsers: [] }, imageUrl: 'https://picsum.photos/100/100?random=99', isViewed: false, timestamp: Date.now() }
];

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
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

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onToggleFollow }) => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'ABOUT' | 'FRIENDS' | 'PHOTOS' | 'PORTFOLIO'>('POSTS');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  
  // Editing States
  const [editedBio, setEditedBio] = useState(user.bio || '');
  const [editedLocation, setEditedLocation] = useState(user.location || '');
  const [editedAvatar, setEditedAvatar] = useState(user.avatar);
  const [editedCover, setEditedCover] = useState(user.coverPhoto || '');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  
  // Privacy & Notification Settings State
  const [privacySettings, setPrivacySettings] = useState(user.privacySettings || { profileVisibility: 'Public', showOnlineStatus: true, allowTagging: true });
  const [notifSettings, setNotifSettings] = useState(user.notificationSettings || {
      emailNotifications: true,
      pushNotifications: true,
      types: { likes: true, comments: true, follows: true, mentions: true, liveEvents: true, friendRequests: true, groups: true }
  });

  const storyInputRef = useRef<HTMLInputElement>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  
  // Friend System Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);

  // Portfolio States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Paintings');
  const [newItemMedia, setNewItemMedia] = useState<string | undefined>(undefined);

  // Load Data
  useEffect(() => {
      setEditedBio(user.bio || '');
      setEditedLocation(user.location || '');
      setEditedAvatar(user.avatar);
      setEditedCover(user.coverPhoto || '');
      setPrivacySettings(user.privacySettings || { profileVisibility: 'Public', showOnlineStatus: true, allowTagging: true });
      setNotifSettings(user.notificationSettings || {
          emailNotifications: true,
          pushNotifications: true,
          types: { likes: true, comments: true, follows: true, mentions: true, liveEvents: true, friendRequests: true, groups: true }
      });
      
      const loadData = async () => {
          // Load Portfolio
          const items = await getPortfolioItems();
          setPortfolioItems(items);

          // Load Users for Friend Lists
          const users = await getAllUsers();
          setAllUsers(users);

          // Populate Friend Request List (Incoming)
          const reqs = users.filter(u => user.friendRequests?.includes(u.id));
          setFriendRequests(reqs);

          // Populate Friends List
          const friends = users.filter(u => user.friends?.includes(u.id));
          setFriendsList(friends);
      };
      loadData();
  }, [user]);

  // Save portfolio persistence
  useEffect(() => {
      if (portfolioItems.length > 0) {
          savePortfolioItems(portfolioItems).catch(console.error);
      }
  }, [portfolioItems]);

  const categories = ['All', ...Array.from(new Set(portfolioItems.map(item => item.category)))];
  const filteredPortfolio = selectedCategory === 'All' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  // Suggested Friends (Not friends, not requested, not me)
  const suggestedFriends = allUsers.filter(u => 
    u.id !== user.id && 
    !user.friends?.includes(u.id) && 
    !user.friendRequests?.includes(u.id) &&
    !user.sentRequests?.includes(u.id)
  ).slice(0, 6);

  const handleSaveProfile = () => {
    const updatedUser = {
        ...user,
        bio: editedBio,
        location: editedLocation,
        avatar: editedAvatar,
        coverPhoto: editedCover,
        privacySettings: privacySettings,
        notificationSettings: notifSettings
    };
    onUpdateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedBio(user.bio || '');
    setEditedLocation(user.location || '');
    setEditedAvatar(user.avatar);
    setEditedCover(user.coverPhoto || '');
    setPrivacySettings(user.privacySettings || { profileVisibility: 'Public', showOnlineStatus: true, allowTagging: true });
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
          }
      }
      e.target.value = '';
  };

  const handleGenerateAvatar = async () => {
      setIsGeneratingAvatar(true);
      try {
          const generatedUrl = await generateAIProfilePicture(user.name, editedBio);
          if (generatedUrl) setEditedAvatar(generatedUrl);
          else alert("Could not generate image.");
      } catch (error) {
          console.error(error);
      } finally {
          setIsGeneratingAvatar(false);
      }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
             const compressed = await compressImage(file);
             setEditedCover(compressed);
          } catch (err) { console.error(err); }
      }
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
            if (!currentStories || currentStories.length === 0) currentStories = INITIAL_STORIES_FALLBACK;

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

            if (currentStories.length > 0) currentStories.splice(1, 0, newStory);
            else currentStories.push(newStory);

            await saveStories(currentStories);
            alert("Story added successfully!");
            
        } catch (err) { console.error(err); }
    }
  };

  const handlePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
            const compressed = await compressImage(file);
            setNewItemMedia(compressed);
          } catch (err) { console.error(err); }
      }
  };

  const handleAddItem = () => {
      if (newItemTitle && newItemMedia) {
          const newItem: PortfolioItem = {
              id: `pf${Date.now()}`,
              userId: user.id,
              title: newItemTitle,
              description: newItemDesc,
              mediaUrl: newItemMedia,
              type: 'image',
              price: newItemPrice ? parseFloat(newItemPrice) : undefined,
              category: newItemCategory
          };
          setPortfolioItems([newItem, ...portfolioItems]);
          setShowAddPortfolio(false);
          setNewItemTitle(''); setNewItemDesc(''); setNewItemPrice(''); setNewItemMedia(undefined);
      }
  };

  // Friend Actions
  const handleSendRequest = async (targetId: string) => {
      await sendFriendRequest(user, targetId);
      // Optimistic update locally
      const u = { ...user, sentRequests: [...(user.sentRequests || []), targetId] };
      onUpdateUser(u);
  };

  const handleAcceptRequest = async (targetId: string) => {
      await acceptFriendRequest(user, targetId);
      // Optimistic update
      const u = { 
          ...user, 
          friends: [...(user.friends || []), targetId],
          friendRequests: (user.friendRequests || []).filter(id => id !== targetId)
      };
      onUpdateUser(u);
  };

  const handleRejectRequest = async (targetId: string) => {
      await rejectFriendRequest(user, targetId);
      const u = { ...user, friendRequests: (user.friendRequests || []).filter(id => id !== targetId) };
      onUpdateUser(u);
  };

  // Edit Tab State
  const [editTab, setEditTab] = useState<'INFO' | 'PRIVACY' | 'NOTIFICATIONS'>('INFO');

  return (
    <div className="bg-white dark:bg-[#18191a] min-h-screen pb-10">
      <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />

      {/* Header */}
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
                    <div onClick={() => setViewingAvatar(true)} className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-[#242526] overflow-hidden bg-gray-200 cursor-pointer hover:brightness-90 transition-all">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute bottom-2 right-2 bg-gray-200 dark:bg-slate-700 p-2 rounded-full cursor-pointer border-2 border-white dark:border-[#242526] hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                        <Camera size={16} className="text-black dark:text-white" />
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left md:ml-4 mt-4 md:mt-0 md:mb-4">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center justify-center md:justify-start gap-2">
                          {user.name}
                          {user.isVerified && <BadgeCheck className="text-blue-500 fill-current" size={24} />}
                      </h1>
                      <div className="flex flex-wrap justify-center md:justify-start gap-x-4 text-gray-500 dark:text-slate-400 font-semibold mt-1">
                        <span>{user.friends?.length || 0} Friends</span>
                        <span>•</span>
                        <span>{user.followers || 0} Followers</span>
                      </div>
                      
                      <div className="flex justify-center md:justify-start -space-x-2 mt-2">
                          {friendsList.slice(0, 5).map(u => (
                              <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#242526]" alt="Friend" />
                          ))}
                      </div>
                  </div>

                  <div className="flex space-x-2 mt-4 md:mt-0 md:mb-6">
                      <button onClick={() => storyInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                          <Plus size={18} /> Add to Story
                      </button>
                      <button onClick={() => setIsEditing(true)} className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-black dark:text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                          <Edit size={18} /> Edit Profile
                      </button>
                  </div>
              </div>

              <div className="w-[95%] mx-auto h-px bg-gray-300 dark:bg-slate-700 mb-1"></div>

              <div className="px-4 md:px-8 max-w-5xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar">
                  {['POSTS', 'ABOUT', 'FRIENDS', 'PHOTOS', 'PORTFOLIO'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500 rounded-b-none' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
                          {tab}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* ... (Rest of the main profile content - POSTS, ABOUT, FRIENDS, etc. - remains unchanged) ... */}
      
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#242526] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                    <button onClick={handleCancelEdit} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
                </div>

                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <button onClick={() => setEditTab('INFO')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'INFO' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Basic Info</button>
                    <button onClick={() => setEditTab('PRIVACY')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'PRIVACY' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Privacy</button>
                    <button onClick={() => setEditTab('NOTIFICATIONS')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'NOTIFICATIONS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Notifications</button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {editTab === 'INFO' && (
                        <>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Profile Picture</h3>
                                    <div className="flex gap-3">
                                        <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="text-purple-500 text-sm font-medium flex items-center gap-1">{isGeneratingAvatar ? 'Generating...' : 'AI Generate'}</button>
                                        <label className="text-blue-500 text-sm font-medium cursor-pointer">Upload New<input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>
                                    </div>
                                </div>
                                <div className="flex justify-center"><img src={editedAvatar} className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover" alt="Profile" /></div>
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Bio</label>
                                <textarea className="w-full bg-gray-100 dark:bg-slate-800 rounded-lg p-3" value={editedBio} onChange={(e) => setEditedBio(e.target.value)} rows={3} />
                            </div>
                            <div>
                                <label className="block font-bold mb-1">Location</label>
                                <input type="text" value={editedLocation} onChange={(e) => setEditedLocation(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-800 p-3 rounded-lg" />
                            </div>
                        </>
                    )}

                    {editTab === 'PRIVACY' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Shield size={18} /> Privacy Settings</h3>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="flex items-center gap-2 text-sm font-medium"><Eye size={16} /> Profile Visibility</span>
                                <select 
                                    value={privacySettings.profileVisibility}
                                    onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value as any})}
                                    className="bg-white border p-2 rounded text-sm"
                                >
                                    <option value="Public">Public</option>
                                    <option value="Friends">Friends Only</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="flex items-center gap-2 text-sm font-medium"><Bell size={16} /> Show Online Status</span>
                                <input 
                                    type="checkbox" 
                                    checked={privacySettings.showOnlineStatus} 
                                    onChange={(e) => setPrivacySettings({...privacySettings, showOnlineStatus: e.target.checked})} 
                                />
                            </div>
                        </div>
                    )}

                    {editTab === 'NOTIFICATIONS' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Bell size={18} /> Notification Preferences</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2"><Mail size={16}/> Email</div>
                                    <input type="checkbox" checked={notifSettings.emailNotifications} onChange={e => setNotifSettings({...notifSettings, emailNotifications: e.target.checked})} />
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-2"><Bell size={16}/> Push</div>
                                    <input type="checkbox" checked={notifSettings.pushNotifications} onChange={e => setNotifSettings({...notifSettings, pushNotifications: e.target.checked})} />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {Object.keys(notifSettings.types).map(key => (
                                    <div key={key} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={notifSettings.types[key as keyof typeof notifSettings.types]} 
                                            onChange={e => setNotifSettings({
                                                ...notifSettings,
                                                types: { ...notifSettings.types, [key]: e.target.checked }
                                            })} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3">
                    <button onClick={handleCancelEdit} className="flex-1 py-2.5 bg-gray-200 dark:bg-slate-700 font-bold rounded-lg">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 text-white py-2.5 font-bold rounded-lg flex items-center justify-center gap-2"><Save size={18} /> Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
