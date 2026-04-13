import React from 'react';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useHabitStore } from '../store/useHabitStore';
import { Check } from 'lucide-react';

const DonutMini = ({ percentage }) => {
  const size = 72;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle stroke="rgba(255,255,255,0.25)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle
          stroke="white"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '800', color: 'white'
      }}>
        {percentage}%
      </div>
    </div>
  );
};

export default function DayColumn({ day }) {
  const { habits, records, notes, toggleHabit, setNote } = useHabitStore();
  const dateStr = format(day, 'yyyy-MM-dd');
  const dailyRecords = records[dateStr] || [];
  const note = notes[dateStr] || '';

  const done = dailyRecords.length;
  const total = habits.length;
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

  const categories = [...new Set(habits.map(h => h.category || '기본'))];
  const groupedHabits = categories.reduce((acc, cat) => {
    acc[cat] = habits.filter(h => (h.category || '기본') === cat);
    return acc;
  }, {});

  const today = isToday(day);
  const isFuture = day > new Date();

  const headerBg = today
    ? 'linear-gradient(145deg, #059669, #34D399)'
    : isFuture
    ? 'linear-gradient(145deg, #9CA3AF, #D1D5DB)'
    : 'linear-gradient(145deg, #10B981, #6EE7B7)';

  return (
    <div style={{
      minWidth: '220px',
      flex: '0 0 auto',
      borderRadius: '16px',
      overflow: 'hidden',
      border: today ? '2px solid #10B981' : '1px solid #E5E7EB',
      boxShadow: today ? '0 4px 20px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
      background: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ background: headerBg, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {format(day, 'EEEE', { locale: ko })}
        </div>
        <div style={{ color: 'white', fontSize: '11px', fontWeight: '500', opacity: 0.8, marginBottom: '4px' }}>
          {format(day, 'yyyy.MM.dd')}
        </div>
        <DonutMini percentage={percentage} />
      </div>

      {/* Content Area */}
      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        
        {/* Categories & Habits */}
        <div className="flex-col gap-4">
          {categories.map(category => (
            <div key={category} className="flex-col gap-1">
              <div style={{
                fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#10B981',
                paddingBottom: '4px', borderBottom: '1.5px solid rgba(16, 185, 129, 0.1)',
                marginBottom: '8px'
              }}>
                {category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {groupedHabits[category].map(habit => {
                  const isDone = dailyRecords.includes(habit.id);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabit(dateStr, habit.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                        backgroundColor: isDone ? '#EEFBF3' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isDone ? '#10B981' : 'white',
                        border: isDone ? '2px solid #10B981' : '2px solid #E5E7EB',
                        transition: 'all 0.15s ease',
                      }}>
                        {isDone && <Check size={12} strokeWidth={4} color="white" />}
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: isDone ? '600' : '400',
                        color: isDone ? '#065F46' : '#4B5563',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.2,
                        flex: 1
                      }}>
                         {habit.name}
                      </span>
                      <span style={{ fontSize: '14px', opacity: isDone ? 1 : 0.4 }}>{habit.emoji}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Statistics Boxes */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              backgroundColor: '#10B981', color: 'white', padding: '10px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTopLeftRadius: '8px', borderTopRightRadius: '8px', fontSize: '11px', fontWeight: '600'
            }}>
              <span>완료</span>
              <span>{done}</span>
            </div>
            <div style={{ 
              backgroundColor: '#D1FAE5', color: '#065F46', padding: '10px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '11px', fontWeight: '600'
            }}>
              <span>미완료</span>
              <span>{total - done}</span>
            </div>
            
            {/* Notes Section */}
            <div style={{ padding: '8px', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', border: '1px solid #E5E7EB', borderTop: 'none' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', color: '#10B981', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.7 }}>노트</div>
              <textarea 
                placeholder="일일 노트를 작성하세요..."
                value={note}
                onChange={(e) => setNote(dateStr, e.target.value)}
                style={{
                  width: '100%', height: '60px', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: '11px', resize: 'none', color: '#374151',
                  lineHeight: '1.4'
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
