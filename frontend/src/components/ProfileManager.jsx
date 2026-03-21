import React, { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import '../styles/ProfileManager.css';
import { apiCall } from '../api';
// Add to imports at the top
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

function ProfileManager({ household, profiles, onProfilesUpdate, onProfileClick }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    role: 'daughter',
    cycleLength: '28',
    periodLength: '5',
    emoji: '🌸'
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({ ...prev, emoji }));
    setShowEmojiPicker(false);
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiCall('/api/profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to add profile');
        return;
      }

      setFormData({
        name: '',
        age: '',
        role: 'daughter',
        cycleLength: '28',
        periodLength: '5',
        emoji: '🌸'
      });
      setShowAddForm(false);
      setShowEmojiPicker(false);
      onProfilesUpdate();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure? This will delete all cycle logs for this person.')) {
      return;
    }

    try {
      const response = await apiCall(`/api/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        setError('Failed to delete profile');
        return;
      }

      onProfilesUpdate();
    } catch (err) {
      setError('Network error');
    }
  };

  const handleExportHousehold = async () => {
    try {
      const response = await apiCall('/api/export/household', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `household-cycle-data.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('Failed to export data');
    }
  };

  return (
    <div className="profile-manager">
      <div className="manager-header">
        <h2>Profile Management</h2>
        <p>Your People. Your Cycles. Your Chaos.</p>
      </div>

      <div className="manager-body">

        {/* LEFT — profile list */}
        <div className="manager-left">
          <div className="pm-card">
            <div className="pm-card-header">
              <div className="pm-card-title">Profiles</div>
              {profiles && profiles.length > 0 && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleExportHousehold}
                >
                  <Download size={14} />
                  Export All
                </button>
              )}
            </div>

            <div className="profiles-list">
              {profiles && profiles.length > 0 ? (
                profiles.map(profile => (
                  <div key={profile.id} className="profile-list-item" onClick={() => onProfileClick(profile)}>
                    <div className="profile-info-main">
                      <div className="profile-name-section">
                        <span className="profile-emoji-display">{profile.emoji || '🌸'}</span>
                        <h3>{profile.name}</h3>
                        <span className="profile-role-badge">
                          {profile.role === 'mother' ? 'Mom' : profile.role === 'teen' ? 'Teen' : profile.role === 'partner' ? 'Partner' : profile.role === 'bestfriend' ? 'Bestie' : 'Other'}
                        </span>
                      </div>
                      <div className="profile-details">
                        <div className="detail"><span className="detail-label">Age:</span><span className="detail-value">{profile.age}y</span></div>
                        <div className="detail"><span className="detail-label">Cycle:</span><span className="detail-value">{profile.cycleLength}d</span></div>
                        <div className="detail"><span className="detail-label">Period:</span><span className="detail-value">{profile.periodLength}d</span></div>
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                        title="Delete profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No profiles yet. Add someone to get started!</p>
                </div>
              )}
            </div>
          </div>

          <div className="profile-tips">
            <h3>💡 Tips</h3>
            <ul>
              <li>Each person gets their own private cycle tracking</li>
              <li>You can log for anyone from any profile</li>
              <li>All data stays in your account</li>
              <li>Perfect for helping teens understand their cycles</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — add form */}
        <div className="manager-right">
          <div className="pm-card">
            {!showAddForm ? (
              <>
                <div className="pm-card-header">
                  <div className="pm-card-title">Add Profile</div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={18} />
                  Add New Profile
                </button>
              </>
            ) : (
              <div className="add-profile-form">
                <h3>New Profile</h3>
                <form onSubmit={handleAddProfile}>
                  <div className="form-group">
                    <label>Profile Emoji</label>
                    <div className="emoji-selector">
                      <button
                        type="button"
                        className="emoji-trigger"
                        onClick={() => setShowEmojiPicker(prev => !prev)}
                      >
                        <span className="selected-emoji">{formData.emoji}</span>
                        <span className="emoji-trigger-label">Change</span>
                      </button>
                      {showEmojiPicker && (
                        <div onClick={e => e.stopPropagation()}>
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                              setFormData(prev => ({ ...prev, emoji: emoji.native }));
                              setShowEmojiPicker(false);
                            }}
                            theme="dark"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Age *</label>
                      <input type="number" name="age" placeholder="Years" value={formData.age} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Relationship *</label>
                      <select name="role" value={formData.role} onChange={handleInputChange}>
                        <option value="mother">Mother</option>
                        <option value="teen">Teen</option>
                        <option value="partner">Partner</option>
                        <option value="bestfriend">Bestie</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cycle Length (days)</label>
                      <input type="number" name="cycleLength" placeholder="28" value={formData.cycleLength} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Period Length (days)</label>
                      <input type="number" name="periodLength" placeholder="5" value={formData.periodLength} onChange={handleInputChange} />
                    </div>
                  </div>

                  {error && <div className="form-error">{error}</div>}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowAddForm(false); setShowEmojiPicker(false); setError(''); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Adding...' : 'Add Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfileManager;