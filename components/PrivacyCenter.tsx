
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getUsersByIds, unblockUser } from '../services/storage';
import { Shield, Lock, Eye, UserX, AlertTriangle } from 'lucide-react';

const PrivacyCenter: React.FC = () => {
  const { user } = useAuth();
  const [blockedList, setBlockedList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (user?.blockedUsers && user.blockedUsers.length > 0) {
          getUsersByIds(user.blockedUsers).then(users => {
              setBlockedList(users);
              setLoading(false);
          });
      } else {
          setLoading(false);
      }
  }, [user]);

  const handleUnblock = async (targetId: string) => {
      if (user && confirm("Are you sure you want to unblock this user?")) {
          await unblockUser(user.id, targetId);
          setBlockedList(prev => prev.filter(u => u.id !== targetId));
      }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Shield className="text-blue-600" size={32} /> Privacy Center
      </h1>
      
      <div className="space-y-6">
          {/* Security Checkup */}
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Security Checkup</h2>
              <div className="flex items-center gap-4 text-green-600 bg-green-50 p-4 rounded-lg">
                  <Shield size={24} />
                  <div>
                      <div className="font-bold">Your account is secure</div>
                      <div className="text-sm opacity-80">No recent suspicious activity detected.</div>
                  </div>
              </div>
          </div>

          {/* Blocked Users */}
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <UserX size={24} /> Blocked Users
              </h2>
              {loading ? <p>Loading...</p> : blockedList.length === 0 ? (
                  <p className="text-gray-500">You haven't blocked anyone.</p>
              ) : (
                  <div className="space-y-3">
                      {blockedList.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-700">
                              <div className="flex items-center gap-3">
                                  <img src={u.avatar} className="w-10 h-10 rounded-full" />
                                  <span className="font-bold dark:text-white">{u.name}</span>
                              </div>
                              <button 
                                onClick={() => handleUnblock(u.id)}
                                className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-semibold border border-red-200"
                              >
                                  Unblock
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* General Settings */}
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <Lock size={24} /> Global Settings
              </h2>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div>
                          <div className="font-bold dark:text-white">Profile Visibility</div>
                          <div className="text-sm text-gray-500">Control who can see your profile info.</div>
                      </div>
                      <select className="p-2 border rounded dark:bg-slate-800 dark:text-white">
                          <option>Public</option>
                          <option>Friends</option>
                          <option>Only Me</option>
                      </select>
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <div className="font-bold dark:text-white">Search Engine Indexing</div>
                          <div className="text-sm text-gray-500">Allow search engines to show your profile?</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;
