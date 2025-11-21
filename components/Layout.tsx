import React, { useState } from 'react';
import { ViewState, User, Notification } from '../types';
import { 
  Home, Mic2, ShoppingBag, User as UserIcon, Menu, X, 
  Search, Bell, MessageCircle, Grid, Users, PlaySquare, Flag, Calendar, Clock, ChevronDown, Video, Radio
} from 'lucide-react';
import ChatWindow from './ChatWindow';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  currentUser: User;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setCurrentView, 
  currentUser
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);

  // Mock Notifications
  const notifications: Notification[] = [
    { id: '1', type: 'LIKE', user: { ...currentUser, name: 'Priya Singh' }, text: 'liked your cover photo.', time: '2m', read: false },
    { id: '2', type: 'COMMENT', user: { ...currentUser, name: 'Arjun Art' }, text: 'commented on your post.', time: '1h', read: true },
    { id: '3', type: 'FOLLOW', user: { ...currentUser, name: 'Design Hub' }, text: 'started following you.', time: '3h', read: true },
  ];

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
          <div className="hidden md:flex items-center px-3 py-2 rounded-full w-64 bg-gray-100">
            <Search size={18} className="text-gray-500" />
            <input 
              type="text" 
              placeholder="Search Artists Facebook" 
              className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm text-inherit"
            />
          </div>
          <button className="md:hidden p-2 rounded-full bg-gray-100">
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
          
          <button className="p-2.5 rounded-full bg-gray-200 hover:bg-gray-300">
            <MessageCircle size={20} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl overflow-hidden z-50 bg-white border border-gray-200">
                <div className="p-3 font-bold text-lg">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`flex items-center p-3 space-x-3 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''} hover:bg-gray-100`}>
                      <div className="relative">
                         <img src={notif.user.avatar} className="w-10 h-10 rounded-full" alt="" />
                         <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full border-2 border-white">
                            {notif.type === 'LIKE' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            {notif.type === 'COMMENT' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                         </div>
                      </div>
                      <div className="flex-1 text-sm">
                        <span className="font-semibold">{notif.user.name}</span> {notif.text}
                        <div className="text-xs mt-0.5 text-gray-500">{notif.time}</div>
                      </div>
                      {!notif.read && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setCurrentView(ViewState.PROFILE)} className="relative">
             <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full border border-slate-600" />
             <div className="absolute bottom-0 right-0 bg-gray-800 p-0.5 rounded-full border border-white">
                <ChevronDown size={10} className="text-white" />
             </div>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (Bottom) */}
      <div className="md:hidden fixed bottom-0 w-full h-16 z-50 flex justify-around items-center border-t bg-white border-gray-200">
          <NavIcon view={ViewState.FEED} icon={Home} />
          <NavIcon view={ViewState.LIVE} icon={Radio} />
          <NavIcon view={ViewState.MARKETPLACE} icon={ShoppingBag} />
          <NavIcon view={ViewState.GROUPS} icon={Users} />
          <NavIcon view={ViewState.PROFILE} icon={UserIcon} />
      </div>

      {/* Main Layout Grid */}
      <div className="pt-16 flex justify-center min-h-screen">
        
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden md:block w-[300px] fixed left-0 top-14 h-full overflow-y-auto p-4 space-y-1 no-scrollbar pb-20">
          <div 
            onClick={() => setCurrentView(ViewState.PROFILE)}
            className="flex items-center space-x-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors mb-4"
          >
            <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full" />
            <span className="font-semibold text-gray-900">{currentUser.name}</span>
          </div>
          
          <SidebarItem icon={Users} label="Groups" onClick={() => setCurrentView(ViewState.GROUPS)} active={currentView === ViewState.GROUPS} />
          <SidebarItem icon={Flag} label="Pages" onClick={() => setCurrentView(ViewState.PAGES)} active={currentView === ViewState.PAGES} />
          <SidebarItem icon={Calendar} label="Events" onClick={() => setCurrentView(ViewState.EVENTS)} active={currentView === ViewState.EVENTS} />
          <SidebarItem icon={Radio} label="Live" onClick={() => setCurrentView(ViewState.LIVE)} active={currentView === ViewState.LIVE} />
          
          <div className="border-b border-gray-300 my-2"></div>
          
          <SidebarItem icon={ShoppingBag} label="Marketplace" onClick={() => setCurrentView(ViewState.MARKETPLACE)} active={currentView === ViewState.MARKETPLACE} />
          <SidebarItem icon={Mic2} label="Studios" onClick={() => setCurrentView(ViewState.STUDIOS)} active={currentView === ViewState.STUDIOS} />
          <SidebarItem icon={PlaySquare} label="Watch" onClick={() => setCurrentView(ViewState.WATCH)} active={currentView === ViewState.WATCH} />
          <SidebarItem icon={Clock} label="Memories" />
          
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
        <main className={`flex-1 max-w-[700px] md:ml-[300px] ${currentView !== ViewState.PROFILE ? 'md:mr-[300px]' : ''} p-4 pb-20 w-full`}>
          {children}
        </main>

        {/* Right Sidebar (Contacts/Sponsored) - Hide on Profile view to give more space */}
        {currentView !== ViewState.PROFILE && (
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