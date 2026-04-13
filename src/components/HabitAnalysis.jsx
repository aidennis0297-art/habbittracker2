import React from 'react';
import { format } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { TrendingUp } from 'lucide-react';

export default function HabitAnalysis({ daysInMonth }) {
  const { habits, records } = useHabitStore();

  // Group habits by category
  const categories = [...new Set(habits.map(h => h.category || '기본'))];
  const groupedHabits = categories.reduce((acc, cat) => {
    acc[cat] = habits.filter(h => (h.category || '기본') === cat);
    return acc;
  }, {});

  return (
    <div className="flex-col gap-4">
      <div className="flex-row items-center gap-2 font-bold mb-2">
        <TrendingUp className="text-green" size={18} />
        습관 분석
      </div>
      
      <div className="flex-col gap-6">
        {categories.map(category => (
          <div key={category} className="flex-col gap-3">
             <div className="text-[10px] font-black text-green tracking-wider uppercase opacity-80 border-b border-gray-100 pb-1">
               {category}
             </div>
             <div className="flex-col gap-2">
               {groupedHabits[category].map(habit => {
                 let actualDays = 0;
                 daysInMonth.forEach(day => {
                   const dateStr = format(day, 'yyyy-MM-dd');
                   if (records[dateStr]?.includes(habit.id)) {
                     actualDays++;
                   }
                 });
                 
                 const progressPercent = habit.goal === 0 ? 0 : Math.min(100, Math.round((actualDays / habit.goal) * 100));

                 return (
                   <div key={habit.id} className="flex-col gap-1">
                     <div className="flex-row justify-between text-xs items-center">
                       <span className="font-medium truncate" style={{ maxWidth: '80px' }}>{habit.name}</span>
                       <div className="flex-row gap-1 items-center">
                         <span className="font-bold">{actualDays}</span>
                         <span className="text-muted opacity-60">/{habit.goal}</span>
                       </div>
                     </div>
                     <div className="sparkline-bg" style={{ height: '18px' }}>
                       <div className="sparkline-fill" style={{ width: `${progressPercent}%` }}></div>
                       <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', mixBlendMode: 'darken' }}>
                         {progressPercent}%
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
