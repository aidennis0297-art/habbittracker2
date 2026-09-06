import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

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
      currentUser: null,
      isLoading: false,
      currentDate: new Date().toISOString(),
      habits: defaultHabits,
      records: {},
      notes: {},

      setUser: (user) => {
        if (!user) {
          set({ currentUserId: null, currentUser: null });
          return;
        }

        const userId = typeof user === 'string' ? user : user.id;
        set({ currentUserId: userId, currentUser: user });
        get().loadState();
      },

      loadState: async () => {
        const { currentUserId } = get();
        if (!currentUserId) return;

        set({ isLoading: true });
        try {
          const stateData = await api.state.get();
          if (stateData) {
            set({
              habits: stateData.habits && stateData.habits.length > 0 ? stateData.habits : defaultHabits,
              records: stateData.records || {},
              notes: stateData.notes || {},
              currentUser: stateData.user || get().currentUser
            });
          }
        } catch (err) {
          console.warn('Backend loadState failed, using cached state:', err.message);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleHabit: async (dateStr, habitId) => {
        const prevState = get();
        const prevDateRecords = prevState.records[dateStr] || [];
        const isDone = prevDateRecords.includes(habitId);

        const newDateRecords = isDone
          ? prevDateRecords.filter((id) => id !== habitId)
          : [...prevDateRecords, habitId];

        // 1. Optimistic UI update
        set((state) => ({
          records: {
            ...state.records,
            [dateStr]: newDateRecords
          }
        }));

        // 2. Persist to real backend SQLite database
        try {
          const res = await api.records.toggle(dateStr, habitId);
          if (res && res.records) {
            set((state) => ({
              records: {
                ...state.records,
                [dateStr]: res.records
              }
            }));
          }
        } catch (err) {
          console.error('Failed to sync record to backend:', err);
          // Rollback on error
          set((state) => ({
            records: {
              ...state.records,
              [dateStr]: prevDateRecords
            }
          }));
        }
      },

      setNote: async (dateStr, text) => {
        const prevNote = get().notes[dateStr] || '';

        // 1. Optimistic UI update
        set((state) => ({
          notes: { ...state.notes, [dateStr]: text }
        }));

        // 2. Persist to backend
        try {
          await api.notes.save(dateStr, text);
        } catch (err) {
          console.error('Failed to save note to backend:', err);
          set((state) => ({
            notes: { ...state.notes, [dateStr]: prevNote }
          }));
        }
      },

      addHabit: async (name, emoji, goal, category) => {
        const tempId = `temp_${Date.now()}`;
        const newHabit = {
          id: tempId,
          name: name.trim(),
          emoji: emoji || '✨',
          goal: parseInt(goal, 10) || 0,
          category: category || '기본'
        };

        // 1. Optimistic UI update
        set((state) => ({
          habits: [...state.habits, newHabit]
        }));

        // 2. Persist to backend
        try {
          const created = await api.habits.create(newHabit);
          if (created && created.id) {
            set((state) => ({
              habits: state.habits.map((h) => (h.id === tempId ? created : h))
            }));
          }
        } catch (err) {
          console.error('Failed to add habit to backend:', err);
          set((state) => ({
            habits: state.habits.filter((h) => h.id !== tempId)
          }));
        }
      },

      deleteHabit: async (habitId) => {
        const prevHabits = get().habits;
        const prevRecords = get().records;

        // 1. Optimistic UI update
        set((state) => {
          const newRecords = {};
          Object.keys(state.records).forEach((date) => {
            newRecords[date] = state.records[date]?.filter((id) => id !== habitId) || [];
          });

          return {
            habits: state.habits.filter((h) => h.id !== habitId),
            records: newRecords
          };
        });

        // 2. Persist to backend
        try {
          await api.habits.delete(habitId);
        } catch (err) {
          console.error('Failed to delete habit from backend:', err);
          set({ habits: prevHabits, records: prevRecords });
        }
      },

      updateHabit: async (habitId, updates) => {
        const prevHabits = get().habits;

        // 1. Optimistic UI update
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
        }));

        // 2. Persist to backend
        try {
          const updated = await api.habits.update(habitId, updates);
          if (updated) {
            set((state) => ({
              habits: state.habits.map((h) => (h.id === habitId ? updated : h))
            }));
          }
        } catch (err) {
          console.error('Failed to update habit on backend:', err);
          set({ habits: prevHabits });
        }
      },

      setCurrentDate: (dateStr) => set({ currentDate: dateStr })
    }),
    {
      name: 'habit-tracker-storage'
    }
  )
);
