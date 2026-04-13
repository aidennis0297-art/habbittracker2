import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, ref, set, onValue, get } from '../lib/firebase';

const defaultHabits = [
  { id: '1', name: '운동하기', emoji: '🏃‍♂️', goal: 20, category: '건강' },
  { id: '2', name: '물 마시기', emoji: '💧', goal: 30, category: '건강' },
  { id: '3', name: '독서하기', emoji: '📚', goal: 15, category: '자기계발' },
  { id: '4', name: '명상하기', emoji: '🧘‍♂️', goal: 30, category: '자기계발' },
  { id: '5', name: '설탕 안 먹기', emoji: '🚫', goal: 25, category: '생활습관' }
];

export const useHabitStore = create(
  persist(
    (set, get) => ({
      currentUserId: null,
      isLoading: false,
      currentDate: new Date().toISOString(),
      habits: defaultHabits,
      records: {}, 
      notes: {}, 
      
      setUser: (userId) => {
        set({ currentUserId: userId });
        if (userId) {
          // Listen for cloud changes
          const userRef = ref(db, `users/${userId}/state`);
          onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              set({
                habits: data.habits || defaultHabits,
                records: data.records || {},
                notes: data.notes || {}
              });
            }
          });
        }
      },

      syncToCloud: () => {
        const { currentUserId, habits, records, notes } = get();
        if (!currentUserId) return;
        
        const userRef = ref(db, `users/${currentUserId}/state`);
        set(userRef, {
          habits,
          records,
          notes,
          lastUpdated: new Date().toISOString()
        });
      },

      toggleHabit: (dateStr, habitId) => {
        set((state) => {
          const dateRecords = state.records[dateStr] || [];
          const isDone = dateRecords.includes(habitId);
          
          const newDateRecords = isDone
            ? dateRecords.filter(id => id !== habitId)
            : [...dateRecords, habitId];
            
          const newState = {
            records: {
              ...state.records,
              [dateStr]: newDateRecords
            }
          };
          
          return newState;
        });
        get().syncToCloud(); // Save to cloud
      },

      setNote: (dateStr, text) => {
        set((state) => ({
          notes: { ...state.notes, [dateStr]: text }
        }));
        get().syncToCloud();
      },
      
      addHabit: (name, emoji, goal, category) => {
        set((state) => {
          const newHabit = {
            id: Date.now().toString(),
            name,
            emoji,
            goal: parseInt(goal) || 0,
            category: category || '기본'
          };
          return { habits: [...state.habits, newHabit] };
        });
        get().syncToCloud();
      },
      
      deleteHabit: (habitId) => {
        set((state) => {
          const newRecords = {};
          Object.keys(state.records).forEach(date => {
            newRecords[date] = state.records[date]?.filter(id => id !== habitId) || [];
          });
          
          return {
            habits: state.habits.filter(h => h.id !== habitId),
            records: newRecords
          };
        });
        get().syncToCloud();
      },
      
      updateHabit: (habitId, updates) => {
        set((state) => ({
          habits: state.habits.map(h => h.id === habitId ? { ...h, ...updates } : h)
        }));
        get().syncToCloud();
      },
      
      setCurrentDate: (dateStr) => set({ currentDate: dateStr }),
    }),
    {
      name: 'habit-tracker-storage',
    }
  )
);
