
import React, { useEffect, useState } from 'react';
import { searchGlobal } from '../services/storage';
import { User, Group, Page, Post } from '../types';
import { Users, FileText, Flag, Calendar, Globe, Lock, MapPin, ThumbsUp } from 'lucide-react';

interface SearchResultsProps {
  query: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PEOPLE' | 'POSTS' | 'GROUPS' | 'PAGES'>('ALL');
  const [results, setResults] = useState<{ users: User[], groups: Group[], pages: Page[], posts: Post[] }>({ users: [], groups: [], pages: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      const fetchResults = async () => {
          setLoading(true);
          const res = await searchGlobal(query);
          setResults(res);
          setLoading(false);
      };
      if (query) fetchResults();
  }, [query]);

  if (loading) return <div className="p-10 text-center text-gray-500">Searching...</div>;

  const hasResults = results.users.length > 0 || results.groups.length > 0 || results.pages.length > 0 || results.posts.length > 0;

  if (!hasResults && !loading) {
      return (
          <div className="p-10 text-center">
              <h2 className="text-2xl font-bold mb-2">No results found for "{query}"</h2>
              <p className="text-gray-500">Check your spelling or try a different keyword.</p>
          </div>
      );
  }

  const renderUsers = () => (
      <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
          <h3 className="font-bold text-lg mb-4 dark:text-white">People</h3>
          {results.users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                          <div className="font-bold dark:text-white">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.type} • {u.location}</div>
                      </div>
                  </div>
                  <button className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-sm">View</button>
              </div>
          ))}
          {results.users.length === 0 && <p className="text-gray-500">No people found.</p>}
      </div>
  );

  const renderGroups = () => (
      <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Groups</h3>
          {results.groups.map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                      <img src={g.coverImage} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                          <div className="font-bold dark:text-white">{g.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                              {g.privacy === 'Public' ? <Globe size={10} /> : <Lock size={10} />} {g.memberCount} members
                          </div>
                      </div>
                  </div>
                  <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm">Visit</button>
              </div>
          ))}
           {results.groups.length === 0 && <p className="text-gray-500">No groups found.</p>}
      </div>
  );

  const renderPages = () => (
      <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-4">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Pages</h3>
          {results.pages.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                      <img src={p.avatar} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                          <div className="font-bold dark:text-white">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.category} • {p.followers} followers</div>
                      </div>
                  </div>
                  <button className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-lg font-semibold text-sm">Like</button>
              </div>
          ))}
           {results.pages.length === 0 && <p className="text-gray-500">No pages found.</p>}
      </div>
  );

  const renderPosts = () => (
      <div className="space-y-4">
          {results.posts.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                  <div className="flex gap-3 mb-3">
                      <img src={p.user?.avatar} className="w-10 h-10 rounded-full" />
                      <div>
                          <div className="font-bold dark:text-white">{p.user?.name}</div>
                          <div className="text-xs text-gray-500">{new Date(p.timestamp).toLocaleDateString()}</div>
                      </div>
                  </div>
                  <p className="dark:text-white">{p.content}</p>
              </div>
          ))}
           {results.posts.length === 0 && <p className="text-gray-500">No posts found.</p>}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6">
            {['ALL', 'PEOPLE', 'POSTS', 'GROUPS', 'PAGES'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {activeTab === 'ALL' && (
            <>
                {results.users.length > 0 && renderUsers()}
                {results.pages.length > 0 && renderPages()}
                {results.groups.length > 0 && renderGroups()}
                {results.posts.length > 0 && (
                    <>
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Posts</h3>
                        {renderPosts()}
                    </>
                )}
            </>
        )}

        {activeTab === 'PEOPLE' && renderUsers()}
        {activeTab === 'POSTS' && renderPosts()}
        {activeTab === 'GROUPS' && renderGroups()}
        {activeTab === 'PAGES' && renderPages()}
    </div>
  );
};

export default SearchResults;
