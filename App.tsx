
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Feed from './components/Feed';
import StudioBooking from './components/StudioBooking';
import Marketplace from './components/Marketplace';
import Profile from './components/Profile';
import Login from './components/Login';
import Groups from './components/Groups';
import Pages from './components/Pages';
import Events from './components/Events';
import LiveStreamComponent from './components/LiveStream';
import Messenger from './components/Messenger';
import AdsManager from './components/AdsManager';
import SearchResults from './components/SearchResults';
import PrivacyCenter from './components/PrivacyCenter';
import { ViewState, User } from './types';
import { saveUser } from './services/storage';

const MainApp: React.FC = () => {
  const { user: currentUser, session } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.FEED);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleUserUpdate = async (updatedUser: User) => {
    try {
      await saveUser(updatedUser);
      window.location.reload(); 
    } catch (e) {
      console.error("Failed to save user data", e);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) return;
    
    try {
      const isFollowing = currentUser.followingIds.includes(targetUserId);
      let newFollowingIds: string[];
      let newFollowingCount = currentUser.following || 0;

      if (isFollowing) {
        newFollowingIds = currentUser.followingIds.filter(id => id !== targetUserId);
        newFollowingCount = Math.max(0, newFollowingCount - 1);
      } else {
        newFollowingIds = [...currentUser.followingIds, targetUserId];
        newFollowingCount += 1;
      }

      const updatedUser = {
        ...currentUser,
        followingIds: newFollowingIds,
        following: newFollowingCount
      };

      await saveUser(updatedUser);
    } catch (e) {
      console.error("Error toggling follow", e);
    }
  };

  const handleSearch = (query: string) => {
      setSearchQuery(query);
      setCurrentView(ViewState.SEARCH);
  };

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewState.FEED:
        return <Feed user={currentUser} onToggleFollow={handleToggleFollow} />;
      case ViewState.STUDIOS:
        return <StudioBooking />;
      case ViewState.MARKETPLACE:
        return <Marketplace />;
      case ViewState.PROFILE:
        return <Profile user={currentUser} onUpdateUser={handleUserUpdate} onToggleFollow={handleToggleFollow} />;
      case ViewState.GROUPS:
        return <Groups />;
      case ViewState.PAGES:
        return <Pages />;
      case ViewState.EVENTS:
        return <Events />;
      case ViewState.LIVE:
        return <LiveStreamComponent />;
      case ViewState.MESSENGER:
        return <Messenger />;
      case ViewState.ADS_MANAGER:
        return <AdsManager />;
      case ViewState.SEARCH:
        return <SearchResults query={searchQuery} />;
      case ViewState.PRIVACY:
        return <PrivacyCenter />;
      case ViewState.WATCH:
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                     <span className="text-4xl">📺</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Watch Page</h2>
                <p>Discover trending art videos and reels.</p>
            </div>
        );
      default:
        return <Feed user={currentUser} onToggleFollow={handleToggleFollow} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={setCurrentView} 
      currentUser={currentUser}
      onSearch={handleSearch}
    >
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
