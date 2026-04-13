import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useHabitStore } from '../store/useHabitStore';
import { CheckCircle2, Target, CalendarDays } from 'lucide-react';

export default function GlobalSummary({ daysInMonth }) {
  const { habits, records, currentDate } = useHabitStore();
  const totalCheckboxes = habits.length * daysInMonth.length;
  
  let completedCount = 0;
  daysInMonth.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (records[dateStr]) {
      completedCount += records[dateStr].length;
    }
  });

  const progress = totalCheckboxes === 0 ? 0 : Math.round((completedCount / totalCheckboxes) * 100);

  return (
    <div className="panel flex-col gap-4">
      <div className="flex-row justify-between items-center">
        <div className="flex-row items-center gap-2 text-2xl font-bold">
          <CalendarDays className="text-green" />
          {format(new Date(currentDate), 'yyyy년 MMMM', { locale: ko })} 요약
        </div>
        <div className="flex-row gap-6">
          <div className="flex-col items-center">
            <span className="text-sm text-muted">습관</span>
            <div className="flex-row gap-1 items-center text-lg font-semibold">
              <Target size={18} /> {habits.length}개
            </div>
          </div>
          <div className="flex-col items-center">
            <span className="text-sm text-muted">완료</span>
            <div className="flex-row gap-1 items-center text-lg font-semibold text-green">
              <CheckCircle2 size={18} /> {completedCount}회
            </div>
          </div>
          <div className="flex-col items-center">
            <span className="text-sm text-muted">달성률</span>
            <div className="text-lg font-semibold">{progress}%</div>
          </div>
        </div>
      </div>
      
      <div className="flex-col gap-1">
        <div className="flex-row justify-between text-xs text-muted">
          <span>전체 진행률</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}
