
import React, { useState, useEffect } from 'react';
import { Group, User } from '../types';
import { Users, Search, Plus, Globe, Lock, Wand2, MoreHorizontal, UserPlus, Shield, LogOut, CheckCircle, XCircle, Grid, FileText, Calendar } from 'lucide-react';
import { generateDescription } from '../services/geminiService';
import { getGroups, saveGroup, joinGroup, leaveGroup, approveJoinRequest, getUser } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import Feed from './Feed';

const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Create Group State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'Public' | 'Private' | 'Secret'>('Public');
  const [isGenerating, setIsGenerating] = useState(false);

  // Detail View State
  const [activeTab, setActiveTab] = useState<'DISCUSSION' | 'MEMBERS' | 'EVENTS' | 'ADMIN'>('DISCUSSION');
  const [memberProfiles, setMemberProfiles] = useState<User[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<User[]>([]);

  useEffect(() => {
      const load = async () => {
          const data = await getGroups();
          setGroups(data);
      };
      load();
  }, [selectedGroup]); // Reload when switching back to list

  // Load member profiles when opening Members or Admin tab
  useEffect(() => {
      if (selectedGroup && (activeTab === 'MEMBERS' || activeTab === 'ADMIN')) {
          const loadProfiles = async () => {
              const members = await Promise.all(selectedGroup.members.map(id => getUser(id)));
              setMemberProfiles(members.filter(Boolean) as User[]);
              
              if (selectedGroup.admins.includes(user?.id || '')) {
                  const requests = await Promise.all((selectedGroup.joinRequests || []).map(id => getUser(id)));
                  setRequestProfiles(requests.filter(Boolean) as User[]);
              }
          };
          loadProfiles();
      }
  }, [selectedGroup, activeTab, user?.id]);

  const handleGenerateDesc = async () => {
    if (!newGroupName) return;
    setIsGenerating(true);
    const desc = await generateDescription(newGroupName, 'Group');
    setNewGroupDesc(desc);
    setIsGenerating(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !user) return;
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || 'Welcome to our new community.',
      coverImage: `https://picsum.photos/800/300?random=${Date.now()}`,
      memberCount: 1,
      privacy: newGroupPrivacy,
      creatorId: user.id,
      admins: [user.id],
      members: [user.id],
      joinRequests: []
    };
    await saveGroup(newGroup);
    setGroups([newGroup, ...groups]);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleJoin = async (groupId: string) => {
      if (!user) return;
      await joinGroup(groupId, user.id);
      const updatedGroups = await getGroups();
      setGroups(updatedGroups);
      if (selectedGroup && selectedGroup.id === groupId) {
           setSelectedGroup(updatedGroups.find(g => g.id === groupId) || null);
      }
  };

  const handleLeave = async (groupId: string) => {
      if (!user) return;
      await leaveGroup(groupId, user.id);
      const updatedGroups = await getGroups();
      setGroups(updatedGroups);
      setSelectedGroup(null);
  };

  const handleApproveRequest = async (reqUserId: string) => {
      if (!selectedGroup) return;
      await approveJoinRequest(selectedGroup.id, reqUserId);
      // Refresh local state
      setRequestProfiles(prev => prev.filter(u => u.id !== reqUserId));
      const updated = await getGroups();
      setSelectedGroup(updated.find(g => g.id === selectedGroup.id) || null);
  };

  if (selectedGroup) {
      const isMember = selectedGroup.members?.includes(user?.id || '');
      const isAdmin = selectedGroup.admins?.includes(user?.id || '');
      const isRequested = selectedGroup.joinRequests?.includes(user?.id || '');

      return (
          <div className="bg-white dark:bg-[#242526] min-h-screen rounded-xl shadow-sm overflow-hidden">
              {/* Group Header */}
              <div className="h-48 md:h-64 bg-gray-300 relative">
                  <img src={selectedGroup.coverImage} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => setSelectedGroup(null)} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"><Grid /></button>
              </div>
              <div className="px-4 md:px-8 pb-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-8">
                       <div>
                           <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-md">{selectedGroup.name}</h1>
                           <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-1">
                               {selectedGroup.privacy === 'Public' ? <Globe size={14} /> : <Lock size={14} />}
                               <span>{selectedGroup.privacy} Group</span>
                               <span>•</span>
                               <span>{selectedGroup.memberCount} members</span>
                           </div>
                       </div>
                       <div className="mt-4 md:mt-0 flex gap-2">
                           {isMember ? (
                               <div className="flex gap-2">
                                   <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                                       <CheckCircle size={18} className="text-green-500" /> Joined
                                   </button>
                                   <button onClick={() => handleLeave(selectedGroup.id)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-100 hover:text-red-600">
                                       <LogOut size={18} /> Leave
                                   </button>
                                   <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                                       <Plus size={18} /> Invite
                                   </button>
                               </div>
                           ) : isRequested ? (
                               <button className="bg-gray-200 px-4 py-2 rounded-lg font-semibold disabled cursor-not-allowed">Request Sent</button>
                           ) : (
                               <button onClick={() => handleJoin(selectedGroup.id)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 w-full md:w-auto">
                                   Join Group
                               </button>
                           )}
                       </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-6 mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                      {['DISCUSSION', 'MEMBERS', 'EVENTS', 'FILES'].map(t => (
                          <button 
                             key={t} 
                             onClick={() => setActiveTab(t as any)}
                             className={`pb-3 font-semibold text-sm ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                              {t}
                          </button>
                      ))}
                      {isAdmin && (
                          <button 
                             onClick={() => setActiveTab('ADMIN')}
                             className={`pb-3 font-semibold text-sm flex items-center gap-1 ${activeTab === 'ADMIN' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                              <Shield size={14} /> Admin
                          </button>
                      )}
                  </div>
              </div>
              
              <div className="bg-[#f0f2f5] dark:bg-[#18191a] p-4 min-h-[500px]">
                  {activeTab === 'DISCUSSION' && (
                      isMember || selectedGroup.privacy === 'Public' ? (
                          <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto">
                              <div className="flex-1">
                                   <Feed user={user!} onToggleFollow={() => {}} groupId={selectedGroup.id} />
                              </div>
                              <div className="w-full md:w-80 space-y-4">
                                  <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm">
                                      <h3 className="font-bold mb-2">About</h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedGroup.description}</p>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-10">
                              <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                              <h2 className="text-xl font-bold">This group is private</h2>
                              <p className="text-gray-500">Join this group to view and participate in discussions.</p>
                          </div>
                      )
                  )}

                  {activeTab === 'MEMBERS' && (
                      <div className="max-w-3xl mx-auto bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4">
                          <h3 className="font-bold text-lg mb-4">Members ({selectedGroup.memberCount})</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {memberProfiles.map(m => (
                                  <div key={m.id} className="flex items-center gap-3 p-2 border border-gray-100 dark:border-gray-700 rounded-lg">
                                      <img src={m.avatar} className="w-12 h-12 rounded-full" />
                                      <div>
                                          <div className="font-bold text-sm">{m.name}</div>
                                          <div className="text-xs text-gray-500">{selectedGroup.admins.includes(m.id) ? 'Admin' : 'Member'}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeTab === 'ADMIN' && isAdmin && (
                      <div className="max-w-3xl mx-auto space-y-6">
                          {/* Join Requests */}
                          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4">
                              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus /> Member Requests ({requestProfiles.length})</h3>
                              {requestProfiles.length === 0 ? <p className="text-gray-500">No pending requests.</p> : (
                                  <div className="space-y-3">
                                      {requestProfiles.map(req => (
                                          <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                              <div className="flex items-center gap-3">
                                                  <img src={req.avatar} className="w-10 h-10 rounded-full" />
                                                  <span className="font-bold">{req.name}</span>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button onClick={() => handleApproveRequest(req.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">Approve</button>
                                                  <button className="bg-gray-300 text-black px-3 py-1 rounded text-sm font-bold">Decline</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                          
                          {/* Settings */}
                          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4">
                              <h3 className="font-bold text-lg mb-4">Group Settings</h3>
                              <div className="space-y-2">
                                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                      <span>Edit Name & Description</span>
                                      <MoreHorizontal size={16} />
                                  </div>
                                  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                      <span>Privacy Settings</span>
                                      <span className="text-sm text-gray-500">{selectedGroup.privacy}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  
                  {activeTab === 'EVENTS' && (
                      <div className="text-center py-10 text-gray-500">
                          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No upcoming events.</p>
                          <button className="mt-4 text-blue-600 font-bold hover:underline">Create Event</button>
                      </div>
                  )}
                  
                   {activeTab === 'FILES' && (
                      <div className="text-center py-10 text-gray-500">
                          <FileText size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No files shared yet.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // Main Discovery List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Groups</h2>
          <p className="text-gray-500 dark:text-slate-400">Discover and join artist communities.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          <Plus size={20} /> Create New Group
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search groups..." 
          className="w-full bg-white dark:bg-[#242526] pl-10 pr-4 py-3 rounded-xl focus:outline-none border border-transparent focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 gap-4">
        {groups.map(group => (
          <div key={group.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
             <div onClick={() => setSelectedGroup(group)} className="h-32 bg-gray-300 relative cursor-pointer group-hover:brightness-90 transition-all">
                <img src={group.coverImage} className="w-full h-full object-cover" alt={group.name} />
             </div>
             <div className="p-4">
                <div className="flex justify-between items-start">
                   <div onClick={() => setSelectedGroup(group)} className="cursor-pointer">
                      <h3 className="text-xl font-bold hover:underline">{group.name}</h3>
                      <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                         {group.privacy === 'Public' ? <Globe size={14} /> : <Lock size={14} />}
                         <span>{group.privacy} Group</span>
                         <span>•</span>
                         <span>{group.memberCount} members</span>
                      </div>
                   </div>
                   <button className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 p-2 rounded-full transition-colors">
                       <MoreHorizontal size={20} />
                   </button>
                </div>
                <p className="mt-3 text-gray-600 dark:text-slate-300 text-sm line-clamp-2">{group.description}</p>
                <div className="mt-4 w-full">
                   {group.members?.includes(user?.id || '') ? (
                       <button onClick={() => setSelectedGroup(group)} className="w-full bg-gray-200 text-black py-2 rounded-lg font-semibold">View Group</button>
                   ) : (
                       <button onClick={() => handleJoin(group.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                          <UserPlus size={18} /> Join Group
                       </button>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
             <h3 className="text-xl font-bold mb-4">Create Group</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Group Name</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Pune Oil Painters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Privacy</label>
                  <select 
                     value={newGroupPrivacy}
                     onChange={(e) => setNewGroupPrivacy(e.target.value as any)}
                     className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800"
                  >
                      <option value="Public">Public (Anyone can see & join)</option>
                      <option value="Private">Private (Only members see posts)</option>
                      <option value="Secret">Secret (Hidden from search)</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-semibold">Description</label>
                     <button 
                        onClick={handleGenerateDesc}
                        disabled={!newGroupName || isGenerating}
                        className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-600 disabled:opacity-50"
                     >
                       <Wand2 size={12} /> {isGenerating ? 'Generating...' : 'Auto-Generate'}
                     </button>
                  </div>
                  <textarea 
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="What is this group about?"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-semibold">Cancel</button>
                  <button onClick={handleCreateGroup} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Create</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
