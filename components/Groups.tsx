
import React, { useState } from 'react';
import { Group } from '../types';
import { Users, Search, Plus, Globe, Lock, Wand2, MoreHorizontal, UserPlus } from 'lucide-react';
import { generateDescription } from '../services/geminiService';

const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: 'Digital Artists India', coverImage: 'https://picsum.photos/800/300?random=1', memberCount: 12500, privacy: 'Public', description: 'A community for digital artists in India to share work, tips, and job opportunities.' },
  { id: 'g2', name: 'Mumbai Sketchers', coverImage: 'https://picsum.photos/800/300?random=2', memberCount: 3400, privacy: 'Public', description: 'Weekend sketching meetups in and around Mumbai.' },
  { id: 'g3', name: 'Pro Audio Engineers', coverImage: 'https://picsum.photos/800/300?random=3', memberCount: 890, privacy: 'Private', description: 'Exclusive group for professional studio engineers.' },
];

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDesc = async () => {
    if (!newGroupName) return;
    setIsGenerating(true);
    const desc = await generateDescription(newGroupName, 'Group');
    setNewGroupDesc(desc);
    setIsGenerating(false);
  };

  const handleCreateGroup = () => {
    if (!newGroupName) return;
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || 'Welcome to our new community.',
      coverImage: `https://picsum.photos/800/300?random=${Date.now()}`,
      memberCount: 1,
      privacy: 'Public'
    };
    setGroups([newGroup, ...groups]);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

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
             <div className="h-32 bg-gray-300 relative">
                <img src={group.coverImage} className="w-full h-full object-cover" alt={group.name} />
             </div>
             <div className="p-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-xl font-bold hover:underline cursor-pointer">{group.name}</h3>
                      <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                         {group.privacy === 'Public' ? <Globe size={14} /> : <Lock size={14} />}
                         <span>{group.privacy} Group</span>
                         <span>•</span>
                         <span>{group.memberCount.toLocaleString()} members</span>
                      </div>
                   </div>
                   <button className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 p-2 rounded-full transition-colors">
                       <MoreHorizontal size={20} />
                   </button>
                </div>
                <p className="mt-3 text-gray-600 dark:text-slate-300 text-sm line-clamp-2">{group.description}</p>
                <div className="mt-4 w-full">
                   <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                      <UserPlus size={18} /> Join Group
                   </button>
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
