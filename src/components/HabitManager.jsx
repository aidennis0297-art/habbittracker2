import React, { useState } from 'react';
import { useHabitStore } from '../store/useHabitStore';
import { X, Plus, Trash2, Edit2, Check, Save } from 'lucide-react';

export default function HabitManager({ onClose }) {
  const { habits, addHabit, deleteHabit, updateHabit } = useHabitStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✨');
  const [newHabitGoal, setNewHabitGoal] = useState(20);
  const [newHabitCategory, setNewHabitCategory] = useState('건강');
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editGoal, setEditGoal] = useState(0);
  const [editCategory, setEditCategory] = useState('');

  const existingCategories = [...new Set(habits.map(h => h.category || '기본'))];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName, newHabitEmoji, newHabitGoal, newHabitCategory);
    setNewHabitName('');
    setNewHabitEmoji('✨');
    setNewHabitGoal(20);
  };

  const startEditing = (habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditEmoji(habit.emoji);
    setEditGoal(habit.goal);
    setEditCategory(habit.category || '기본');
  };

  const handleUpdate = (id) => {
    if (!editName.trim()) return;
    updateHabit(id, { name: editName, emoji: editEmoji, goal: parseInt(editGoal) || 0, category: editCategory });
    setEditingId(null);
  };

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', 
        alignItems: 'center', justifyContent: 'center' 
      }} 
      onClick={onClose}
    >
      <div 
        className="panel animate-fade-in flex-col gap-6" 
        style={{ width: '600px', maxHeight: '80vh', backgroundColor: 'white', overflowY: 'auto' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-row justify-between items-center">
          <div className="text-xl font-bold">습관 관리</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X className="text-muted" />
          </button>
        </div>

        {/* Add New Habit Form */}
        <form onSubmit={handleAdd} className="flex-col gap-4" style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '12px' }}>
          <div className="text-sm font-bold text-muted">새 습관 추가</div>
          <div className="flex-row gap-2 items-end">
            <div className="flex-col gap-1">
              <span className="text-xs text-muted font-bold ml-1">아이콘</span>
              <input 
                type="text" 
                value={newHabitEmoji} 
                onChange={(e) => setNewHabitEmoji(e.target.value)} 
                style={{ width: '40px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', textAlign: 'center' }}
              />
            </div>
            <div className="flex-col gap-1" style={{ flex: 2 }}>
              <span className="text-xs text-muted font-bold ml-1">습관 명칭</span>
              <input 
                type="text" 
                placeholder="새 습관 이름..." 
                value={newHabitName} 
                onChange={(e) => setNewHabitName(e.target.value)} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
            </div>
            <div className="flex-col gap-1" style={{ flex: 1.5 }}>
              <span className="text-xs text-muted font-bold ml-1">분야 (카테고리)</span>
              <input 
                list="categories"
                value={newHabitCategory} 
                onChange={(e) => setNewHabitCategory(e.target.value)} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <datalist id="categories">
                {existingCategories.map(cat => <option key={cat} value={cat} />)}
                <option value="건강" />
                <option value="자기계발" />
                <option value="생활습관" />
              </datalist>
            </div>
            <div className="flex-col gap-1">
              <span className="text-xs text-muted font-bold ml-1">목표(일)</span>
              <input 
                type="number" 
                value={newHabitGoal} 
                onChange={(e) => setNewHabitGoal(e.target.value)} 
                style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
            </div>
            <button 
              type="submit" 
              style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', height: '38px' }}
            >
              <Plus size={20} />
            </button>
          </div>
        </form>

        {/* Habit List */}
        <div className="flex-col gap-3">
          <div className="text-sm font-semibold text-muted">현재 습관 목록</div>
          {habits.map(habit => (
            <div 
              key={habit.id} 
              className="flex-row justify-between items-center" 
              style={{ padding: '0.75rem', border: '1px solid #F3F4F6', borderRadius: '12px' }}
            >
              {editingId === habit.id ? (
                <div className="flex-row gap-2 items-center" style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    value={editEmoji} 
                    onChange={(e) => setEditEmoji(e.target.value)} 
                    style={{ width: '32px', padding: '0.25rem', borderRadius: '6px', border: '1px solid #E5E7EB', textAlign: 'center' }}
                  />
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    style={{ flex: 2, padding: '0.25rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                  <input 
                    type="text" 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)} 
                    style={{ flex: 1.5, padding: '0.25rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                  <input 
                    type="number" 
                    value={editGoal} 
                    onChange={(e) => setEditGoal(e.target.value)} 
                    style={{ width: '45px', padding: '0.25rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                  />
                  <button onClick={() => handleUpdate(habit.id)} style={{ color: '#10B981', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Save size={18} />
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-row gap-3 items-center" style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.25rem', width: '32px', textAlign: 'center' }}>{habit.emoji}</div>
                    <div className="flex-col">
                      <div className="font-medium text-sm">{habit.name}</div>
                      <div className="flex-row gap-2 items-center">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold">{habit.category?.toUpperCase() || '기본'}</span>
                        <span className="text-xs text-muted">목표: 월 {habit.goal}일</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-row gap-2">
                    <button onClick={() => startEditing(habit)} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteHabit(habit.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
