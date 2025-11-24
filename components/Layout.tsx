
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, Notification } from '../types';
import { 
  Home, Mic2, ShoppingBag, User as UserIcon, Menu, X, 
  Search, Bell, MessageCircle, Grid, Users, PlaySquare, Flag, Calendar, Clock, ChevronDown, Video, Radio, Check, Layout as LayoutIcon, Shield, LogOut, Moon, Sun, Globe, Bookmark, BarChart2, Hash
} from 'lucide-react';
import ChatWindow from './ChatWindow';
import { getNotifications, markAllNotificationsAsRead, searchGlobal, getTrendingTags, getUsersByIds } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  currentUser: User;
  onSearch: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setCurrentView, 
  currentUser,
  onSearch
}) => {
  const { signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number}[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dark Mode Handler
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  // Initial Load & Realtime
  useEffect(() => {
      const fetchNotifications = async () => {
          if (!currentUser?.id) return;
          const data = await getNotifications(currentUser.id);
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
      };
      fetchNotifications();

      const fetchTrends = async () => {
          const trends = await getTrendingTags();
          setTrendingTags(trends);
      };
      fetchTrends();

      // Load Friends
      const loadFriends = async () => {
          if (currentUser?.friends?.length > 0) {
              const friendData = await getUsersByIds(currentUser.friends);
              setFriends(friendData);
          }
      };
      loadFriends();

      if (isSupabaseConfigured && currentUser?.id) {
          // Notifications Channel
          const notifChannel = supabase.channel(`notifications:${currentUser.id}`)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `userId=eq.${currentUser.id}` }, (payload) => {
                  setNotifications(prev => [payload.new as Notification, ...prev]);
                  setUnreadCount(prev => prev + 1);
              })
              .subscribe();

          // Presence Channel (Global or Friends scope)
          const presenceChannel = supabase.channel('online_users', {
            config: { presence: { key: currentUser.id } }
          });

          presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const onlineIds = new Set(Object.keys(newState));
                setOnlineUsers(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ online_at: new Date().toISOString() });
                }
            });

          return () => { 
              supabase.removeChannel(notifChannel);
              supabase.removeChannel(presenceChannel);
          };
      }
  }, [currentUser?.id, currentUser?.friends]);

  // Search Logic
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      const fetchSuggestions = async () => {
          if (searchTerm.length < 2) { setSuggestions([]); return; }
          const res = await searchGlobal(searchTerm);
          setSuggestions([
              ...res.users.map(u => ({ ...u, type: 'User', label: u.name })),
              ...res.groups.map(g => ({ ...g, type: 'Group', label: g.name })),
              ...res.pages.map(p => ({ ...p, type: 'Page', label: p.name }))
          ].slice(0, 5));
      };
      const timeout = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleMarkAllRead = async () => {
      await markAllNotificationsAsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) { onSearch(searchTerm); setShowSuggestions(false); }
  };

  const NavIcon = ({ view, icon: Icon, active }: { view: ViewState, icon: any, active?: boolean }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex-1 md:flex-none flex justify-center items-center h-12 w-12 md:w-28 rounded-lg transition-colors relative group ${
        currentView === view 
          ? 'text-blue-500 border-b-4 border-blue-500 rounded-none' 
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
      }`}
    >
      <Icon size={28} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="absolute -bottom-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block z-50 whitespace-nowrap">
        {t(view.toLowerCase() as any)}
      </span>
    </button>
  );

  const SidebarItem = ({ icon: Icon, label, onClick, active }: any) => (
    <div 
      onClick={onClick}
      className={`flex items-center space-x-3 p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors ${active ? 'bg-gray-200 dark:bg-slate-700' : ''}`}
    >
      <Icon className={`${active ? 'text-blue-600' : 'text-blue-500'}`} size={24} />
      <span className={`font-medium ${active ? 'text-blue-600 font-bold' : 'text-gray-900 dark:text-white'}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-14 shadow-sm px-4 flex items-center justify-between bg-white dark:bg-[#242526] border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer" onClick={() => setCurrentView(ViewState.FEED)}>
            Af
          </div>
          
          <div className="relative hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="flex items-center px-3 py-2 rounded-full w-64 bg-gray-100 dark:bg-slate-700 focus-within:w-80 transition-all duration-300">
                <Search size={18} className="text-gray-500 dark:text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')}
                  className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm text-inherit dark:text-white"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </form>
              {showSuggestions && searchTerm && (
                  <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 shadow-xl rounded-lg mt-1 border border-gray-100 dark:border-slate-600 overflow-hidden z-50">
                      <ul>
                          {suggestions.map((item, idx) => (
                              <li key={idx} onClick={() => { onSearch(item.label); setShowSuggestions(false); setSearchTerm(item.label); }} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2">
                                  {item.type === 'User' && <img src={item.avatar} className="w-6 h-6 rounded-full" />}
                                  <div className="flex flex-col">
                                      <span className="text-sm font-bold dark:text-white">{item.label}</span>
                                      <span className="text-xs text-gray-500">{item.type}</span>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>
          <button className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-slate-700" onClick={() => setCurrentView(ViewState.SEARCH)}><Search size={20} /></button>
        </div>

        <nav className="hidden md:flex items-center space-x-1 h-full">
          <NavIcon view={ViewState.FEED} icon={Home} />
          <NavIcon view={ViewState.WATCH} icon={PlaySquare} />
          <NavIcon view={ViewState.MARKETPLACE} icon={ShoppingBag} />
          <NavIcon view={ViewState.GROUPS} icon={Users} />
          <NavIcon view={ViewState.LIVE} icon={Radio} />
        </nav>

        <div className="flex items-center space-x-2 md:space-x-3">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600">
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>

          <button onClick={() => setCurrentView(ViewState.MESSENGER)} className="hidden md:flex p-2.5 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600">
            <MessageCircle size={20} />
          </button>
          
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600">
              <Bell size={20} className={showNotifications ? 'fill-current' : ''} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl overflow-hidden z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="p-3 font-bold text-lg flex justify-between items-center border-b border-gray-200 dark:border-slate-700 dark:text-white">
                    <span>Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:underline flex items-center gap-1"><Check size={12} /> Mark read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No notifications yet</div>}
                  {notifications.map(notif => (
                    <div key={notif.id} onClick={() => { setCurrentView(ViewState.FEED); setShowNotifications(false); }} className={`flex items-center p-3 space-x-3 cursor-pointer ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-slate-700'} transition-colors border-b border-gray-100 dark:border-slate-700`}>
                      <img src={notif.actorAvatar} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 text-sm">
                        <div className="line-clamp-2 dark:text-white"><span className="font-semibold">{notif.actorName}</span> {notif.text}</div>
                        <div className="text-xs mt-1 text-blue-500">{new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                      </div>
                      {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="relative">
                 <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-600" />
              </button>
              {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 py-2 animate-in fade-in zoom-in duration-100">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 mb-2" onClick={() => { setCurrentView(ViewState.PROFILE); setShowProfileMenu(false); }}>
                          <div className="font-bold text-gray-900 dark:text-white">{currentUser.name}</div>
                          <div className="text-sm text-gray-500">View Profile</div>
                      </div>
                      <button onClick={() => { setLanguage(language === 'en' ? 'hi' : 'en'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm dark:text-gray-300">
                          <Globe size={16} /> {t('language')}: {language === 'en' ? 'English' : 'हिन्दी'}
                      </button>
                      <button onClick={() => { setCurrentView(ViewState.PRIVACY); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm dark:text-gray-300">
                          <Shield size={16} /> {t('privacy')}
                      </button>
                      <button onClick={() => signOut()} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-red-600">
                          <LogOut size={16} /> Log Out
                      </button>
                  </div>
              )}
          </div>
        </div>
      </header>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full h-16 z-50 flex justify-around items-center border-t bg-white dark:bg-[#242526] border-gray-200 dark:border-slate-700">
          <NavIcon view={ViewState.FEED} icon={Home} />
          <NavIcon view={ViewState.MESSENGER} icon={MessageCircle} />
          <NavIcon view={ViewState.MARKETPLACE} icon={ShoppingBag} />
          <NavIcon view={ViewState.GROUPS} icon={Users} />
          <NavIcon view={ViewState.PROFILE} icon={UserIcon} />
      </div>

      {/* Main Layout */}
      <div className="pt-16 flex justify-center min-h-screen">
        {/* Left Sidebar */}
        <aside className={`hidden md:block w-[300px] fixed left-0 top-14 h-full overflow-y-auto p-4 space-y-1 no-scrollbar pb-20 ${currentView === ViewState.MESSENGER ? 'hidden' : ''}`}>
          <div onClick={() => setCurrentView(ViewState.PROFILE)} className="flex items-center space-x-3 p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer mb-4">
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full" />
            <span className="font-semibold text-gray-900 dark:text-white">{currentUser.name}</span>
          </div>
          
          <SidebarItem icon={Bookmark} label={t('saved')} onClick={() => setCurrentView(ViewState.SAVED)} active={currentView === ViewState.SAVED} />
          <SidebarItem icon={MessageCircle} label={t('messenger')} onClick={() => setCurrentView(ViewState.MESSENGER)} active={currentView === ViewState.MESSENGER} />
          <SidebarItem icon={Users} label={t('groups')} onClick={() => setCurrentView(ViewState.GROUPS)} active={currentView === ViewState.GROUPS} />
          <SidebarItem icon={Flag} label={t('pages')} onClick={() => setCurrentView(ViewState.PAGES)} active={currentView === ViewState.PAGES} />
          <SidebarItem icon={LayoutIcon} label={t('ads')} onClick={() => setCurrentView(ViewState.ADS_MANAGER)} active={currentView === ViewState.ADS_MANAGER} />
          <SidebarItem icon={Calendar} label={t('events')} onClick={() => setCurrentView(ViewState.EVENTS)} active={currentView === ViewState.EVENTS} />
          <SidebarItem icon={Radio} label={t('live')} onClick={() => setCurrentView(ViewState.LIVE)} active={currentView === ViewState.LIVE} />
          <div className="border-b border-gray-300 dark:border-slate-700 my-2"></div>
          <SidebarItem icon={ShoppingBag} label={t('marketplace')} onClick={() => setCurrentView(ViewState.MARKETPLACE)} active={currentView === ViewState.MARKETPLACE} />
          <SidebarItem icon={Mic2} label={t('studios')} onClick={() => setCurrentView(ViewState.STUDIOS)} active={currentView === ViewState.STUDIOS} />
          <SidebarItem icon={BarChart2} label={t('admin')} onClick={() => setCurrentView(ViewState.ADMIN)} active={currentView === ViewState.ADMIN} />
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${currentView === ViewState.MESSENGER ? 'w-full max-w-full px-0' : 'max-w-[700px] md:ml-[300px] p-4'} ${currentView !== ViewState.PROFILE && currentView !== ViewState.MESSENGER ? 'md:mr-[300px]' : ''} pb-20 w-full`}>
          {children}
        </main>

        {/* Right Sidebar */}
        {currentView !== ViewState.PROFILE && currentView !== ViewState.MESSENGER && (
          <aside className="hidden md:flex flex-col w-[300px] fixed right-0 top-14 h-full overflow-y-auto p-4 border-l border-transparent pb-20">
            {/* Trending Widget */}
            <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm p-4 mb-4 border border-gray-200 dark:border-slate-700">
                <h3 className="font-bold text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Hash size={16} /> {t('trending')}
                </h3>
                <div className="space-y-3">
                    {trendingTags.length === 0 ? <p className="text-xs text-gray-500">No trending topics yet.</p> : trendingTags.map(({tag, count}) => (
                        <div key={tag} onClick={() => onSearch(tag)} className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded">
                            <span className="font-semibold text-sm dark:text-white">#{tag}</span>
                            <span className="text-xs text-gray-400">{count} posts</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-500 font-semibold mb-3">{t('sponsored')}</h3>
              <div className="flex items-center space-x-3 hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded-lg cursor-pointer transition-colors">
                <img src="https://picsum.photos/120/120?random=200" className="w-28 h-28 rounded-lg object-cover" alt="Ad" />
                <div className="flex flex-col justify-center">
                  <span className="font-semibold text-sm dark:text-white">Masterclass: Oil Painting</span>
                  <span className="text-xs text-gray-500">artmasterclass.com</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-slate-700 pt-4">
               <div className="flex justify-between items-center mb-3 px-2">
                  <h3 className="text-gray-500 font-semibold">{t('contacts')}</h3>
                  <div className="flex space-x-2 text-gray-500"><Video size={16} /><Search size={16} /></div>
               </div>
               <div className="space-y-1">
                 {friends.length === 0 && <p className="text-sm text-gray-500 px-2">Add friends to see them here.</p>}
                 {friends.map(contact => {
                   const isOnline = onlineUsers.has(contact.id);
                   return (
                     <div key={contact.id} onClick={() => setActiveChatUser(contact)} className="flex items-center space-x-3 p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer group">
                       <div className="relative">
                         <img src={contact.avatar} className="w-9 h-9 rounded-full" />
                         {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]"></div>}
                       </div>
                       <span className="font-medium text-sm text-gray-900 dark:text-white">{contact.name}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
          </aside>
        )}
      </div>

      {activeChatUser && <ChatWindow user={activeChatUser} onClose={() => setActiveChatUser(null)} />}
    </div>
  );
};

export default Layout;
