import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUsersByIds, unblockUser, saveUser } from '../services/storage';
import { Shield, Lock, Eye, UserX, AlertTriangle, Bell, Tag, ChevronDown, Check } from 'lucide-react';

const PrivacyCenter: React.FC = () => {
  const { user } = useAuth();
  const [blockedList, setBlockedList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Global Settings State
  const [settings, setSettings] = useState<{
      profileVisibility: 'Public' | 'Friends' | 'Private';
      showOnlineStatus: boolean;
      allowTagging: boolean;
  }>(user?.privacySettings || {
      profileVisibility: 'Public',
      showOnlineStatus: true,
      allowTagging: true
  });

  // Dropdown State
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (user) {
          // Load blocked users
          if (user.blockedUsers && user.blockedUsers.length > 0) {
              getUsersByIds(user.blockedUsers).then(users => {
                  setBlockedList(users);
                  setLoading(false);
              });
          } else {
              setLoading(false);
          }

          // Sync settings if user updates elsewhere
          if (user.privacySettings) {
              setSettings(user.privacySettings);
          }
      }
  }, [user]);

  // Handle Click Outside Dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
              setShowVisibilityMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnblock = async (targetId: string) => {
      if (user && confirm("Are you sure you want to unblock this user?")) {
          await unblockUser(user.id, targetId);
          setBlockedList(prev => prev.filter(u => u.id !== targetId));
      }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
      if (!user) return;
      
      // Optimistic update
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Save to DB
      try {
          await saveUser({ ...user, privacySettings: newSettings });
      } catch (err) {
          console.error("Failed to save settings", err);
          // Revert on error logic could go here
      }
  };

  const getVisibilityLabel = (val: string) => {
      switch(val) {
          case 'Public': return 'Public';
          case 'Friends': return 'Friends Only';
          case 'Private': return 'Private';
          default: return val;
      }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#1877F2] rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
            <Shield className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C1E21] dark:text-white tracking-tight">Privacy Center</h1>
            <p className="text-[#606770] dark:text-gray-400 font-medium">Manage your account security and visibility settings.</p>
          </div>
      </div>
      
      <div className="space-y-8">
          {/* Security Checkup */}
          <div className="bg-white dark:bg-[#242526] p-1 rounded-2xl shadow-sm border border-[#DADDE1] dark:border-slate-700">
              <div className="p-6">
                  <h2 className="text-lg font-bold mb-4 text-[#1C1E21] dark:text-white flex items-center gap-2">
                      Security Checkup
                  </h2>
                  <div className="flex items-start gap-4 bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-full shrink-0">
                        <Shield size={24} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">Your account is secure</div>
                          <div className="text-emerald-700 dark:text-emerald-300/80 text-sm mt-1 font-medium leading-relaxed">No recent suspicious activity detected. Your password was last changed 3 months ago.</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Global Settings */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#DADDE1] dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-[#DADDE1] dark:border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#1C1E21] dark:text-white">
                      <Lock size={20} className="text-gray-400" /> Global Settings
                  </h2>
              </div>
              
              <div className="divide-y divide-[#DADDE1] dark:divide-slate-700/50">
                  {/* Profile Visibility Custom Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 hover:bg-[#F0F2F5] dark:hover:bg-slate-800/30 transition-colors gap-4">
                      <div className="flex gap-4 items-start">
                          {/* Updated Icon Container - Neutral colors */}
                          <div className="p-2.5 bg-[#F0F2F5] dark:bg-gray-800 rounded-xl text-[#606770] dark:text-gray-300 shrink-0">
                              <Eye size={22} />
                          </div>
                          <div>
                              {/* Updated Typography Colors */}
                              <div className="font-bold text-[#1C1E21] dark:text-white">Profile Visibility</div>
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-medium mt-0.5">Control who can see your profile details.</div>
                          </div>
                      </div>
                      
                      <div className="relative shrink-0 sm:w-auto w-full" ref={visibilityRef}>
                          <button 
                            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                            className="w-full sm:w-48 flex items-center justify-between px-4 py-2.5 !bg-white dark:!bg-white border border-[#DADDE1] dark:border-[#DADDE1] rounded-lg text-[#1C1E21] dark:text-[#1C1E21] font-semibold shadow-sm hover:border-gray-400 dark:hover:border-blue-500 focus:ring-2 focus:ring-[#1877F2] dark:focus:ring-blue-900 transition-all outline-none"
                          >
                              <span className="text-sm">{getVisibilityLabel(settings.profileVisibility)}</span>
                              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showVisibilityMenu ? 'rotate-180' : ''}`} />
                          </button>

                          {showVisibilityMenu && (
                              <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-white dark:bg-white border border-[#DADDE1] dark:border-[#DADDE1] rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <div className="p-1">
                                      {['Public', 'Friends', 'Private'].map((opt) => (
                                          <button
                                              key={opt}
                                              onClick={() => { handleSettingChange('profileVisibility', opt); setShowVisibilityMenu(false); }}
                                              className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-lg transition-colors mb-0.5 last:mb-0 ${
                                                  settings.profileVisibility === opt 
                                                  ? 'bg-blue-50 dark:bg-blue-50 text-[#1877F2] dark:text-blue-700 font-bold' 
                                                  : 'text-[#1C1E21] dark:text-[#1C1E21] hover:bg-[#F0F2F5] dark:hover:bg-gray-50 font-medium'
                                              }`}
                                          >
                                              {getVisibilityLabel(opt)}
                                              {settings.profileVisibility === opt && <Check size={16} />}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Allow Tagging */}
                  <div className="flex justify-between items-center p-5 hover:bg-[#F0F2F5] dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex gap-4 items-center">
                          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                              <Tag size={22} />
                          </div>
                          <div>
                              <div className="font-bold text-[#1C1E21] dark:text-white">Allow Tagging</div>
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-medium mt-0.5">Allow others to tag you in their posts?</div>
                          </div>
                      </div>
                      <div 
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2 ${settings.allowTagging ? 'bg-[#1877F2]' : 'bg-[#E4E6EB] dark:bg-slate-600'}`}
                        onClick={() => handleSettingChange('allowTagging', !settings.allowTagging)}
                      >
                          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.allowTagging ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                  </div>

                  {/* Show Online Status */}
                  <div className="flex justify-between items-center p-5 hover:bg-[#F0F2F5] dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex gap-4 items-center">
                          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                              <Bell size={22} />
                          </div>
                          <div>
                              <div className="font-bold text-[#1C1E21] dark:text-white">Show Online Status</div>
                              <div className="text-sm text-[#606770] dark:text-gray-400 font-medium mt-0.5">Let friends see when you are active.</div>
                          </div>
                      </div>
                      <div 
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 ${settings.showOnlineStatus ? 'bg-green-500' : 'bg-[#E4E6EB] dark:bg-slate-600'}`}
                        onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                      >
                          <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.showOnlineStatus ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Blocked Users */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-sm border border-[#DADDE1] dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-[#DADDE1] dark:border-slate-700/50">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-[#1C1E21] dark:text-white">
                      <UserX size={20} className="text-gray-400" /> Blocked Users
                  </h2>
              </div>
              <div className="p-4">
                  {loading ? <p className="text-gray-500 p-4">Loading...</p> : blockedList.length === 0 ? (
                      <div className="text-center py-8">
                          <div className="w-16 h-16 bg-[#F0F2F5] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              <UserX size={32} className="text-gray-300 dark:text-slate-600" />
                          </div>
                          <p className="text-[#606770] font-medium">You haven't blocked anyone yet.</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {blockedList.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 border border-[#DADDE1] dark:border-slate-700/60 rounded-xl hover:bg-[#F0F2F5] dark:hover:bg-slate-800/30 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <img src={u.avatar} className="w-10 h-10 rounded-full bg-[#F0F2F5] object-cover" alt="" />
                                      <span className="font-bold text-[#1C1E21] dark:text-white">{u.name}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleUnblock(u.id)}
                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-1.5 rounded-lg text-sm font-bold border border-red-100 dark:border-red-900/30 transition-colors"
                                  >
                                      Unblock
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;