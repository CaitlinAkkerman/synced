import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import '../styles/Dashboard.css';
import { apiCall } from '../api';
 
const CIRCUMFERENCE = 2 * Math.PI * 22;
 
function getPhase(day, cycleLength) {
  const pct = day / cycleLength;
  if (pct <= 0.18) return { name: 'Menstrual', color: '#D85A30' };
  if (pct <= 0.32) return { name: 'Follicular', color: '#639922' };
  if (pct <= 0.68) return { name: 'Ovulation', color: '#378ADD' };
  return { name: 'Luteal', color: '#534AB7' };
}
 
function getRingColor(daysUntil) {
  if (daysUntil <= 2) return '#D85A30';
  if (daysUntil <= 7) return '#BA7517';
  return '#378ADD';
}
 
function getCurrentDay(lastLogged) {
  if (!lastLogged) return null;
  const [y, m, d] = lastLogged.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
}
 
function getDaysUntilNext(lastLogged, cycleLength) {
  if (!lastLogged) return null;
  const [y, m, d] = lastLogged.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(start);
  next.setDate(next.getDate() + (cycleLength || 28));
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}
 
const MOOD_MAP = {
  menstrual:  { emoji: '🌧️', label: 'Menstrual phase',  vibe: 'Rest mode. Cozy blankets recommended.',      color: '#D85A30' },
  follicular: { emoji: '🌱', label: 'Follicular phase', vibe: 'Energy rising. Suspiciously productive.',     color: '#639922' },
  ovulation:  { emoji: '☀️', label: 'Ovulation phase',  vibe: 'Peak chaos. Everyone is annoyingly social.',  color: '#378ADD' },
  luteal:     { emoji: '⚡', label: 'Luteal phase',      vibe: 'Proceed with snacks and low expectations.',   color: '#534AB7' },
  mixed:      { emoji: '🌀', label: 'Mixed phases',      vibe: 'Household energy: unpredictable. Good luck.', color: '#7209b7' },
  unknown:    { emoji: '🔮', label: 'Unknown',           vibe: "Log some data and we'll tell you more.",      color: '#a8b5d1' },
};
 
function getHouseholdMood(profiles) {
  if (!profiles || profiles.length === 0) return 'unknown';
  const phases = profiles
    .filter(p => p.lastLogged)
    .map(p => {
      const day = getCurrentDay(p.lastLogged);
      if (!day) return null;
      const pct = day / (p.cycleLength || 28);
      if (pct <= 0.18) return 'menstrual';
      if (pct <= 0.32) return 'follicular';
      if (pct <= 0.68) return 'ovulation';
      return 'luteal';
    })
    .filter(Boolean);
  if (phases.length === 0) return 'unknown';
  const unique = [...new Set(phases)];
  return unique.length === 1 ? unique[0] : 'mixed';
}
 
function HouseholdMoodRing({ profiles }) {
  const mood = getHouseholdMood(profiles);
  const { emoji, label, vibe, color } = MOOD_MAP[mood];
  return (
    <div className="mood-ring-card">
      <div className="mood-ring-emoji" style={{ color }}>{emoji}</div>
      <div className="mood-ring-info">
        <div className="mood-ring-label">Household Vibe</div>
        <div className="mood-ring-phase">{label}</div>
        <div className="mood-ring-vibe">{vibe}</div>
      </div>
    </div>
  );
}
 
function ProfileRingCard({ profile, isSelected, onClick }) {
  const [animated, setAnimated] = useState(false);
 
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);
 
  const cycleLength = profile.cycleLength || 28;
  const currentDay = getCurrentDay(profile.lastLogged);
  const daysUntil = getDaysUntilNext(profile.lastLogged, cycleLength);
  const progress = currentDay ? Math.min(currentDay / cycleLength, 1) : 0;
  const strokeDashoffset = animated ? CIRCUMFERENCE * (1 - progress) : CIRCUMFERENCE;
  const ringColor = daysUntil !== null ? getRingColor(daysUntil) : '#4a4f6a';
 
  let pillText = 'No data yet';
  let pillClass = 'pill-neutral';
  if (daysUntil !== null) {
    if (daysUntil <= 0) { pillText = 'Period due!'; pillClass = 'pill-danger'; }
    else if (daysUntil <= 2) { pillText = `${daysUntil}d away`; pillClass = 'pill-danger'; }
    else if (daysUntil <= 7) { pillText = `${daysUntil}d away`; pillClass = 'pill-warn'; }
    else { pillText = `${daysUntil}d away`; pillClass = 'pill-safe'; }
  }
 
  return (
    <div className={`profile-ring-card ${isSelected ? 'active' : ''}`} onClick={onClick}>
      <div className="ring-wrap">
        <svg viewBox="0 0 56 56" width="56" height="56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          {progress > 0 && (
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke={ringColor}
              strokeWidth="5"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '28px 28px',
                transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            />
          )}
        </svg>
        <div className="ring-emoji">{profile.emoji || '🌸'}</div>
      </div>
      <div className="ring-info">
        <div className="ring-name">{profile.name}</div>
        <div className="ring-day">
          {currentDay ? `Day ${Math.min(currentDay, cycleLength)} of ${cycleLength}` : 'Not tracked'}
        </div>
        <span className={`ring-pill ${pillClass}`}>{pillText}</span>
      </div>
    </div>
  );
}
 
function PhaseTimeline({ profile }) {
  const cycleLength = profile.cycleLength || 28;
  const currentDay = getCurrentDay(profile.lastLogged);
  const clampedDay = currentDay ? Math.min(currentDay, cycleLength) : null;
  const markerPct = clampedDay ? (clampedDay / cycleLength) * 100 : null;
  const phase = clampedDay ? getPhase(clampedDay, cycleLength) : null;
 
  return (
    <div className="phase-timeline">
      <div className="phase-timeline-header">
        <span className="phase-timeline-name">{profile.emoji || '🌸'} {profile.name}</span>
        <span className="phase-timeline-phase">
          {phase ? `${phase.name} · Day ${clampedDay}` : 'No data'}
        </span>
      </div>
      <div className="phase-track">
        <div className="phase-segment" style={{ left: '0%', width: '18%', background: '#D85A30', opacity: 0.75 }} />
        <div className="phase-segment" style={{ left: '18%', width: '14%', background: '#639922', opacity: 0.75 }} />
        <div className="phase-segment" style={{ left: '32%', width: '36%', background: '#378ADD', opacity: 0.75 }} />
        <div className="phase-segment" style={{ left: '68%', width: '32%', background: '#534AB7', opacity: 0.75 }} />
        {markerPct !== null && (
          <div className="phase-marker" style={{ left: `${markerPct}%` }} />
        )}
      </div>
      <div className="phase-labels">
        <span>Menstrual</span>
        <span>Follicular</span>
        <span>Ovulation</span>
        <span>Luteal</span>
      </div>
    </div>
  );
}
 
function Dashboard({ household, profiles, onAddLog, onEditLog, onProfileClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (!profiles || profiles.length === 0) return;
    const fetchAllLogs = async () => {
      const results = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const response = await apiCall(`/api/logs/profile/${profile.id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            return (data || [])
              .filter(log => log.type === 'period')
              .map(log => ({ ...log, profileName: profile.name, profileColor: getProfileColor(profile.name) }));
          } catch {
            return [];
          }
        })
      );
      setAllLogs(results.flat());
    };
    fetchAllLogs();
  }, [profiles]);
 
  const getInsightPills = () => {
    const pills = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 
    profiles.forEach(profile => {
      const daysUntil = getDaysUntilNext(profile.lastLogged, profile.cycleLength);
      if (daysUntil === null) return;
 
      const name = `${profile.emoji || '🌸'} ${profile.name}`;
 
      if (daysUntil <= 0) {
        pills.push({ text: `${name} — period due today!`, type: 'danger' });
      } else if (daysUntil <= 3) {
        pills.push({ text: `⚠ ${name} — ${daysUntil}d until period`, type: 'danger' });
      } else if (daysUntil <= 7) {
        pills.push({ text: `📅 ${name} — period in ${daysUntil} days`, type: 'warn' });
      } else {
        const next = new Date(today);
        next.setDate(next.getDate() + daysUntil);
        const dateStr = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        pills.push({ text: `🔮 ${name} — due ${dateStr}`, type: 'info' });
      }
    });
 
    const activePeriods = profiles.filter(p => p.lastLogged);
    if (activePeriods.length > 1) {
      const dates = activePeriods.map(p => new Date(p.lastLogged));
      const maxDate = Math.max(...dates);
      const minDate = Math.min(...dates);
      const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 3) {
        pills.push({ text: '🔄 Cycles are synced!', type: 'info' });
      } else {
        pills.push({ text: '📊 Cycles staggered this month', type: 'neutral' });
      }
    }
 
    pills.push({ text: `📦 Tracking ${profiles.length} person${profiles.length === 1 ? '' : 's'}`, type: 'neutral' });
 
    return pills;
  };
 
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
 
  const getProfileColor = (name) => {
    const colors = ['#ff006e', '#08f7fe', '#7209b7', '#06d6a0', '#ffa500', '#ff1493'];
    let colorIndex = 0;
    profiles?.forEach((profile, index) => {
      if (profile.name === name) colorIndex = index;
    });
    return colors[colorIndex % colors.length];
  };
 
  const getPeriodDaysForMonth = () => {
    const periodDays = {};
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    allLogs.forEach(log => {
      if (!log.date) return;
      const [startYear, startMonth, startDay] = log.date.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      let endDate = startDate;
      if (log.flow && log.flow.length === 10) {
        const [endYear, endMonth, endDay] = log.flow.split('-').map(Number);
        endDate = new Date(endYear, endMonth - 1, endDay);
      }
      if (startDate <= monthEnd && endDate >= monthStart) {
        const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        while (current.getMonth() === currentDate.getMonth()) {
          if (current >= startDate && current <= endDate) {
            const day = current.getDate();
            if (!periodDays[day]) periodDays[day] = [];
            const alreadyAdded = periodDays[day].some(p => p.name === log.profileName);
            if (!alreadyAdded) {
              periodDays[day].push({ name: log.profileName, color: log.profileColor });
            }
          }
          current.setDate(current.getDate() + 1);
        }
      }
    });
    return periodDays;
  };
 
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const periodDays = getPeriodDaysForMonth();
    const days = [];
 
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
 
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasPeriod = periodDays[day];
      let background = 'transparent';
      if (hasPeriod && hasPeriod.length === 1) background = hasPeriod[0].color;
      else if (hasPeriod && hasPeriod.length > 1) background = `linear-gradient(135deg, ${hasPeriod.map(p => p.color).join(', ')})`;
 
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday && !hasPeriod ? 'today' : ''} ${hasPeriod ? 'period-day' : ''}`}
          title={hasPeriod ? `Period: ${hasPeriod.map(p => p.name).join(', ')}` : ''}
          style={{
            background,
            opacity: hasPeriod ? 0.85 : 1,
            color: hasPeriod ? '#1a1f3a' : 'var(--text-secondary)',
            textShadow: hasPeriod ? '0 1px 3px rgba(255,255,255,0.3)' : 'none'
          }}
        >
          {day}
        </div>
      );
    }
    return days;
  };
 
  const pills = profiles ? getInsightPills() : [];
 
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Sync Center</h2>
        <p>Track. Sync. Plan.</p>
      </div>
 
      <div className="dashboard-container">
 
        {/* PROFILE RING CARDS */}
        <div className="profiles-section">
          <div className="section-header">
            <h3>Profiles</h3>
            <button className="btn btn-primary btn-small" onClick={onAddLog}>
              <Plus size={16} />
              Log Period
            </button>
          </div>

          <div className="profiles-overview">
            {profiles && profiles.map((profile) => (
              <ProfileRingCard
                key={profile.id}
                profile={profile}
                isSelected={selectedProfile?.id === profile.id}
                onClick={() => {
                  setSelectedProfile(profile);
                  onProfileClick(profile);
                }}
              />
            ))}
          </div>

          {profiles && profiles.length > 0 && (
            <HouseholdMoodRing profiles={profiles} />
          )}

          {/* PHASE TIMELINES inside profiles card */}
          {profiles && profiles.some(p => p.lastLogged) && (
            <div className="phase-section-inner">
              <div className="phase-section-title">Cycle Phases</div>
              <div className="phase-list">
                {profiles.filter(p => p.lastLogged).map(profile => (
                  <PhaseTimeline key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* CALENDAR */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={previousMonth} className="calendar-nav"><ChevronLeft size={20} /></button>
            <h3>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={nextMonth} className="calendar-nav"><ChevronRight size={20} /></button>
          </div>
          <div className="weekday-header">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="calendar-grid">{renderCalendar()}</div>
          <div className="calendar-legend">
            {profiles && profiles.map((profile) => (
              <div key={profile.id} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: getProfileColor(profile.name) }}></div>
                <span>{profile.emoji || '🌸'} {profile.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* INSIGHT PILLS */}
      <div className="insights-section">
        <h3>Family Insights</h3>
        <div className="insight-pills">
          {pills.map((pill, idx) => (
            <div key={idx} className={`insight-pill insight-pill--${pill.type}`}>
              {pill.text}
            </div>
          ))}
        </div>
      </div>
 
      {/* PENDING PERIODS */}
      <div className="pending-periods-section">
        <h3>Pending Period Entries</h3>
        <div className="pending-list">
          {profiles && profiles.length > 0 ? (
            profiles.filter(profile => profile.lastLogged && !profile.endDate).length > 0 ? (
              profiles
                .filter(profile => profile.lastLogged && !profile.endDate)
                .map(profile => (
                  <div key={profile.id} className="pending-item">
                    <div className="pending-info">
                      <div className="pending-name">{profile.emoji || '🌸'} {profile.name}</div>
                      <div className="pending-date">Started: {profile.lastLogged}</div>
                      <div className="pending-status">⏳ Waiting for end date</div>
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => onEditLog({
                        profileId: profile.id,
                        date: profile.lastLogged,
                        startDate: profile.lastLogged,
                        endDate: null,
                        symptoms: [],
                        notes: ''
                      })}
                    >
                      Edit
                    </button>
                  </div>
                ))
            ) : (
              <p className="empty-state">No pending periods</p>
            )
          ) : (
            <p className="empty-state">No pending periods</p>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default Dashboard;