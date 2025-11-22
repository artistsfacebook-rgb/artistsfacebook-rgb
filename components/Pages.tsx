
import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { Flag, ThumbsUp, Plus, MoreHorizontal, Wand2, CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { generateDescription } from '../services/geminiService';
import { getPages, createPage } from '../services/storage';
import Feed from './Feed';
import { useAuth } from '../contexts/AuthContext';

const Pages: React.FC = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageDesc, setPageDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      const load = async () => {
          const data = await getPages();
          setPages(data);
      };
      load();
  }, [showCreate]);

  const handleGenerateDesc = async () => {
      if (!pageName) return;
      setIsGenerating(true);
      const desc = await generateDescription(pageName, 'Page');
      setPageDesc(desc);
      setIsGenerating(false);
  };

  const handleCreate = async () => {
      if (!pageName) return;
      const newPage: Page = {
          id: `pg${Date.now()}`,
          name: pageName,
          category: 'Artist',
          avatar: `https://picsum.photos/100/100?random=${Date.now()}`,
          coverImage: `https://picsum.photos/800/300?random=${Date.now()}`,
          followers: 0,
          description: pageDesc || 'Brand new page.'
      };
      await createPage(newPage);
      setPages([newPage, ...pages]);
      setShowCreate(false);
      setPageName('');
      setPageDesc('');
  };

  if (selectedPage) {
      return (
          <div className="bg-white dark:bg-[#242526] min-h-screen pb-10">
              <div className="relative">
                  <div className="h-48 md:h-64 bg-gray-300 overflow-hidden">
                      <img src={selectedPage.coverImage} className="w-full h-full object-cover" alt="" />
                  </div>
                  <button onClick={() => setSelectedPage(null)} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10">
                      <ArrowLeft size={24} />
                  </button>
                  
                  <div className="max-w-5xl mx-auto px-4 relative">
                      <div className="absolute -top-16 left-4 md:left-8 border-4 border-white dark:border-[#242526] rounded-full overflow-hidden w-32 h-32 bg-gray-200">
                          <img src={selectedPage.avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="pt-20 md:pt-4 md:pl-44 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div>
                              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  {selectedPage.name} 
                                  <CheckCircle size={20} className="text-blue-500 fill-current text-white" />
                              </h1>
                              <p className="text-gray-500 text-sm font-semibold">{selectedPage.category} • {selectedPage.followers.toLocaleString()} likes</p>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                              <button className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                  <ThumbsUp size={18} /> Like
                              </button>
                              <button className="flex-1 md:flex-none bg-gray-200 dark:bg-slate-700 text-black dark:text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                  <MessageCircle size={18} /> Message
                              </button>
                          </div>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>
                      
                      <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-80 space-y-4">
                              <div className="bg-white dark:bg-[#242526] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                                  <h3 className="font-bold mb-2 text-lg">About</h3>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedPage.description}</p>
                                  <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
                                      <div className="flex items-center gap-2"><Flag size={16} /> {selectedPage.category}</div>
                                      <div className="flex items-center gap-2"><ThumbsUp size={16} /> {selectedPage.followers} people like this</div>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex-1">
                              <Feed user={user!} onToggleFollow={() => {}} pageId={selectedPage.id} />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pages</h2>
          <p className="text-gray-500 dark:text-slate-400">Discover businesses and artist brands.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Plus size={20} /> Create Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {pages.map(page => (
             <div key={page.id} onClick={() => setSelectedPage(page)} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col cursor-pointer hover:shadow-md transition-shadow">
                 <div className="h-24 bg-gray-300 relative">
                     <img src={page.coverImage} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div className="px-4 pb-4 flex-1 flex flex-col">
                     <div className="flex justify-between items-end -mt-8 mb-2">
                         <div className="w-16 h-16 rounded-full border-4 border-white dark:border-[#242526] overflow-hidden bg-gray-200">
                             <img src={page.avatar} className="w-full h-full object-cover" alt="" />
                         </div>
                     </div>
                     <div>
                         <h3 className="font-bold text-lg hover:underline">{page.name}</h3>
                         <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{page.category} • {page.followers.toLocaleString()} followers</p>
                         <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-4">{page.description}</p>
                     </div>
                     <div className="mt-auto flex gap-2">
                         <button className="flex-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                             <ThumbsUp size={16} /> Like
                         </button>
                         <button className="px-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">
                             <MoreHorizontal size={16} />
                         </button>
                     </div>
                 </div>
             </div>
         ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#242526] w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4">Create a Page</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Page Name</label>
                        <input 
                            type="text" 
                            value={pageName} 
                            onChange={(e) => setPageName(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Business or Brand Name"
                        />
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-1">
                             <label className="block text-sm font-semibold">Description</label>
                             <button 
                                onClick={handleGenerateDesc}
                                disabled={!pageName || isGenerating}
                                className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-600 disabled:opacity-50"
                             >
                               <Wand2 size={12} /> {isGenerating ? 'Generating...' : 'Auto-Generate'}
                             </button>
                         </div>
                        <textarea 
                            value={pageDesc} 
                            onChange={(e) => setPageDesc(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" 
                            placeholder="Describe your page..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-semibold">Cancel</button>
                        <button onClick={handleCreate} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Create Page</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Pages;
