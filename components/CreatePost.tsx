
import React, { useState } from 'react';
import { Image, Wand2, Video, Smile, Hash, X, Globe, Users, Lock, ChevronDown } from 'lucide-react';
import { generateCreativeCaption } from '../services/geminiService';
import { User } from '../types';

interface CreatePostProps {
  user: User;
  onPostCreate: (content: string, image: string | undefined, video: string | undefined, tags: string[], visibility: 'Public' | 'Friends' | 'Private') => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new document.defaultView!.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
            resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

const CreatePost: React.FC<CreatePostProps> = ({ user, onPostCreate }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Friends' | 'Private'>('Public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const handleGenerateCaption = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    const caption = await generateCreativeCaption(content);
    setContent(caption);
    setIsGenerating(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
         const reader = new FileReader();
         reader.onloadend = () => {
             setSelectedVideo(reader.result as string);
             setSelectedImage(undefined);
         };
         reader.readAsDataURL(file);
      } else {
        try {
            const compressed = await compressImage(file);
            setSelectedImage(compressed);
            setSelectedVideo(undefined);
        } catch (err) {
            console.error("Compression error", err);
            // Fallback
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setSelectedVideo(undefined);
            }
            reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    
    const trimmedTag = tagInput.trim().replace(/^#/, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!content.trim() && !selectedImage && !selectedVideo) return;
    onPostCreate(content, selectedImage, selectedVideo, tags, visibility);
    setContent('');
    setSelectedImage(undefined);
    setSelectedVideo(undefined);
    setTags([]);
    setShowTagInput(false);
    setVisibility('Public');
  };

  const VisibilityIcon = {
      'Public': Globe,
      'Friends': Users,
      'Private': Lock
  }[visibility];

  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 mb-4">
      <div className="flex space-x-3 mb-3">
        <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover" alt={user.name} />
        <div className="flex-1">
             <div className="bg-gray-100 dark:bg-[#3a3b3c] rounded-2xl px-4 py-2 relative">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                    className="w-full bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px]"
                />
             </div>
             {/* Tag Chips */}
             {tags.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-2 pl-1">
                 {tags.map(tag => (
                   <span key={tag} className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                     #{tag}
                     <button onClick={() => removeTag(tag)} className="ml-1 hover:text-blue-600 dark:hover:text-blue-100">
                       <X size={12} />
                     </button>
                   </span>
                 ))}
               </div>
             )}
             {/* Tag Input Field */}
             {showTagInput && (
               <div className="mt-2 flex items-center gap-2">
                 <Hash size={16} className="text-gray-400" />
                 <input 
                   type="text"
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   onKeyDown={handleAddTag}
                   placeholder="Add a tag and press Enter"
                   className="bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300 w-full"
                   autoFocus
                 />
               </div>
             )}
        </div>
      </div>
      
      {/* Media Previews */}
      {selectedImage && (
        <div className="mb-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <img src={selectedImage} alt="Preview" className="max-h-80 w-full object-cover" />
            <button 
                onClick={() => setSelectedImage(undefined)}
                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 text-gray-500 hover:text-red-500 shadow-md transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      )}

      {selectedVideo && (
        <div className="mb-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-black">
            <video src={selectedVideo} controls className="max-h-80 w-full" />
            <button 
                onClick={() => setSelectedVideo(undefined)}
                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 text-gray-500 hover:text-red-500 shadow-md transition-colors z-10"
            >
                <X size={20} />
            </button>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
         <div className="flex flex-wrap justify-between items-center gap-2">
             <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar items-center">
                 {/* Visibility Selector */}
                 <div className="relative">
                     <button 
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-md text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                     >
                         <VisibilityIcon size={14} />
                         <span>{visibility}</span>
                         <ChevronDown size={12} />
                     </button>
                     {showVisibilityMenu && (
                         <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-20 overflow-hidden">
                             {(['Public', 'Friends', 'Private'] as const).map((opt) => (
                                 <button
                                    key={opt}
                                    onClick={() => { setVisibility(opt); setShowVisibilityMenu(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                 >
                                     {opt === 'Public' && <Globe size={12} />}
                                     {opt === 'Friends' && <Users size={12} />}
                                     {opt === 'Private' && <Lock size={12} />}
                                     {opt}
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>

                 <label className="flex items-center space-x-2 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors flex-shrink-0">
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                    <Image className="text-green-500" size={24} />
                 </label>

                 <button className="flex items-center space-x-2 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
                    <Smile className="text-yellow-500" size={24} />
                 </button>

                 <button 
                   onClick={() => setShowTagInput(!showTagInput)}
                   className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${showTagInput ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                 >
                    <Hash className="text-blue-500" size={24} />
                 </button>

                 <button 
                    onClick={handleGenerateCaption}
                    disabled={isGenerating || !content.trim()}
                    className="flex items-center space-x-1 px-2 py-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors disabled:opacity-50 text-xs text-purple-600 dark:text-purple-400"
                 >
                    {isGenerating ? <span className="animate-spin">✨</span> : <Wand2 size={14} />}
                    <span className="hidden sm:inline">AI Magic</span>
                 </button>
             </div>
             
             <button 
                onClick={handleSubmit}
                disabled={!content.trim() && !selectedImage && !selectedVideo}
                className="px-6 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
             >
                Post
            </button>
         </div>
      </div>
    </div>
  );
};

export default CreatePost;
