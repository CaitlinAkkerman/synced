import React, { useState, useEffect, useRef } from 'react';

function MouseGlow() {
  const [trail, setTrail] = useState([]);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Add new trail point every 50ms
    const interval = setInterval(() => {
      setTrail(prev => {
        const newPoint = {
          x: positionRef.current.x,
          y: positionRef.current.y,
          id: Date.now(),
          opacity: 1
        };
        // Keep only last 8 points
        return [...prev.slice(-7), newPoint];
      });
    }, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {trail.map((point, index) => (
        <div 
          key={point.id}
          className="trail-glow"
          style={{
            left: point.x - 100,
            top: point.y - 100,
            opacity: (index + 1) / trail.length * 0.4, // Fade older ones
            transform: `scale(${0.5 + (index / trail.length) * 0.5})`, // Grow newer ones
          }}
        />
      ))}
    </>
  );
}

export default MouseGlow;