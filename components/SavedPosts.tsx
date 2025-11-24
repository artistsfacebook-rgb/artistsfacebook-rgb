
import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { getPostsByIds } from '../services/storage';
import { Bookmark, Loader, AlertCircle } from 'lucide-react';

const SavedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSaved = async () => {
      const savedIds = JSON.parse(localStorage.getItem('saved_posts') || '[]');
      if (savedIds.length > 0) {
        const data = await getPostsByIds(savedIds);
        setPosts(data);
      }
      setLoading(false);
    };
    loadSaved();
  }, []);

  return (
    <div className="max-w-[600px] mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
        <Bookmark className="text-blue-600" fill="currentColor" /> Saved Posts
      </h2>

      {loading && <div className="flex justify-center p-8"><Loader className="animate-spin text-blue-600" /></div>}

      {!loading && posts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
          <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No saved posts yet</h3>
          <p className="text-gray-500">Save posts from your feed to see them here.</p>
        </div>
      )}

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-[#242526] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-4 flex gap-3 items-center border-b border-gray-100 dark:border-slate-800">
              <img src={post.user?.avatar} className="w-10 h-10 rounded-full" alt="" />
              <div>
                <div className="font-bold text-sm dark:text-white">{post.user?.name}</div>
                <div className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">{post.content}</p>
              {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-lg max-h-96 object-cover" alt="" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPosts;
