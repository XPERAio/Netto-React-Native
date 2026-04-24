import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Shift, ManualPayment, defaultUserProfile } from '../models/types';
import * as Firebase from '../services/FirebaseService';

interface AppState {
  // Auth
  isLoggedIn: boolean;
  currentEmail: string;
  isLoading: boolean;
  authError?: string;

  // Data
  profile: UserProfile | null;
  shifts: Shift[];
  payments: ManualPayment[];

  // Subscription
  hasActiveSubscription: boolean;
  aiCredits: number;

  // Active shift timer
  activeShiftStartTime: number; // Unix ms, 0 = not working

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;

  setProfile: (profile: UserProfile) => void;
  saveProfile: (profile: UserProfile) => Promise<void>;

  addShift: (shift: Shift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;

  addPayment: (payment: ManualPayment) => Promise<void>;
  removePayment: (id: string) => Promise<void>;

  startShift: () => void;
  stopShift: () => Promise<Shift | null>;

  loadPersistedSession: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoggedIn: false,
  currentEmail: '',
  isLoading: false,
  profile: null,
  shifts: [],
  payments: [],
  hasActiveSubscription: false,
  aiCredits: 0,
  activeShiftStartTime: 0,

  // ─── Auth ────────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true, authError: undefined });
    try {
      await Firebase.signIn(email, password);
      const [profile, shifts, payments] = await Promise.all([
        Firebase.loadUserProfile(email),
        Firebase.loadShifts(email),
        Firebase.loadManualPayments(email),
      ]);
      const resolvedProfile = profile ?? defaultUserProfile(email, email.split('@')[0]);
      await AsyncStorage.multiSet([
        ['currentEmail', email],
        ['isLoggedIn', 'true'],
      ]);
      set({ isLoggedIn: true, currentEmail: email, profile: resolvedProfile, shifts, payments, isLoading: false });
      return true;
    } catch (e: any) {
      set({ isLoading: false, authError: e.message });
      return false;
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, authError: undefined });
    try {
      await Firebase.signUp(email, password, name);
      const newProfile = defaultUserProfile(email, name);
      await Firebase.saveUserProfile(newProfile);
      await AsyncStorage.multiSet([
        ['currentEmail', email],
        ['isLoggedIn', 'true'],
      ]);
      set({ isLoggedIn: true, currentEmail: email, profile: newProfile, shifts: [], payments: [], isLoading: false });
      return true;
    } catch (e: any) {
      set({ isLoading: false, authError: e.message });
      return false;
    }
  },

  logout: async () => {
    await Firebase.signOut();
    await AsyncStorage.multiRemove(['currentEmail', 'isLoggedIn']);
    set({ isLoggedIn: false, currentEmail: '', profile: null, shifts: [], payments: [], activeShiftStartTime: 0 });
  },

  resetPassword: async (email) => {
    await Firebase.resetPassword(email);
  },

  deleteAccount: async () => {
    await Firebase.deleteAccount();
    await AsyncStorage.multiRemove(['currentEmail', 'isLoggedIn']);
    set({ isLoggedIn: false, currentEmail: '', profile: null, shifts: [], payments: [] });
  },

  // ─── Profile ─────────────────────────────────────────────────────────────────

  setProfile: (profile) => set({ profile }),

  saveProfile: async (profile) => {
    set({ profile });
    await Firebase.saveUserProfile(profile);
  },

  // ─── Shifts ──────────────────────────────────────────────────────────────────

  addShift: async (shift) => {
    set(s => ({ shifts: [shift, ...s.shifts] }));
    try { await Firebase.saveShift(shift); } catch { /* local-first */ }
  },

  removeShift: async (id) => {
    set(s => ({ shifts: s.shifts.filter(sh => sh.id !== id) }));
    try { await Firebase.deleteShift(id); } catch { /* local-first */ }
  },

  // ─── Payments ────────────────────────────────────────────────────────────────

  addPayment: async (payment) => {
    set(s => ({ payments: [payment, ...s.payments] }));
    try { await Firebase.saveManualPayment(payment); } catch { /* local-first */ }
  },

  removePayment: async (id) => {
    set(s => ({ payments: s.payments.filter(p => p.id !== id) }));
    try { await Firebase.deleteManualPayment(id); } catch { /* local-first */ }
  },

  // ─── Timer ───────────────────────────────────────────────────────────────────

  startShift: () => {
    const now = Date.now();
    set({ activeShiftStartTime: now });
    AsyncStorage.setItem('activeShiftStart', String(now));
  },

  stopShift: async () => {
    const { activeShiftStartTime, profile } = get();
    if (!activeShiftStartTime || !profile) return null;

    const shift: Shift = {
      id: Math.random().toString(36).slice(2) + Date.now(),
      ownerEmail: profile.email,
      startTime: new Date(activeShiftStartTime).toISOString(),
      endTime: new Date().toISOString(),
      type: 'רגילה',
      hourlyRateSnapshot: profile.hourlyRate,
      breakDurationMinutes: 0,
      isManualEntry: false,
      isHolidayWorkedByChoice: false,
      isShabbatWork: false,
      travelPaid: 0,
    };

    set({ activeShiftStartTime: 0 });
    await AsyncStorage.removeItem('activeShiftStart');
    await get().addShift(shift);
    return shift;
  },

  // ─── Restore session ──────────────────────────────────────────────────────────

  loadPersistedSession: async () => {
    try {
      const [emailPair, loginPair, shiftStartPair] = await AsyncStorage.multiGet([
        'currentEmail', 'isLoggedIn', 'activeShiftStart',
      ]);
      const email = emailPair[1];
      const loggedIn = loginPair[1] === 'true';
      const shiftStart = shiftStartPair[1] ? Number(shiftStartPair[1]) : 0;

      if (loggedIn && email) {
        set({ isLoading: true });
        const [profile, shifts, payments] = await Promise.all([
          Firebase.loadUserProfile(email),
          Firebase.loadShifts(email),
          Firebase.loadManualPayments(email),
        ]);
        const resolvedProfile = profile ?? defaultUserProfile(email, email.split('@')[0]);
        set({
          isLoggedIn: true,
          currentEmail: email,
          profile: resolvedProfile,
          shifts,
          payments,
          activeShiftStartTime: shiftStart,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
