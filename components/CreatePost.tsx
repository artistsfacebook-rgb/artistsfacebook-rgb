
import React, { useState } from 'react';
import { Image, Wand2, Video, Smile, Hash, X, Globe, Users, Lock, ChevronDown, BarChart2, Film, Loader } from 'lucide-react';
import { generateCreativeCaption, suggestHashtags, generateVeoVideo, analyzeImageForPost } from '../services/geminiService';
import { User, PollOption } from '../types';

interface CreatePostProps {
  user: User;
  onPostCreate: (content: string, image: string | undefined, video: string | undefined, tags: string[], visibility: 'Public' | 'Friends' | 'Private', poll?: {question: string, options: PollOption[]}) => void;
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
        } else { resolve(event.target?.result as string); }
      };
      img.onerror = (err) => reject(err);
    };
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
  
  // Poll State
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Video Generation State
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleGenerateCaption = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    const caption = await generateCreativeCaption(content);
    setContent(caption);
    setIsGenerating(false);
  };

  const handleAutoTags = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    const suggested = await suggestHashtags(content);
    setTags(prev => Array.from(new Set([...prev, ...suggested])));
    setIsGenerating(false);
    setShowTagInput(true);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    const { caption, tags: aiTags } = await analyzeImageForPost(selectedImage);
    if (caption) setContent(prev => prev ? prev + "\n\n" + caption : caption);
    if (aiTags && aiTags.length > 0) setTags(prev => Array.from(new Set([...prev, ...aiTags])));
    setIsGenerating(false);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGenerating(true);
    const videoUrl = await generateVeoVideo(videoPrompt, videoAspectRatio);
    if (videoUrl) {
        setSelectedVideo(videoUrl);
        setSelectedImage(undefined);
        setShowVideoGen(false);
        setContent(prev => prev || videoPrompt); // Set prompt as caption if empty
    } else {
        alert("Video generation failed. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
         const reader = new FileReader();
         reader.onloadend = () => { setSelectedVideo(reader.result as string); setSelectedImage(undefined); };
         reader.readAsDataURL(file);
      } else {
        try {
            const compressed = await compressImage(file);
            setSelectedImage(compressed);
            setSelectedVideo(undefined);
        } catch (err) {
            const reader = new FileReader();
            reader.onloadend = () => { setSelectedImage(reader.result as string); setSelectedVideo(undefined); }
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

  const handleSubmit = () => {
    if (!content.trim() && !selectedImage && !selectedVideo && !showPoll) return;
    
    let pollData;
    if (showPoll) {
        pollData = {
            question: content, // Content acts as question
            options: pollOptions.filter(o => o.trim()).map(o => ({ id: `opt_${Date.now()}_${Math.random()}`, text: o, votes: [] }))
        };
        if (pollData.options.length < 2) { alert("Poll needs at least 2 options"); return; }
    }

    onPostCreate(content, selectedImage, selectedVideo, tags, visibility, pollData);
    setContent('');
    setSelectedImage(undefined);
    setSelectedVideo(undefined);
    setTags([]);
    setShowTagInput(false);
    setShowPoll(false);
    setPollOptions(['', '']);
  };

  const VisibilityIcon = { 'Public': Globe, 'Friends': Users, 'Private': Lock }[visibility];

  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm p-4 mb-4 animate-in fade-in zoom-in duration-300">
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
             
             {showPoll && (
                 <div className="mt-3 space-y-2 border-l-4 border-blue-500 pl-3">
                     {pollOptions.map((opt, idx) => (
                         <input 
                            key={idx}
                            type="text"
                            value={opt}
                            onChange={e => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="w-full p-2 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 text-sm"
                         />
                     ))}
                     <button 
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-xs text-blue-500 font-bold hover:underline"
                     >
                        + Add Option
                     </button>
                 </div>
             )}

             {/* Video Gen Modal */}
             {showVideoGen && (
                 <div className="mt-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                     <h4 className="text-sm font-bold mb-2 flex items-center gap-2"><Film size={16}/> Generate Video (Veo)</h4>
                     <textarea 
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="Describe the video you want to create (e.g. A futuristic art studio with neon lights)"
                        className="w-full p-2 rounded border border-gray-300 dark:border-slate-600 text-sm mb-2"
                        rows={2}
                     />
                     <div className="flex items-center gap-2 mb-3">
                         <span className="text-xs font-bold">Aspect Ratio:</span>
                         <select 
                            value={videoAspectRatio} 
                            onChange={(e: any) => setVideoAspectRatio(e.target.value)}
                            className="text-xs p-1 rounded border"
                         >
                             <option value="16:9">Landscape (16:9)</option>
                             <option value="9:16">Portrait (9:16)</option>
                         </select>
                     </div>
                     <div className="flex gap-2">
                         <button onClick={handleGenerateVideo} disabled={isGenerating || !videoPrompt} className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1">
                             {isGenerating ? <Loader className="animate-spin" size={12}/> : <Wand2 size={12}/>} Generate
                         </button>
                         <button onClick={() => setShowVideoGen(false)} className="bg-gray-200 text-black px-3 py-1 rounded text-xs font-bold">Cancel</button>
                     </div>
                 </div>
             )}

             {tags.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-2 pl-1">
                 {tags.map(tag => (
                   <span key={tag} className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                     #{tag} <button onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1"><X size={12} /></button>
                   </span>
                 ))}
               </div>
             )}
             {showTagInput && (
               <div className="mt-2 flex items-center gap-2">
                 <Hash size={16} className="text-gray-400" />
                 <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Add tag..." className="bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-300 w-full" autoFocus />
               </div>
             )}
        </div>
      </div>
      
      {selectedImage && (
        <div className="mb-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <img src={selectedImage} alt="Preview" className="max-h-80 w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={handleAnalyzeImage} disabled={isGenerating} className="bg-white/90 text-purple-600 p-2 rounded-full shadow-sm text-xs font-bold flex items-center gap-1 hover:bg-white">
                    {isGenerating ? <Loader className="animate-spin" size={14}/> : <Wand2 size={14}/>} Analyze
                </button>
                <button onClick={() => setSelectedImage(undefined)} className="bg-white rounded-full p-2 text-gray-500 hover:text-red-500"><X size={20} /></button>
            </div>
        </div>
      )}
      {selectedVideo && (
        <div className="mb-3 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-black">
            <video src={selectedVideo} controls className="max-h-80 w-full" />
            <button onClick={() => setSelectedVideo(undefined)} className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-500 hover:text-red-500"><X size={20} /></button>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
         <div className="flex flex-wrap justify-between items-center gap-2">
             <div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar items-center">
                 <div className="relative">
                     <button onClick={() => setShowVisibilityMenu(!showVisibilityMenu)} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-md text-xs font-medium text-gray-600 dark:text-slate-300">
                         <VisibilityIcon size={14} /><span>{visibility}</span><ChevronDown size={12} />
                     </button>
                     {showVisibilityMenu && (
                         <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 z-20">
                             {['Public', 'Friends', 'Private'].map((opt: any) => (
                                 <button key={opt} onClick={() => { setVisibility(opt); setShowVisibilityMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700">{opt}</button>
                             ))}
                         </div>
                     )}
                 </div>

                 <label className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors" title="Upload Photo/Video">
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                    <Image className="text-green-500" size={24} />
                 </label>
                 
                 <button onClick={() => setShowVideoGen(!showVideoGen)} className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg ${showVideoGen ? 'bg-purple-100 dark:bg-purple-900/20' : ''}`} title="Generate AI Video">
                    <Film className="text-purple-600" size={24} />
                 </button>

                 <button onClick={() => setShowPoll(!showPoll)} className={`p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg ${showPoll ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} title="Create Poll">
                    <BarChart2 className="text-red-500" size={24} />
                 </button>
                 
                 <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"><Smile className="text-yellow-500" size={24} /></button>
                 <button onClick={() => setShowTagInput(!showTagInput)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"><Hash className="text-blue-500" size={24} /></button>
                 
                 <button onClick={handleGenerateCaption} disabled={isGenerating || !content.trim()} className="flex items-center gap-1 px-2 py-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-xs text-purple-600 disabled:opacity-50 font-medium">
                    {isGenerating ? <span className="animate-spin">✨</span> : <Wand2 size={14} />} Caption
                 </button>
                 
                 <button onClick={handleAutoTags} disabled={isGenerating || !content.trim()} className="flex items-center gap-1 px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-xs text-blue-600 disabled:opacity-50 font-medium ml-1">
                    <Hash size={14} /> AI Tags
                 </button>
             </div>
             
             <button onClick={handleSubmit} disabled={!content.trim() && !selectedImage && !selectedVideo} className="px-6 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">Post</button>
         </div>
      </div>
    </div>
  );
};

export default CreatePost;
