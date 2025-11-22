
import React, { useState, useEffect } from 'react';
import { AdCampaign, Ad, User } from '../types';
import { createCampaign, createAd, getCampaigns, getAdsForAdvertiser } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2, Plus, Target, DollarSign, Image, Eye, MousePointer, ExternalLink, Layout, TrendingUp } from 'lucide-react';

const AdsManager: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CAMPAIGNS' | 'ADS'>('DASHBOARD');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);

  // Form States
  const [campName, setCampName] = useState('');
  const [campBudget, setCampBudget] = useState('');
  
  const [adTitle, setAdTitle] = useState('');
  const [adContent, setAdContent] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adImage, setAdImage] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  useEffect(() => {
      if (user) {
          loadData();
      }
  }, [user]);

  const loadData = async () => {
      if (!user) return;
      const c = await getCampaigns(user.id);
      setCampaigns(c);
      const a = await getAdsForAdvertiser(user.id);
      setAds(a);
  };

  const handleCreateCampaign = async () => {
      if (!user || !campName || !campBudget) return;
      const newCamp: AdCampaign = {
          id: `cmp_${Date.now()}`,
          userId: user.id,
          name: campName,
          budget: parseFloat(campBudget),
          status: 'ACTIVE',
          startDate: Date.now()
      };
      await createCampaign(newCamp);
      setCampaigns([...campaigns, newCamp]);
      setShowCreateCampaign(false);
      setCampName('');
      setCampBudget('');
  };

  const handleCreateAd = async () => {
      if (!user || !selectedCampaignId || !adTitle) return;
      const newAd: Ad = {
          id: `ad_${Date.now()}`,
          campaignId: selectedCampaignId,
          userId: user.id,
          title: adTitle,
          content: adContent,
          mediaUrl: adImage || 'https://picsum.photos/800/400?random=' + Date.now(),
          mediaType: 'image',
          ctaLink: adLink || '#',
          ctaText: 'Learn More',
          impressions: 0,
          clicks: 0,
          spend: 0
      };
      await createAd(newAd);
      setAds([...ads, newAd]);
      setShowCreateAd(false);
      setAdTitle(''); setAdContent(''); setAdLink(''); setAdImage('');
  };

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="text-blue-600" /> Ads Manager
              </h1>
              <p className="text-gray-500">Create and track your advertising campaigns.</p>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setShowCreateCampaign(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <Plus size={18} /> New Campaign
              </button>
              <button onClick={() => setShowCreateAd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <Image size={18} /> Create Ad
              </button>
          </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Eye size={24} /></div>
                  <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Total Impressions</p>
                      <h3 className="text-2xl font-bold dark:text-white">{totalImpressions.toLocaleString()}</h3>
                  </div>
              </div>
          </div>
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><MousePointer size={24} /></div>
                  <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Total Clicks</p>
                      <h3 className="text-2xl font-bold dark:text-white">{totalClicks.toLocaleString()}</h3>
                  </div>
              </div>
          </div>
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><TrendingUp size={24} /></div>
                  <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Click-Through Rate</p>
                      <h3 className="text-2xl font-bold dark:text-white">{ctr}%</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* Tables */}
      <div className="space-y-8">
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 font-bold text-lg">Your Campaigns</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase text-gray-500 font-semibold">
                          <tr>
                              <th className="p-4">Name</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Budget</th>
                              <th className="p-4">Start Date</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                          {campaigns.map(c => (
                              <tr key={c.id}>
                                  <td className="p-4 font-medium dark:text-white">{c.name}</td>
                                  <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{c.status}</span></td>
                                  <td className="p-4 dark:text-slate-300">${c.budget}</td>
                                  <td className="p-4 dark:text-slate-300">{new Date(c.startDate).toLocaleDateString()}</td>
                              </tr>
                          ))}
                          {campaigns.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No campaigns yet.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 font-bold text-lg">Active Ads</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase text-gray-500 font-semibold">
                          <tr>
                              <th className="p-4">Creative</th>
                              <th className="p-4">Headline</th>
                              <th className="p-4">Metrics</th>
                              <th className="p-4">Link</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                          {ads.map(ad => (
                              <tr key={ad.id}>
                                  <td className="p-4"><img src={ad.mediaUrl} className="w-16 h-16 object-cover rounded bg-gray-100" /></td>
                                  <td className="p-4 font-medium dark:text-white">{ad.title}</td>
                                  <td className="p-4">
                                      <div className="flex flex-col text-xs text-gray-500 dark:text-slate-400">
                                          <span>👀 {ad.impressions} Views</span>
                                          <span>👆 {ad.clicks} Clicks</span>
                                      </div>
                                  </td>
                                  <td className="p-4"><a href={ad.ctaLink} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a></td>
                              </tr>
                          ))}
                          {ads.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No ads yet.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Modals */}
      {showCreateCampaign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Create Campaign</h3>
                  <div className="space-y-4">
                      <input type="text" placeholder="Campaign Name" className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white" value={campName} onChange={e => setCampName(e.target.value)} />
                      <div className="flex items-center border rounded-lg dark:bg-slate-800 px-3">
                          <DollarSign size={16} className="text-gray-500" />
                          <input type="number" placeholder="Total Budget" className="w-full p-3 outline-none dark:bg-slate-800 dark:text-white" value={campBudget} onChange={e => setCampBudget(e.target.value)} />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowCreateCampaign(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold">Cancel</button>
                          <button onClick={handleCreateCampaign} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">Create</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showCreateAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Create Ad</h3>
                  <div className="space-y-4">
                      <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white">
                          <option value="">Select Campaign</option>
                          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder="Ad Headline" className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white" value={adTitle} onChange={e => setAdTitle(e.target.value)} />
                      <textarea placeholder="Ad Text" className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white h-24" value={adContent} onChange={e => setAdContent(e.target.value)} />
                      <input type="text" placeholder="Image URL (optional)" className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white" value={adImage} onChange={e => setAdImage(e.target.value)} />
                      <input type="text" placeholder="Destination Link" className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white" value={adLink} onChange={e => setAdLink(e.target.value)} />
                      
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowCreateAd(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold">Cancel</button>
                          <button onClick={handleCreateAd} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">Publish Ad</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdsManager;
