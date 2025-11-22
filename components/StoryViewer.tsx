
import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal, Eye } from 'lucide-react';
import { markStoryAsViewed } from '../services/storage';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const currentStory = stories[currentIndex];
  const DURATION = currentStory.duration || 5000;

  useEffect(() => {
      // Mark as viewed when story opens
      markStoryAsViewed(currentStory.id, 'me');
  }, [currentStory.id]);

  useEffect(() => {
    if (isPaused || showViewers) return;
    const interval = 50;
    const step = (interval / DURATION) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { handleNext(); return 0; }
        return prev + step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showViewers, DURATION]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) { setCurrentIndex(currentIndex + 1); setProgress(0); } 
    else { onClose(); }
  };

  const handlePrev = () => {
    if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setProgress(0); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:w-[400px] md:h-[90vh] bg-gray-900 md:rounded-xl overflow-hidden flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-0 right-0 z-20 px-2 flex space-x-1">
          {stories.map((story, idx) => {
             if (story.id === 'create_placeholder') return null;
             return (
                <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }} />
                </div>
             )
          })}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 z-20 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <img src={currentStory.user.avatar} className="w-10 h-10 rounded-full border border-white/50" />
             <div>
                <p className="text-white font-semibold text-sm shadow-sm">{currentStory.userId === 'me' || currentStory.user.name === 'You' ? 'Your Story' : currentStory.user.name}</p>
                <p className="text-white/70 text-xs">{new Date(currentStory.timestamp).toLocaleTimeString()}</p>
             </div>
          </div>
          <div className="flex space-x-4">
             <button onClick={() => setIsPaused(!isPaused)} className="text-white/80 hover:text-white"><MoreHorizontal size={24} /></button>
             <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden" onClick={() => !showViewers && handleNext()}>
             {/* Media */}
             <div className={`w-full h-full ${currentStory.filter || ''}`}>
                 {currentStory.videoUrl ? (
                     <video src={currentStory.videoUrl} className="w-full h-full object-cover" autoPlay loop playsInline />
                 ) : (
                     <img src={currentStory.imageUrl} className="w-full h-full object-cover" alt="" />
                 )}
             </div>

             {/* Text Overlay */}
             {currentStory.textOverlay && (
                 <div 
                    className="absolute w-full text-center font-bold text-2xl drop-shadow-lg px-4 pointer-events-none"
                    style={{ top: `${currentStory.textOverlay.yPosition}%`, color: currentStory.textOverlay.color }}
                 >
                     {currentStory.textOverlay.text}
                 </div>
             )}
        </div>

        {/* Footer / Viewers */}
        {!showViewers ? (
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent pt-10">
                 {(currentStory.userId === 'u0' || currentStory.user.name === 'You') ? (
                     <div onClick={() => setShowViewers(true)} className="flex items-center gap-2 text-white cursor-pointer">
                         <Eye size={20} />
                         <span className="font-bold">{currentStory.viewers?.length || 0} viewers</span>
                     </div>
                 ) : (
                     <div className="flex items-center space-x-3">
                         <div className="flex-1 relative">
                            <input type="text" placeholder={`Reply to ${currentStory.user.name}...`} className="w-full bg-transparent border border-white/40 rounded-full py-2.5 px-4 text-white focus:outline-none" onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)} />
                         </div>
                         <button className="text-white p-2"><Heart size={28} /></button>
                     </div>
                 )}
            </div>
        ) : (
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white rounded-t-xl z-30 p-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-lg">Viewers ({currentStory.viewers?.length || 0})</h3>
                    <button onClick={() => setShowViewers(false)}><X /></button>
                </div>
                <div className="space-y-3 overflow-y-auto h-[80%]">
                    {currentStory.viewers?.map(vId => (
                        <div key={vId} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <span className="font-semibold text-sm">User {vId}</span>
                        </div>
                    ))}
                    {(!currentStory.viewers || currentStory.viewers.length === 0) && <p className="text-gray-500 text-sm">No views yet.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
