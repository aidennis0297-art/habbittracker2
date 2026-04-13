import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useHabitStore } from '../store/useHabitStore';
import { X, Check } from 'lucide-react';

const Donut = ({ percentage, size }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
        <circle stroke="#10B981" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} 
                strokeDasharray={circumference + ' ' + circumference} 
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
        {percentage}%
      </div>
    </div>
  );
};

export default function DailyDetailCard({ date, onClose }) {
  const { habits, records, toggleHabit } = useHabitStore();
  const dateStr = format(date, 'yyyy-MM-dd');
  const dailyRecords = records[dateStr] || [];
  
  const doneCount = dailyRecords.length;
  const totalCount = habits.length;
  const percentage = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Group habits by category
  const categories = [...new Set(habits.map(h => h.category || '기본'))];
  const groupedHabits = categories.reduce((acc, cat) => {
    acc[cat] = habits.filter(h => (h.category || '기본') === cat);
    return acc;
  }, {});

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="panel animate-fade-in flex-col gap-6" style={{ width: '400px', maxHeight: '90vh', backgroundColor: 'white', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex-row justify-between items-center">
          <div className="text-xl font-bold">{format(date, 'yyyy년 MMMM d일 (EEEE)', { locale: ko })}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="text-muted" /></button>
        </div>
        
        <div className="flex-row justify-center">
          <Donut percentage={percentage} size={160} />
        </div>
        
        <div className="flex-col gap-5 mt-2">
           {categories.map(category => (
             <div key={category} className="flex-col gap-2">
               <div className="text-[10px] font-black tracking-widest text-green uppercase border-b border-gray-100 pb-1">
                 {category}
               </div>
               <div className="flex-col gap-2">
                 {groupedHabits[category].map(habit => {
                   const isDone = dailyRecords.includes(habit.id);
                   return (
                     <div 
                       key={habit.id} 
                       className="flex-row justify-between items-center" 
                       style={{ padding: '0.625rem 0.75rem', backgroundColor: isDone ? '#F0FDF4' : '#F9FAFB', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', border: isDone ? '1px solid #D1FAE5' : '1px solid #F3F4F6' }} 
                       onClick={() => toggleHabit(dateStr, habit.id)}
                     >
                        <div className="flex-row gap-3 items-center">
                          <div style={{ fontSize: '1.2rem' }}>{habit.emoji}</div>
                          <div className={`font-medium text-sm ${isDone ? 'text-green' : ''}`}>
                            {habit.name}
                          </div>
                        </div>
                        <div 
                          className={`checkbox-cell ${isDone ? 'checked' : 'empty'}`} 
                          style={{ width: '24px', height: '24px', borderRadius: '4px', marginRight: 0 }}
                        >
                          {isDone && <Check size={14} strokeWidth={4} />}
                        </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
