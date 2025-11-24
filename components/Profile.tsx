import React, { useState, useEffect, useRef } from 'react';
import { User, PortfolioItem, Story } from '../types';
import { MapPin, Briefcase, Link as LinkIcon, UserPlus, Camera, Edit, Grid, Image, Video, Plus, X, Save, Tag, Filter, Upload, UserCheck, Wand2, Lock, Globe, BadgeCheck, Shield, Eye, Bell, UserMinus, Check, MoreHorizontal, Mail, ChevronDown, AlignLeft } from 'lucide-react';
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
  const [privacySettings, setPrivacySettings] = useState<{
      profileVisibility: 'Public' | 'Friends' | 'Private';
      showOnlineStatus: boolean;
      allowTagging: boolean;
  }>(user.privacySettings || { profileVisibility: 'Public', showOnlineStatus: true, allowTagging: true });
  
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

  // Dropdown state for Edit Profile
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);

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
    const updatedUser: User = {
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
          const generatedUrl = await generateAIProfilePicture(user.name, editedBio || '');
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

  // Standard input style - Forces White Background & Dark Text with !important
  const inputClass = "w-full p-3 !bg-white !border-[#D1D5DB] border rounded-lg !text-[#1F1F1F] !placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all";

  return (
    <div className="bg-white dark:bg-[#18191a] min-h-screen pb-10">
      <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />

      {/* Header */}
      <div className="bg-white dark:bg-[#242526] shadow-sm pb-4 mb-4">
          <div className="max-w-5xl mx-auto">
              <div className="relative h-[200px] md:h-[350px] rounded-b-xl overflow-hidden bg-[#F0F2F5] dark:bg-slate-800 group">
                  <img src={user.coverPhoto || 'https://picsum.photos/1200/400?random=999'} alt="Cover" className="w-full h-full object-cover" />
                  <button onClick={() => setIsEditing(true)} className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 text-black dark:text-white px-3 py-2 rounded-lg flex items-center gap-2 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <Camera size={16} /> Edit Cover Photo
                  </button>
              </div>

              <div className="px-4 md:px-8 relative flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-8 mb-4">
                  <div className="relative">
                    <div onClick={() => setViewingAvatar(true)} className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-[#242526] overflow-hidden bg-[#E4E6EB] cursor-pointer hover:brightness-90 transition-all">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="absolute bottom-2 right-2 bg-[#E4E6EB] dark:bg-slate-700 p-2 rounded-full cursor-pointer border-2 border-white dark:border-[#242526] hover:bg-[#D8DADF] dark:hover:bg-slate-600 transition-colors">
                        <Camera size={16} className="text-black dark:text-white" />
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left md:ml-4 mt-4 md:mt-0 md:mb-4">
                      <h1 className="text-3xl font-bold text-[#1C1E21] dark:text-slate-100 flex items-center justify-center md:justify-start gap-2">
                          {user.name}
                          {user.isVerified && <BadgeCheck className="text-[#1877F2] fill-current" size={24} />}
                      </h1>
                      <div className="flex flex-wrap justify-center md:justify-start gap-x-4 text-[#606770] dark:text-slate-400 font-semibold mt-1">
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
                      <button onClick={() => storyInputRef.current?.click()} className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                          <Plus size={18} /> Add to Story
                      </button>
                      <button onClick={() => setIsEditing(true)} className="bg-[#E4E6EB] dark:bg-slate-700 hover:bg-[#D8DADF] dark:hover:bg-slate-600 text-[#1C1E21] dark:text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                          <Edit size={18} /> Edit Profile
                      </button>
                  </div>
              </div>

              <div className="w-[95%] mx-auto h-px bg-[#DADDE1] dark:bg-slate-700 mb-1"></div>

              <div className="px-4 md:px-8 max-w-5xl mx-auto flex space-x-1 overflow-x-auto no-scrollbar">
                  {['POSTS', 'ABOUT', 'FRIENDS', 'PHOTOS', 'PORTFOLIO'].map((tab) => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'text-[#1877F2] border-b-2 border-[#1877F2] rounded-b-none' : 'text-[#606770] dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-slate-800'}`}>
                          {tab}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
          {/* ABOUT TAB */}
          {activeTab === 'ABOUT' && (
              <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-[#DADDE1] dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-[#1C1E21] dark:text-white mb-6">About</h2>
                  <div className="space-y-6">
                      {/* Bio */}
                      <div className="flex items-start gap-3">
                          <AlignLeft className="text-[#606770] dark:text-gray-400 mt-1" size={24} />
                          <div className="flex-1">
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-semibold mb-1">Bio</div>
                              <p className="text-[#1C1E21] dark:text-white text-lg">{user.bio || "No bio added."}</p>
                          </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-3">
                          <MapPin className="text-[#606770] dark:text-gray-400 mt-1" size={24} />
                          <div className="flex-1">
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-semibold mb-1">Location</div>
                              <p className="text-[#1C1E21] dark:text-white text-lg">{user.location || "No location added."}</p>
                          </div>
                      </div>

                      {/* Work */}
                      <div className="flex items-start gap-3">
                          <Briefcase className="text-[#606770] dark:text-gray-400 mt-1" size={24} />
                          <div className="flex-1">
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-semibold mb-1">Works At</div>
                              <p className="text-[#1C1E21] dark:text-white text-lg">{user.worksAt || "Not specified"}</p>
                          </div>
                      </div>

                      {/* Website */}
                      <div className="flex items-start gap-3">
                          <LinkIcon className="text-[#606770] dark:text-gray-400 mt-1" size={24} />
                          <div className="flex-1">
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-semibold mb-1">Website</div>
                              {user.website ? (
                                  <a href={user.website} target="_blank" rel="noreferrer" className="text-[#1877F2] hover:underline text-lg">{user.website}</a>
                              ) : (
                                  <p className="text-[#1C1E21] dark:text-white text-lg">No website added.</p>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-[#DADDE1] dark:border-slate-700">
                      <button onClick={() => setIsEditing(true)} className="w-full py-2 bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#1C1E21] font-bold rounded-lg transition-colors">
                          Edit Details
                      </button>
                  </div>
              </div>
          )}

          {/* Other tabs would go here... keeping existing functionality for brevity */}
          {activeTab === 'POSTS' && (
              <div className="text-center py-10 text-gray-500">Posts component goes here (Feed)</div>
          )}
          {activeTab === 'FRIENDS' && (
              <div className="text-center py-10 text-gray-500">Friends List</div>
          )}
          {activeTab === 'PHOTOS' && (
              <div className="text-center py-10 text-gray-500">Photos Grid</div>
          )}
          {activeTab === 'PORTFOLIO' && (
              <div className="text-center py-10 text-gray-500">Portfolio Items</div>
          )}
      </div>
      
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#242526] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-[#DADDE1] dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-[#DADDE1] dark:border-slate-700">
                    <h2 className="text-xl font-bold text-[#1C1E21] dark:text-white">Edit Profile</h2>
                    <button onClick={handleCancelEdit} className="p-2 bg-[#F0F2F5] rounded-full"><X size={20} /></button>
                </div>

                <div className="flex border-b border-[#DADDE1] dark:border-slate-700">
                    <button onClick={() => setEditTab('INFO')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'INFO' ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#606770]'}`}>Basic Info</button>
                    <button onClick={() => setEditTab('PRIVACY')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'PRIVACY' ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#606770]'}`}>Privacy</button>
                    <button onClick={() => setEditTab('NOTIFICATIONS')} className={`flex-1 py-3 font-bold text-sm ${editTab === 'NOTIFICATIONS' ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#606770]'}`}>Notifications</button>
                </div>
                
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {editTab === 'INFO' && (
                        <>
                            {/* Cover Photo UI */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg text-[#1C1E21] dark:text-white">Cover Photo</h3>
                                    <label className="text-[#1877F2] text-sm font-medium cursor-pointer hover:underline">
                                        Upload New
                                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                                    </label>
                                </div>
                                <div className="h-32 w-full bg-[#F0F2F5] dark:bg-slate-800 rounded-lg overflow-hidden relative border border-[#DADDE1] dark:border-slate-600">
                                    <img src={editedCover || 'https://picsum.photos/1200/400?random=999'} className="w-full h-full object-cover" alt="Cover Preview" />
                                </div>
                            </div>

                            {/* Profile Picture UI */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg text-[#1C1E21] dark:text-white">Profile Picture</h3>
                                    <div className="flex gap-3">
                                        <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="text-purple-500 text-sm font-medium flex items-center gap-1 hover:underline">{isGeneratingAvatar ? 'Generating...' : 'AI Generate'}</button>
                                        <label className="text-[#1877F2] text-sm font-medium cursor-pointer hover:underline">Upload New<input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <img src={editedAvatar} className="w-32 h-32 rounded-full border-4 border-[#DADDE1] dark:border-slate-600 object-cover" alt="Profile" />
                                    {editedAvatar !== user.avatar && (
                                        <span className="text-xs text-[#606770] mt-2 bg-[#E4E6EB] px-2 py-1 rounded">Preview Mode</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Bio & Location */}
                            <div className="mb-4">
                                <label className="block font-medium text-[#606770] mb-1">Bio</label>
                                <textarea className={inputClass} value={editedBio} onChange={(e) => setEditedBio(e.target.value)} rows={3} />
                            </div>
                            <div>
                                <label className="block font-medium text-[#606770] mb-1">Location</label>
                                <input type="text" value={editedLocation} onChange={(e) => setEditedLocation(e.target.value)} className={inputClass} />
                            </div>
                        </>
                    )}

                    {editTab === 'PRIVACY' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-[#1C1E21] dark:text-white"><Shield size={18} /> Privacy Settings</h3>
                            <div className="flex flex-col sm:flex-row justify-between items-center p-3 hover:bg-[#F0F2F5] dark:hover:bg-slate-800 rounded transition-colors">
                                <span className="flex items-center gap-2 text-sm font-medium text-[#1C1E21] dark:text-white"><Eye size={16} /> Profile Visibility</span>
                                <div className="relative mt-2 sm:mt-0">
                                    <button 
                                        onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                                        className="w-40 !bg-white dark:!bg-white border border-[#DADDE1] dark:border-[#DADDE1] p-2 rounded-lg text-sm flex justify-between items-center text-[#1F1F1F] dark:text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                                    >
                                        {privacySettings.profileVisibility === 'Friends' ? 'Friends Only' : privacySettings.profileVisibility}
                                        <ChevronDown size={14} />
                                    </button>
                                    
                                    {showPrivacyMenu && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-white border border-[#DADDE1] dark:border-[#DADDE1] rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
                                            {['Public', 'Friends', 'Private'].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        setPrivacySettings({...privacySettings, profileVisibility: opt as any});
                                                        setShowPrivacyMenu(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F0F2F5] dark:hover:bg-[#F0F2F5] flex items-center justify-between ${privacySettings.profileVisibility === opt ? 'bg-blue-50 dark:bg-blue-50 text-[#1877F2] font-semibold' : 'text-[#1C1E21] dark:text-[#1C1E21]'}`}
                                                >
                                                    {opt === 'Friends' ? 'Friends Only' : opt}
                                                    {privacySettings.profileVisibility === opt && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 hover:bg-[#F0F2F5] dark:hover:bg-slate-800 rounded transition-colors">
                                <span className="flex items-center gap-2 text-sm font-medium text-[#1C1E21] dark:text-white"><Bell size={16} /> Show Online Status</span>
                                <input 
                                    type="checkbox" 
                                    checked={privacySettings.showOnlineStatus} 
                                    onChange={(e) => setPrivacySettings({...privacySettings, showOnlineStatus: e.target.checked})}
                                    className="w-5 h-5 cursor-pointer accent-[#1877F2]"
                                />
                            </div>
                        </div>
                    )}

                    {editTab === 'NOTIFICATIONS' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-[#1C1E21] dark:text-white"><Bell size={18} /> Notification Preferences</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center justify-between p-3 border border-[#DADDE1] dark:border-slate-700 rounded-lg !bg-white dark:bg-slate-800">
                                    <div className="flex items-center gap-2 text-[#1C1E21] dark:text-white"><Mail size={16}/> Email</div>
                                    <input type="checkbox" className="accent-[#1877F2] w-4 h-4" checked={notifSettings.emailNotifications} onChange={e => setNotifSettings({...notifSettings, emailNotifications: e.target.checked})} />
                                </div>
                                <div className="flex items-center justify-between p-3 border border-[#DADDE1] dark:border-slate-700 rounded-lg !bg-white dark:bg-slate-800">
                                    <div className="flex items-center gap-2 text-[#1C1E21] dark:text-white"><Bell size={16}/> Push</div>
                                    <input type="checkbox" className="accent-[#1877F2] w-4 h-4" checked={notifSettings.pushNotifications} onChange={e => setNotifSettings({...notifSettings, pushNotifications: e.target.checked})} />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-[#1C1E21] dark:text-gray-300">
                                {Object.keys(notifSettings.types).map(key => (
                                    <div key={key} className="flex justify-between items-center p-2 hover:bg-[#F0F2F5] dark:hover:bg-slate-700 rounded">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input 
                                            type="checkbox" 
                                            className="accent-[#1877F2] w-4 h-4"
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

                <div className="p-4 border-t border-[#DADDE1] dark:border-slate-700 bg-[#F0F2F5] dark:bg-slate-800/50 flex gap-3">
                    <button onClick={handleCancelEdit} className="flex-1 py-2.5 bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#1C1E21] font-bold rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 bg-[#1877F2] hover:bg-[#166fe5] text-white py-2.5 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"><Save size={18} /> Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Profile;