
import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getChats, getMessages, sendMessage, getUsersByIds, createChat, getAllUsers } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Send, Search, Plus, Image, Paperclip, Smile, MoreVertical, Phone, Video, Info, Check, CheckCheck, X } from 'lucide-react';

const Messenger: React.FC = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [participantsMap, setParticipantsMap] = useState<Record<string, User>>({});
    
    const [showNewChat, setShowNewChat] = useState(false);
    const [friendList, setFriendList] = useState<User[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load Chats
    useEffect(() => {
        if (!user) return;
        const loadChats = async () => {
            const loadedChats = await getChats(user.id);
            setChats(loadedChats);
            
            // Hydrate participants
            const allUserIds = Array.from(new Set(loadedChats.flatMap(c => c.participantIds)));
            const users = await getUsersByIds(allUserIds);
            const map: Record<string, User> = {};
            users.forEach(u => map[u.id] = u);
            setParticipantsMap(map);
        };
        loadChats();

        // Realtime Subscription for Chats List
        if (isSupabaseConfigured) {
            const channel = supabase.channel(`user_chats:${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => loadChats())
                .subscribe();
            return () => { supabase.removeChannel(channel); }
        }
    }, [user, showNewChat]);

    // Load Friends for New Chat
    useEffect(() => {
        if (showNewChat && user) {
            const loadFriends = async () => {
                const all = await getAllUsers();
                setFriendList(all.filter(u => u.id !== user.id)); // In real app, filter by user.friends
            };
            loadFriends();
        }
    }, [showNewChat, user]);

    // Load Messages for Active Chat
    useEffect(() => {
        if (!activeChat) return;
        const loadMsgs = async () => {
            const msgs = await getMessages(activeChat.id);
            setMessages(msgs);
            scrollToBottom();
        };
        loadMsgs();

        if (isSupabaseConfigured) {
            const channel = supabase.channel(`chat:${activeChat.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chatId=eq.${activeChat.id}` }, (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                    scrollToBottom();
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); }
        }
    }, [activeChat]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !activeChat || !user) return;
        
        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            chatId: activeChat.id,
            senderId: user.id,
            content: input,
            timestamp: Date.now(),
            readBy: [user.id],
            status: 'sent'
        };
        setMessages([...messages, tempMsg]);
        setInput('');
        scrollToBottom();

        await sendMessage(activeChat.id, user.id, input);
    };

    const handleCreateChat = async (targetUser: User) => {
        if (!user) return;
        // Check if chat exists
        const existing = chats.find(c => c.type === 'individual' && c.participantIds.includes(targetUser.id));
        if (existing) {
            setActiveChat(existing);
        } else {
            const newChat = await createChat([user.id, targetUser.id], 'individual');
            setActiveChat(newChat);
        }
        setShowNewChat(false);
    };

    const getChatName = (chat: Chat) => {
        if (chat.type === 'group') return chat.name || 'Group Chat';
        const otherId = chat.participantIds.find(id => id !== user?.id);
        return participantsMap[otherId || '']?.name || 'User';
    };

    const getChatImage = (chat: Chat) => {
        if (chat.type === 'group') return chat.image || 'https://picsum.photos/100/100?random=group';
        const otherId = chat.participantIds.find(id => id !== user?.id);
        return participantsMap[otherId || '']?.avatar || 'https://picsum.photos/100/100?random=user';
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#18191a] overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-slate-800 m-0 md:m-4 relative">
            {/* Sidebar */}
            <div className={`w-full md:w-80 border-r border-gray-200 dark:border-slate-700 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold dark:text-white">Chats</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowNewChat(true)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200"><Plus size={20} /></button>
                    </div>
                </div>
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" placeholder="Search Messenger" className="w-full bg-gray-100 dark:bg-slate-800 rounded-full py-2 pl-10 pr-4 focus:outline-none dark:text-white" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => setActiveChat(chat)}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 ${activeChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            <img src={getChatImage(chat)} className="w-12 h-12 rounded-full object-cover" alt="" />
                            <div className="ml-3 flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{getChatName(chat)}</h4>
                                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                                    {chat.lastMessage?.senderId === user?.id ? 'You: ' : ''}{chat.lastMessage?.content || 'No messages yet'}
                                </p>
                            </div>
                            {chat.updatedAt && (
                                <span className="text-xs text-gray-400">{new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-[#242526] ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center">
                                <button className="md:hidden mr-2" onClick={() => setActiveChat(null)}>Back</button>
                                <img src={getChatImage(activeChat)} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div className="ml-3">
                                    <h3 className="font-bold dark:text-white">{getChatName(activeChat)}</h3>
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Active now</span>
                                </div>
                            </div>
                            <div className="flex items-center text-blue-500 gap-4 pr-2">
                                <Phone className="cursor-pointer" />
                                <Video className="cursor-pointer" />
                                <Info className="cursor-pointer" />
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user?.id;
                                const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        {!isMe && (
                                            <div className="w-8 mr-2 flex flex-col justify-end">
                                                {showAvatar && <img src={participantsMap[msg.senderId]?.avatar} className="w-8 h-8 rounded-full" alt="" />}
                                            </div>
                                        )}
                                        <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-200 dark:bg-slate-700 dark:text-white rounded-bl-sm'}`}>
                                            {msg.mediaUrl && (
                                                <img src={msg.mediaUrl} className="rounded-lg mb-2 max-w-full" alt="Attachment" />
                                            )}
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center gap-2">
                            <Plus className="text-blue-500 cursor-pointer" />
                            <Image className="text-blue-500 cursor-pointer" />
                            <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center px-4 py-2">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Aa" 
                                        className="bg-transparent flex-1 outline-none dark:text-white"
                                    />
                                    <Smile className="text-gray-400 cursor-pointer" />
                                </div>
                                <button type="submit" className="text-blue-500 p-2 hover:bg-blue-50 rounded-full">
                                    <Send />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Send size={48} className="text-blue-500 ml-2" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Messages</h3>
                        <p>Send private photos and messages to a friend or group.</p>
                        <button onClick={() => setShowNewChat(true)} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700">Send Message</button>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="absolute inset-0 bg-white dark:bg-[#242526] z-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-lg">New Message</h3>
                        <button onClick={() => setShowNewChat(false)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-500">To:</label>
                        <input type="text" placeholder="Search people..." className="w-full p-2 bg-gray-100 dark:bg-slate-800 rounded-lg outline-none" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Suggested</h4>
                        {friendList.map(u => (
                            <div key={u.id} onClick={() => handleCreateChat(u)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                <img src={u.avatar} className="w-10 h-10 rounded-full" />
                                <span className="font-bold dark:text-white">{u.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messenger;
