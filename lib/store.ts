import { create } from 'zustand';

export type UserProfile = {
  id?: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetWeight: number; // kg
};

type CalorieStore = {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  // Local cache for food queries to avoid hitting Gemini repeated times
  foodCache: Record<string, any>;
  addFoodCache: (query: string, result: any) => void;
};

export const useStore = create<CalorieStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  foodCache: {},
  addFoodCache: (query, result) =>
    set((state) => ({
      foodCache: { ...state.foodCache, [query.toLowerCase()]: result },
    })),
}));
