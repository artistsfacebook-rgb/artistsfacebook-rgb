
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { X, Minus, Phone, Video, ThumbsUp, Send, Smile, Image, MoreVertical, Mic, Paperclip, Trash2, Heart, Check, CheckCheck } from 'lucide-react';

interface ChatWindowProps {
  user: User;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isSender: boolean;
  timestamp: number;
  type: 'text' | 'image';
  reactions?: string[];
  status: 'sent' | 'delivered' | 'read';
}

const THEMES = [
  { name: 'Default', color: 'bg-blue-500' },
  { name: 'Love', color: 'bg-pink-500' },
  { name: 'Ocean', color: 'bg-teal-500' },
  { name: 'Forest', color: 'bg-green-600' },
];

const ChatWindow: React.FC<ChatWindowProps> = ({ user, onClose }) => {
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey! Saw your new art piece, it looks amazing! 🎨', isSender: false, timestamp: Date.now() - 100000, type: 'text', status: 'read' },
    { id: '2', text: 'Thanks! It took me about 3 weeks to finish.', isSender: true, timestamp: Date.now() - 80000, type: 'text', status: 'read' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!minimized) scrollToBottom();
  }, [messages, minimized, isTyping]);

  // Simulate random typing indicator
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (Math.random() > 0.7) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isSender: true,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent'
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    
    // Simulate reply status updates
    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'delivered'} : m));
    }, 1000);
     setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'read'} : m));
    }, 2500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         // Mock upload
         const reader = new FileReader();
         reader.onload = (ev) => {
             const newMessage: Message = {
                id: Date.now().toString(),
                text: ev.target?.result as string,
                isSender: true,
                timestamp: Date.now(),
                type: 'image',
                status: 'sent'
             };
             setMessages([...messages, newMessage]);
         }
         reader.readAsDataURL(file);
     }
  }

  const addReaction = (msgId: string, emoji: string) => {
      setMessages(messages.map(m => {
          if (m.id === msgId) {
              const existing = m.reactions || [];
              if (existing.includes(emoji)) return m; // Prevent duplicate reactions for demo
              return { ...m, reactions: [...existing, emoji] };
          }
          return m;
      }));
      setHoveredMessageId(null);
  }

  const deleteMessage = (msgId: string) => {
      setMessages(messages.filter(m => m.id !== msgId));
  }

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-20 w-64 bg-white dark:bg-[#242526] shadow-lg rounded-t-lg z-50 cursor-pointer border border-gray-200 dark:border-slate-700">
        <div 
          className="p-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
          onClick={() => setMinimized(false)}
        >
          <div className="flex items-center space-x-2">
            <div className="relative">
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                {user.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-20 w-80 h-[450px] bg-white dark:bg-[#242526] shadow-2xl rounded-t-lg z-50 flex flex-col border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div 
        className="p-2 px-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-[#242526] rounded-t-lg shadow-sm"
        onClick={() => !showSettings && setMinimized(true)}
      >
        <div className="flex items-center space-x-2 cursor-pointer">
            <div className="relative">
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                {user.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></div>}
            </div>
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</h4>
                <span className="text-xs text-gray-500 dark:text-slate-400">{user.isOnline ? 'Active now' : 'Offline'}</span>
            </div>
        </div>
        <div className="flex items-center space-x-0.5 text-blue-500">
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Phone size={18} /></button>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Video size={18} /></button>
            <button 
                onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
                <Minus size={18} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
                <X size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white dark:bg-[#18191a] relative">
         {/* Settings Dropdown */}
         {showSettings && (
             <div className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-gray-200 dark:border-slate-700 p-2 w-48 animate-in fade-in zoom-in duration-200">
                 <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase">Chat Theme</h5>
                 <div className="grid grid-cols-4 gap-2 mb-3">
                     {THEMES.map(theme => (
                         <button 
                            key={theme.name}
                            onClick={() => setActiveTheme(theme)}
                            className={`w-6 h-6 rounded-full ${theme.color} ring-2 ring-offset-1 ${activeTheme.name === theme.name ? 'ring-blue-500' : 'ring-transparent'}`}
                            title={theme.name}
                         />
                     ))}
                 </div>
                 <button className="w-full text-left text-red-500 text-sm p-2 hover:bg-red-50 rounded flex items-center gap-2">
                    <Trash2 size={14} /> Delete Chat
                 </button>
             </div>
         )}

         <div className="text-center text-xs text-gray-400 my-4">
            Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
         </div>

         {messages.map(msg => (
             <div 
                key={msg.id} 
                className={`flex group relative ${msg.isSender ? 'justify-end' : 'justify-start'}`}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
             >
                 {!msg.isSender && (
                     <img src={user.avatar} className="w-7 h-7 rounded-full self-end mr-2 mb-1 shadow-sm" alt="" />
                 )}
                 
                 <div className={`max-w-[70%] relative`}>
                    {/* Reactions Popup */}
                    {hoveredMessageId === msg.id && (
                        <div className={`absolute -top-8 ${msg.isSender ? 'right-0' : 'left-0'} bg-white dark:bg-slate-800 shadow-md rounded-full px-2 py-1 flex gap-1 border border-gray-100 dark:border-slate-600 animate-in fade-in slide-in-from-bottom-1 duration-200 z-10`}>
                            {['❤️', '😂', '😮', '👍', '🔥'].map(emoji => (
                                <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="hover:scale-125 transition-transform">{emoji}</button>
                            ))}
                            {msg.isSender && (
                                <button onClick={() => deleteMessage(msg.id)} className="text-red-500 ml-1 hover:scale-110"><Trash2 size={12} /></button>
                            )}
                        </div>
                    )}

                     <div 
                        className={`py-2 px-3 rounded-2xl text-[15px] shadow-sm break-words ${
                            msg.isSender 
                            ? `${activeTheme.color} text-white rounded-br-none` 
                            : 'bg-gray-200 dark:bg-[#3a3b3c] text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                     >
                         {msg.type === 'text' ? msg.text : (
                             <img src={msg.text} alt="Sent media" className="rounded-lg max-w-full" />
                         )}
                     </div>

                     {/* Display Reactions */}
                     {msg.reactions && msg.reactions.length > 0 && (
                         <div className={`absolute -bottom-2 ${msg.isSender ? 'left-0' : 'right-0'} bg-white dark:bg-slate-700 shadow-sm rounded-full px-1 text-[10px] border border-gray-100 dark:border-slate-600 flex gap-0.5`}>
                             {msg.reactions.slice(0, 3).map((r, i) => <span key={i}>{r}</span>)}
                             {msg.reactions.length > 3 && <span>+</span>}
                         </div>
                     )}
                     
                     {/* Status Indicator */}
                     {msg.isSender && (
                         <div className="text-[10px] text-gray-400 text-right mt-1 mr-1 flex justify-end items-center gap-1">
                             {msg.status === 'sent' && <Check size={10} />}
                             {msg.status === 'delivered' && <CheckCheck size={10} />}
                             {msg.status === 'read' && <CheckCheck size={10} className="text-blue-500" />}
                         </div>
                     )}
                 </div>
             </div>
         ))}
         
         {isTyping && (
             <div className="flex justify-start">
                 <img src={user.avatar} className="w-7 h-7 rounded-full self-end mr-2 mb-1" alt="" />
                 <div className="bg-gray-200 dark:bg-[#3a3b3c] rounded-2xl py-2 px-3 rounded-bl-none flex space-x-1 items-center h-9">
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-[#242526]">
          <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${showSettings ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-slate-400'}`}
           >
             <MoreVertical size={20} />
          </button>
          <label className="cursor-pointer text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors">
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
             <Image size={20} />
          </label>
          <button className="text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors">
             <Mic size={20} />
          </button>
          
          <form onSubmit={handleSend} className="flex-1 flex items-center">
              <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Aa"
                    className="w-full bg-gray-100 dark:bg-[#3a3b3c] rounded-full py-2 px-3 pl-3 pr-8 text-[15px] focus:outline-none text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" className="absolute right-2 top-2 text-gray-500 dark:text-slate-400 hover:text-blue-500">
                    <Smile size={20} />
                </button>
              </div>
              {inputValue.trim() ? (
                   <button type="submit" className={`ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${activeTheme.name === 'Default' ? 'text-blue-500' : activeTheme.name === 'Love' ? 'text-pink-500' : activeTheme.name === 'Ocean' ? 'text-teal-500' : 'text-green-600'}`}>
                        <Send size={20} className="fill-current" />
                   </button>
              ) : (
                   <button type="button" className={`ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${activeTheme.name === 'Default' ? 'text-blue-500' : activeTheme.name === 'Love' ? 'text-pink-500' : activeTheme.name === 'Ocean' ? 'text-teal-500' : 'text-green-600'}`}>
                       <ThumbsUp size={20} className="fill-current" />
                   </button>
              )}
          </form>
      </div>
    </div>
  );
};

export default ChatWindow;
