import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isThisMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useHabitStore } from './store/useHabitStore';
import GlobalSummary from './components/GlobalSummary';
import HabitGrid from './components/HabitGrid';
import DailyFooter from './components/DailyFooter';
import DayColumn from './components/DayColumn';
import HabitAnalysis from './components/HabitAnalysis';
import TrendAreaChart from './components/TrendAreaChart';
import DailyDetailCard from './components/DailyDetailCard';
import HabitManager from './components/HabitManager';
import { Settings, ChevronLeft, ChevronRight, LayoutGrid, Columns } from 'lucide-react';

import Auth from './components/Auth';

function App() {
  const { currentDate, setCurrentDate } = useHabitStore();
  const dateObj = new Date(currentDate);

  const startDate = startOfMonth(dateObj);
  const endDate = endOfMonth(dateObj);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const [selectedDate, setSelectedDate] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [viewMode, setViewMode] = useState('card');

  const goToPrevMonth = () => setCurrentDate(subMonths(dateObj, 1).toISOString());
  const goToNextMonth = () => setCurrentDate(addMonths(dateObj, 1).toISOString());
  const goToToday = () => setCurrentDate(new Date().toISOString());

  return (
    <Auth>
      <div className="dashboard-container animate-fade-in">
      {/* Header */}
      <div className="flex-row justify-between items-center px-2">
        <div className="flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">습관 트래커</h1>
          <div className="flex-row items-center gap-2">
            <button onClick={goToPrevMonth} style={navBtnStyle}><ChevronLeft size={16} /></button>
            <span className="font-semibold text-sm" style={{ minWidth: '130px', textAlign: 'center' }}>
              {format(dateObj, 'yyyy년 MMMM', { locale: ko })}
            </span>
            <button onClick={goToNextMonth} style={navBtnStyle}><ChevronRight size={16} /></button>
            {!isThisMonth(dateObj) && (
              <button 
                onClick={goToToday} 
                style={{ ...navBtnStyle, width: 'auto', padding: '0 0.75rem', fontSize: '11px', fontWeight: 'bold', color: '#10B981', borderColor: '#10B981' }}
              >
                오늘로 이동
              </button>
            )}
          </div>
        </div>

        <div className="flex-row gap-2 items-center">
          {/* View Toggle */}
          <div className="flex-row" style={{ background: '#F3F4F6', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            <button
              onClick={() => setViewMode('card')}
              title="카드 뷰"
              style={{
                ...toggleBtnStyle,
                background: viewMode === 'card' ? 'white' : 'transparent',
                color: viewMode === 'card' ? '#10B981' : '#9CA3AF',
                boxShadow: viewMode === 'card' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Columns size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="테이블 뷰"
              style={{
                ...toggleBtnStyle,
                background: viewMode === 'grid' ? 'white' : 'transparent',
                color: viewMode === 'grid' ? '#10B981' : '#9CA3AF',
                boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowManager(true)}
            className="flex-row gap-2 items-center"
            style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'white', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            <Settings size={18} className="text-muted" />
            <span className="font-semibold text-sm">습관 관리</span>
          </button>
        </div>
      </div>

      <GlobalSummary daysInMonth={daysInMonth} />

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <>
          <div className="panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content', paddingBottom: '4px' }}>
              {daysInMonth.map(day => (
                <DayColumn key={day.toISOString()} day={day} />
              ))}
            </div>
          </div>

          <div className="flex-row gap-6" style={{ alignItems: 'flex-start' }}>
            <div className="panel" style={{ flex: 1 }}>
              <TrendAreaChart daysInMonth={daysInMonth} />
            </div>
            <div className="panel" style={{ width: '260px', flexShrink: 0 }}>
              <HabitAnalysis daysInMonth={daysInMonth} />
            </div>
          </div>
        </>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          <div className="panel flex-row gap-6" style={{ alignItems: 'flex-start', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowX: 'auto', paddingBottom: '0.5rem' }} className="flex-col">
              <div className="grid-table">
                <HabitGrid daysInMonth={daysInMonth} onDateClick={setSelectedDate} />
                <DailyFooter daysInMonth={daysInMonth} />
              </div>
            </div>
            <div style={{ width: '220px', flexShrink: 0, borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
              <HabitAnalysis daysInMonth={daysInMonth} />
            </div>
          </div>

          <div className="panel">
            <TrendAreaChart daysInMonth={daysInMonth} />
          </div>

          {selectedDate && (
            <DailyDetailCard date={selectedDate} onClose={() => setSelectedDate(null)} />
          )}
        </>
      )}

      {showManager && (
        <HabitManager onClose={() => setShowManager(false)} />
      )}
    </div>
    </Auth>
  );
}

const navBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '8px',
  background: 'white', border: '1px solid var(--border-color)',
  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const toggleBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '32px', height: '32px', borderRadius: '7px',
  border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
};

export default App;
