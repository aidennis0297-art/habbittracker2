import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useHabitStore } from '../store/useHabitStore';
import { Check } from 'lucide-react';

export default function HabitGrid({ daysInMonth, onDateClick }) {
  const { habits, records, notes, toggleHabit, setNote } = useHabitStore();

  // Group habits by category
  const categories = [...new Set(habits.map(h => h.category || '기본'))];
  const groupedHabits = categories.reduce((acc, cat) => {
    acc[cat] = habits.filter(h => (h.category || '기본') === cat);
    return acc;
  }, {});

  return (
    <>
      <div className="table-row table-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--panel-bg)' }}>
        <div className="sticky-col font-medium text-sm text-muted">분야 / 습관</div>
        {daysInMonth.map((day) => (
          <div 
            key={day.toISOString()} 
            className="date-cell text-xs font-medium cursor-pointer"
            onClick={() => onDateClick(day)}
            title="상세 보기"
          >
            <div className="text-muted">{format(day, 'E', { locale: ko })}</div>
            <div style={{ marginTop: '2px' }}>{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {categories.map((category, idx) => (
        <React.Fragment key={category}>
          {/* Category Header Row */}
          <div 
            className="table-row" 
            style={{ 
              backgroundColor: '#F9FAFB', 
              borderTop: '1px solid var(--border-color)', 
              borderBottom: '1px solid var(--border-color)',
              marginTop: idx > 0 ? '12px' : '0'
            }}
          >
             <div className="sticky-col py-1.5 px-2 text-[10px] font-black text-green tracking-widest" style={{ backgroundColor: '#F9FAFB' }}>
               {category.toUpperCase()}
             </div>
             {daysInMonth.map(day => (
               <div key={day.toISOString()} className="date-cell" style={{ height: '30px' }}></div>
             ))}
          </div>

          <div style={{ height: '6px' }}></div>

          {/* Habit Rows */}
          {groupedHabits[category].map(habit => (
            <div key={habit.id} className="table-row" style={{ marginBottom: '4px' }}>
              <div className="sticky-col flex-row items-center gap-2 text-sm font-medium">
                <span style={{ fontSize: '1.25rem' }}>{habit.emoji}</span>
                <span className="truncate">{habit.name}</span>
              </div>
              
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isChecked = records[dateStr]?.includes(habit.id);
                
                return (
                  <div 
                    key={`${habit.id}-${dateStr}`}
                    className={`checkbox-cell ${isChecked ? 'checked' : 'empty'}`}
                    onClick={() => toggleHabit(dateStr, habit.id)}
                  >
                    {isChecked && <Check size={16} strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          ))}
        </React.Fragment>
      ))}

      {/* Notes Row */}
      <div className="table-row" style={{ marginTop: '1.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
        <div className="sticky-col text-[10px] font-black text-green opacity-70 uppercase tracking-widest">일일 노트</div>
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const noteText = notes[dateStr] || '';
          return (
            <div key={`note-${dateStr}`} className="date-cell">
               <textarea 
                 value={noteText}
                 onChange={(e) => setNote(dateStr, e.target.value)}
                 style={{ 
                   width: '32px', height: '60px', background: '#F9FAFB', border: '1px solid #E5E7EB', 
                   borderRadius: '4px', fontSize: '8px', padding: '4px', resize: 'none', outline: 'none',
                   color: '#374151', lineHeight: '1.4'
                 }}
                 placeholder="노트..."
               />
            </div>
          );
        })}
      </div>
    </>
  );
}
