
import React, { useState, useEffect, useRef } from 'react';
import { LiveStream } from '../types';
import { Video, Users, Heart, MessageCircle, Send, X, Radio, Mic, MicOff, VideoOff, Pause, Play, Square, Lock, Trash2, Ban, ShieldAlert, ChevronDown, Clock, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notifyFollowers, createLiveStream, endLiveStream, getActiveStreams, sendLiveMessage, getPastStreams } from '../services/storage';
import { moderateContent } from '../services/geminiService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const REACTIONS = ['👍', '❤️', '😆', '😮', '😢', '😡'];

interface ChatMessage {
    id: string;
    userId: string;
    user: string;
    text: string;
    avatar?: string;
}

const LiveStreamComponent: React.FC = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [pastStreams, setPastStreams] = useState<LiveStream[]>([]);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<{id: number, left: number, emoji: string}[]>([]);
  
  // Moderation State
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  
  // Timer State
  const [duration, setDuration] = useState('00:00:00');
  
  // Broadcasting State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [streamPrivacy, setStreamPrivacy] = useState<'Public' | 'Private'>('Public');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null);
  
  // Media Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  const isHost = isBroadcasting || (activeStream && user?.id === activeStream.hostUser.id);

  // Load Active and Past Streams
  useEffect(() => {
      const loadStreams = async () => {
          const active = await getActiveStreams();
          setStreams(active);
          const past = await getPastStreams();
          setPastStreams(past);
      };
      loadStreams();
      const interval = setInterval(loadStreams, 10000);
      return () => clearInterval(interval);
  }, []);

  // Subscribe to Realtime Chat & Reactions
  useEffect(() => {
      const streamId = isBroadcasting ? currentBroadcastId : activeStream?.id;
      if (!streamId || !isSupabaseConfigured) return;

      const channel = supabase.channel(`live:${streamId}`)
        .on('broadcast', { event: 'message' }, ({ payload }) => {
            if (blockedUsers.has(payload.userId)) return;
            setChatMessages(prev => [...prev, payload]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
            addReactionEffect(payload.emoji);
        })
        .subscribe();

      channelRef.current = channel;

      return () => {
          supabase.removeChannel(channel);
      };
  }, [activeStream?.id, currentBroadcastId, isBroadcasting, blockedUsers]);

  // Update Duration Timer
  useEffect(() => {
      let interval: any;
      if (activeStream?.isLive || isBroadcasting) {
          const startTime = isBroadcasting ? (streamStartTime || Date.now()) : (activeStream?.startedAt || Date.now());
          
          interval = setInterval(() => {
              const diff = Math.floor((Date.now() - startTime) / 1000);
              const h = Math.floor(diff / 3600).toString().padStart(2, '0');
              const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
              const s = (diff % 60).toString().padStart(2, '0');
              setDuration(`${h}:${m}:${s}`);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [activeStream, isBroadcasting, streamStartTime]);

  // Handle Camera Logic (Start/Stop) & Backend Creation
  useEffect(() => {
    if (isBroadcasting && user) {
        const startBroadcast = async () => {
            try {
                const constraints = {
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: true 
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setCameraError(null);
                setIsStreamPaused(false);
                
                const startTime = Date.now();
                setStreamStartTime(startTime);
                
                const streamId = `lv_${Date.now()}`;
                setCurrentBroadcastId(streamId);
                
                const newStream: LiveStream = {
                    id: streamId,
                    title: `${user.name}'s Live Stream`,
                    hostUser: user,
                    viewers: 0,
                    isLive: true,
                    thumbnail: user.avatar, 
                    startedAt: startTime,
                    privacy: streamPrivacy as any
                };
                
                await createLiveStream(newStream);
                notifyFollowers(user, 'LIVE', 'is going live now! 🔴 Watch before it ends.');

            } catch (err: any) {
                console.error("Error accessing camera:", err);
                setCameraError("Could not access camera. Please check permissions.");
                setIsBroadcasting(false);
            }
        };
        startBroadcast();
    } else {
        stopStream();
    }
    return () => stopStream();
  }, [isBroadcasting]);

  const stopStream = async () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      setIsStreamPaused(false);
      
      if (currentBroadcastId) {
          await endLiveStream(currentBroadcastId);
          setCurrentBroadcastId(null);
      }
      setStreamStartTime(null);
  };

  const addReactionEffect = (emoji: string) => {
      const id = Date.now() + Math.random();
      const left = Math.random() * 80 + 10;
      setFloatingReactions(prev => [...prev, { id, left, emoji }]);
      setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
  };

  const handleSendReaction = async (emoji: string) => {
      addReactionEffect(emoji);
      if (channelRef.current) {
          await channelRef.current.send({
              type: 'broadcast',
              event: 'reaction',
              payload: { emoji }
          });
      }
  };

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || isSending) return;
      
      setIsSending(true);
      setModerationError(null);

      const isSafe = await moderateContent(messageInput);
      
      if (!isSafe) {
          setModerationError("Message flagged as unsafe by AI moderation.");
          setIsSending(false);
          return;
      }

      const payload = { 
          id: Date.now().toString(), 
          userId: user?.id || 'anon',
          user: user?.name || 'Guest', 
          text: messageInput,
          avatar: user?.avatar || 'https://picsum.photos/50/50?random=99' 
      };

      setChatMessages(prev => [...prev, payload]);
      setMessageInput('');
      setIsSending(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      if (channelRef.current) {
          await channelRef.current.send({
              type: 'broadcast',
              event: 'message',
              payload: payload
          });
      }

      const streamId = isBroadcasting ? currentBroadcastId : activeStream?.id;
      if (streamId && user) {
          sendLiveMessage(streamId, user.id, payload.text);
      }
  };

  const toggleBroadcast = () => {
      if (isBroadcasting) {
          setIsBroadcasting(false);
      } else {
          setIsBroadcasting(true);
          setActiveStream(null); 
      }
  };

  const togglePauseStream = () => setIsStreamPaused(!isStreamPaused);

  const handleDeleteMessage = (msgId: string) => {
      setChatMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleBlockUser = (userId: string) => {
      if (confirm("Block this user from chat?")) {
          setBlockedUsers(prev => new Set(prev).add(userId));
          setChatMessages(prev => prev.filter(m => m.userId !== userId));
      }
  };

  const handleJoinStream = (stream: LiveStream) => {
      if (stream.privacy === 'Private') {
          const canAccess = user?.followingIds?.includes(stream.hostUser.id) || user?.id === stream.hostUser.id;
          if (!canAccess) {
              alert(`This stream is Private. You must follow ${stream.hostUser.name} to watch.`);
              return;
          }
      }
      setActiveStream(stream);
      setChatMessages([]);
  };

  if (activeStream || isBroadcasting) {
      return (
          <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row h-screen w-screen overflow-hidden">
              {/* Video Area */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden group">
                   {isBroadcasting ? (
                       <div className="w-full h-full flex items-center justify-center bg-black relative">
                           {cameraError ? (
                               <div className="text-red-500 flex flex-col items-center gap-2">
                                   <VideoOff size={48} />
                                   <p>{cameraError}</p>
                               </div>
                           ) : (
                               <>
                                   <video 
                                     ref={videoRef} 
                                     autoPlay 
                                     muted 
                                     playsInline 
                                     className={`w-full h-full object-cover transform scale-x-[-1] ${(isVideoOff || isStreamPaused) ? 'opacity-0' : 'opacity-100'}`} 
                                   />
                                   {(isVideoOff || isStreamPaused) && (
                                       <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 flex-col gap-2">
                                           <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
                                                {isStreamPaused ? <Pause size={40} /> : <VideoOff size={40} />}
                                           </div>
                                           <p className="font-semibold">{isStreamPaused ? 'Stream Paused' : 'Camera Off'}</p>
                                       </div>
                                   )}
                               </>
                           )}
                       </div>
                   ) : (
                        <div className="w-full h-full bg-black relative">
                           {activeStream?.videoUrl ? (
                               <video src={activeStream.videoUrl} autoPlay loop={!activeStream.isLive} playsInline controls={!activeStream.isLive} className="w-full h-full object-cover md:object-contain" />
                           ) : (
                               <img src={activeStream?.thumbnail} className="w-full h-full object-cover opacity-50 blur-sm" alt="" />
                           )}
                           {/* Overlay if stream ended and no video */}
                           {!activeStream?.isLive && !activeStream?.videoUrl && (
                               <div className="absolute inset-0 flex items-center justify-center text-white">
                                   <div className="text-center">
                                       <h3 className="text-2xl font-bold">Stream Ended</h3>
                                       <p>This broadcast has finished.</p>
                                   </div>
                               </div>
                           )}
                        </div>
                   )}
                   
                   {/* Close Button */}
                   <button 
                        onClick={() => { setActiveStream(null); setIsBroadcasting(false); }} 
                        className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 z-50"
                   >
                        <X size={24} />
                   </button>
                   
                   {/* Streamer Info Badges */}
                   <div className="absolute top-4 left-16 right-4 flex justify-between items-start z-10 pointer-events-none">
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                                {activeStream?.isLive || isBroadcasting ? (
                                    <div className={`px-3 py-1 rounded-md font-bold text-sm flex items-center gap-2 shadow-lg ${isStreamPaused ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'}`}>
                                        <span className={`uppercase ${!isStreamPaused && 'animate-pulse'}`}>{isStreamPaused ? 'Paused' : 'Live'}</span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1 rounded-md font-bold text-sm bg-gray-600 text-white flex items-center gap-2 shadow-lg">
                                        <History size={14} /> REPLAY
                                    </div>
                                )}
                                {(activeStream?.isLive || isBroadcasting) && (
                                    <div className="flex items-center gap-1 font-normal text-xs bg-black/40 text-white px-2 rounded backdrop-blur-sm border border-white/10">
                                        <Users size={12} /> {isBroadcasting ? 0 : activeStream?.viewers.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 text-white pr-3 rounded-full backdrop-blur-sm border border-white/10 w-fit">
                                <img src={isBroadcasting ? user?.avatar : activeStream?.hostUser.avatar} className="w-8 h-8 rounded-full border border-white/50" alt="" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{isBroadcasting ? 'You' : activeStream?.hostUser.name}</span>
                                    {(activeStream?.isLive || isBroadcasting) && (
                                        <span className="text-[10px] opacity-80">🔴 {duration}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                   </div>

                   {/* Streamer Controls (Desktop: Bottom Center / Mobile: Top Right) */}
                   {isBroadcasting && (
                       <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-50 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 md:flex hidden">
                           <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                               {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                           </button>
                           <button onClick={togglePauseStream} className={`p-3 rounded-full ${isStreamPaused ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                               {isStreamPaused ? <Play size={20} className="fill-current" /> : <Pause size={20} className="fill-current" />}
                           </button>
                           <button className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg scale-110" onClick={() => setIsBroadcasting(false)}>
                               <Square size={20} className="fill-current" />
                           </button>
                           <button onClick={() => setIsVideoOff(!isVideoOff)} disabled={isStreamPaused} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} disabled:opacity-50`}>
                               {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                           </button>
                       </div>
                   )}

                   {/* Floating Reactions Layer */}
                   <div className="absolute inset-0 overflow-hidden pointer-events-none z-30 bottom-0">
                       {floatingReactions.map(reaction => (
                           <div 
                                key={reaction.id}
                                className="absolute bottom-[20%] text-4xl animate-float-up transition-opacity opacity-0"
                                style={{ left: `${reaction.left}%`, animation: 'floatUp 2.5s ease-out' }}
                           >
                               {reaction.emoji}
                           </div>
                       ))}
                   </div>
              </div>

              {/* Chat Interface - Responsive Overlay/Sidebar */}
              <div className={`
                  flex flex-col transition-all duration-300
                  md:w-96 md:h-full md:relative md:bg-white md:dark:bg-[#242526] md:border-l md:border-gray-800
                  absolute bottom-0 left-0 right-0 h-[45vh] bg-gradient-to-t from-black/95 via-black/60 to-transparent z-40
              `}>
                  {/* Desktop Header (Hidden on Mobile) */}
                  <div className="hidden md:flex p-4 border-b border-gray-200 dark:border-slate-700 items-center gap-3 bg-gray-50 dark:bg-[#18191a]">
                      <h3 className="font-bold dark:text-white text-sm">Live Chat</h3>
                  </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 md:space-y-3 no-scrollbar mask-image-linear-gradient">
                      {chatMessages.map(msg => (
                          <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300 group">
                              <img src={msg.avatar || 'https://picsum.photos/50/50?random=0'} className="w-8 h-8 rounded-full object-cover mt-1 border border-white/20" alt="" />
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                      <span className="font-bold text-xs text-gray-200 md:text-gray-600 md:dark:text-slate-300 block truncate drop-shadow-md md:drop-shadow-none">{msg.user}</span>
                                  </div>
                                  <span className="text-sm text-white md:text-gray-900 md:dark:text-white break-words leading-tight drop-shadow-md md:drop-shadow-none">{msg.text}</span>
                              </div>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  {moderationError && (
                      <div className="px-4 py-1 bg-red-500/80 text-white text-xs flex items-center gap-2 mx-4 rounded mb-2 backdrop-blur-sm">
                          <ShieldAlert size={14} /> {moderationError}
                      </div>
                  )}

                  {/* Input Area */}
                  { (activeStream?.isLive || isBroadcasting) ? (
                    <div className="p-3 md:border-t md:border-gray-200 md:dark:border-slate-700 md:bg-gray-50 md:dark:bg-[#18191a] flex flex-col gap-2">
                        {/* Reaction Bar (Mobile & Desktop) */}
                        <div className="flex justify-between px-2 overflow-x-auto no-scrollbar pb-2">
                            {REACTIONS.map(emoji => (
                                <button 
                                    key={emoji}
                                    onClick={() => handleSendReaction(emoji)}
                                    className="text-2xl hover:scale-125 transition-transform active:scale-90"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <form onSubmit={handleSend} className="flex-1 flex gap-2 relative">
                                <input 
                                    type="text" 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    className="flex-1 bg-black/40 md:bg-white md:dark:bg-slate-700 text-white md:text-black md:dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none border border-white/20 md:border-gray-300 focus:border-blue-500 backdrop-blur-sm placeholder-white/60 md:placeholder-gray-500"
                                    placeholder="Add a comment..."
                                    disabled={isSending}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!messageInput.trim() || isSending}
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                  ) : (
                     <div className="p-4 bg-black/50 md:bg-gray-50 text-center text-white md:text-gray-500 text-sm font-semibold">
                         Chat is disabled for replays
                     </div>
                  )}
              </div>
              
              <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
                }
                .mask-image-linear-gradient {
                    mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%);
                }
                /* Only apply mask on mobile */
                @media (min-width: 768px) {
                    .mask-image-linear-gradient {
                        mask-image: none;
                        -webkit-mask-image: none;
                    }
                }
              `}</style>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl text-white shadow-lg">
          <div>
              <h2 className="text-3xl font-bold mb-2">Live Dashboard</h2>
              <p className="opacity-80">Manage your stream settings and privacy.</p>
          </div>
          <div className="flex items-center gap-2">
             <select 
                className="bg-black/30 border border-white/30 text-white text-sm rounded-full px-3 py-2 outline-none"
                value={streamPrivacy}
                onChange={(e) => setStreamPrivacy(e.target.value as any)}
             >
                 <option value="Public">Public</option>
                 <option value="Private">Private (Followers)</option>
             </select>
             <button onClick={toggleBroadcast} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 border-2 border-red-400/50">
                <Radio size={20} /> Go Live
             </button>
          </div>
      </div>

      {/* Active Streams */}
      <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Radio className="text-red-500 animate-pulse" /> Live Now
          </h3>
          {streams.length === 0 ? (
              <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700">
                  <p className="text-gray-500 dark:text-slate-400">No active streams right now.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {streams.map(stream => (
                      <div key={stream.id} onClick={() => handleJoinStream(stream)} className="cursor-pointer group relative rounded-xl overflow-hidden aspect-video shadow-md hover:shadow-xl transition-shadow bg-black">
                          <img src={stream.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          
                          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</div>
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                              <div className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                                  <Users size={12} /> {stream.viewers.toLocaleString()}
                              </div>
                          </div>

                          <div className="absolute bottom-4 left-4 flex items-center gap-3">
                              <img src={stream.hostUser.avatar} className="w-10 h-10 rounded-full border-2 border-red-500 object-cover" alt="" />
                              <div>
                                  <h3 className="text-white font-bold">{stream.title}</h3>
                                  <p className="text-gray-300 text-xs">{stream.hostUser.name}</p>
                              </div>
                          </div>
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-16 h-16 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                                  <Play size={32} className="text-white ml-1" />
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Past Broadcasts / Replays */}
      <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="text-gray-500" /> Past Broadcasts
          </h3>
          {pastStreams.length === 0 ? (
              <p className="text-gray-500 text-sm">No recorded streams yet.</p>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pastStreams.map(stream => (
                      <div key={stream.id} onClick={() => handleJoinStream(stream)} className="cursor-pointer group relative rounded-xl overflow-hidden aspect-video shadow-sm border border-gray-200 dark:border-slate-700">
                          <img src={stream.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                                   <Play size={20} className="text-white ml-1" />
                               </div>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                              <h4 className="text-white font-bold text-sm truncate">{stream.title}</h4>
                              <p className="text-gray-300 text-xs">{stream.hostUser.name}</p>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default LiveStreamComponent;
