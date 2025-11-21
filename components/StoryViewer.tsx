
import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal } from 'lucide-react';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const DURATION = currentStory.duration || 5000; // Default 5s

  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // Update every 50ms
    const step = (interval / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, DURATION]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Background Blur - only shows for images, not videos */}
      {currentStory.imageUrl && (
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl" 
          style={{ backgroundImage: `url(${currentStory.imageUrl})` }}
        />
      )}

      {/* Main Story Container */}
      <div className="relative w-full h-full md:w-[400px] md:h-[90vh] bg-gray-900 md:rounded-xl overflow-hidden flex flex-col">
        
        {/* Top Progress Bars */}
        <div className="absolute top-4 left-0 right-0 z-20 px-2 flex space-x-1">
          {stories.map((story, idx) => {
            // Skip rendering progress bar for the "Create Story" placeholder if it's at index 0
             if (idx === 0) return null;
             
             return (
                <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ 
                      width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                    }}
                  />
                </div>
             )
          })}
        </div>

        {/* Header Info */}
        <div className="absolute top-8 left-0 right-0 z-20 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <img src={currentStory.user.avatar} alt="" className="w-10 h-10 rounded-full border border-white/50" />
             <div>
                <p className="text-white font-semibold text-sm shadow-sm">{currentStory.userId === 'me' ? 'Your Story' : currentStory.user.name}</p>
                <p className="text-white/70 text-xs">Just now</p>
             </div>
          </div>
          <div className="flex space-x-4">
             <button className="text-white/80 hover:text-white"><MoreHorizontal size={24} /></button>
             <button onClick={onClose} className="text-white/80 hover:text-white"><X size={28} /></button>
          </div>
        </div>

        {/* Tap Navigation Zones */}
        <div className="absolute inset-0 flex z-10">
            <div 
                className="w-1/3 h-full" 
                onClick={handlePrev} 
                onMouseDown={() => setIsPaused(true)} 
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            ></div>
            <div 
                className="w-2/3 h-full" 
                onClick={handleNext}
                onMouseDown={() => setIsPaused(true)} 
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            ></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center bg-black">
            {currentStory.videoUrl ? (
                <video 
                    src={currentStory.videoUrl} 
                    className="w-full h-full object-contain" 
                    autoPlay 
                    muted={false} // Ideally user should be able to unmute
                    playsInline
                />
            ) : (
                <img src={currentStory.imageUrl} alt="Story" className="w-full h-full object-cover" />
            )}
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent pt-10">
             <div className="flex items-center space-x-3">
                 <div className="flex-1 relative">
                    <input 
                        type="text" 
                        placeholder={`Reply to ${currentStory.user.name}...`}
                        className="w-full bg-transparent border border-white/40 rounded-full py-2.5 px-4 text-white placeholder-white/70 focus:outline-none focus:border-white"
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                    />
                 </div>
                 <button className="text-white p-2"><Heart size={28} /></button>
                 <button className="text-white p-2"><Send size={24} /></button>
             </div>
        </div>

      </div>

      {/* Desktop Desktop Navigation Arrows */}
      <button onClick={handlePrev} className="hidden md:block absolute left-4 text-white/50 hover:text-white p-2 bg-gray-800/50 rounded-full"><ChevronLeft size={32} /></button>
      <button onClick={handleNext} className="hidden md:block absolute right-4 text-white/50 hover:text-white p-2 bg-gray-800/50 rounded-full"><ChevronRight size={32} /></button>
    </div>
  );
};

export default StoryViewer;
