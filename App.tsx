
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
import { ViewState, User } from './types';
import { saveUser } from './services/storage';

const MainApp: React.FC = () => {
  const { user: currentUser, session } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.FEED);
  
  const handleUserUpdate = async (updatedUser: User) => {
    try {
      // In AuthContext we might need a setUser method, but for now relying on local mutation + save
      // The best practice is to update DB then let subscription update state, but for instant feedback:
      // We can't easily update context state from here without exposing setter.
      // But saving to DB will eventually trigger updates if real-time.
      await saveUser(updatedUser);
      // Force reload to reflect changes if context doesn't auto-update from save
      window.location.reload(); 
    } catch (e) {
      console.error("Failed to save user data", e);
      alert("Failed to save profile. Please try again.");
    }
  };

  // We handle follow toggles by updating the current user object and saving it
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
      // Triggering a reload is crude but effective for this architecture
      // Ideally AuthContext provides a `updateProfile` method
    } catch (e) {
      console.error("Error toggling follow", e);
    }
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
