import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { Activity } from 'lucide-react';

export default function TrendAreaChart({ daysInMonth }) {
  const { habits, records } = useHabitStore();
  const totalHabits = habits.length;

  const data = daysInMonth.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const done = records[dateStr]?.length || 0;
    const progress = totalHabits === 0 ? 0 : Math.round((done / totalHabits) * 100);
    return {
      date: format(day, 'd'),
      progress
    };
  });

  return (
    <div className="flex-col gap-4" style={{ height: '300px' }}>
      <div className="flex-row items-center gap-2 font-bold text-lg">
        <Activity className="text-green" />
        월간 달성률 추세
      </div>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
              labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
              formatter={(value) => [`${value}%`, '진행률']}
              labelFormatter={(label) => `${label}일`}
            />
            <Area type="monotone" dataKey="progress" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
