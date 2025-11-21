
import React, { useState } from 'react';
import { Page } from '../types';
import { Flag, ThumbsUp, Plus, MoreHorizontal, Wand2 } from 'lucide-react';
import { generateDescription } from '../services/geminiService';

const MOCK_PAGES: Page[] = [
  { id: 'pg1', name: 'Art Supplies India', category: 'Business', avatar: 'https://picsum.photos/100/100?random=10', coverImage: 'https://picsum.photos/800/300?random=10', followers: 54000, description: 'Your one stop shop for premium art supplies.' },
  { id: 'pg2', name: 'Modern Art Gallery', category: 'Art Gallery', avatar: 'https://picsum.photos/100/100?random=11', coverImage: 'https://picsum.photos/800/300?random=11', followers: 12000, description: 'Exhibiting contemporary Indian art since 2010.' },
];

const Pages: React.FC = () => {
  const [pages, setPages] = useState<Page[]>(MOCK_PAGES);
  const [showCreate, setShowCreate] = useState(false);
  const [pageName, setPageName] = useState('');
  const [pageDesc, setPageDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDesc = async () => {
      if (!pageName) return;
      setIsGenerating(true);
      const desc = await generateDescription(pageName, 'Page');
      setPageDesc(desc);
      setIsGenerating(false);
  };

  const handleCreate = () => {
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
      setPages([newPage, ...pages]);
      setShowCreate(false);
      setPageName('');
      setPageDesc('');
  };

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
             <div key={page.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col">
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
                         <h3 className="font-bold text-lg hover:underline cursor-pointer">{page.name}</h3>
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
