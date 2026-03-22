import React, { useState } from 'react';
import { X, Plus, ChevronRight } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { apiCall } from '../api';
import '../styles/Onboarding.css';

const TOTAL_STEPS = 4; // 0=welcome, 1=add profile, 2=log period, 3=done

function ProgressDots({ step }) {
  return (
    <div className="ob-dots">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`ob-dot ${step === i ? 'active' : step > i ? 'done' : ''}`}
        />
      ))}
    </div>
  );
}

function StepWelcome({ onNext, onSkip }) {
  return (
    <div className="ob-step ob-welcome">
      <button className="ob-skip" onClick={onSkip}>Skip <X size={13} /></button>
      <div className="ob-welcome-emoji">🌸</div>
      <h1 className="ob-welcome-title">Welcome to Synced</h1>
      <p className="ob-welcome-desc">
        Track cycles for your whole household in one place. Takes about 2 minutes to set up.
      </p>
      <div className="ob-steps-preview">
        <div className="ob-preview-step">
          <div className="ob-preview-num">1</div>
          <div className="ob-preview-label">Add a profile</div>
        </div>
        <div className="ob-preview-connector" />
        <div className="ob-preview-step">
          <div className="ob-preview-num">2</div>
          <div className="ob-preview-label">Log last period</div>
        </div>
        <div className="ob-preview-connector" />
        <div className="ob-preview-step">
          <div className="ob-preview-num">3</div>
          <div className="ob-preview-label">See predictions</div>
        </div>
      </div>
      <button className="ob-btn-primary" onClick={onNext}>
        Let's go <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepAddProfile({ onNext, onSkip, onProfileCreated }) {
  const [formData, setFormData] = useState({
    name: '', age: '', role: 'mother', cycleLength: '28', periodLength: '5', emoji: '🌸'
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiCall('/api/profiles', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to create profile');
        return;
      }
      const profile = await response.json();
      onProfileCreated(profile);
      onNext();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-step">
      <button className="ob-skip" onClick={onSkip}>Skip <X size={13} /></button>
      <ProgressDots step={1} />
      <h2 className="ob-step-title">Add your first profile</h2>
      <p className="ob-step-desc">Who are we tracking? Start with yourself — you can add more people later.</p>

      <form onSubmit={handleSubmit} className="ob-form">
        <div className="ob-emoji-row">
          <div className="emoji-selector">
            <button
              type="button"
              className="emoji-trigger"
              onClick={() => setShowEmojiPicker(p => !p)}
            >
              <span className="selected-emoji">{formData.emoji}</span>
              <span className="emoji-trigger-label">Change</span>
            </button>
            {showEmojiPicker && (
              <div onClick={e => e.stopPropagation()}>
                <Picker
                  data={data}
                  onEmojiSelect={(emoji) => {
                    setFormData(p => ({ ...p, emoji: emoji.native }));
                    setShowEmojiPicker(false);
                  }}
                  theme="dark"
                />
              </div>
            )}
          </div>
        </div>

        <div className="ob-form-group">
          <label>Name *</label>
          <input
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            required
          />
        </div>

        <div className="ob-form-row">
          <div className="ob-form-group">
            <label>Age *</label>
            <input
              type="number"
              placeholder="Years"
              value={formData.age}
              onChange={e => setFormData(p => ({ ...p, age: e.target.value }))}
              required
            />
          </div>
          <div className="ob-form-group">
            <label>Role</label>
            <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
              <option value="mother">Mother</option>
              <option value="teen">Teen</option>
              <option value="partner">Partner</option>
              <option value="bestfriend">Bestie</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="ob-form-row">
          <div className="ob-form-group">
            <label>Cycle length (days)</label>
            <input
              type="number"
              placeholder="28"
              value={formData.cycleLength}
              onChange={e => setFormData(p => ({ ...p, cycleLength: e.target.value }))}
            />
          </div>
          <div className="ob-form-group">
            <label>Period length (days)</label>
            <input
              type="number"
              placeholder="5"
              value={formData.periodLength}
              onChange={e => setFormData(p => ({ ...p, periodLength: e.target.value }))}
            />
          </div>
        </div>

        {error && <div className="ob-error">{error}</div>}

        <button type="submit" className="ob-btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Continue'} <ChevronRight size={16} />
        </button>
      </form>
    </div>
  );
}

function StepLogPeriod({ onNext, onSkip, profile }) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id) { onNext(); return; }
    setLoading(true);
    try {
      const response = await apiCall('/api/logs', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          profileId: profile.id,
          startDate,
          endDate: endDate || null,
          type: 'period',
          intensity,
          symptoms: [],
          notes: ''
        })
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to log');
        return;
      }
      onNext();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-step">
      <button className="ob-skip" onClick={onSkip}>Skip <X size={13} /></button>
      <ProgressDots step={2} />
      <h2 className="ob-step-title">When was {profile?.emoji || '🌸'} {profile?.name || 'your'}'s last period?</h2>
      <p className="ob-step-desc">This lets us predict the next one right away. You can always edit it later.</p>

      <form onSubmit={handleSubmit} className="ob-form">
        <div className="ob-form-row">
          <div className="ob-form-group">
            <label>Start date *</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="ob-form-group">
            <label>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="ob-form-group">
          <label>Flow intensity</label>
          <div className="ob-intensity">
            {[['light', '🌸 Light'], ['medium', '🩸 Medium'], ['heavy', '🌊 Heavy']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`ob-intensity-btn ${intensity === val ? 'selected' : ''}`}
                onClick={() => setIntensity(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="ob-error">{error}</div>}

        <button type="submit" className="ob-btn-primary" disabled={loading}>
          {loading ? 'Logging...' : 'Continue'} <ChevronRight size={16} />
        </button>
      </form>
    </div>
  );
}

function StepDone({ onFinish, profile }) {
  return (
    <div className="ob-step ob-done">
      <ProgressDots step={3} />
      <div className="ob-done-emoji">🎉</div>
      <h2 className="ob-done-title">You're all set!</h2>
      <p className="ob-done-desc">
        {profile?.emoji || '🌸'} {profile?.name || 'Your profile'} is ready. Head to the dashboard to see predictions, cycle phases, and household insights.
      </p>
      <div className="ob-done-features">
        <div className="ob-done-feature">✓ Cycle predictions calculated</div>
        <div className="ob-done-feature">✓ Phase timeline ready</div>
        <div className="ob-done-feature">✓ Household insights active</div>
      </div>
      <button className="ob-btn-primary" onClick={onFinish}>
        Go to dashboard <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Onboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [createdProfile, setCreatedProfile] = useState(null);

  const next = () => setStep(s => s + 1);
  const skip = () => onSkip ? onSkip() : onComplete();

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        {step === 0 && <StepWelcome onNext={next} onSkip={skip} />}
        {step === 1 && <StepAddProfile onNext={next} onSkip={skip} onProfileCreated={setCreatedProfile} />}
        {step === 2 && <StepLogPeriod onNext={next} onSkip={skip} profile={createdProfile} />}
        {step === 3 && <StepDone onFinish={onComplete} profile={createdProfile} />}
      </div>
    </div>
  );
}

export default Onboarding;