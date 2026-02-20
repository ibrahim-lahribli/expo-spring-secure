import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ssrSafeStorage } from "../lib/storage";
import { supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      initializeAuth: async () => {
        try {
          // Get initial session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          set({
            user: session?.user || null,
            session: session || null,
            isAuthenticated: !!session,
            isLoading: false,
          });

          // Set up real-time state synchronization
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              user: session?.user || null,
              session: session || null,
              isAuthenticated: !!session,
              isLoading: false,
            });
          });
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          set({
            user: data.user,
            session: data.session,
            isAuthenticated: !!data.session,
            isLoading: false,
          });

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error };
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error("Error signing out:", error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
