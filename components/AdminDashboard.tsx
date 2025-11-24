
import React, { useEffect, useState } from 'react';
import { getPlatformStats } from '../services/storage';
import { Users, FileText, Flag, Users as GroupIcon, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, groups: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getPlatformStats();
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  const Card = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold mb-1">{title}</p>
          <h3 className="text-3xl font-bold dark:text-white">{value.toLocaleString()}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} text-white`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 dark:text-white flex items-center gap-3">
        <Activity className="text-blue-600" /> Admin Dashboard
      </h1>

      {loading ? <p>Loading analytics...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card title="Total Users" value={stats.users} icon={Users} color="bg-blue-500" />
          <Card title="Total Posts" value={stats.posts} icon={FileText} color="bg-green-500" />
          <Card title="Groups" value={stats.groups} icon={GroupIcon} color="bg-purple-500" />
          <Card title="Reports" value={stats.reports} icon={Flag} color="bg-red-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} /> Growth Overview
          </h3>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
             {/* Fake Chart Bars */}
             {[30, 45, 35, 50, 60, 75, 90].map((h, i) => (
               <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative group">
                 <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600" style={{ height: `${h}%` }}></div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" /> System Health
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-green-700 dark:text-green-400">Database Status</span>
              </div>
              <span className="text-green-700 dark:text-green-400 font-bold text-sm">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-blue-700 dark:text-blue-400">API Latency</span>
              </div>
              <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">24ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-purple-700 dark:text-purple-400">Storage Usage</span>
              </div>
              <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
