import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import { AppwriteException, ID, Models } from "appwrite";
import { account } from "@/models/client/config";

export interface UserPrefs {
  reputation: number;
  avatar?: string;
}

interface IAuthStore {
  session: Models.Session | null;
  jwt: string | null;
  user: Models.User<UserPrefs> | null;
  hydrated: boolean;
  loading: boolean;

  setHydrated(): void;
  verfiySession(): Promise<void>;
  login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;
  createAccount(
    name: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;
  logout(): Promise<void>;
}

function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const STORAGE_VERSION = 2; // Increment this on breaking changes

export const useAuthStore = create<IAuthStore>()(
  persist(
    immer((set) => ({
      session: null,
      jwt: null,
      user: null,
      hydrated: false,
      loading: false,

      setHydrated() {
        set({ hydrated: true });
      },

      async verfiySession() {
        if (!isLocalStorageAvailable()) {
          alert('LocalStorage is not available. Please disable privacy mode or use a different browser to login.');
          set({ session: null, user: null, loading: false });
          return;
        }
        set({ loading: true });
        try {
          const session = await account.getSession("current");
          set({ session });
        } catch (error) {
          set({ session: null, user: null });
          console.log(error);
        } finally {
          set({ loading: false });
        }
      },

      async login(email: string, password: string) {
        if (!isLocalStorageAvailable()) {
          alert('LocalStorage is not available. Please disable privacy mode or use a different browser to login.');
          return { success: false, error: null };
        }
        try {
          const session = await account.createEmailPasswordSession(
            email,
            password
          );
          const [user, { jwt }] = await Promise.all([
            account.get<UserPrefs>(),
            account.createJWT(),
          ]);
          if (!user.prefs?.reputation)
            await account.updatePrefs<UserPrefs>({
              reputation: 0,
            });

          set({ session, user, jwt });

          return { success: true };
        } catch (error) {
          console.log(error);
          return {
            success: false,
            error: error instanceof AppwriteException ? error : null,
          };
        }
      },

      async createAccount(name: string, email: string, password: string) {
        if (!isLocalStorageAvailable()) {
          alert('LocalStorage is not available. Please disable privacy mode or use a different browser to register.');
          return { success: false, error: null };
        }
        try {
          await account.create(ID.unique(), email, password, name);
          return { success: true };
        } catch (error) {
          console.log(error);
          return {
            success: false,
            error: error instanceof AppwriteException ? error : null,
          };
        }
      },

      async logout() {
        try {
          set({ loading: true });
          await account.deleteSessions();
          set({ session: null, jwt: null, user: null, loading: false });
        } catch (error) {
          console.log(error);
          set({ loading: false });
        }
      },
    })),
    {
      name: "auth",
      version: STORAGE_VERSION,
      // Optimize storage for faster hydration
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // Ignore storage errors
          }
        },
      },
      migrate: (persistedState, version) => {
        if (version !== STORAGE_VERSION) {
          // Clear state if version mismatch
          return { session: null, jwt: null, user: null, hydrated: false, loading: false } as IAuthStore;
        }
        return persistedState as IAuthStore;
      },
      onRehydrateStorage() {
        return (state, error) => {
          if (!error && state) {
            // Immediately set hydrated to true for faster rendering
            state.setHydrated();
          }
        };
      },
      // Skip hydration if localStorage is not available
      skipHydration: typeof window === 'undefined' || !isLocalStorageAvailable(),
    }
  )
);

export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth');
    window.location.reload();
  }
};

// Custom hook for faster auth state access
export const useAuthState = () => {
  const { user, hydrated, loading } = useAuthStore();
  
  // Return early if not hydrated to prevent unnecessary re-renders
  if (!hydrated) {
    return { user: null, hydrated: false, loading: true };
  }
  
  return { user, hydrated, loading };
};
