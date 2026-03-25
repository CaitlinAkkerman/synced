import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, LogOut, Droplet } from 'lucide-react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import ProfileDetailPage from './components/ProfileDetailPage';
import CycleLogger from './components/CycleLogger';
import { apiCall } from './api';
import { useCyclePhase, useHouseholdPhases } from './hooks/useCyclePhase';
import './styles/PhaseThemes.css';
import Toast from './components/Toast';
import MouseGlow from './components/MouseGlow';
import Onboarding from './components/Onboarding';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [profiles, setProfiles] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedProfileDetail, setSelectedProfileDetail] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const phases = useHouseholdPhases(profiles);
  const activePhases = Object.values(phases);
  const dominantPhase = activePhases.length > 0
    ? activePhases.sort((a,b) => activePhases.filter(v => v===a).length - activePhases.filter(v => v===b).length).pop()
    : 'menstrual';

  useEffect(() => {
    document.body.className = `phase-${dominantPhase}`;
  }, [dominantPhase]);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      loadHousehold();
    }
  }, []);

  const loadHousehold = async () => {
    try {
      const response = await apiCall('/api/household', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setCurrentHousehold(data);
      const loadedProfiles = data.profiles || [];
      setProfiles(loadedProfiles);
      if (loadedProfiles.length === 0 && !sessionStorage.getItem('onboarding_skipped')) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load household:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadHousehold();
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const response = await apiCall('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (!response.ok) {
        setDeleteError(data.message || 'Failed to delete account');
        setDeleteLoading(false);
        return;
      }
      // Wipe everything and go back to login
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      sessionStorage.clear();
      setCurrentUser(null);
      setCurrentHousehold(null);
      setProfiles([]);
      setShowDeleteConfirm(false);
    } catch {
      setDeleteError('Network error. Try again.');
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentHousehold(null);
    setProfiles([]);
    sessionStorage.removeItem('onboarding_skipped');
  };

  if (!currentUser) {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    return <LoginScreen onLogin={handleLogin} resetToken={resetToken} />;
  }

  return (
    <div className="app-container">
      <MouseGlow />
      <Toast />
      {showOnboarding && (
        <Onboarding
          onComplete={() => {
            setShowOnboarding(false);
            loadHousehold();
          }}
          onSkip={() => {
            sessionStorage.setItem('onboarding_skipped', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-emoji">⚠️</div>
            <h2 className="delete-confirm-title">Delete Account</h2>
            <p className="delete-confirm-desc">
              This will permanently delete your account, all profiles, and every single period log. There is no undo. Like, none. Gone forever.
            </p>
            {deleteError && (
              <div className="delete-confirm-error">{deleteError}</div>
            )}
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                disabled={deleteLoading}
              >
                Never mind
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="navbar">
        <div className="nav-left">
          <div className="app-logo">
            <Droplet className="logo-icon" />
            <h1>Synced</h1>
            <p>Track. Sync. Plan.</p>
          </div>
        </div>
        <div className="nav-right">
          <button
            className="nav-btn"
            onClick={() => { setActiveView('dashboard'); setEditingLog(null); }}
            data-active={activeView === 'dashboard'}
          >
            <Calendar size={20} />
            Sync Center
          </button>
          <button
            className="nav-btn"
            onClick={() => setActiveView('profiles')}
            data-active={activeView === 'profiles'}
          >
            <Settings size={20} />
            Profiles
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
          <button
            className="nav-btn delete-account-btn"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete account"
          >
            🗑
          </button>
          <div className="phase-indicator" title="Current cycle phase">
            {dominantPhase.charAt(0).toUpperCase() + dominantPhase.slice(1)} Phase
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeView === 'dashboard' && (
          <Dashboard
            household={currentHousehold}
            profiles={profiles}
            onAddLog={() => { setEditingLog(null); setActiveView('log'); }}
            onEditLog={(log) => { setEditingLog(log); setActiveView('log'); }}
            onProfileClick={(profile) => {
              setSelectedProfileDetail(profile);
              setActiveView('profile-detail');
            }}
          />
        )}
        {activeView === 'profiles' && (
          <ProfileManager
            household={currentHousehold}
            profiles={profiles}
            onProfilesUpdate={loadHousehold}
            onProfileClick={(profile) => {
              setSelectedProfileDetail(profile);
              setActiveView('profile-detail');
            }}
          />
        )}
        {activeView === 'profile-detail' && (
          <ProfileDetailPage
            profile={selectedProfileDetail}
            onBack={() => setActiveView('dashboard')}
            onEditLog={(log) => { setEditingLog(log); setActiveView('log'); }}
          />
        )}
        {activeView === 'log' && (
          <CycleLogger
            profiles={profiles}
            editingLog={editingLog}
            onClose={() => { setActiveView('dashboard'); setEditingLog(null); }}
            onLogCreated={loadHousehold}
          />
        )}
      </main>

      {/* BOTTOM TAB BAR — mobile only */}
      <nav className="bottom-tab-bar">
        <button
          className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveView('dashboard'); setEditingLog(null); }}
        >
          <Calendar size={20} />
          <span className="tab-btn-label">Dashboard</span>
        </button>
        <button
          className={`tab-btn ${activeView === 'log' ? 'active' : ''}`}
          onClick={() => { setEditingLog(null); setActiveView('log'); }}
        >
          <Plus size={20} />
          <span className="tab-btn-label">Log</span>
        </button>
        <button
          className={`tab-btn ${activeView === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveView('profiles')}
        >
          <Settings size={20} />
          <span className="tab-btn-label">Profiles</span>
        </button>
        <button
          className="tab-btn"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="tab-btn-label">Logout</span>
        </button>
        <button
          className="tab-btn tab-btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <span style={{ fontSize: '18px' }}>🗑</span>
          <span className="tab-btn-label">Delete</span>
        </button>
      </nav>
    </div>
  );
}

export default App;