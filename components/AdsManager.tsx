
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

  // Standardized Input Style Class - Forced White Background with !important
  const inputClass = "w-full p-3 !bg-white !border-[#D1D5DB] border rounded-lg !text-[#1F1F1F] !placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-3xl font-bold text-[#1F1F1F] dark:text-white flex items-center gap-2">
                  <Layout className="text-[#1877F2]" /> Ads Manager
              </h1>
              <p className="text-[#606770]">Create and track your advertising campaigns.</p>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setShowCreateCampaign(true)} className="bg-[#E4E6EB] border border-[#D1D5DB] text-[#1C1E21] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#D8DADF]">
                  <Plus size={18} /> New Campaign
              </button>
              <button onClick={() => setShowCreateAd(true)} className="bg-[#1877F2] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#166fe5]">
                  <Image size={18} /> Create Ad
              </button>
          </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-[#D1D5DB] dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-[#1877F2] rounded-full flex items-center justify-center"><Eye size={24} /></div>
                  <div>
                      <p className="text-sm text-[#606770] dark:text-slate-400">Total Impressions</p>
                      <h3 className="text-2xl font-bold text-[#1C1E21] dark:text-white">{totalImpressions.toLocaleString()}</h3>
                  </div>
              </div>
          </div>
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-[#D1D5DB] dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><MousePointer size={24} /></div>
                  <div>
                      <p className="text-sm text-[#606770] dark:text-slate-400">Total Clicks</p>
                      <h3 className="text-2xl font-bold text-[#1C1E21] dark:text-white">{totalClicks.toLocaleString()}</h3>
                  </div>
              </div>
          </div>
          <div className="bg-white dark:bg-[#242526] p-6 rounded-xl shadow-sm border border-[#D1D5DB] dark:border-slate-700">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><TrendingUp size={24} /></div>
                  <div>
                      <p className="text-sm text-[#606770] dark:text-slate-400">Click-Through Rate</p>
                      <h3 className="text-2xl font-bold text-[#1C1E21] dark:text-white">{ctr}%</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* Tables */}
      <div className="space-y-8">
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-[#D1D5DB] dark:border-slate-700">
              <div className="p-4 border-b border-[#D1D5DB] dark:border-slate-700 font-bold text-lg text-[#1C1E21] dark:text-white">Your Campaigns</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-[#F0F2F5] dark:bg-slate-800 text-xs uppercase text-[#606770] font-semibold">
                          <tr>
                              <th className="p-4">Name</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Budget</th>
                              <th className="p-4">Start Date</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D5DB] dark:divide-slate-700 text-sm">
                          {campaigns.map(c => (
                              <tr key={c.id}>
                                  <td className="p-4 font-medium text-[#1C1E21] dark:text-white">{c.name}</td>
                                  <td className="p-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">{c.status}</span></td>
                                  <td className="p-4 text-[#606770] dark:text-slate-300">${c.budget}</td>
                                  <td className="p-4 text-[#606770] dark:text-slate-300">{new Date(c.startDate).toLocaleDateString()}</td>
                              </tr>
                          ))}
                          {campaigns.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-[#606770]">No campaigns yet.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>

          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-[#D1D5DB] dark:border-slate-700">
              <div className="p-4 border-b border-[#D1D5DB] dark:border-slate-700 font-bold text-lg text-[#1C1E21] dark:text-white">Active Ads</div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-[#F0F2F5] dark:bg-slate-800 text-xs uppercase text-[#606770] font-semibold">
                          <tr>
                              <th className="p-4">Creative</th>
                              <th className="p-4">Headline</th>
                              <th className="p-4">Metrics</th>
                              <th className="p-4">Link</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D5DB] dark:divide-slate-700 text-sm">
                          {ads.map(ad => (
                              <tr key={ad.id}>
                                  <td className="p-4"><img src={ad.mediaUrl} className="w-16 h-16 object-cover rounded bg-gray-100" /></td>
                                  <td className="p-4 font-medium text-[#1C1E21] dark:text-white">{ad.title}</td>
                                  <td className="p-4">
                                      <div className="flex flex-col text-xs text-[#606770] dark:text-slate-400">
                                          <span>👀 {ad.impressions} Views</span>
                                          <span>👆 {ad.clicks} Clicks</span>
                                      </div>
                                  </td>
                                  <td className="p-4"><a href={ad.ctaLink} target="_blank" className="text-[#1877F2] hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a></td>
                              </tr>
                          ))}
                          {ads.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-[#606770]">No ads yet.</td></tr>}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Modals */}
      {showCreateCampaign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-[#1C1E21] dark:text-white">Create Campaign</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-[#606770] mb-1">Campaign Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Summer Sale" 
                            className={inputClass} 
                            value={campName} 
                            onChange={e => setCampName(e.target.value)} 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-[#606770] mb-1">Total Budget ($)</label>
                          <div className="relative flex items-center !bg-white !border !border-[#D1D5DB] rounded-lg px-3">
                              <DollarSign size={16} className="text-[#606770]" />
                              <input 
                                type="number" 
                                placeholder="1000" 
                                className="w-full p-3 !bg-white text-[#1F1F1F] placeholder-[#6B7280] outline-none" 
                                value={campBudget} 
                                onChange={e => setCampBudget(e.target.value)} 
                              />
                          </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowCreateCampaign(false)} className="flex-1 py-2 rounded-lg bg-[#E4E6EB] text-[#1C1E21] font-bold hover:bg-[#D8DADF] transition-colors">Cancel</button>
                          <button onClick={handleCreateCampaign} className="flex-1 py-2 rounded-lg bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-colors">Create</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showCreateAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-[#1C1E21] dark:text-white">Create Ad</h3>
                  <div className="space-y-4">
                      <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} className={inputClass}>
                          <option value="">Select Campaign</option>
                          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder="Ad Headline" className={inputClass} value={adTitle} onChange={e => setAdTitle(e.target.value)} />
                      <textarea placeholder="Ad Text" className={`${inputClass} h-24`} value={adContent} onChange={e => setAdContent(e.target.value)} />
                      <input type="text" placeholder="Image URL (optional)" className={inputClass} value={adImage} onChange={e => setAdImage(e.target.value)} />
                      <input type="text" placeholder="Destination Link" className={inputClass} value={adLink} onChange={e => setAdLink(e.target.value)} />
                      
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowCreateAd(false)} className="flex-1 py-2 rounded-lg bg-[#E4E6EB] text-[#1C1E21] font-bold hover:bg-[#D8DADF] transition-colors">Cancel</button>
                          <button onClick={handleCreateAd} className="flex-1 py-2 rounded-lg bg-[#1877F2] text-white font-bold hover:bg-[#166fe5] transition-colors">Publish Ad</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdsManager;
