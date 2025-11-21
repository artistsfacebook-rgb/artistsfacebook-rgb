
import React, { useState, useRef } from 'react';
import { Reel } from '../types';
import { Heart, MessageCircle, Share2, Music2, X, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';

interface ReelsViewerProps {
  reels: Reel[];
  initialIndex: number;
  onClose: () => void;
}

const ReelsViewer: React.FC<ReelsViewerProps> = ({ reels, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
        const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
        if (index !== currentIndex && index >= 0 && index < reels.length) {
            setCurrentIndex(index);
        }
    }
  };

  const toggleLike = (e: React.MouseEvent, reelId: string) => {
      e.stopPropagation();
      setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const toggleFollow = (e: React.MouseEvent, userId: string) => {
      e.stopPropagation();
      setFollowedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex justify-center">
        <button 
            onClick={onClose}
            className="absolute top-4 left-4 z-50 bg-gray-800/50 p-2 rounded-full text-white hover:bg-gray-700 transition-colors"
        >
            <X size={24} />
        </button>
        
        <div className="w-full md:w-[450px] h-full bg-gray-900 relative">
             <div 
                ref={containerRef}
                className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                onScroll={handleScroll}
             >
                 {reels.map((reel, idx) => {
                     const isLiked = likedReels[reel.id] || false;
                     const isFollowed = followedUsers[reel.userId] || false;
                     
                     return (
                     <div key={reel.id} className="w-full h-full snap-start relative">
                         {/* Video Placeholder */}
                         <div className="w-full h-full relative">
                             <img src={reel.thumbnailUrl} className="w-full h-full object-cover opacity-90" alt="Reel" />
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
                             
                             {/* Play/Pause/Mute Controls (Simulated) */}
                             <div className="absolute top-4 right-4 flex flex-col gap-4">
                                <button onClick={() => setIsMuted(!isMuted)} className="bg-black/30 p-2 rounded-full text-white backdrop-blur-sm">
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                             </div>
                         </div>

                         {/* Right Sidebar Actions */}
                         <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-20 pb-4">
                             <div className="flex flex-col items-center gap-1">
                                 <button 
                                    onClick={(e) => toggleLike(e, reel.id)}
                                    className={`p-2 rounded-full backdrop-blur-sm transition-transform hover:scale-110 ${isLiked ? 'bg-red-500/20 text-red-500' : 'bg-gray-800/40 text-white hover:bg-gray-700/50'}`}
                                 >
                                     <Heart size={28} className={isLiked ? 'fill-current' : 'fill-transparent'} />
                                 </button>
                                 <span className="text-white text-xs font-semibold">{isLiked ? '1.3K' : reel.likes}</span>
                             </div>
                             
                             <div className="flex flex-col items-center gap-1">
                                 <button className="p-2 bg-gray-800/40 rounded-full hover:bg-gray-700/50 text-white backdrop-blur-sm">
                                     <MessageCircle size={28} />
                                 </button>
                                 <span className="text-white text-xs font-semibold">{reel.comments}</span>
                             </div>

                             <div className="flex flex-col items-center gap-1">
                                 <button className="p-2 bg-gray-800/40 rounded-full hover:bg-gray-700/50 text-white backdrop-blur-sm">
                                     <Share2 size={28} />
                                 </button>
                                 <span className="text-white text-xs font-semibold">{reel.shares}</span>
                             </div>

                             <button className="p-2 text-white mt-2">
                                 <MoreHorizontal size={24} />
                             </button>
                         </div>

                         {/* Bottom Info */}
                         <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white pb-8 pl-4 pr-16">
                             <div className="flex items-center gap-3 mb-3">
                                 <img src={reel.user.avatar} className="w-10 h-10 rounded-full border border-white object-cover" alt={reel.user.name} />
                                 <div>
                                     <h3 className="font-bold text-sm hover:underline cursor-pointer">{reel.user.name}</h3>
                                     <button 
                                        onClick={(e) => toggleFollow(e, reel.userId)}
                                        className={`text-xs border px-2 py-0.5 rounded mt-0.5 transition-colors ${isFollowed ? 'bg-white text-black border-white font-bold' : 'border-white/50 hover:bg-white/20'}`}
                                     >
                                        {isFollowed ? 'Following' : 'Follow'}
                                     </button>
                                 </div>
                             </div>
                             <div className="mb-4">
                                 <p className="text-sm line-clamp-2">{reel.description} <span className="text-blue-400">#art #creative</span></p>
                             </div>
                             <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                                 <Music2 size={12} />
                                 <span className="animate-pulse">{reel.audioTrack}</span>
                             </div>
                         </div>
                     </div>
                 )})}
             </div>
        </div>
    </div>
  );
};

export default ReelsViewer;
