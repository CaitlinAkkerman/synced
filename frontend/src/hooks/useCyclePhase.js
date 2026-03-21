import { useState, useEffect } from 'react';

// Calculate which phase of the cycle someone is in
export function useCyclePhase(profile) {
  const [phase, setPhase] = useState('menstrual');
  const [phaseMessage, setPhaseMessage] = useState('');

  useEffect(() => {
    if (!profile?.lastLogged) {
      setPhase('menstrual');
      setPhaseMessage('Welcome! Start tracking to discover your rhythm.');
      return;
    }

    const lastPeriod = new Date(profile.lastLogged);
    const today = new Date();
    const cycleLength = profile.cycleLength || 28;
    const periodLength = profile.periodLength || 5;
    
    // Calculate days since last period started
    const daysSinceLastPeriod = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
    
    // Calculate current day in cycle
    const dayInCycle = daysSinceLastPeriod % cycleLength;
    
    let detectedPhase = 'menstrual';
    let message = '';

    if (dayInCycle <= periodLength) {
      // Days 1-5 (or periodLength): Menstrual
      detectedPhase = 'menstrual';
      const messages = [
        "Rest and restore. Your body is doing important work.",
        "Be gentle with yourself. This too shall pass.",
        "Cozy mode activated. Snuggle up!",
        "Your energy is inward. Honor what you need."
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    } else if (dayInCycle <= cycleLength * 0.4) {
      // Days 6-11: Follicular
      detectedPhase = 'follicular';
      const messages = [
        "Fresh energy rising! New beginnings await.",
        "Your power is building. Plant those seeds!",
        "Creativity is flowing. Ride the wave!",
        "Good vibes only. You're leveling up."
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    } else if (dayInCycle <= cycleLength * 0.6) {
      // Days 12-17: Ovulatory
      detectedPhase = 'ovulatory';
      const messages = [
        "Peak energy! You're magnetic right now.",
        "Shine bright! This is your social butterfly phase.",
        "Confidence at maximum. Go get 'em!",
        "You're basically glowing. Own it!"
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    } else {
      // Days 18-28: Luteal
      detectedPhase = 'luteal';
      const messages = [
        "Slowing down. Wrap things up gently.",
        "Nesting mode. Time to organize and reflect.",
        "Your intuition is strong. Listen to it.",
        "Winding down. Self-care is the priority."
      ];
      message = messages[Math.floor(Math.random() * messages.length)];
    }

    setPhase(detectedPhase);
    setPhaseMessage(message);
  }, [profile]);

  return { phase, phaseMessage, isMenstrual: phase === 'menstrual', isFollicular: phase === 'follicular', isOvulatory: phase === 'ovulatory', isLuteal: phase === 'luteal' };
}

// Get all phases for household
export function useHouseholdPhases(profiles) {
  const phases = {};
  
  profiles?.forEach(profile => {
    const lastPeriod = profile.lastLogged ? new Date(profile.lastLogged) : null;
    if (!lastPeriod) return;
    
    const today = new Date();
    const cycleLength = profile.cycleLength || 28;
    const periodLength = profile.periodLength || 5;
    const daysSinceLastPeriod = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
    const dayInCycle = daysSinceLastPeriod % cycleLength;
    
    if (dayInCycle <= periodLength) {
      phases[profile.id] = 'menstrual';
    } else if (dayInCycle <= cycleLength * 0.4) {
      phases[profile.id] = 'follicular';
    } else if (dayInCycle <= cycleLength * 0.6) {
      phases[profile.id] = 'ovulatory';
    } else {
      phases[profile.id] = 'luteal';
    }
  });
  
  return phases;
}