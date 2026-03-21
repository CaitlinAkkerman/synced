import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Trash2, Download } from 'lucide-react';
import '../styles/ProfileDetail.css';
import '../styles/Charts.css';
import { apiCall } from '../api';
import CycleChart from './CycleChart';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { showToast } from './Toast';

function ProfileDetailPage({ profile, onBack, onEditLog }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editForm, setEditForm] = useState({
    age: '',
    cycleLength: '28',
    periodLength: '5',
    emoji: '🌸'
  });

  if (!profile) {
    return (
      <div className="profile-detail-page">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
          Back
        </button>
        <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>
          No profile selected. Please go back and click a profile.
        </p>
      </div>
    );
  }

  useEffect(() => {
    setEditForm({
      age: profile.age || '',
      cycleLength: profile.cycleLength || '28',
      periodLength: profile.periodLength || '5',
      emoji: profile.emoji || '🌸'
    });
    fetchLogs();
  }, [profile?.id]);

  const fetchLogs = async () => {
    if (!profile?.id) return;
    try {
      const response = await apiCall(`/api/logs/profile/${profile.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const responseData = await response.json();
      setLogs(responseData || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      const response = await apiCall(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          age: parseInt(editForm.age),
          cycleLength: parseInt(editForm.cycleLength),
          periodLength: parseInt(editForm.periodLength),
          emoji: editForm.emoji
        })
      });

      if (!response.ok) { console.error('Failed to update profile'); return; }

      profile.emoji = editForm.emoji;
      setIsEditing(false);
      setShowEmojiPicker(false);
      showToast('profile-updated');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Delete this period entry? This cannot be undone.')) return;
    try {
      const response = await apiCall(`/api/logs/${logId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) { console.error('Failed to delete log'); return; }
      showToast('log-deleted');
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleExport = async () => {
    if (!profile?.id) return;
    try {
      const response = await apiCall(`/api/export/profile/${profile.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.name}-period-data.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const periodLogs = logs.filter(log => log.type === 'period');
  const symptomLogs = logs.filter(log => log.type === 'symptom');

  const getNextPeriodInfo = () => {
    if (!profile.lastLogged) return null;
    const lastPeriod = new Date(profile.lastLogged);
    lastPeriod.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cycleLength = profile.cycleLength || 28;
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
    const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0) {
      return {
        status: daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'normal',
        message: daysUntil <= 3
          ? `Period in ${daysUntil} day${daysUntil === 1 ? '' : 's'} 🛒`
          : daysUntil <= 7
            ? `Coming in ${daysUntil} days 📅`
            : `Expected around ${nextPeriod.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} 🔮`,
        daysUntil
      };
    } else if (daysUntil === 0) {
      return { status: 'due', message: 'Period due today! 🩸', daysUntil: 0 };
    } else {
      return { status: 'overdue', message: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue ⏰`, daysUntil };
    }
  };

  const prediction = getNextPeriodInfo();

  return (
    <div className="profile-detail-page">

      {/* HEADER */}
      <div className="profile-page-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
          Back to Sync Center
        </button>
        <h1>{profile.emoji || '🌸'} {profile.name}</h1>
        <div className="profile-badge">{profile.role}</div>
      </div>

      {/* TWO COLUMN CONTENT */}
      <div className="profile-page-content">

        {/* LEFT COLUMN */}
        <div className="profile-left-col">

          {/* PREDICTION */}
          {prediction && (
            <div className={`period-prediction-card ${prediction.status}`}>
              <div className="prediction-label">Next Period</div>
              <div className="prediction-value">{prediction.message}</div>
            </div>
          )}

          {/* PERSONAL INFO */}
          <div className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title">Personal Info</div>
              <div className="pd-card-actions">
                <button className="btn btn-secondary btn-small" onClick={handleExport}>
                  <Download size={14} />
                  Export
                </button>
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={13} />
                  Edit
                </button>
              </div>
            </div>

            {isEditing ? (
              <div onClick={(e) => e.stopPropagation()}>
                <div className="edit-form">
                  <div className="form-group">
                    <label>Profile Emoji</label>
                    <div className="emoji-selector">
                      <button type="button" className="emoji-trigger" onClick={() => setShowEmojiPicker(prev => !prev)}>
                        <span className="selected-emoji">{editForm.emoji}</span>
                        <span className="emoji-trigger-label">Change</span>
                      </button>
                      {showEmojiPicker && (
                        <div onClick={e => e.stopPropagation()}>
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                              setEditForm(prev => ({ ...prev, emoji: emoji.native }));
                              setShowEmojiPicker(false);
                            }}
                            theme="dark"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Cycle Length (days)</label>
                    <input type="number" value={editForm.cycleLength} onChange={(e) => setEditForm({...editForm, cycleLength: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Period Length (days)</label>
                    <input type="number" value={editForm.periodLength} onChange={(e) => setEditForm({...editForm, periodLength: e.target.value})} />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleEditProfile}>Save</button>
                    <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setShowEmojiPicker(false); }}>Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <div className="label">Emoji</div>
                  <div className="value" style={{ fontSize: '1.3rem' }}>{profile.emoji || '🌸'}</div>
                </div>
                <div className="info-item">
                  <div className="label">Age</div>
                  <div className="value">{profile.age} years</div>
                </div>
                <div className="info-item">
                  <div className="label">Cycle Length</div>
                  <div className="value">{profile.cycleLength} days</div>
                </div>
                <div className="info-item">
                  <div className="label">Period Length</div>
                  <div className="value">{profile.periodLength} days</div>
                </div>
              </div>
            )}
          </div>

          {/* CYCLE CHART */}
          <CycleChart logs={logs} cycleLength={profile.cycleLength} />

          {/* SYMPTOM LOGS */}
          {symptomLogs.length > 0 && (
            <div className="pd-card">
              <div className="pd-card-header">
                <div className="pd-card-title">Symptom Logs</div>
              </div>
              <div className="symptom-list">
                {symptomLogs.map((log) => (
                  <div key={log.id} className="symptom-entry">
                    <span className="symptom-date">{log.date}</span>
                    <div className="symptom-tags">
                      {log.symptoms?.map((symptom, idx) => (
                        <span key={idx} className="symptom-tag">{symptom}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-right-col">

          {/* PERIOD HISTORY */}
          <div className="pd-card">
            <div className="pd-card-header">
              <div className="pd-card-title">Period History</div>
            </div>
            {loading ? (
              <p className="loading">Loading...</p>
            ) : periodLogs.length > 0 ? (
              <div className="period-list">
                {periodLogs.map((log) => (
                  <div key={log.id} className="period-entry">
                    <div>
                      <div className="period-dates">
                        <span className="start-date">{log.date}</span>
                        {log.flow && <span className="separator">→</span>}
                        {log.flow && <span className="end-date">{log.flow}</span>}
                        {log.intensity && (
                          <span className={`intensity-badge ${log.intensity}`}>
                            {log.intensity === 'light' && '🌸 Light'}
                            {log.intensity === 'medium' && '🩸 Medium'}
                            {log.intensity === 'heavy' && '🌊 Heavy'}
                          </span>
                        )}
                      </div>
                      {log.notes && <div className="period-notes"><p>{log.notes}</p></div>}
                    </div>
                    <div className="period-actions">
                      <button className="edit-btn" onClick={() => onEditLog(log)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteLog(log.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No period logs yet</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProfileDetailPage;