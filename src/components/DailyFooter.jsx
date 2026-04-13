import React from 'react';
import { format } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';

export default function DailyFooter({ daysInMonth }) {
  const { habits, records } = useHabitStore();
  const totalHabits = habits.length;

  return (
    <div className="table-row" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
      <div className="sticky-col flex-col gap-1 text-xs text-muted font-black justify-center uppercase">
        <div>진행률</div>
        <div>완료</div>
        <div>미완료</div>
      </div>
      
      {daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const done = records[dateStr]?.length || 0;
        const notDone = totalHabits - done;
        const progress = totalHabits === 0 ? 0 : Math.round((done / totalHabits) * 100);
        
        return (
          <div key={`footer-${dateStr}`} className="date-cell flex-col gap-1 text-[10px] justify-center items-center" style={{ fontSize: '0.7rem' }}>
            <div className={`font-bold ${progress === 100 ? 'text-green' : ''}`}>{progress}%</div>
            <div>{done}</div>
            <div className="text-muted">{notDone}</div>
          </div>
        );
      })}
    </div>
  );
}
