import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import '../styles/Charts.css';

function CycleChart({ logs, cycleLength = 28 }) {
  // Process logs into chart data
  const processData = () => {
    const periodLogs = logs.filter(log => log.type === 'period').sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (periodLogs.length < 2) return [];
    
    const data = [];
    for (let i = 1; i < periodLogs.length; i++) {
      const current = new Date(periodLogs[i].date);
      const previous = new Date(periodLogs[i-1].date);
      const daysBetween = Math.round((current - previous) / (1000 * 60 * 60 * 24));
      
      data.push({
        period: i,
        cycleLength: daysBetween,
        date: periodLogs[i].date,
        expected: cycleLength
      });
    }
    
    return data;
  };
  
  const data = processData();
  
  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <div className="chart-icon">📊</div>
        <p>Log at least 2 periods to see your cycle patterns!</p>
      </div>
    );
  }
  
  const averageCycle = Math.round(data.reduce((sum, d) => sum + d.cycleLength, 0) / data.length);
  const variance = data.map(d => Math.abs(d.cycleLength - averageCycle));
  const regularity = variance.reduce((sum, v) => sum + v, 0) / variance.length;
  
  let regularityText = '';
  let regularityEmoji = '';
  if (regularity < 2) {
    regularityText = 'Very Regular';
    regularityEmoji = '🎯';
  } else if (regularity < 4) {
    regularityText = 'Pretty Regular';
    regularityEmoji = '✨';
  } else {
    regularityText = 'Variable';
    regularityEmoji = '🌊';
  }
  
  return (
    <div className="cycle-chart">
      <div className="chart-header">
        <h3>Cycle History</h3>
        <div className="chart-stats">
          <span className="stat">
            <span className="stat-value">{averageCycle}</span>
            <span className="stat-label">avg days</span>
          </span>
          <span className="stat">
            <span className="stat-value">{regularityEmoji}</span>
            <span className="stat-label">{regularityText}</span>
          </span>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cycleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff006e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff006e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="period" 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1f3a', 
                border: '1px solid rgba(255,0,110,0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value} days`, 'Cycle Length']}
            />
            <Area 
              type="monotone" 
              dataKey="cycleLength" 
              stroke="#ff006e" 
              strokeWidth={2}
              fill="url(#cycleGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-insight">
        {regularity < 3 ? (
          <p className="insight-positive">🌟 Your cycle is quite regular! Great for predictions.</p>
        ) : (
          <p className="insight-neutral">📝 Cycles vary - that's totally normal. Keep logging!</p>
        )}
      </div>
    </div>
  );
}

export default CycleChart;