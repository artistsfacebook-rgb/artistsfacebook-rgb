
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, Notification } from '../types';
import { 
  Home, Mic2, ShoppingBag, User as UserIcon, Menu, X, 
  Search, Bell, MessageCircle, Grid, Users, PlaySquare, Flag, Calendar, Clock, ChevronDown, Video, Radio, Check, Layout as LayoutIcon, Shield, LogOut
} from 'lucide-react';
import ChatWindow from './ChatWindow';
import { getNotifications, markAllNotificationsAsRead, searchGlobal } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
      const fetchNotifications = async () => {
          if (!currentUser?.id) return;
          const data = await getNotifications(currentUser.id);
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
      };
      fetchNotifications();
  }, [currentUser?.id]);

  // Real-time Notifications
  useEffect(() => {
      if (!isSupabaseConfigured || !currentUser?.id) return;

      const channel = supabase.channel(`notifications:${currentUser.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `userId=eq.${currentUser.id}` }, (payload) => {
              const newNotif = payload.new as Notification;
              setNotifications(prev => [newNotif, ...prev]);
              setUnreadCount(prev => prev + 1);
          })
          .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  // Click outside to close search suggestions
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-suggest
  useEffect(() => {
      const fetchSuggestions = async () => {
          if (searchTerm.length < 2) {
              setSuggestions([]);
              return;
          }
          const res = await searchGlobal(searchTerm);
          const combined = [
              ...res.users.map(u => ({ ...u, type: 'User', label: u.name })),
              ...res.groups.map(g => ({ ...g, type: 'Group', label: g.name })),
              ...res.pages.map(p => ({ ...p, type: 'Page', label: p.name }))
          ].slice(0, 5);
          setSuggestions(combined);
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
      if (searchTerm.trim()) {
          onSearch(searchTerm);
          setShowSuggestions(false);
      }
  };

  // Mock Contacts
  const contacts: User[] = [
    { ...currentUser, id: 'c1', name: 'Priya Singh', isOnline: true, avatar: 'https://picsum.photos/100/100?random=2' },
    { ...currentUser, id: 'c2', name: 'Rahul Verma', isOnline: true, avatar: 'https://picsum.photos/100/100?random=12' },
    { ...currentUser, id: 'c3', name: 'Studio 88', isOnline: false, avatar: 'https://picsum.photos/100/100?random=13' },
    { ...currentUser, id: 'c4', name: 'Neha K', isOnline: true, avatar: 'https://picsum.photos/100/100?random=14' },
    { ...currentUser, id: 'c5', name: 'Art Supplies Co', isOnline: true, avatar: 'https://picsum.photos/100/100?random=15' },
  ];

  const NavIcon = ({ view, icon: Icon, active }: { view: ViewState, icon: any, active?: boolean }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex-1 md:flex-none flex justify-center items-center h-12 w-12 md:w-28 rounded-lg transition-colors relative group ${
        currentView === view 
          ? 'text-blue-500 border-b-4 border-blue-500 rounded-none' 
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon size={28} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="absolute -bottom-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block z-50 whitespace-nowrap">
        {view}
      </span>
    </button>
  );

  const SidebarItem = ({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick?: () => void, active?: boolean }) => (
    <div 
      onClick={onClick}
      className={`flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors ${active ? 'bg-gray-200' : ''}`}
    >
      <Icon className={`${active ? 'text-blue-600' : 'text-blue-500'}`} size={24} />
      <span className={`font-medium ${active ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900 font-sans transition-colors duration-200">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-14 shadow-sm px-4 flex items-center justify-between bg-white border-b border-gray-200">
        {/* Left: Logo & Search */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer" onClick={() => setCurrentView(ViewState.FEED)}>
            Af
          </div>
          
          {/* Search Bar with Suggestions */}
          <div className="relative hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="flex items-center px-3 py-2 rounded-full w-64 bg-gray-100 focus-within:w-80 transition-all duration-300">
                <Search size={18} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search Artists Facebook" 
                  className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm text-inherit"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </form>
              
              {showSuggestions && searchTerm && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-lg mt-1 border border-gray-100 overflow-hidden z-50">
                      {suggestions.length > 0 ? (
                          <ul>
                              {suggestions.map((item, idx) => (
                                  <li key={idx} onClick={() => { onSearch(item.label); setShowSuggestions(false); setSearchTerm(item.label); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2">
                                      {item.type === 'User' && <img src={item.avatar} className="w-6 h-6 rounded-full" />}
                                      <div className="flex flex-col">
                                          <span className="text-sm font-bold">{item.label}</span>
                                          <span className="text-xs text-gray-500">{item.type}</span>
                                      </div>
                                  </li>
                              ))}
                              <li onClick={handleSearchSubmit} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 text-sm font-bold flex items-center gap-2">
                                  <Search size={14} /> See all results for "{searchTerm}"
                              </li>
                          </ul>
                      ) : (
                          <div className="p-3 text-sm text-gray-500">No suggestions found</div>
                      )}
                  </div>
              )}
          </div>

          <button className="md:hidden p-2 rounded-full bg-gray-100" onClick={() => setCurrentView(ViewState.SEARCH)}>
            <Search size={20} />
          </button>
        </div>

        {/* Center: Nav Tabs (Desktop) */}
        <nav className="hidden md:flex items-center space-x-1 h-full">
          <NavIcon view={ViewState.FEED} icon={Home} />
          <NavIcon view={ViewState.WATCH} icon={PlaySquare} />
          <NavIcon view={ViewState.MARKETPLACE} icon={ShoppingBag} />
          <NavIcon view={ViewState.GROUPS} icon={Users} />
          <NavIcon view={ViewState.LIVE} icon={Radio} />
        </nav>

        {/* Right: User Actions */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <button className="hidden md:flex p-2.5 rounded-full bg-gray-200 hover:bg-gray-300">
            <Grid size={20} />
          </button>
          
          <button 
            onClick={() => setCurrentView(ViewState.MESSENGER)}
            className={`p-2.5 rounded-full hover:bg-gray-300 ${currentView === ViewState.MESSENGER ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}
          >
            <MessageCircle size={20} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-full hover:bg-gray-300 ${showNotifications ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}
            >
              <Bell size={20} className={showNotifications ? 'fill-current' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl overflow-hidden z-50 bg-white border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="p-3 font-bold text-lg flex justify-between items-center">
                    <span>Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <Check size={12} /> Mark all read
                    </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No notifications yet</div>}
                  {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        onClick={() => {
                            if (notif.type === 'LIVE') setCurrentView(ViewState.LIVE);
                            else if (notif.type === 'MESSAGE') setCurrentView(ViewState.MESSENGER);
                            else if (notif.type === 'FRIEND_REQ') setCurrentView(ViewState.PROFILE);
                            else if (notif.type === 'GROUP_INVITE') setCurrentView(ViewState.GROUPS);
                            else setCurrentView(ViewState.FEED);
                            setShowNotifications(false);
                        }}
                        className={`flex items-center p-3 space-x-3 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''} hover:bg-gray-100 transition-colors`}
                    >
                      <div className="relative">
                         <img src={notif.actorAvatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                         <div className="absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white bg-white shadow-sm">
                            {notif.type === 'LIKE' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            {notif.type === 'COMMENT' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                            {notif.type === 'LIVE' && <Radio size={10} className="text-red-500 fill-current" />}
                            {notif.type === 'FRIEND_REQ' && <UserIcon size={10} className="text-blue-500 fill-current" />}
                         </div>
                      </div>
                      <div className="flex-1 text-sm">
                        <div className="line-clamp-2">
                            <span className="font-semibold">{notif.actorName}</span> {notif.text}
                        </div>
                        <div className="text-xs mt-1 text-blue-500 font-medium">{new Date(notif.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                      </div>
                      {!notif.read && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="relative">
                 <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-600" />
                 <div className="absolute bottom-0 right-0 bg-gray-800 p-0.5 rounded-full border border-white">
                    <ChevronDown size={10} className="text-white" />
                 </div>
              </button>
              
              {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in duration-100">
                      <div className="px-4 py-2 border-b border-gray-100 mb-2" onClick={() => { setCurrentView(ViewState.PROFILE); setShowProfileMenu(false); }}>
                          <div className="font-bold text-gray-900">{currentUser.name}</div>
                          <div className="text-sm text-gray-500">View your profile</div>
                      </div>
                      <button onClick={() => { setCurrentView(ViewState.PRIVACY); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm">
                          <Shield size={16} /> Privacy & Support
                      </button>
                      <button onClick={() => signOut()} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600">
                          <LogOut size={16} /> Log Out
                      </button>
                  </div>
              )}
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation Bar (Bottom) */}
      <div className="md:hidden fixed bottom-0 w-full h-16 z-50 flex justify-around items-center border-t bg-white border-gray-200">
          <NavIcon view={ViewState.FEED} icon={Home} />
          <NavIcon view={ViewState.MESSENGER} icon={MessageCircle} />
          <NavIcon view={ViewState.MARKETPLACE} icon={ShoppingBag} />
          <NavIcon view={ViewState.GROUPS} icon={Users} />
          <NavIcon view={ViewState.PROFILE} icon={UserIcon} />
      </div>

      {/* Main Layout Grid */}
      <div className="pt-16 flex justify-center min-h-screen">
        
        {/* Left Sidebar (Desktop Only) */}
        <aside className={`hidden md:block w-[300px] fixed left-0 top-14 h-full overflow-y-auto p-4 space-y-1 no-scrollbar pb-20 ${currentView === ViewState.MESSENGER ? 'hidden' : ''}`}>
          <div 
            onClick={() => setCurrentView(ViewState.PROFILE)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors mb-4"
          >
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full" />
            <span className="font-semibold text-gray-900">{currentUser.name}</span>
          </div>
          
          <SidebarItem icon={MessageCircle} label="Messenger" onClick={() => setCurrentView(ViewState.MESSENGER)} active={currentView === ViewState.MESSENGER} />
          <SidebarItem icon={Users} label="Groups" onClick={() => setCurrentView(ViewState.GROUPS)} active={currentView === ViewState.GROUPS} />
          <SidebarItem icon={Flag} label="Pages" onClick={() => setCurrentView(ViewState.PAGES)} active={currentView === ViewState.PAGES} />
          <SidebarItem icon={LayoutIcon} label="Ads Manager" onClick={() => setCurrentView(ViewState.ADS_MANAGER)} active={currentView === ViewState.ADS_MANAGER} />
          <SidebarItem icon={Calendar} label="Events" onClick={() => setCurrentView(ViewState.EVENTS)} active={currentView === ViewState.EVENTS} />
          <SidebarItem icon={Radio} label="Live" onClick={() => setCurrentView(ViewState.LIVE)} active={currentView === ViewState.LIVE} />
          
          <div className="border-b border-gray-300 my-2"></div>
          
          <SidebarItem icon={ShoppingBag} label="Marketplace" onClick={() => setCurrentView(ViewState.MARKETPLACE)} active={currentView === ViewState.MARKETPLACE} />
          <SidebarItem icon={Mic2} label="Studios" onClick={() => setCurrentView(ViewState.STUDIOS)} active={currentView === ViewState.STUDIOS} />
          <SidebarItem icon={PlaySquare} label="Watch" onClick={() => setCurrentView(ViewState.WATCH)} active={currentView === ViewState.WATCH} />
          <SidebarItem icon={Shield} label="Privacy Center" onClick={() => setCurrentView(ViewState.PRIVACY)} active={currentView === ViewState.PRIVACY} />
          
          <div className="border-t border-gray-300 my-4 pt-4">
            <h3 className="text-gray-500 font-semibold px-2 mb-2">Your Shortcuts</h3>
            <div className="flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer">
              <img src="https://picsum.photos/50/50?random=100" className="w-8 h-8 rounded-lg" alt="" />
              <span className="text-sm font-medium">Indian Digital Artists</span>
            </div>
            <div className="flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer">
              <img src="https://picsum.photos/50/50?random=101" className="w-8 h-8 rounded-lg" alt="" />
              <span className="text-sm font-medium">Mumbai Art Events</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 ${currentView === ViewState.MESSENGER ? 'w-full max-w-full px-0' : 'max-w-[700px] md:ml-[300px] p-4'} ${currentView !== ViewState.PROFILE && currentView !== ViewState.MESSENGER ? 'md:mr-[300px]' : ''} pb-20 w-full`}>
          {children}
        </main>

        {/* Right Sidebar (Contacts/Sponsored) - Hide on Profile and Messenger view */}
        {currentView !== ViewState.PROFILE && currentView !== ViewState.MESSENGER && (
          <aside className="hidden md:flex flex-col w-[300px] fixed right-0 top-14 h-full overflow-y-auto p-4 border-l border-transparent pb-20">
            
            <div className="mb-6">
              <h3 className="text-gray-500 font-semibold mb-3">Sponsored</h3>
              <div className="flex items-center space-x-3 hover:bg-gray-200 p-2 rounded-lg cursor-pointer transition-colors">
                <img src="https://picsum.photos/120/120?random=200" className="w-28 h-28 rounded-lg object-cover" alt="Ad" />
                <div className="flex flex-col justify-center">
                  <span className="font-semibold text-sm">Masterclass: Oil Painting</span>
                  <span className="text-xs text-gray-500">artmasterclass.com</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4">
               <div className="flex justify-between items-center mb-3 px-2">
                  <h3 className="text-gray-500 font-semibold">Contacts</h3>
                  <div className="flex space-x-2 text-gray-500">
                     <Video size={16} />
                     <Search size={16} />
                  </div>
               </div>
               
               <div className="space-y-1">
                 {contacts.map(contact => (
                   <div 
                    key={contact.id} 
                    onClick={() => setActiveChatUser(contact)}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer group"
                   >
                     <div className="relative">
                       <img src={contact.avatar} className="w-9 h-9 rounded-full" alt={contact.name} />
                       {contact.isOnline && (
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                       )}
                     </div>
                     <span className="font-medium text-sm text-gray-900">{contact.name}</span>
                   </div>
                 ))}
               </div>
            </div>
          </aside>
        )}
      </div>

      {/* Chat Window */}
      {activeChatUser && (
        <ChatWindow user={activeChatUser} onClose={() => setActiveChatUser(null)} />
      )}
    </div>
  );
};

export default Layout;
