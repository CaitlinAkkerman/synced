import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import '../styles/Logger.css';
import { apiCall } from '../api';
import { showToast } from './Toast';

// Confetti component for celebrations
function Confetti() {
  return (
    <div className="confetti-container">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%` }} />
      ))}
    </div>
  );
}

function CycleLogger({ profiles, onClose, onLogCreated, editingLog }) {
  // Form state
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]?.id || '');
  const [logType, setLogType] = useState('period');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Predefined symptom options
  const symptomOptions = [
    'Cramps',
    'Headache',
    'Back pain',
    'Bloating',
    'Mood swings',
    'Irritability',
    'Fatigue',
    'Nausea',
    'Breast tenderness',
    'Insomnia',
    'Cravings',
    'Acne',
  ];

  // Load editing log data if present
  useEffect(() => {
    if (editingLog) {
      setSelectedProfile(editingLog.profileId);
      setStartDate(editingLog.date || '');
      setEndDate(editingLog.flow || '');
      setIntensity(editingLog.intensity || 'medium');
      setSymptoms(editingLog.symptoms || []);
      setNotes(editingLog.notes || '');
    }
  }, [editingLog]);

  // Toggle symptom selection
  const toggleSymptom = (symptom) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Add custom symptom from input
  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      toggleSymptom(trimmed);
      setCustomSymptom('');
    }
  };

  // Calculate period duration
  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      profileId: selectedProfile,
      startDate: startDate,
      endDate: logType === 'period' ? endDate : null,
      type: logType,
      intensity: logType === 'period' ? intensity : null,
      symptoms,
      notes
    };

    try {
      const method = editingLog ? 'PUT' : 'POST';
      const url = editingLog ? `/api/logs/${editingLog.id}` : '/api/logs';

      const response = await apiCall(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to log');
        setLoading(false);
        return;
      }

      setShowConfetti(true);
      showToast(editingLog ? 'log-updated' : 'log-created');
      
      setTimeout(() => {
        onLogCreated();
        onClose();
      }, 1500);

    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {showConfetti && <Confetti />}
      
      <div className="modal-content logger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log Your Period</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="logger-form">
          {/* Profile Selection */}
          <div className="form-group">
            <label>Who are we logging for?</label>
            <select 
              value={selectedProfile} 
              onChange={(e) => setSelectedProfile(e.target.value)}
              required
            >
              <option value="">Select a profile</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {/* Log Type */}
          <div className="form-group">
            <label>What are we logging?</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="logType"
                  value="period"
                  checked={logType === 'period'}
                  onChange={(e) => setLogType(e.target.value)}
                />
                <span>Period 🩸</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="logType"
                  value="symptom"
                  checked={logType === 'symptom'}
                  onChange={(e) => setLogType(e.target.value)}
                />
                <span>Just Symptoms 😩</span>
              </label>
            </div>
          </div>

          {/* Period Dates */}
          {logType === 'period' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Period Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Period End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {calculateDays() > 0 && (
                <div className="period-duration">
                  <span className="duration-badge">
                    {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}

              {/* Flow Intensity */}
              <div className="form-group">
                <label>Flow Intensity</label>
                <div className="intensity-options">
                  <button
                    type="button"
                    className={`intensity-btn ${intensity === 'light' ? 'selected' : ''}`}
                    onClick={() => setIntensity('light')}
                  >
                    🌸 Light
                  </button>
                  <button
                    type="button"
                    className={`intensity-btn ${intensity === 'medium' ? 'selected' : ''}`}
                    onClick={() => setIntensity('medium')}
                  >
                    🩸 Medium
                  </button>
                  <button
                    type="button"
                    className={`intensity-btn ${intensity === 'heavy' ? 'selected' : ''}`}
                    onClick={() => setIntensity('heavy')}
                  >
                    🌊 Heavy
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Symptom Date (for symptom-only logs) */}
          {logType === 'symptom' && (
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* Symptoms Grid */}
          <div className="form-group">
            <label>Symptoms (select all that apply)</label>
            <div className="symptoms-grid">
              {symptomOptions.map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  className={`symptom-btn ${symptoms.includes(symptom) ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(symptom)}
                >
                  {symptoms.includes(symptom) && <Check size={16} />}
                  {symptom}
                </button>
              ))}
              
              {/* Custom Symptoms that were added */}
              {symptoms.filter(s => !symptomOptions.includes(s)).map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  className={`symptom-btn custom selected`}
                  onClick={() => toggleSymptom(symptom)}
                >
                  <Check size={16} />
                  {symptom}
                  <span className="custom-tag">custom</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Custom Symptom Input */}
          <div className="form-group" onClick={(e) => e.stopPropagation()}>
            <label>Add Custom Symptom</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Type a new symptom..."
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--accent-teal)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSymptom();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomSymptom}
                className="btn btn-secondary btn-small"
                disabled={!customSymptom.trim()}
                style={{ 
                  opacity: customSymptom.trim() ? 1 : 0.5,
                  minWidth: '70px'
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              placeholder="Anything else? Mood spirals? Weird food cravings? We don't judge..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Display */}
          {error && <div className="form-error">{error}</div>}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            <Sparkles size={18} />
            {loading ? 'Logging...' : editingLog ? 'Update Period' : 'Log Period'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CycleLogger;