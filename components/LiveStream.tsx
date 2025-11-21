
import React, { useState, useEffect, useRef } from 'react';
import { LiveStream } from '../types';
import { Video, Users, Heart, MessageCircle, Send, X, Radio, Mic, MicOff, VideoOff } from 'lucide-react';

const MOCK_STREAMS: LiveStream[] = [
  { id: 'lv1', title: 'Painting a Sunset 🌅', hostUser: { id: 'u2', name: 'Priya Singh', avatar: 'https://picsum.photos/100/100?random=2', handle: '', type: 'Artist', location: '', followingIds: [] }, viewers: 1420, isLive: true, thumbnail: 'https://picsum.photos/600/400?random=50' },
  { id: 'lv2', title: 'Studio Q&A Session', hostUser: { id: 'u1', name: 'Aarav Patel', avatar: 'https://picsum.photos/100/100?random=1', handle: '', type: 'Artist', location: '', followingIds: [] }, viewers: 350, isLive: true, thumbnail: 'https://picsum.photos/600/400?random=51' },
];

interface ChatMessage {
    id: string;
    user: string;
    text: string;
}

const LiveStreamComponent: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>(MOCK_STREAMS);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<{id: number, left: number}[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // Simulation refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStream || isBroadcasting) {
        const interval = setInterval(() => {
            // Simulate incoming chat
            if (Math.random() > 0.6) {
                const names = ['Rahul', 'Sneha', 'ArtLover', 'DesignPro', 'Karan'];
                const msgs = ['Amazing!', 'Love the colors', 'How do you mix that?', 'Wow 🔥', 'Hello from Delhi'];
                const newMsg = {
                    id: Date.now().toString(),
                    user: names[Math.floor(Math.random() * names.length)],
                    text: msgs[Math.floor(Math.random() * msgs.length)]
                };
                setChatMessages(prev => [...prev, newMsg]);
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
            // Simulate floating hearts
            if (Math.random() > 0.7) {
                addHeart();
            }
        }, 2000);
        return () => clearInterval(interval);
    }
  }, [activeStream, isBroadcasting]);

  const addHeart = () => {
      const id = Date.now();
      const left = Math.random() * 80 + 10; // Random position 10-90%
      setFloatingHearts(prev => [...prev, { id, left }]);
      setTimeout(() => {
          setFloatingHearts(prev => prev.filter(h => h.id !== id));
      }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim()) return;
      setChatMessages([...chatMessages, { id: Date.now().toString(), user: 'You', text: messageInput }]);
      setMessageInput('');
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      addHeart(); // Self heart on message
  };

  if (activeStream || isBroadcasting) {
      return (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row">
              {/* Video Area */}
              <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                   {isBroadcasting ? (
                       <div className="w-full h-full flex items-center justify-center bg-slate-800 relative">
                           <div className="text-slate-400 flex flex-col items-center gap-4">
                               <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                                    <Radio size={40} className="text-white" />
                               </div>
                               <p>You are Live!</p>
                           </div>
                           {/* WebCam controls mock */}
                           <div className="absolute bottom-8 flex gap-4">
                               <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"><Mic size={24} /></button>
                               <button className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white px-6 font-bold" onClick={() => setIsBroadcasting(false)}>End Stream</button>
                               <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white"><VideoOff size={24} /></button>
                           </div>
                       </div>
                   ) : (
                       <img src={activeStream?.thumbnail} className="w-full h-full object-cover opacity-50 blur-sm md:blur-0" alt="" />
                   )}
                   
                   {/* Close Button */}
                   <button onClick={() => { setActiveStream(null); setIsBroadcasting(false); }} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 z-50">
                       <X size={24} />
                   </button>
                   
                   {/* Live Badge */}
                   <div className="absolute top-4 left-16 bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg">
                       <span className="uppercase">Live</span>
                       <div className="flex items-center gap-1 font-normal text-xs bg-black/20 px-2 rounded">
                           <Users size={12} /> {isBroadcasting ? 0 : activeStream?.viewers.toLocaleString()}
                       </div>
                   </div>

                   {/* Floating Hearts Animation Layer */}
                   <div className="absolute inset-0 overflow-hidden pointer-events-none">
                       {floatingHearts.map(heart => (
                           <div 
                                key={heart.id}
                                className="absolute bottom-0 text-4xl animate-float-up transition-opacity opacity-0"
                                style={{ left: `${heart.left}%`, animation: 'floatUp 2s ease-out' }}
                           >
                               ❤️
                           </div>
                       ))}
                   </div>
              </div>

              {/* Chat Sidebar */}
              <div className="w-full md:w-96 bg-white dark:bg-[#242526] flex flex-col h-1/2 md:h-full border-l border-gray-800">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                      <img src={isBroadcasting ? 'https://picsum.photos/100/100?random=99' : activeStream?.hostUser.avatar} className="w-10 h-10 rounded-full" alt="" />
                      <div>
                          <h3 className="font-bold dark:text-white">{isBroadcasting ? 'Your Stream' : activeStream?.hostUser.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{isBroadcasting ? 'Broadcasting now' : activeStream?.title}</p>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map(msg => (
                          <div key={msg.id} className="flex items-start gap-2">
                              <span className="font-bold text-sm text-gray-600 dark:text-slate-300">{msg.user}:</span>
                              <span className="text-sm text-gray-900 dark:text-white break-words">{msg.text}</span>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center gap-2">
                      <form onSubmit={handleSend} className="flex-1 flex gap-2">
                          <input 
                            type="text" 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-700 rounded-full px-4 py-2 text-sm focus:outline-none border border-gray-300 dark:border-slate-600"
                            placeholder="Say something..."
                          />
                          <button type="submit" className="p-2 bg-blue-600 text-white rounded-full"><Send size={18} /></button>
                      </form>
                      <button onClick={addHeart} className="p-2 bg-pink-600 text-white rounded-full hover:scale-110 transition-transform"><Heart size={18} className="fill-current" /></button>
                  </div>
              </div>
              
              <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
                }
              `}</style>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl text-white">
          <div>
              <h2 className="text-3xl font-bold mb-2">Live Now</h2>
              <p className="opacity-80">Watch artists create in real-time or go live yourself.</p>
          </div>
          <button onClick={() => setIsBroadcasting(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105">
              <Radio size={20} /> Go Live
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {streams.map(stream => (
              <div key={stream.id} onClick={() => setActiveStream(stream)} className="cursor-pointer group relative rounded-xl overflow-hidden aspect-video">
                  <img src={stream.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</div>
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                      <Users size={12} /> {stream.viewers.toLocaleString()}
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <img src={stream.hostUser.avatar} className="w-10 h-10 rounded-full border-2 border-red-500" alt="" />
                      <div>
                          <h3 className="text-white font-bold">{stream.title}</h3>
                          <p className="text-gray-300 text-xs">{stream.hostUser.name}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default LiveStreamComponent;
